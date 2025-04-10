import { createServer, type IncomingMessage } from "node:http";

import { verifyAndParseRequest, transformPayloadForOpenAICompatibility, getFunctionCalls, createDoneEvent, createReferencesEvent } from "@copilot-extensions/preview-sdk";
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
          [...models.map((model) => ({
            friendly_name: model.displayName,
            name: model.name,
            publisher: model.publisher,
            registry: model.registryName,
            description: model.summary,
          })),
          {
            friendly_name: "OpenAI o1-mini",
            name: "o1-mini",
            publisher: "openai",
            model_registry: "azure-openai",
            description: "Smaller, faster, and 80% cheaper than o1-preview, performs well at code generation and small context operations."
          },
          {
            friendly_name: "OpenAI o1-preview",
            name: "o1-preview",
            publisher: "openai",
            model_registry: "azure-openai",
            description: "Focused on advanced reasoning and solving complex problems, including math and science tasks. Ideal for applications that require deep contextual understanding and agentic workflows."
          },
        ]
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
      messages: compatibilityPayload.messages,
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
      compatibilityPayload.messages,
      args
    );
  } catch (err) {
    console.error(err);
    response.statusCode = 500
    response.end();
    return;
  }
  console.timeEnd("function-exec");

  // Now that we have a tool result, let's use it to call the model.
  try {
    let stream: AsyncIterable<any>;

    if (functionToCall.function.name === executeModel.definition.name) {
      // First, let's write a reference with the model we're executing.
      // Fetch the model data from the index (already in-memory) so we have all the information we need
      // to build out the reference URLs
      const modelData = await modelsAPI.getModelFromIndex(functionCallRes.model);
      const sseData = {
        type: "models.reference",
        id: `models.reference.${modelData.name}`,
        data: {
          model: functionCallRes.model
        },
        is_implicit: false,
        metadata: {
          display_name: `Model: ${modelData.name}`,
          display_icon: "icon",
          display_url: `https://github.com/marketplace/models/${modelData.registryName}/${modelData.name}`,
        }
      };
      const event = createReferencesEvent([sseData]);
      response.write(event);

      if (["o1-mini", "o1-preview"].includes(args.model)) {
        // for non-streaming models, we need to still stream the response back, so we build the stream ourselves
        stream = (async function*() {
          const result = await modelsAPI.inference.chat.completions.create({
            model: functionCallRes.model,
            messages: functionCallRes.messages
          });
          yield result;
        })();
      } else {
        stream = await modelsAPI.inference.chat.completions.create({
          model: functionCallRes.model,
          messages: functionCallRes.messages,
          stream: true
        });
      }
    } else {
      stream = await capiClient.chat.completions.create({
        stream: true,
        model: "gpt-4o",
        messages: functionCallRes.messages,
      });
    }

    console.time("streaming");
    for await (const chunk of stream) {
      const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
      response.write(chunkStr);
    }

    response.end(createDoneEvent());
    console.timeEnd("streaming");
  } catch (err) {
    console.error(err);

    if ((err as any).response && (err as any).response.status === 400) {
      console.error('Error 400:', (err as any).response.data);
    }

    response.statusCode = 500
    response.write("data: Something went wrong\n\n")
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
