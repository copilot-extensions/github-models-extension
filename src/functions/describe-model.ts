import { RunnerResponse, defaultModel, Tool } from "../functions";
import { getModel } from "../models-api";

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

  static async execute(args: { model: string }): Promise<RunnerResponse> {
    const model = await getModel(args.model);

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
    ].join("\n");

    return {
      model: defaultModel,
      messages: [{ role: "system", content: systemMessage }],
    };
  }
}
