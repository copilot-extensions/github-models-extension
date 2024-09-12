import OpenAI from "openai";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MessageWithReferences = OpenAI.ChatCompletionMessageParam & {
  copilot_references: Reference[];
};

interface Reference {
  type: string;
  data: any;
  id: string;
  metadata: any;
}

export class generateCode extends Tool {
  static definition = {
    name: "generate_code",
    description:
      "Generates or modifies code in a file to use GitHub Models for AI inference.",
    parameters: {
        type: "object",
        properties: {
          model: {
            type: "string",
            description: [
              "The name of the model to generate code for. If it is close by not an exact match to something in the list below, use the name from the list. It is ONLY the name of the model, not the publisher or registry.",
              "For example: `gpt-4o`, or `cohere-command-r-plus`.",
              "The list of models is available in the context window of the chat, in the `<-- LIST OF MODELS -->` section.",
            ].join("\n"),
          },
          instruction: {
            type: "string",
            description: "The type of code they want to generate.",
          },
        },
        required: ["model", "instruction"],
    },
  };

  async execute(
    messages: MessageWithReferences[],
    args: {
      model: string;
      instruction: string;
    }
  ): Promise<RunnerResponse> {
    const models = await this.modelsAPI.listModels();

    // Check if the user included any code references in their last message
    const lastMessage = messages[messages.length - 1];
    const importantRefs = lastMessage.copilot_references.filter(
      (ref) => ref.type === "client.selection" || ref.type === "client.file"
    );

    console.log(importantRefs);
    
    const content = [
      `The user has chosen to use the model named ${args.model}. Begin your response with the following phrase: "The model you've selected is ${args.model}".`,
      "Do not include any additional information about the selected model in this first sentence - ONLY the name.",
    ];

    if (importantRefs.length > 0) {
      content.push(
        "The user included the following context - you may find information in this context useful for your response:",
        JSON.stringify(importantRefs)
      );
    }

    // Read additional prompts from the text files in the directory
    const samplesDir = path.resolve(__dirname, 'samples');
    const promptFiles = fs.readdirSync(samplesDir);
    const additionalPrompts = promptFiles.map(file => 
      fs.readFileSync(path.join(samplesDir, file), 'utf-8')
    ).join("\n");

    const systemMessage = [
      "The user is asking for you to add new code or change their code to use GitHub Models.",
      "Some sample code for how to use GitHub Models for multiple SDKs is as follows:",
      additionalPrompts,
      "Given the user instructions, generate appropriate code relying on the SDK samples.",
      "Use the user's code as the starting point for the code you generate, if it can be adapted, do so, otherwise use the file type to guide your recommendation.",
      "The list of available models is as follows to reference in code. If not request is made, use gpt-4o and the Open AI SDK in javascript:",
    ];

    for (const model of models) {
      systemMessage.push(
        [
          `\t- Model Name: ${model.name}`,
          `\t\tModel Version: ${model.model_version}`,
          `\t\tPublisher: ${model.publisher}`,
          `\t\tModel Family: ${model.model_family}`,
          `\t\tModel Registry: ${model.model_registry}`,
          `\t\tLicense: ${model.license}`,
        ].join("\n")
      );
    }

    return {
      model: defaultModel,
      messages: [
        { role: "system", content: systemMessage.join("\n") },
        ...messages,
      ],
    };
  }
}
