import OpenAI from "openai";
import { ModelsAPI } from "./models-api";

// defaultModel is the model used for internal calls - for tool calling,
// or just for chat completions.
export const defaultModel = "gpt-4o-mini";

// RunnerResponse is the response from a function call.
export interface RunnerResponse {
  model: string;
  messages: OpenAI.ChatCompletionMessageParam[];
}

export abstract class Tool {
  modelsAPI: ModelsAPI;
  abstract definition: OpenAI.FunctionDefinition;

  constructor(modelsAPI: ModelsAPI) {
    this.modelsAPI = modelsAPI;
  }

  get tool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: this.definition,
    };
  }

  abstract execute(
    messages: OpenAI.ChatCompletionMessageParam[],
    args: object
  ): Promise<RunnerResponse>;
}
