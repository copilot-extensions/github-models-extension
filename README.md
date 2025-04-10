# @models Copilot Extension

This is an agent-based [GitHub Copilot Extension](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat) that provides a way to interact with [GitHub Models](https://github.blog/news-insights/product-news/introducing-github-models/), directly in Copilot Chat.

## What it can do

You can ask it things like "what models are available?" or "which model should I use for my use-case?". You can also ask it to execute a basic prompt using a particular model.

| Description | Image |
| --- |--- |
| User asking `@models` for a recommended model that is low-cost and supports function calling | ![User asking @models for a recommended model that is low-cost and supports function calling](https://github.com/user-attachments/assets/b0c2710d-3d3e-46af-a021-864a17fb5a9c) |
| Dialogue with the Extension, asking for an OpenAI model | ![Dialogue with the Extension, asking for an OpenAI model](https://github.com/user-attachments/assets/1d042c46-895f-43f7-9ab4-2f261811c6b1) |
| User executing a basic prompt using the model that the extension recommended | ![User executing a basic prompt using the model that the extension recommended](https://github.com/user-attachments/assets/688951dc-c02d-40df-a226-c5da8900b633) |

## Development

1. Install dependencies:

```bash
npm install
```

2. Run the server

- To run in development mode:

```bash
npm run dev
```

- To build and run in production mode:

```bash
npm run build && npm start
```
3. Follow [this guide](https://docs.github.com/en/copilot/building-copilot-extensions/creating-a-copilot-extension/configuring-your-server-to-deploy-your-copilot-agent#configuring-your-server) to make your server accessible to the internet

In short, we would expose a public URL for our local server using the following command (follow the guide for detailed setup instructions):
```
ngrok http http://localhost:3000
```

4. Follow [this guide](https://docs.github.com/en/copilot/building-copilot-extensions/creating-a-copilot-extension/creating-a-github-app-for-your-copilot-extension) to create a GitHub app
5. Follow [this guide](https://docs.github.com/en/copilot/building-copilot-extensions/creating-a-copilot-extension/configuring-your-github-app-for-your-copilot-agent) to configure the app to use the public URL from (3.)
6. Use your newly installed app! On any copilot enabled page, type `@your-app-name <prompt>` (from the app created in 4.) to interact with your local installation of this extension!

## Copilot Extensions Documentation
- [Using Copilot Extensions](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [About building Copilot Extensions](https://docs.github.com/en/copilot/building-copilot-extensions/about-building-copilot-extensions)
- [Set up process](https://docs.github.com/en/copilot/building-copilot-extensions/setting-up-copilot-extensions)
- [Communicating with the Copilot platform](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-the-copilot-platform)
- [Communicating with GitHub](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-github)
