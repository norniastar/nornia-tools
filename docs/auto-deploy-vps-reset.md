# VPS 重置后的自动部署恢复指南

这份文档针对当前仓库的自动部署链路，重点说明 VPS 重置后需要重新配置什么，以及哪些地方通常不用改。

## 1. 当前自动部署链路

仓库现在的发布流程在 [`.github/workflows/deploy.yml`](/Users/cds-dn-891/code/codex/nornia-tools/.github/workflows/deploy.yml) 中定义：

1. 推送代码到 `main`
2. GitHub Actions 构建 Docker 镜像
3. 镜像推送到 `ghcr.io/<owner>/<repo>`
4. GitHub Actions 通过 SSH 登录 VPS
5. 远端执行 `deploy.sh <image-ref>`
6. VPS 拉取新镜像，删除旧容器，启动新容器

远端部署脚本模板在 [`deploy/remote-deploy.sh.example`](/Users/cds-dn-891/code/codex/nornia-tools/deploy/remote-deploy.sh.example)，容器内运行的是 Nginx 静态站点，监听容器内 `80` 端口，配置文件在 [`nginx.conf`](/Users/cds-dn-891/code/codex/nornia-tools/nginx.conf)。

结论：

- 这次重置 VPS 后，通常不需要改 GitHub Actions 的主流程。
- 需要重建的是 VPS 侧环境和 GitHub Secrets/Variables 对应关系。
- 只有当服务器用户名、SSH 端口、部署脚本路径、域名反代方式发生变化时，才需要调整配置。

## 2. 重置 VPS 后必须恢复的内容

新机器至少要恢复下面几类内容：

- Docker 运行环境
- 部署目录，例如 `/opt/nornia-tools`
- 远端部署脚本 `deploy.sh`
- 远端环境文件 `deploy.env`
- GitHub Actions 登录 VPS 用的 SSH 公钥
- VPS 拉取 GHCR 镜像需要的凭证
- 反向代理或公网入口配置

如果上面任何一项缺失，推送后自动部署都会失败。

## 3. 建议先确认哪些参数变了

VPS 重置后，先确认下面这些值是否和以前一致：

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- VPS 上部署脚本路径
- 站点对外暴露端口
- 域名解析是否还指向这台机器
- Nginx/宝塔/Caddy/Traefik 之类的反代是否还在

如果这些值没变，GitHub Actions 大概率不用改，只需要把服务器重新配好。

如果这些值变了，只更新对应的 GitHub Secrets/Variables 即可，不一定要改 workflow 文件。

## 4. VPS 侧推荐恢复步骤

以下步骤默认使用仓库当前的约定路径 `/opt/nornia-tools`。

### 4.1 安装 Docker

先确保 VPS 上已经安装 Docker，并且部署用户可以直接执行 `docker`：

```bash
docker --version
docker ps
```

如果部署用户没有权限执行 Docker，需要把该用户加入 Docker 用户组，或者在部署脚本里统一走 `sudo docker`。当前模板脚本默认直接调用 `docker`，所以更推荐把权限配好，而不是改 workflow。

### 4.2 创建部署目录

```bash
sudo mkdir -p /opt/nornia-tools/logs
sudo chown -R <your-user>:<your-user> /opt/nornia-tools
```

### 4.3 安装远端部署脚本

把仓库中的模板脚本放到 VPS 上：

```bash
sudo cp /path/to/remote-deploy.sh.example /opt/nornia-tools/deploy.sh
sudo chmod +x /opt/nornia-tools/deploy.sh
```

如果你是在本地仓库操作，也可以直接把 [`deploy/remote-deploy.sh.example`](/Users/cds-dn-891/code/codex/nornia-tools/deploy/remote-deploy.sh.example) 内容复制到 VPS 的 `/opt/nornia-tools/deploy.sh`。

当前脚本的默认行为是：

