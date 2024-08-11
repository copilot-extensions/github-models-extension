import { RunnerResponse, defaultModel, Tool } from "../functions";

export class recommendModel extends Tool {
  static definition = {
    name: "recommend_model",
    description:
      "Recommends the best model according to the user's use-case, using the available models.",
    parameters: { type: "object", properties: {} },
  };

  async execute(): Promise<RunnerResponse> {
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
          `\t\tModel Version: ${model.model_version}`,
          `\t\tPublisher: ${model.publisher}`,
          `\t\tModel Family: ${model.model_family}`,
          `\t\tModel Registry: ${model.model_registry}`,
          `\t\tLicense: ${model.license}`,
          `\t\tTask: ${model.task}`,
          `\t\tSummary: ${model.summary}`,
        ].join("\n")
      );
    }

    return {
      model: defaultModel,
      messages: [{ role: "system", content: systemMessage.join("\n") }],
    };
  }
}
