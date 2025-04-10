import OpenAI from "openai";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";

export class recommendModel extends Tool {
  static definition = {
    name: "recommend_model",
    description:
      "Determines and recommends the most appropriate machine learning model based on the provided use-case. This function uses the available list of models to make the recommendation.",
    parameters: {
      type: "object",
      properties: {},
      description:
        "This function does not require any input parameters. It uses internal logic to recommend the best model based on the provided use-case.",
    },
  };

  async execute(
    messages: OpenAI.ChatCompletionMessageParam[]
  ): Promise<RunnerResponse> {
    const models = await this.modelsAPI.listModels();

    const systemMessage = [
      "The user is asking for you to recommend the right model for their use-case.",
      "Explain your reasoning, and why you recommend the model you choose.",
      "Provide a summary of the model's capabilities and limitations.",
      "Include any relevant information that the user should know.",
      "Use the available models to make your recommendation.",
      "The list of available models is as follows:",
    ];

    for (const model of models) {
      systemMessage.push(
        [
          `\t- Model Name: ${model.name}`,
          `\t\tModel Version: ${model.version}`,
          `\t\tPublisher: ${model.publisher}`,
          `\t\tModel Registry: ${model.registryName}`,
          `\t\tLicense: ${model.license}`,
          `\t\tTask: ${model.inferenceTasks.join(", ")}`,
          `\t\tSummary: ${model.summary}`,
        ].join("\n")
      );
    }

    return {
      model: defaultModel,
      messages: [
        { role: "system", content: systemMessage.join("\n") },
        ...messages,
      ],
    };
  }
}
