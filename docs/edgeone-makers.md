# 在 EdgeOne Makers 部署 Sublink Worker

使用 **Node.js Cloud Functions + EdgeOne Blob** 部署完整的订阅转换 UI、转换接口、短链接与配置托管。保留已有 Cloudflare Workers、Vercel、Node.js、Docker 入口。

## 1. 导入仓库

1. 打开 [EdgeOne Makers 控制台](https://pages.edgeone.ai/)。
2. 选择 **创建项目 → 导入 Git 仓库**，连接 GitHub 并选择 `zephyr-roc/sublink-worker`。
3. 选择 `main` 分支，框架预设选 **Other / 无框架**。
4. 项目根目录使用仓库根目录 `./`。
5. 构建参数由根目录 `edgeone.json` 提供；若控制台需要手动填写：

| 参数 | 值 |
| --- | --- |
| Install Command | `npm install` |
| Build Command | `npm run build:edgeone` |
| Output Directory | `public` |
| Node.js Build Version | `22.11.0` |

`cloud-functions/index.js` 负责 `/`，`cloud-functions/[[default]].js` 负责所有其他路径。构建脚本用 esbuild 将 Hono + JSX 服务端逻辑打包到 `cloud-functions/_shared/app.mjs`。请勿把 `npm run deploy`（Cloudflare Wrangler）用作 Makers 的构建命令。

## 2. 存储配置

应用使用 Makers Blob SDK `@edgeone/pages-blob`，首次请求会自动创建名为 `sublink-worker` 的 Blob 命名空间。**无需申请 Makers KV、无需配置外部 Redis，也无需提供 API Token。**

默认配置：

- `EDGEONE_BLOB_STORE=sublink-worker`：Blob 命名空间，可选。
- `CONFIG_TTL_SECONDS`：托管配置有效期，省略时保留原项目默认值 **30 天**；设为 `0` 可永久保留。
- `SHORT_LINK_TTL_SECONDS`：短链接有效期，默认无期限；设为正整数时启用过期。
  
Blob 不支持原项目的 KV `expirationTtl` 参数；此部署使用带过期时间的 JSON 包装，读取时判断是否过期。已过期对象不会返回，但不会自动物理删除，需要定期清理时可扩展 Blob 管理脚本。读操作采用强一致性，避免保存后立即访问到旧配置。

注意：Blob 是项目级持久化存储，部署到另一个 Makers 项目不会自动迁移原项目的短链接和配置。

## 3. 验证

- 首页：`https://<your-domain>/`
- 配置转换：`/clash?config=...` 和 `/singbox?config=...`
- 短链接生成：`/shorten-v2`，访问：`/c/<code>`、`/b/<code>`
- 配置托管：`POST /config`，读取：`/resolve?configId=...`

运行本地检查：

```bash
npm install
npm run test:edgeone
npm run build:edgeone
```

**不要直接用本地 `node cloud-functions/index.js` 模拟 Makers 的运行环境**：Blob SDK 的自动认证仅在 Makers Functions 环境提供。可使用 Makers 控制台预览部署验证读写。

## 4. 安全与平台限制

- 生成的短链接和转换地址是可被持有者访问的公开 URL，含节点凭据时应视作敏感信息。
- 本项目原有的管理和转换 API 默认没有账号鉴权；建议只面向可信用户提供管理界面，必要时添加访问控制。
- 运行 Node Functions 而非 Edge Functions，因为当前应用依赖 Hono JSX 和 npm 模块，Blob 官方 SDK 支持 Node Functions。
- `/favicon.ico` 使用 `public/favicon.ico` 作为静态资源，由 Makers 静态路由优先返回。
- EdgeOne Makers 运行时部署是否成功，还需要在控制台检查构建日志并实际测试写入、读取；GitHub CI 只验证代码和构建。

官方文档：[Node Functions](https://pages.edgeone.ai/document/node-functions) / [Blob Storage](https://pages.edgeone.ai/document/blob-storage) / [edgeone.json](https://pages.edgeone.ai/document/edgeone-json)
