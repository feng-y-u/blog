# CLAUDE.md — 个人博客系统项目指引

## 项目概述

轻量级个人博客系统，支持 Markdown 写作、笔记管理。技术栈：React 18 + Vite + TailwindCSS / Node.js + Express / Prisma + SQLite。

## 关键文档

- [Project.md](Project.md) — 设计文档（架构、数据库、API、路由）
- [Task.md](Task.md) — 开发计划（Phase 1~3 详细任务）
- [coding.md](coding.md) — 编码规范（命名、结构、格式）

## 快速命令

```bash
# 后端
cd server && npm run dev      # 开发启动（端口 3001）

# 前端
cd client && npm run dev      # 开发启动（端口 5173）

# 数据库
cd server && npx prisma studio  # 可视化数据管理
cd server && npx prisma migrate dev --name <名称>
cd server && node prisma/seed.js
```

## 开发规则

1. **Phase 顺序**：严格按 Task.md Phase 1 → 2 → 3 顺序开发，不跳阶段
2. **单任务专注**：一次只做一个 Task，完成后标记再开始下一个
3. **编码规范**：遵循 coding.md，不做规范外的事（不写 TypeScript、不写测试）
4. **提交格式**：`<type>(<scope>): <描述>` — feat/fix/refactor/chore
5. **默认中文**：代码注释用英文，提交信息用中文，对话用中文

## 当前状态

- 项目初始化阶段，尚未开始编码
- 下一步：Task 1.1 — 项目初始化与基础搭建
