import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AppShell from '../components/AppShell';
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_WIDTH_KEY } from '../config/sidebar';
import Footer from '../components/Footer';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '../config/tools';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'zh_CN',
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#f8f9ff',
};

// 在首次绘制前按用户保存的侧边栏状态设置宽度，避免水合后主内容区横向跳动
const sidebarPrefsScript = `try{var c=JSON.parse(localStorage.getItem('${SIDEBAR_COLLAPSED_KEY}')||'false'),w=JSON.parse(localStorage.getItem('${SIDEBAR_WIDTH_KEY}')||'240');document.documentElement.style.setProperty('--sidebar-width',(c?64:w)+'px')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sidebarPrefsScript }} />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "d98ea3d9c4314a18acbfeb2ca7231d2d"}'
        />
      </head>
      <body>
        <AppShell footer={<Footer />}>{children}</AppShell>
      </body>
    </html>
  );
}
