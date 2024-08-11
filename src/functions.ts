import OpenAI from "openai";

// defaultModel is the model used for internal calls - for tool calling,
// or just for chat completions.
export const defaultModel = "gpt-4o-mini";

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
