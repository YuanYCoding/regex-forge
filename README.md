# RegexForge

正则表达式自动化生成与测试平台。基于多模型大语言模型（LLM），从用户意图出发，自动生成相似表达、构建正则表达式、执行批量测试，并支持一键适配修正。同时内置快速算法模式，无需 API Key 即可在本地完成正则生成。

## 工作流程

```
意图输入 → 相似问生成 → 正则/关键词生成 → 批量测试 → 适配修正
```

### Step 1 — 意图输入

输入用户意图的核心描述（如「优惠券无法使用」「客服回访无人接听」），支持**简洁模式**和**详细模式**两种输入方式。详细模式下可补充额外的上下文背景。

### Step 2 — 相似问生成

AI 根据意图自动生成语义一致的多样化表达，覆盖以下变体：

- 同义词替换（领 → 抢 → 拿 → 获取）
- 句式变化（陈述 → 反问 → 感叹）
- 语气词变化（啊、吧、嘛、呢、哦）
- 长短句变化（3 字短句到 20 字长句）
- 主语变化（我 → 咱 → 用户）

同时支持**反例生成**——生成与意图主题相关但语义相反的测试问，用于验证正则不会产生误命中。

### Step 3 — 正则 / 关键词生成

提供三种生成模式：

| 模式 | 说明 | 需要 API Key |
|------|------|:---:|
| **快速算法** | 基于文本相似度和公共子串分析，本地直接生成正则 | 否 |
| **AI 生成** | 调用 LLM 理解语义，生成高覆盖率的智能正则 | 是 |
| **提取关键词** | 从意图和相似问中提取核心关键词列表 | 是 |

正则输出支持两种展示格式：

- **逐条格式**：每条正则独立，逗号分隔，如 `^.*优惠券.*领.*[。.]?$ , ^.*券.*没了.*$`
- **合并格式**：所有正则合并为一个，管道符 `|` 连接

### Step 4 — 批量测试

在正则表达式测试区粘贴测试话术（支持批量，每行一条），一键运行测试。每个测试用例返回：

- **匹配状态**：通过 / 失败
- **命中正则**：匹配到哪条正则规则
- **失败原因**：智能分析——缺少关键词、标点差异、空格处理等

### Step 5 — 适配修正

当测试有失败话术时，AI 自动分析失败原因并修正正则：

- **保留原有覆盖**：确保原有话术仍然能匹配
- **扩展新规则**：为失败话术新增或调整正则
- **防止过度泛化**：精准修正，避免误匹配
- **返回变更说明**：清晰列出修改了哪些正则

## 模型支持

内置 12 个预设模型，同时支持自定义模型：

| 模型 | 提供商 |
|------|--------|
| GPT-4o / GPT-4o-mini / GPT-4.1 | OpenAI |
| Claude Opus 4 / Claude Sonnet 4 | Anthropic |
| DeepSeek V3 / DeepSeek R1 | DeepSeek |
| Qwen-Max / Qwen-Plus | 阿里云 (DashScope) |
| GLM-4 / GLM-4-Plus | 智谱 AI |
| Moonshot V1 | 月之暗面 |
| 自定义模型 | 兼容 OpenAI API 格式 |

API Key 仅存储在浏览器本地（localStorage），所有 LLM 调用从浏览器直连 API 服务端（通过 Next.js API Route 服务端代理），不上传至任何第三方。

## 技术架构

