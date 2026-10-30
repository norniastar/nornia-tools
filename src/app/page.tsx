import Dashboard from '../components/Dashboard';
import JsonLd from '../components/JsonLd';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TOOL_DEFINITIONS, toolPath } from '../config/tools';

export default function HomePage() {
  return (
    <>
      <Dashboard />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: SITE_NAME,
              url: `${SITE_URL}/`,
              description: SITE_DESCRIPTION,
              inLanguage: 'zh-CN',
            },
            {
              '@type': 'ItemList',
              name: '开发小工具',
              itemListElement: TOOL_DEFINITIONS.map((tool, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: tool.name,
                url: `${SITE_URL}${toolPath(tool)}`,
              })),
            },
          ],
        }}
      />
    </>
  );
}
