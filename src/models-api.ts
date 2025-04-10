import OpenAI from "openai";

// Model is the structure of a model in the model catalog.
export interface Model {
  name: string;
  displayName: string;
  version: string;
  publisher: string;
  registryName: string;
  license: string;
  inferenceTasks: string[];
  description?: string;
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
    const modelFromIndex = await this.getModelFromIndex(modelName);

    const modelRes = await fetch(
      `https://api.catalog.azureml.ms/asset-gallery/v1.0/${modelFromIndex.registryName}/models/${modelFromIndex.name}/version/${modelFromIndex.version}`,
    );
    if (!modelRes.ok) {
      throw new Error(`Failed to fetch ${modelName} details from the model catalog.`);
    }
    const model = (await modelRes.json()) as Model;
    return model;
  }

  async getModelSchema(modelName: string): Promise<ModelSchema> {
    const modelFromIndex = await this.getModelFromIndex(modelName);

    const modelSchemaRes = await fetch(
      `https://modelcatalogcachev2-ebendjczf0c5dzca.b02.azurefd.net/widgets/en/Serverless/${modelFromIndex.registryName.toLowerCase()}/${modelFromIndex.name.toLowerCase()}.json`
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
      "https://api.catalog.azureml.ms/asset-gallery/v1.0/models",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: [
            { field: "freePlayground", values: ["true"], operator: "eq" },
            { field: "labels", values: ["latest"], operator: "eq" },
          ],
          order: [{ field: "displayName", direction: "Asc" }],
        }),
      }
    );
    if (!modelsRes.ok) {
      throw new Error("Failed to fetch models from the model catalog");
    }

    const models = (await modelsRes.json()).summaries as Model[];
    this._models = models;
    return models;
  }

  async getModelFromIndex(modelName: string): Promise<Model> {
    this._models = this._models || (await this.listModels());
    const modelFromIndex = this._models.find((model) => model.name === modelName);
    if (!modelFromIndex) {
      throw new Error(`Failed to fetch ${modelName} from the model catalog.`);
    }
    return modelFromIndex;
  }
}
