# Amanuensis - Obsidian AI Assistant Plugin

一个功能强大的 Obsidian 社区插件，为用户提供集成的 AI 助手功能。支持多个 LLM 提供商，允许用户灵活配置和切换不同的 AI 模型。

## 核心特性

- **多提供商支持** - OpenAI、Anthropic、Ollama、LM Studio、自定义 API
- **灵活的模型配置** - 添加和管理多个 LLM 模型
- **现代化聊天界面** - 类似 Cursor/Windsurf 的用户友好 UI
- **本地服务器** - 后端运行在本地，保护用户隐私
- **Mastra 框架集成** - 利用 Mastra 的强大功能
- **MCP 支持** - 集成 Model Context Protocol

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

监听文件变化，自动编译 TypeScript。

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── main.ts              # 插件入口
├── ui/                  # UI 模块（聊天界面）
├── server/              # 后端服务器
├── settings/            # 设置管理
├── providers/           # LLM 提供商
├── types/               # 类型定义
└── utils/               # 工具函数
```

## 文档

- **[项目概览](./docs/PROJECT_OVERVIEW.md)** - 项目简介和快速参考
- **[架构文档](./docs/ARCHITECTURE.md)** - 整体架构和设计
- **[开发指南](./docs/DEVELOPMENT_GUIDE.md)** - 开发工作流和最佳实践
- **[模块指南](./docs/MODULE_GUIDE.md)** - 各模块详细说明

## 使用方式

1. 在 Obsidian 设置中启用插件
2. 点击侧边栏的 AI 图标打开聊天界面
3. 在设置中配置 LLM 提供商和模型
4. 选择模型并开始聊天

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: <https://github.com/obsidianmd/obsidian-sample-plugin/releases>
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at <https://github.com/obsidianmd/obsidian-releases> to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- This project already has eslint preconfigured, you can invoke a check by running`npm run lint`
- Together with a custom eslint [plugin](https://github.com/obsidianmd/eslint-plugin) for Obsidan specific code guidelines.
- A GitHub action is preconfigured to automatically lint every commit on all branches.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See <https://docs.obsidian.md>
