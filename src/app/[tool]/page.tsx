import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '../../components/JsonLd';
import ToolAbout from '../../components/ToolAbout';
import ToolLoader from '../../components/ToolLoader';
import { OG_IMAGE, SITE_NAME, SITE_URL, TOOL_DEFINITIONS, TOOL_DEFINITIONS_BY_SLUG, toolPath } from '../../config/tools';

type Props = { params: Promise<{ tool: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => TOOL_DEFINITIONS.map(tool => ({ tool: tool.slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const tool = TOOL_DEFINITIONS_BY_SLUG[(await params).tool];
  if (!tool) return {};

  const path = toolPath(tool);
  const title = `${tool.seoTitle} - ${SITE_NAME}`;
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'zh_CN',
      url: path,
      title,
      description: tool.seoDescription,
      images: OG_IMAGE,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: tool.seoDescription,
      images: OG_IMAGE,
    },
  };
};

export default async function ToolRoutePage({ params }: Props) {
  const tool = TOOL_DEFINITIONS_BY_SLUG[(await params).tool];
  if (!tool) notFound();

  const url = `${SITE_URL}${toolPath(tool)}`;
  return (
    <>
      <ToolLoader toolId={tool.id} />
      <ToolAbout tool={tool} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: tool.name,
              url,
              description: tool.seoDescription,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              browserRequirements: 'Requires JavaScript',
              inLanguage: 'zh-CN',
              isAccessibleForFree: true,
              featureList: tool.features,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: tool.name, item: url },
              ],
            },
          ],
        }}
      />
    </>
  );
}
