---
name: openspec-github-workflow
description: OpenSpec + GitHub Projects 最佳工作流实践指南。当用户询问如何组织开发流程、如何管理任务、如何使用 OpenSpec 和 GitHub Projects 协作时使用。
license: MIT
metadata:
  author: obsidian-amanuensis
  version: "1.0"
---

# OpenSpec + GitHub Projects 工作流指南

本技能提供 OpenSpec 与 GitHub Projects 结合使用的最佳实践，用于规范化开发流程。

---

## 工作流概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    开发工作流                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 探索阶段  │───▶│ 提案阶段  │───▶│ 实现阶段  │───▶│ 归档阶段  │ │
│  │ explore  │    │ propose  │    │  apply   │    │ archive  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  OpenSpec        OpenSpec        代码实现        specs/ 更新   │
│  讨论记录        变更文档        tasks 完成      变更归档       │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                        GitHub Projects                         │
│                                                                 │
│  Issue 创建    状态同步      进度跟踪        完成关闭           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 阶段 1：探索（Explore）

**目的**：理清需求，明确范围

**操作**：
- 使用 `/opsx-explore` 或 `openspec-explore` skill
- 讨论技术方案、识别风险、明确边界

**产出**：
- 需求澄清记录
- 技术方案讨论
- 风险识别

**GitHub Projects 对应**：
- 创建 Epic Issue（如果功能较大）
- 添加初步标签和描述

---

## 阶段 2：提案（Propose）

**目的**：结构化变更方案

**操作**：
```bash
/opsx-propose "功能描述"
```

**产出文件**：
```
openspec/changes/[change-name]/
├── proposal.md      # 为什么做、做什么、影响范围
├── design.md        # 技术设计（可选）
├── tasks.md         # 实现任务清单
└── specs/           # 规范变更
    └── [capability]/
        └── spec.md
```

**GitHub Projects 对应**：
```
Issue: [feat] 功能名称
├── 描述：链接到 proposal.md
├── Tasks：从 tasks.md 创建子 Issues
├── 标签：feature, infra, ui 等
├── 里程碑：对应开发阶段
└── 状态：Todo
```

---

## 阶段 3：实现（Apply）

**目的**：按任务清单实现代码

**操作**：
```bash
/opsx-apply
```

**工作方式**：
- 按 `tasks.md` 逐项实现
- 每完成一项，标记 `- [x]`
- 同步更新 GitHub Issue 状态

**GitHub Projects 对应**：
```
主 Issue: [feat] 功能名称 - In Progress
├── 子 Issue 1: 子任务 - Done
├── 子 Issue 2: 子任务 - In Progress
└── 子 Issue 3: 子任务 - Todo
```

---

## 阶段 4：归档（Archive）

**目的**：完成变更，更新规范

**操作**：
```bash
/opsx-archive
```

**自动执行**：
1. 验证所有 tasks 完成
2. 移动变更到 `openspec/changes/archive/`
3. 更新 `openspec/specs/` 为新状态
4. Git commit 记录

**GitHub Projects 对应**：
- 主 Issue 关闭
- 里程碑进度更新
- 添加完成评论（链接到归档记录）

---

## GitHub Projects 组织结构

### 推荐视图

**视图 1：看板视图**
```
┌─────────┬─────────────┬─────────────┬─────────┐
│  Todo   │ In Progress │   Review    │  Done   │
├─────────┼─────────────┼─────────────┼─────────┤
│ Issue 1 │ Issue 3     │ Issue 2     │ Issue 0 │
└─────────┴─────────────┴─────────────┴─────────┘
```

**视图 2：按里程碑分组**
```
Phase 1: 基础设施
├── [infra] Mastra Core 集成
└── [ui] 完整设置页面

Phase 2: 核心功能
├── [feat] 多模型管理
└── [feat] 基础文本操作
```

### Issue 标签规范

| 标签 | 用途 | 颜色建议 |
|------|------|----------|
| `infra` | 基础设施 | 灰色 |
| `ui` | 用户界面 | 蓝色 |
| `feat` | 新功能 | 绿色 |
| `bug` | 缺陷修复 | 红色 |
| `docs` | 文档 | 黄色 |

---

## Issue 模板

### 功能 Issue 模板

```markdown
## 概述
[feat] 功能名称

## OpenSpec 链接
- Proposal: openspec/changes/[change-name]/proposal.md
- Design: openspec/changes/[change-name]/design.md
- Tasks: openspec/changes/[change-name]/tasks.md

## 验收标准
- [ ] 标准 1
- [ ] 标准 2

## 子任务
- [ ] #12 子任务 1
- [ ] #13 子任务 2
```

---

## 日常工作流示例

### 场景：实现"多模型管理"功能

```bash
# 1. 探索需求
/opsx-explore

# 2. 创建提案
/opsx-propose "多模型管理：Ollama + OpenAI + 参数配置"

# 3. 在 GitHub 创建 Issue
gh issue create \
  --title "[feat] 多模型管理" \
  --body "See openspec/changes/add-model-management/proposal.md" \
  --label "feature" \
  --milestone "Phase 2"

# 4. 实现
/opsx-apply

# 5. 归档
/opsx-archive
```

---

## 关键原则

| 原则 | 说明 |
|------|------|
| **先设计后编码** | 用 OpenSpec 提案明确需求，再写代码 |
| **任务原子化** | tasks.md 每项任务 < 2 小时工作量 |
| **状态同步** | OpenSpec tasks 与 GitHub Issues 双向同步 |
| **归档即完成** | 只有归档后才算真正完成 |
| **Git 版本化** | 所有 OpenSpec 文件都加入版本控制 |

---

## 常用命令参考

### OpenSpec 命令

```bash
openspec list                    # 查看活跃变更
openspec show [change-name]      # 查看变更详情
openspec validate [change]       # 验证规范格式
openspec archive [change]        # 归档完成变更
```

### GitHub CLI 命令

```bash
gh issue list                    # 列出 Issues
gh issue create                  # 创建 Issue
gh issue edit [number]           # 更新 Issue 状态
gh project item-list 2           # 查看项目板（项目编号 2）
```

---

## 注意事项

1. **OpenSpec 文件全部加入 Git**：包括活跃变更和归档，不需要特殊 gitignore 规则
2. **归档使用 Git**：`openspec archive` 会使用 `git mv` 移动文件，保留历史
3. **任务粒度**：每个 task 应该可以在 1-2 小时内完成
4. **及时同步**：实现过程中及时更新 tasks.md 和 GitHub Issue 状态
