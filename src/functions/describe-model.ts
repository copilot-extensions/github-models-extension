import OpenAI from "openai";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";

export class describeModel extends Tool {
  static definition = {
    name: "describe_model",
    description: "Describes a specific model.",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: [
            'The model to describe. Looks like "model-name". For example, `Phi-3-medium-128k-instruct` or `gpt-4o`.',
            'The list of models is available in the context window of the chat, in the `<-- LIST OF MODELS -->` section.',
            'If the model name is not found in the list of models, pick the closest matching model from the list.',
          ].join("\n"),
        },
      },
      required: ["model"],
    },
  };

  async execute(
    messages: OpenAI.ChatCompletionMessageParam[],
    args: { model: string }
  ): Promise<RunnerResponse> {
    const [model, modelSchema] = await Promise.all([
      this.modelsAPI.getModel(args.model),
      this.modelsAPI.getModelSchema(args.model),
    ]);

    const systemMessage = [
      "The user is asking about the AI model with the following details:",
      `\tModel Name: ${model.name}`,
      `\tModel Version: ${model.version}`,
      `\tPublisher: ${model.publisher}`,
      `\tModel Registry: ${model.registryName}`,
      `\tLicense: ${model.license}`,
      `\tTask: ${model.inferenceTasks.join(", ")}`,
      `\tDescription: ${model.description}`,
      `\tSummary: ${model.summary}`,
      "\n",
      "API requests for this model use the following schema:",
      "\n",
      "```json",
      JSON.stringify(modelSchema, null, 2),
      "```",
    ].join("\n");

    return {
      model: defaultModel,
      messages: [{ role: "system", content: systemMessage }, ...messages],
    };
  }
}
