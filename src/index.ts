import express from "express";
import OpenAI from "openai";
import { verifySignatureMiddleware } from "./validate-signature";
import { describeModel } from "./functions/describe-model";
import { executeModel } from "./functions/execute-model";
import { listModels } from "./functions/list-models";
import { RunnerResponse } from "./functions";

const app = express();

app.post("/", verifySignatureMiddleware, express.json(), async (req, res) => {
  // Use the GitHub API token sent in the request
  const apiKey = req.get("X-GitHub-Token");

  // Use the Copilot API to determine which function to execute
  const capiClient = new OpenAI({
    baseURL: "https://api.githubcopilot.com",
    apiKey,
  });

  console.time("tool-call");
  const toolCaller = await capiClient.chat.completions.create({
    stream: false,
    model: "gpt-4",
    messages: req.body.messages,
    tool_choice: "auto",
    tools: [listModels.tool, describeModel.tool, executeModel.tool],
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
      functionCallRes = await listModels.execute();
      break;
    case "describe_model":
      functionCallRes = await describeModel.execute({
        model: args.model,
      });
      break;
    case "execute_model":
      functionCallRes = await executeModel.execute({
        model: args.model,
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
