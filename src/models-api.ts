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

export type ModelSchema = {
  parameters: ModelSchemaParameter[];
  capabilities: Record<string, boolean>;
};

export type ModelSchemaParameter = {
  key: string;
  type: "number" | "integer" | "array" | "string" | "boolean";
  payloadPath: string;
  default?: number | string | boolean | any[];
  min?: number;
  max?: number;
  required: boolean;
  description?: string;
  friendlyName?: string;
};

export class ModelsAPI {
  inference: OpenAI;
  private _models: Model[] | null = null;

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

  async getModelSchema(modelName: string): Promise<ModelSchema> {
    const modelSchemaRes = await fetch(
      `https://modelcatalogcachev2-ebendjczf0c5dzca.b02.azurefd.net/widgets/en/Serverless/${modelName.toLowerCase()}.json`
    );
    if (!modelSchemaRes.ok) {
      throw new Error(
        `Failed to fetch ${modelName} schema from the model catalog.`
      );
    }
    const modelSchema = (await modelSchemaRes.json()) as ModelSchema;
    return modelSchema;
  }

  async listModels(): Promise<Model[]> {
    if (this._models) {
      return this._models;
    }

    const modelsRes = await fetch(
      "https://modelcatalog.azure-api.net/v1/models"
    );
    if (!modelsRes.ok) {
      throw new Error("Failed to fetch models from the model catalog");
    }

    const models = (await modelsRes.json()) as Model[];
    this._models = models;
    return models;
  }
}
