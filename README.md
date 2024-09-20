# @models Copilot Extension

This is a [GitHub Copilot Extension](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat) that provides a way to interact with [GitHub Models](https://github.blog/news-insights/product-news/introducing-github-models/), directly in Copilot Chat.

>[!NOTE]
> Copilot Extensions are in public beta and GitHub Models are in limited public beta. They may be subject to change. To request access to GitHub Models, [join the waitlist](https://github.com/marketplace/models/waitlist).

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

## Copilot Extensions Documentation
- [Using Copilot Extensions](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [About building Copilot Extensions](https://docs.github.com/en/copilot/building-copilot-extensions/about-building-copilot-extensions)
- [Set up process](https://docs.github.com/en/copilot/building-copilot-extensions/setting-up-copilot-extensions)
- [Communicating with the Copilot platform](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-the-copilot-platform)
- [Communicating with GitHub](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-github)
