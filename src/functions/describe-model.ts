import OpenAI from "openai";
import { RunnerResponse, defaultModel, Tool } from "../functions";

export class describeModel extends Tool {
  static definition = {
    name: "describe_model",
    description: "Describes a model.",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description:
            'The model to describe. Looks like "publisher/model-name".',
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
      `\tModel Version: ${model.model_version}`,
      `\tPublisher: ${model.publisher}`,
      `\tModel Family: ${model.model_family}`,
      `\tModel Registry: ${model.model_registry}`,
      `\tLicense: ${model.license}`,
      `\tTask: ${model.task}`,
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
