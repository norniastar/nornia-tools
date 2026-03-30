# 自动部署说明

当前仓库的发布链路是：

- 推送到 `main` 分支
- GitHub-hosted runner 构建 Docker 镜像
- 推送镜像到 GitHub Container Registry (`ghcr.io`)
- 通过 SSH 登录 VPS
- 调用 VPS 上的 Docker 部署脚本拉取新镜像并重启容器

对应文件：

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Docker 构建文件: `Dockerfile`
- Nginx 运行配置: `nginx.conf`
- VPS 部署脚本模板: `deploy/remote-deploy.sh.example`

## 第 1 步：确认 GitHub 仓库默认分支是 `main`

这个 workflow 只会在推送到 `main` 时触发：

```yaml
on:
  push:
    branches:
      - main
```

## 第 2 步：准备 VPS 部署脚本

在你的 VPS 上创建目录并放置部署脚本：

```bash
sudo mkdir -p /opt/nornia-tools
sudo cp deploy/remote-deploy.sh.example /opt/nornia-tools/deploy.sh
sudo chmod +x /opt/nornia-tools/deploy.sh
```

然后在 VPS 上为脚本准备环境变量。推荐放到 systemd 环境文件或当前用户 shell 配置中，至少包括：

```bash
export GHCR_USERNAME="<your-github-username>"
export GHCR_TOKEN="<github-token-with-read-packages>"
export APP_NAME="nornia-tools"
export HOST_PORT="80"
export APP_PORT="80"
```

说明：

- `GHCR_TOKEN` 需要有 `read:packages` 权限
- 如果镜像包是私有的，VPS 必须登录 GHCR 才能拉取
- 如果你把包改成公开，理论上可以省略登录，但通常不建议一开始就这么做

## 第 3 步：给 GitHub Actions 配置 Secrets

在 GitHub 仓库 `Settings > Secrets and variables > Actions` 中添加：

- `VPS_HOST`: VPS IP 或域名
- `VPS_PORT`: SSH 端口，默认可填 `22`
- `VPS_USER`: SSH 登录用户名
- `VPS_SSH_KEY`: GitHub Actions 用来登录 VPS 的私钥内容

私钥建议单独为部署创建一把，例如：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

然后：

- 把 `~/.ssh/github_actions_deploy.pub` 追加到 VPS 上目标用户的 `~/.ssh/authorized_keys`
- 把 `~/.ssh/github_actions_deploy` 的内容保存到 GitHub Secret `VPS_SSH_KEY`

## 第 4 步：可选配置 Repository Variable

如果你在 VPS 上不想把脚本放在 `/opt/nornia-tools/deploy.sh`，可以新增一个 GitHub Actions Variable：

- `VPS_DEPLOY_SCRIPT`: 例如 `/srv/apps/nornia-tools/deploy.sh`

如果不配置，workflow 默认执行：

```bash
/opt/nornia-tools/deploy.sh
```

## 第 5 步：首次在 VPS 验证部署脚本

先在 VPS 本机手动跑一次，确认 Docker、权限和 GHCR 登录都正常：

```bash
/opt/nornia-tools/deploy.sh ghcr.io/<owner>/<repo>:main
```

如果这里失败，不要先看 Actions，先把 VPS 侧问题解决掉。

## 第 6 步：推送到 `main` 触发自动发布

当你把代码推送到 `main` 后，workflow 会执行以下动作：

1. 构建镜像
2. 推送两个 tag 到 GHCR
3. 通过 SSH 连接 VPS
4. 调用部署脚本并传入本次 commit 对应的镜像 tag

当前会推送两个 tag：

- `ghcr.io/<owner>/<repo>:main`
- `ghcr.io/<owner>/<repo>:sha-<commit_sha>`

部署时实际使用的是 `sha-<commit_sha>`，这样回滚更清晰。

## 第 7 步：常见排查点

- `docker push` 权限失败：检查 workflow 是否有 `packages: write`
- VPS 拉镜像失败：检查 `GHCR_TOKEN` 是否有 `read:packages`
- SSH 登录失败：检查 `VPS_USER`、`VPS_PORT`、私钥和 `authorized_keys`
- 部署脚本找不到：检查 `VPS_DEPLOY_SCRIPT` 或服务器上的默认路径
- 容器启动后无法访问：检查 VPS 防火墙、安全组和 `HOST_PORT`
