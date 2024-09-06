import { createServer, type IncomingMessage } from "node:http";

import { verifyAndParseRequest, transformPayloadForOpenAICompatibility, getFunctionCalls, createDoneEvent } from "@copilot-extensions/preview-sdk";
import OpenAI from "openai";

import { describeModel } from "./functions/describe-model.js";
import { executeModel } from "./functions/execute-model.js";
import { listModels } from "./functions/list-models.js";
import { RunnerResponse } from "./functions.js";
import { recommendModel } from "./functions/recommend-model.js";
import { ModelsAPI } from "./models-api.js";

const server = createServer(async (request, response) => {
  if (request.method === "GET") {
    response.statusCode = 200;
    response.end(`OK`);
    return;
  }

  const body = await getBody(request);

  let verifyAndParseRequestResult: Awaited<ReturnType<typeof verifyAndParseRequest>>;
  const apiKey = request.headers["x-github-token"] as string;
  try {
    const signature = request.headers["github-public-key-signature"] as string;
    const keyID = request.headers["github-public-key-identifier"] as string;
    verifyAndParseRequestResult = await verifyAndParseRequest(body, signature, keyID, {
      token: apiKey,
    });
  } catch (err) {
    console.error(err);
    response.statusCode = 401
    response.end("Unauthorized");
    return
  }

  const { isValidRequest, payload } = verifyAndParseRequestResult

  if (!isValidRequest) {
    console.log("Signature verification failed");
    response.statusCode = 401
    response.end("Unauthorized");
  }

  console.log("Signature verified");

  const compatibilityPayload = transformPayloadForOpenAICompatibility(payload);

  // Use the GitHub API token sent in the request
  if (!apiKey) {
    response.statusCode = 400
    response.end()
    return;
  }

  // List of functions that are available to be called
  const modelsAPI = new ModelsAPI(apiKey);
  const functions = [listModels, describeModel, executeModel, recommendModel];

  // Use the Copilot API to determine which function to execute
  const capiClient = new OpenAI({
    baseURL: "https://api.githubcopilot.com",
    apiKey,
  });

  // Prepend a system message that includes the list of models, so that
  // tool calls can better select the right model to use.
  const models = await modelsAPI.listModels();
  const toolCallMessages = [
    {
      role: "system" as const,
      content: [
        "You are an extension of GitHub Copilot, built to interact with GitHub Models.",
        "GitHub Models is a language model playground, where you can experiment with different models and see how they respond to your prompts.",
        "Here is a list of some of the models available to the user:",
        "<-- LIST OF MODELS -->",
        JSON.stringify(
          models.map((model) => ({
            friendly_name: model.friendly_name,
            name: model.name,
            publisher: model.publisher,
            registry: model.model_registry,
            description: model.summary,
          }))
        ),
        "<-- END OF LIST OF MODELS -->",
      ].join("\n"),
    },
    ...compatibilityPayload.messages,
  ];

  console.time("tool-call");
  const toolCaller = await capiClient.chat.completions.create({
    stream: false,
    model: "gpt-4o",
    messages: toolCallMessages,
    stream: false,
    model: "gpt-4",
    tools: functions.map((f) => f.tool),
  });
  console.timeEnd("tool-call");

  const [functionToCall] = getFunctionCalls(
    // @ts-expect-error - type error due to Copilot/OpenAI SDKs interop, I'll look into it ~@gr2m
    toolCaller.choices[0]
  )

  if (
    !functionToCall
  ) {
    console.log("No tool call found");
    // No tool to call, so just call the model with the original messages
    const stream = await capiClient.chat.completions.create({
      stream: true,
      model: "gpt-4o",
      messages: payload.messages,
      token: apiKey,
    })

    for await (const chunk of stream) {
      const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
      response.write(chunkStr);
    }

    response.end(createDoneEvent());
    return;
  }

  const args = JSON.parse(functionToCall.function.arguments);

  console.time("function-exec");
  let functionCallRes: RunnerResponse;
  try {
    console.log("Executing function", functionToCall.function.name);
    const funcClass = functions.find(
      (f) => f.definition.name === functionToCall.function.name
    );
    if (!funcClass) {
      throw new Error("Unknown function");
    }

    console.log("\t with args", args);
    const func = new funcClass(modelsAPI);
    functionCallRes = await func.execute(
      payload.messages,
      args
    );
  } catch (err) {
    console.error(err);
    response.statusCode = 500
    response.end();
    return;
  }
  console.timeEnd("function-exec");

  try {
    const stream = await modelsAPI.inference.chat.completions.create({
      model: functionCallRes.model,
      messages: functionCallRes.messages,
      stream: true,
      stream_options: {
        include_usage: false,
      },
    });

    console.time("streaming");
    for await (const chunk of stream) {
      const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
      response.write(chunkStr);
    }

    response.end(createDoneEvent());
    console.timeEnd("streaming");
  } catch (err) {
    console.error(err);
    response.statusCode = 500
    response.end()
  }
});

const port = process.env.PORT || "3000"
server.listen(port);
console.log(`Server running at http://localhost:${port}`);

function getBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const bodyParts: Buffer[] = [];
    let body;
    request
      .on("data", (chunk: Buffer) => {
        bodyParts.push(chunk);
      })
      .on("end", () => {
        resolve(Buffer.concat(bodyParts).toString());
      });
  });
}
