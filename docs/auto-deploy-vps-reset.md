# VPS 重建后的自动部署恢复

发布方案已统一，完整流程见 [部署说明](../DEPLOY.md)。

VPS 重建时按顺序恢复：

1. 运维仓库的 `apps/nornia-tools/compose.yaml` 与固定 root 部署脚本。
2. 现有 Nginx 站点和证书，上游 `127.0.0.1:18080`。
3. deploy 用户、CI 公钥及仅允许统一脚本的 sudo 权限。
4. root 的 GHCR `read:packages` 登录凭据。
5. GitHub `production` Environment 的四项 Secrets，特别是重新核验主机指纹。
6. 先部署指定 SHA 验收，再恢复 push main 自动部署。

不恢复旧的 `/opt/nornia-tools/deploy.sh`、`deploy.env` 或无健康回滚的 docker run 流程。
不要重置 UFW 或 SSH 端口，实际端口与共享服务以运维仓库事实文档为准。
