import { RunnerResponse, defaultModel, Model, Tool } from "../functions";

export class listModels extends Tool {
  static definition = {
    name: "list_models",
    description: "Lists the available models.",
    parameters: { type: "object", properties: {} },
  };

  static async execute(): Promise<RunnerResponse> {
    const modelsRes = await fetch(
      "https://modelcatalog.azure-api.net/v1/models"
    );
    if (!modelsRes.ok) {
      return {
        model: defaultModel,
        messages: [
          {
            role: "system",
            content: "Failed to fetch models from the model catalog.",
          },
        ],
      };
    }

    const models = (await modelsRes.json()) as Model[];

    const systemMessage = [
      "The user is asking for a list of available models.",
      "Respond with a concise and readable list of the models, with a short description for each one.",
      "Use markdown formatting to make each description more readable.",
      "Begin each model's description with a header consisting of the model's registry and name",
      "The header must be formatted as `<registry>/<name>`.",
      "That list is as follows:",
    ];

    for (const model of models) {
      systemMessage.push(
        [
          "The user is asking about the AI model with the following details:",
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
