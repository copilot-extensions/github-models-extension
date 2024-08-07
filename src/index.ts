import express from "express";
import OpenAI from "openai";
import {
  listModels,
  describeModel,
  executeModel,
  type RunnerResponse,
} from "./functions";
import { verifySignatureMiddleware } from "./validate-signature";

const app = express();

app.post("/", verifySignatureMiddleware, express.json(), async (req, res) => {
  // Create a new GitHub Models API client
  const apiKey = req.get("X-GitHub-Token");
  const capiClient = new OpenAI({
    baseURL: "https://api.githubcopilot.com",
    apiKey,
  });

  console.time("tool-call");
  const toolCaller = await capiClient.chat.completions.create({
    stream: false,
    model: "gpt-4",
    messages: req.body.messages,
    // tool_choice: "required", // Azure OpenAI doesn't support this yet
    tool_choice: "auto",
    tools: [
      {
        type: "function",
        function: {
          name: "list_models",
          description: "Lists the available models.",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "describe_model",
          description: "Describes a model.",
          parameters: {
            type: "object",
            properties: {
              modelName: {
                type: "string",
                description:
                  'The model to describe. Looks like "publisher/model-name".',
              },
            },
            required: ["modelName"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "execute_model",
          description:
            'Executes a model. This will often be used by saying something like "using <model>: <instruction>".',
          parameters: {
            type: "object",
            properties: {
              modelName: {
                type: "string",
                description:
                  "The name of the model to execute. It is ONLY the name of the model, not the publisher or registry. For example: `gpt-4o`, or `cohere-command-r-plus`.",
              },
              instruction: {
                type: "string",
                description: "The instruction to execute.",
              },
            },
            required: ["modelName", "instruction"],
          },
        },
      },
    ],
  });
  console.timeEnd("tool-call");

  if (
    !toolCaller.choices[0] ||
    !toolCaller.choices[0].message ||
    !toolCaller.choices[0].message.tool_calls ||
    !toolCaller.choices[0].message.tool_calls[0].function
  ) {
    res.status(500).end();
    return;
  }

  const functionToCall = toolCaller.choices[0].message.tool_calls[0].function;
  const args = JSON.parse(functionToCall.arguments);

  console.time("function-exec");
  let functionCallRes: RunnerResponse;
  switch (functionToCall.name) {
    case "list_models":
      functionCallRes = await listModels();
      break;
    case "describe_model":
      functionCallRes = await describeModel({
        modelName: args.modelName,
      });
      break;
    case "execute_model":
      functionCallRes = await executeModel({
        modelName: args.modelName,
        instruction: args.instruction,
      });
      break;
    default:
      console.log("Unknown function");
      res.status(500).end();
      return;
  }
  console.timeEnd("function-exec");

  console.time("stream");
  const ghModelsClient = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey,
  });
  const stream = await ghModelsClient.chat.completions.create({
    model: functionCallRes.model,
    messages: functionCallRes.messages,
    stream: true,
  });
  console.timeEnd("stream");

  console.time("streaming");
  for await (const chunk of stream) {
    const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
    console.log(chunkStr);
    res.write(chunkStr);
  }
  res.write("data: [DONE]\n\n");
  console.timeEnd("streaming");
  res.end();
});

const port = Number(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
