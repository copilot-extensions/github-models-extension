import { RunnerResponse, Tool } from "../functions";

export class executeModel extends Tool {
  static definition = {
    name: "execute_model",
    description:
      'Executes a model. This will often be used by saying something like "using <model>: <instruction>".',
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description:
            "The name of the model to execute. It is ONLY the name of the model, not the publisher or registry. For example: `gpt-4o`, or `cohere-command-r-plus`.",
        },
        instruction: {
          type: "string",
          description: "The instruction to execute.",
        },
      },
      required: ["model", "instruction"],
    },
  };

  async execute(args: {
    model: string;
    instruction: string;
  }): Promise<RunnerResponse> {
    return {
      model: args.model,
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
}