```
┌──────────────────────────────────────────┐
│              Next.js 16 (App Router)       │
│                                            │
│  ┌──────────┐  ┌──────────────────────┐   │
│  │  Frontend │  │   API Routes (Node)   │   │
│  │  React 19 │  │                        │   │
│  │  Zustand  │  │  /api/generate-similar  │   │
│  │  Tailwind │  │  /api/generate-regex    │   │
│  │  Radix UI │  │  /api/generate-regex-   │   │
│  │  Motion   │  │    fast                 │   │
│  │  Monaco   │  │  /api/generate-keywords │   │
│  │           │  │  /api/generate-negative  │   │
│  └──────────┘  │  /api/adapt-regex       │   │
│                │  /api/test-connection    │   │
│                │  /api/prompts            │   │
│                │  /api/models             │   │
│                └──────────────────────────┘   │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │         LLM Client (Server-side)     │   │
│  │  OpenAI SDK  │  Anthropic SDK       │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

## 目录结构

```
├── app/
│   ├── layout.tsx              # 根布局（字体加载、Provider）
│   ├── page.tsx                # 主工作台页面（4 步流程）
│   ├── globals.css             # 全局样式 + Tailwind CSS 主题
│   ├── api/                    # API 路由 (Next.js Route Handlers)
│   │   ├── generate-similar/   # 生成相似问
│   │   ├── generate-regex/     # AI 生成正则
│   │   ├── generate-regex-fast/# 快速算法生成正则
│   │   ├── generate-keywords/  # 提取关键词
│   │   ├── generate-negative/  # 生成反例
│   │   ├── adapt-regex/        # 适配修正正则
│   │   ├── test-connection/    # 测试 API 连接
│   │   ├── models/             # 获取预设模型列表
│   │   └── prompts/            # 提示词管理
│   ├── prompts/page.tsx        # 提示词配置页面
│   └── settings/page.tsx       # 模型配置页面
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # 顶部导航栏
│   │   └── Provider.tsx        # 应用 Provider（字体加载、状态初始化）
│   ├── intent/
│   │   ├── IntentPanel.tsx     # 意图输入面板
│   │   └── ExpressionList.tsx  # 相似问列表管理
│   ├── regex/
│   │   └── RegexResultPanel.tsx # 正则/关键词结果展示
│   └── test/
│       ├── TestPanel.tsx        # 测试输入面板
│       ├── TestResultModal.tsx  # 测试结果弹窗
│       └── TestResultTable.tsx  # 测试结果表格
├── lib/
│   ├── types.ts                # TypeScript 类型定义 + 预设模型
│   ├── store.ts                # Zustand 全局状态管理
│   ├── llm-client.ts           # LLM 客户端（OpenAI + Anthropic）
│   ├── regex-engine.ts         # 正则解析、测试、统计引擎
│   ├── fast-regex-generator.ts # 快速正则生成算法
│   ├── prompts.ts              # 内置提示词模板
│   └── utils.ts                # 工具函数（cn）
├── hooks/
│   └── useLocalStorage.ts      # localStorage 持久化 Hook
├── Dockerfile                  # Docker 多阶段构建
├── next.config.ts              # Next.js 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 项目依赖
```

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建

```bash
npm run build
npm start
```

### Docker 部署

```bash
docker build -t regex-forge .
docker run -d -p 3000:3000 regex-forge
```

## 页面说明

### 工作台 (`/`)

核心功能页面，包含四个步骤区：

1. **意图输入** — 输入意图描述，选择简洁/详细模式，设置生成数量
2. **相似问管理** — 查看/编辑/删除生成的相似问，选择正则生成模式
3. **正则 / 关键词** — 展示生成结果，支持逐条/合并格式切换、复制、编辑
4. **正则测试** — 输入测试话术，运行测试，查看通过率

### 模型配置 (`/settings`)

- 预设模型一键选择
- 自定义模型 ID
- API Key 配置（本地加密存储）
- API Base URL 配置（兼容 OpenAI API 格式代理）
- Temperature & Max Tokens 滑块调节
- 一键测试连接

### 提示词配置 (`/prompts`)

- 查看所有内置提示词模板
- 在线编辑和保存（保存到服务端内存，容器重启后恢复默认）
- 源码 / 渲染预览切换
- JSON / Markdown 格式支持

## 提示词管理

项目内置 5 个可编辑的提示词模板：

| 提示词 | 用途 | 类别 |
|--------|------|------|
| `generate_similar` | 根据意图生成语义相似的表达 | 意图扩展 |
| `generate_regex` | 基于意图和相似问生成正则表达式 | 正则生成 |
| `generate_keywords` | 从意图和相似问中提取核心关键词 | 关键词提取 |
| `generate_negative` | 生成反例测试问 | 意图扩展 |
| `adapt_regex` | 根据失败话术修正和扩展正则 | 正则优化 |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| UI 组件 | Radix UI (Dialog, Select, Slider, Switch, Tabs, Toast, Tooltip) |
| 动画 | Motion (Framer Motion) |
| 代码编辑器 | Monaco Editor (@monaco-editor/react) |
| LLM SDK | OpenAI SDK + Anthropic SDK |
| 图标 | Lucide React |
| Markdown | react-markdown |
| 字体 | DM Sans + JetBrains Mono (Google Fonts) |
| 容器化 | Docker (multi-stage build, Alpine) |

## License

MIT