- 从命令行接收一个镜像地址
- 读取 `/opt/nornia-tools/deploy.env`
- 登录 `ghcr.io`
- `docker pull` 新镜像
- 删除同名旧容器
- 用 `--restart unless-stopped` 启动新容器
- 记录部署日志到 `/opt/nornia-tools/logs/deploy.log`

### 4.4 创建远端环境文件

在 VPS 上创建 `/opt/nornia-tools/deploy.env`：

```bash
cat >/opt/nornia-tools/deploy.env <<'EOF'
GHCR_USERNAME="<your-github-username>"
GHCR_TOKEN="<github-token-with-read-packages>"
APP_NAME="nornia-tools"
HOST_PORT="18080"
APP_PORT="80"
EOF
```

参数说明：

- `GHCR_USERNAME`：用于登录 GHCR 的 GitHub 用户名
- `GHCR_TOKEN`：至少具备 `read:packages` 权限的 token
- `APP_NAME`：Docker 容器名，默认 `nornia-tools`
- `HOST_PORT`：VPS 对外暴露端口，默认 `18080`
- `APP_PORT`：容器内端口，当前镜像里是 `80`

注意：

- 当前 Docker 镜像是 Nginx 静态站点，容器内端口不要改成别的，除非你同步改了镜像。
- 如果你改了 `HOST_PORT`，记得同步检查服务器防火墙和反向代理。

### 4.5 先在 VPS 本机手动验证一次

不要先依赖 GitHub Actions，先在 VPS 手动确认链路能跑通：

```bash
/opt/nornia-tools/deploy.sh ghcr.io/<owner>/<repo>:main
```

验证项：

- `docker login ghcr.io` 是否成功
- `docker pull` 是否成功
- 容器是否成功启动
- `docker ps` 是否能看到 `nornia-tools`
- `curl http://127.0.0.1:18080/healthz` 是否返回 `ok`

如果这里都不通，说明问题在 VPS 侧，不在 GitHub Actions。

## 5. GitHub 侧需要核对的配置

当前 workflow 会读取这些仓库配置：

- Secret `VPS_SSH_KEY`
- Secret 或 Variable `VPS_HOST`
- Secret 或 Variable `VPS_USER`
- Secret 或 Variable `VPS_PORT`
- Variable `VPS_DEPLOY_SCRIPT`，可选

对应逻辑见 [`.github/workflows/deploy.yml`](/Users/cds-dn-891/code/codex/nornia-tools/.github/workflows/deploy.yml)。

### 5.1 必配项

在 GitHub 仓库 `Settings > Secrets and variables > Actions` 中确认：

- `VPS_HOST`：新 VPS 的 IP 或域名
- `VPS_PORT`：新 VPS SSH 端口，默认一般是 `22`
- `VPS_USER`：SSH 登录用户
- `VPS_SSH_KEY`：GitHub Actions 用来 SSH 登录 VPS 的私钥内容

### 5.2 可选项

如果远端脚本不在默认路径 `/opt/nornia-tools/deploy.sh`，需要额外设置：

- `VPS_DEPLOY_SCRIPT`

例如：

```text
/srv/nornia-tools/deploy.sh
```

### 5.3 什么时候需要更新 `VPS_SSH_KEY`

VPS 重置后，下面两种情况最常见：

1. 服务器重建了，但还沿用原来的部署私钥
2. 服务器重建后，重新生成了一套新的部署密钥

如果你保留的是原来那把私钥，只需要把对应公钥重新写入新 VPS 的 `~/.ssh/authorized_keys`。

如果你重新生成了部署密钥，需要同时做两件事：

1. 把新公钥写入 VPS 的 `authorized_keys`
2. 把新私钥内容更新到 GitHub Secret `VPS_SSH_KEY`

## 6. 哪些情况下需要调整 workflow

当前 [`deploy.yml`](/Users/cds-dn-891/code/codex/nornia-tools/.github/workflows/deploy.yml) 本身已经支持大部分 VPS 重建场景，通常不用改代码。

