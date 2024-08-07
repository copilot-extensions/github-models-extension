import OpenAI from "openai";

const defaultModel = "gpt-4o-mini";

interface Model {
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

export interface RunnerResponse {
  model: string;
  messages: Array<
    | OpenAI.Chat.ChatCompletionSystemMessageParam
    | OpenAI.Chat.ChatCompletionUserMessageParam
  >;
}

export async function listModels(): Promise<RunnerResponse> {
  const modelsRes = await fetch("https://modelcatalog.azure-api.net/v1/models");
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

export async function describeModel(args: {
  modelName: string;
}): Promise<RunnerResponse> {
  const modelRes = await fetch(
    "https://modelcatalog.azure-api.net/v1/model/" + args.modelName
  );
  if (!modelRes.ok) {
    return {
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: `Failed to fetch ${args.modelName} from the model catalog.`,
        },
      ],
    };
  }
  const model = (await modelRes.json()) as Model;

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

export async function executeModel(args: {
  modelName: string;
  instruction: string;
}): Promise<RunnerResponse> {
  return {
    model: args.modelName,
    messages: [
      {
        role: "system",
        content:
          "Begin your response by telling the user the name of your language model.",
      },
      { role: "user", content: args.instruction },
    ],
  };
}
