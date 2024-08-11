import OpenAI from "openai";

// Model is the structure of a model in the model catalog.
export interface Model {
  id: string;
  name: string;
  friendly_name: string;
  model_version: number;
  publisher: string;
  model_family: string;
  model_registry: string;
  license: string;
  task: string;
  description: string;
  summary: string;
}

export class ModelsAPI {
  inference: OpenAI;

  constructor(apiKey: string) {
    this.inference = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey,
    });
  }

  async getModel(modelName: string): Promise<Model> {
    const modelRes = await fetch(
      "https://modelcatalog.azure-api.net/v1/model/" + modelName
    );
    if (!modelRes.ok) {
      throw new Error(`Failed to fetch ${modelName} from the model catalog.`);
    }
    const model = (await modelRes.json()) as Model;
    return model;
  }

  async listModels(): Promise<Model[]> {
    const modelsRes = await fetch(
      "https://modelcatalog.azure-api.net/v1/models"
    );
    if (!modelsRes.ok) {
      throw new Error("Failed to fetch models from the model catalog");
    }

    const models = (await modelsRes.json()) as Model[];
    return models;
  }
}
