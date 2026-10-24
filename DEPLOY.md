# GitHub Actions、GHCR 与 VPS 部署

本项目与 `norniastar/nornia-dashboard` 使用相同的发布约定。VPS 配置以运维目录
`/Users/nornia/nornia-sync/codex/nornia-vps` 为唯一来源。

## 发布与回滚

- PR：执行 TypeScript 校验与前端构建。
- push main：校验 → 构建 `linux/amd64` → 推送 GHCR → SSH 执行统一部署脚本。
- 镜像标签：`ghcr.io/norniastar/nornia-tools:main`、`sha-<完整提交SHA>`。
- Actions 手动触发：填写 `image_sha`，直接部署已有镜像，不 checkout 或构建历史源码。
- Dashboard 的服务管理页也触发同一 `workflow_dispatch`，仅提供最近 10 个可部署镜像。
- workflow 为 `.github/workflows/deploy.yml`，构建缓存使用 GHA；生产任务使用 `production` Environment。

## VPS 约定

| 项目 | 配置 |
| --- | --- |
| SSH | `154.44.20.127:57622`，专用 `deploy` 用户 |
| Compose | `/srv/nornia/apps/nornia-tools/compose.yaml` |
| 部署入口 | `sudo -n /usr/local/sbin/nornia-release nornia-tools <完整SHA>` |
| 上游 | `127.0.0.1:18080:80` |
| 健康检查 | `/healthz` |
| 公网入口 | `https://tools.nornia.top/`，复用宿主机 Nginx |

`/usr/local/sbin/nornia-release` 来自运维仓库 `scripts/release.sh`，由 root 持有。
不再使用 `/opt/nornia-tools/deploy.sh`、`deploy.env` 或先删除容器的 `docker run` 流程。
应用镜像包含 curl，Compose 同时检查镜像 ID、容器健康和本机 HTTP。

脚本在拉取前为旧镜像建立本地回滚标签；新镜像拉取失败不会替换旧容器。
更新失败时恢复旧镜像并重新检查健康，Actions 仍显示失败。脚本不执行数据库操作或全局 image prune。
Compose 的 `NORNIA_IMAGE` 由脚本传入，请勿绕过脚本直接执行 `docker compose up`，以免部署浮动 main 标签。

## GitHub 配置

创建 Environment `production`，仅允许 main，若需要完全自动部署则不设置人工审批。
Environment Secrets：`VPS_HOST`、`VPS_USER`（deploy）、`VPS_SSH_KEY`、`VPS_SSH_FINGERPRINT`。
固定 SSH 端口为 57622；主机指纹必须通过可信管理连接核验，不能以 ssh-keyscan 的结果直接建立信任。

Actions 使用 `GITHUB_TOKEN` 推送镜像。私有镜像的 VPS 拉取使用 root Docker 配置中独立的
`read:packages` PAT，不能复用只有 repo 权限的本机 gh 登录。
统一脚本安装、受限 sudo、密钥和 GHCR 初始化步骤见运维仓库 `docs/runbook.md` 的统一发布章节。

## 版本记录与清理

每次部署通过 GitHub Deployments 写入 `vps-production` 环境，记录目标镜像 SHA、请求编号、操作用户和执行日志。
`production` 是工作流的凭据与审批环境，`vps-production` 是镜像发布记录，避免历史镜像与工作流源码 SHA 混淆。

每周清理仅处理本包，保留最近 10 个 SHA 镜像，额外保留 main 和最近两次成功部署对应的镜像。
不足两次成功记录时停止删除。旧的无标签 OCI 关联清单不自动删除，避免破坏已有镜像索引。
Package Settings 必须给予本仓库工作流管理该包的权限，清理失败应检查此项。

## 验收

1. 完成运维脚本与 Secrets 初始化后，手动部署一个已存在的 SHA。
2. 确认本机 `/healthz` 和公网 `/healthz` 返回 200。
3. 确认 GitHub `vps-production` 部署记录目标 SHA 与容器实际镜像一致。
4. 在隔离验收环境演练不健康镜像更新，确认旧容器恢复、Actions 返回失败。
5. 再验证 push main 的构建、推送、部署全链路和 Dashboard 历史镜像发布。

手动回滚：

```sh
ssh -p 57622 deploy@154.44.20.127 \
  'sudo -n /usr/local/sbin/nornia-release nornia-tools <旧版本完整SHA>'
```

直接 SSH 发布不会自动补写 GitHub 部署记录。日常使用 Actions 或 Dashboard；紧急 SSH 操作后须核验并补齐记录。
