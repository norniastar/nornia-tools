# 性能冲刺简报：Nornia Tools

## 你的职责

负责 tools.nornia.top 打开到能用的速度：先测基线，再一步步优化，每一步都用测量证明，赢下来的用棘轮锁住。用户看得见的变化和上线由人决定。

## 核心操作与「能用」的定义

所有页面都是核心页面（用户指定）。起点一律是导航开始，终点和判定表达式见 `perf/bench/pages.json`。

| 操作 | 页面 | 终点（真的能用） |
|---|---|---|
| 打开首页 | `/` | 6 张工具卡片都可见、可点 |
| 打开 JSON 编辑器 | `/#/json` | Ace 编辑器已渲染出行，输入框存在 |
| 打开时间戳转换 | `/#/timestamp` | 时间戳输入框可见，能打字（打字校验） |
| 打开 UUID 生成器 | `/#/uuid` | 已生成 UUID 可见 |
| 打开文本代码对比 | `/#/text-code-diff` | Monaco 左右两侧都已渲染，输入框存在 |
| 打开 URL 编解码 | `/#/url-codec` | 输入框可见，能打字（打字校验） |
| 打开计算稿纸 | `/#/calculator` | 输入框可见，能打字（打字校验） |

## 不能动的东西

- 视觉：完全不变，包括切换工具时 0.2s 的 motion 淡入位移动画（用户确认保留）
- 功能：全部工具行为不变，切换工具时草稿保留
- SEO / 统计：`<title>`、Cloudflare Web Analytics beacon 保持不变

## 目标

- 主指标：各页面「能用」p75 降一半（用户未给数字，按 skill 默认）
- 测量口径：主口径 fast4g（RTT 20ms、下行 4Mbps）、CPU 不限速、冷缓存、1440×900、每组 10 次。本地用 nginx 开 gzip 起服务（`perf/bench/nginx-bench.conf`），模拟线上 Cloudflare 的压缩

## 上线与回滚

- 谁批准上线：用户事先放行——护栏全绿、配对测量确实变快，就直接推 main
- 部署方式：推 main 触发 GitHub Actions，构建镜像并部署到 VPS
- 回滚办法：`git revert` 后推 main；或在 Actions 里用 workflow_dispatch 指定旧提交的镜像 SHA 重新部署
