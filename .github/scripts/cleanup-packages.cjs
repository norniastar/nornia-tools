// 每次只清理本仓库的旧 SHA 镜像；无法确认回滚基线时停止删除。
module.exports = async function cleanup({ github, context, core }) {
  const repo = context.repo;
  const deployments = await github.paginate(github.rest.repos.listDeployments, {
    ...repo, environment: 'vps-production', per_page: 100,
  });
  const protectedSHAs = new Set();
  let successes = 0;
  for (const deployment of deployments) {
    const { data: statuses } = await github.rest.repos.listDeploymentStatuses({
      ...repo, deployment_id: deployment.id, per_page: 1,
    });
    if (statuses[0]?.state === 'success') {
      protectedSHAs.add(deployment.sha);
      successes++;
      if (successes === 2) break;
    }
  }
  // 首次改造时线上可能是 SSH 导入的镜像，不把缺失部署记录视为安全删除依据。
  if (successes < 2) { core.notice('尚无两次成功部署记录，本轮不删除镜像'); return; }
  const versions = await github.paginate('GET /users/{username}/packages/container/{package_name}/versions', {
    username: repo.owner, package_name: repo.repo, per_page: 100,
  });
  const shaTag = /^sha-[a-f0-9]{40}$/;
  const releases = versions.filter((v) => v.metadata?.container?.tags?.some((t) => shaTag.test(t)))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const keepIDs = new Set(releases.slice(0, 10).map((v) => v.id));
  for (const version of releases) {
    const tags = version.metadata.container.tags;
    if (tags.includes('main') || tags.some((tag) => protectedSHAs.has(tag.replace(/^sha-/, '')))) keepIDs.add(version.id);
  }
  for (const version of releases) {
    if (keepIDs.has(version.id)) continue;
    await github.request('DELETE /users/{username}/packages/container/{package_name}/versions/{package_version_id}', {
      username: repo.owner, package_name: repo.repo, package_version_id: version.id,
    });
    core.info(`已清理旧镜像 version=${version.id}`);
  }
  // 不删除旧构建产生的无标签关联清单，避免破坏历史 OCI 索引引用。
};
