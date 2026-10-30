import type { MetadataRoute } from 'next';
import { SITE_URL, TOOL_DEFINITIONS, toolPath } from '../config/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    ...TOOL_DEFINITIONS.map(tool => ({
      url: `${SITE_URL}${toolPath(tool)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
