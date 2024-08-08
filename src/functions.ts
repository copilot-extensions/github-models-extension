import OpenAI from "openai";

// defaultModel is the model used for internal calls - for tool calling,
// or just for chat completions.
export const defaultModel = "gpt-4o-mini";

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

// RunnerResponse is the response from a function call.
export interface RunnerResponse {
  model: string;
  messages: Array<
    | OpenAI.Chat.ChatCompletionSystemMessageParam
    | OpenAI.Chat.ChatCompletionUserMessageParam
  >;
}

export class Tool {
  static get tool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: this.definition,
    };
  }
  static definition: OpenAI.FunctionDefinition;
  static async execute(args: object): Promise<RunnerResponse> {
    throw new Error("Not implemented");
  }
}
