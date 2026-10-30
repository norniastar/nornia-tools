import type { NextConfig } from 'next';

// 全站无服务端依赖，静态导出后由 nginx / CDN 直接托管 out/
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