只有下面这些情况，才建议调整 workflow 或脚本：

- 默认分支不再是 `main`
- SSH 端口策略变了，且你不想只用 Secret/Variable 覆盖
- 远端脚本路径规范变了
- 你不想再用 GHCR，改成 Docker Hub 或私有镜像仓库
- 你想从“直接拉镜像重启单容器”升级成 `docker compose`、蓝绿发布或回滚脚本
- 你希望部署前增加健康检查、数据库迁移或 smoke test

如果只是“VPS 重置了”，建议优先保持 workflow 不动，只修复配置和机器环境。

## 7. 推荐的推送后验收顺序

建议按这个顺序验收，定位问题最快：

1. 在 VPS 本机执行一次 `/opt/nornia-tools/deploy.sh ghcr.io/<owner>/<repo>:main`
2. 用 `docker ps` 确认容器已启动
3. 用 `curl http://127.0.0.1:<HOST_PORT>/healthz` 确认应用存活
4. 确认公网入口能访问
5. 再推一个 commit 到 `main`
6. 查看 GitHub Actions 的 `Build And Deploy` 是否全部成功
7. 最后检查 `/opt/nornia-tools/logs/deploy.log`

## 8. 常见失败点和对应处理

### 8.1 SSH 登录失败

常见原因：

- `VPS_HOST` 写错
- `VPS_PORT` 写错
- `VPS_USER` 不对
- `VPS_SSH_KEY` 对应的公钥没有写到新机器
- 新 VPS 重置后，GitHub Actions 首次连接拿到的是新 host key

说明：

- 当前 workflow 里已经有 `ssh-keyscan`，会自动把目标主机 host key 写入 `known_hosts`
- 所以 VPS 重建后，通常不需要改 workflow，只要目标地址和 SSH 信息正确即可

### 8.2 VPS 拉取 GHCR 失败

常见原因：

- `deploy.env` 里的 `GHCR_TOKEN` 失效
- token 没有 `read:packages`
- 镜像包是私有的，但 VPS 侧没有正确登录
- `GHCR_USERNAME` 不匹配

建议：

- 先在 VPS 手动执行一次 `docker login ghcr.io`
- 再执行一次 `docker pull ghcr.io/<owner>/<repo>:main`

### 8.3 容器启动了，但外部访问不到

重点检查：

- `HOST_PORT` 是否和防火墙放行端口一致
- 云厂商安全组是否放行该端口
- 域名 A 记录是否仍指向当前 VPS
- 反代是否还转发到 `127.0.0.1:<HOST_PORT>`

### 8.4 GitHub Actions 构建成功，但远端脚本不存在

处理方式：

- 检查 VPS 上是否真的存在 `/opt/nornia-tools/deploy.sh`
- 如果路径改了，补上 `VPS_DEPLOY_SCRIPT`

## 9. 这次重置后建议你优先核对的最小清单

如果你想最快恢复自动部署，先只做这几件事：

1. 在新 VPS 上装好 Docker
2. 创建 `/opt/nornia-tools/deploy.sh`
3. 创建 `/opt/nornia-tools/deploy.env`
4. 把部署公钥写到新 VPS 的 `authorized_keys`
5. 核对 GitHub 的 `VPS_HOST`、`VPS_PORT`、`VPS_USER`、`VPS_SSH_KEY`
6. 在 VPS 手动执行一次部署脚本
7. 推一个 commit 到 `main` 验证自动部署

## 10. 结合当前仓库，推荐的调整结论

基于当前代码仓库，VPS 重置后最合理的调整方式是：

- 不改 GitHub Actions 主流程
- 保留 GHCR 镜像发布方式
- 在新 VPS 上重新部署 `deploy.sh` 和 `deploy.env`
- 重新配置 SSH 公钥和 GHCR 拉取凭证
- 按新的服务器信息更新 GitHub Secrets/Variables

也就是说，这次更像是“恢复部署环境”，不是“重写自动部署方案”。
