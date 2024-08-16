# @gh-models Copilot Extension

This is a [GitHub Copilot Extension](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat) that provides a way to interact with [GitHub Models](https://github.blog/news-insights/product-news/introducing-github-models/), directly in Copilot Chat.

> [!NOTE]
> To use Copilot Extensions, you must be enrolled in the limited public beta.
> 
> All enrolled users with a GitHub Copilot Individual subscription can use Copilot Extensions.
> 
> For enrolled organizations or enterprises with a Copilot Business or Copilot Enterprise subscription, organization owners and enterprise administrators can grant access to Copilot Extensions.

## What it can do

You can ask it things like "what models are available?" or "which model should I use for my use-case?". You can also ask it to execute a basic prompt using a particular model.

| Description | Image |
| --- |--- |
| User asking `@gh-models` for a recommended model that is low-cost and supports function calling | ![User asking @gh-models for a recommended model that is low-cost and supports function calling](https://github.com/user-attachments/assets/aed29aa3-2056-44c5-8c7b-e8ef7ffa3301) |
| Dialogue with the Extension, asking for an OpenAI model | ![Dialogue with the Extension, asking for an OpenAI model](https://github.com/user-attachments/assets/f08b23a9-7f2c-4da7-b764-7220dcda9408) |
| User executing a basic prompt using the model that the extension recommended | ![User executing a basic prompt using the model that the extension recommended](https://github.com/user-attachments/assets/795dd669-aea2-4b88-9c27-0836008c28a4) |
| In VS Code, explain code using a specific model | <img width="838" alt="image" src="https://github.com/user-attachments/assets/c019ed37-5494-4cb6-9e21-82ecf3235dcc"> |

## Development

Install dependencies:

```bash
npm install
```

To run in development mode:

```bash
npm run dev
```

To build and run in production mode:

```bash
npm run build && npm start
```
