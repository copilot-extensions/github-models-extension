# @models Copilot Extension

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
| User asking `@models` for a recommended model that is low-cost and supports function calling | ![User asking @models for a recommended model that is low-cost and supports function calling](https://github.com/user-attachments/assets/b0c2710d-3d3e-46af-a021-864a17fb5a9c) |
| Dialogue with the Extension, asking for an OpenAI model | ![Dialogue with the Extension, asking for an OpenAI model](https://github.com/user-attachments/assets/1d042c46-895f-43f7-9ab4-2f261811c6b1) |
| User executing a basic prompt using the model that the extension recommended | ![User executing a basic prompt using the model that the extension recommended](https://github.com/user-attachments/assets/688951dc-c02d-40df-a226-c5da8900b633) |

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
