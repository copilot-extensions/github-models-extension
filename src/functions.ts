import type { PromptFunction, InteropMessage } from "@copilot-extensions/preview-sdk";

import { ModelsAPI } from "./models-api.js";

// defaultModel is the model used for internal calls - for tool calling,
// or just for chat completions.
export const defaultModel = "gpt-4o-mini";

// RunnerResponse is the response from a function call.
export interface RunnerResponse {
  model: string;
  messages: InteropMessage[];
}

export abstract class Tool {
  modelsAPI: ModelsAPI;
  static definition: PromptFunction["function"];

  constructor(modelsAPI: ModelsAPI) {
    this.modelsAPI = modelsAPI;
  }

  static get tool(): PromptFunction {
    return {
      type: "function",
      function: this.definition,
    };
  }

  abstract execute(
    messages: InteropMessage[],
    args: Record<string, unknown>
  ): Promise<RunnerResponse>;
}
