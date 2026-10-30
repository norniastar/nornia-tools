import { ImageResponse } from 'next/og';

// 构建时生成的站点分享图。内置字体不含中文，图上只用英文
export const alt = 'Nornia Tools - Developer Utility Toolkit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(180deg, #fbfdff 0%, #f3f7fc 100%)',
          color: '#020617',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="112" height="112" viewBox="0 0 32 32" fill="none">
            <rect x="3.5" y="3.5" width="24" height="24" rx="4.5" stroke="#2f5cff" strokeWidth="2.4" />
            <rect x="9.5" y="9.5" width="12" height="12" rx="2.5" fill="#2f5cff" />
            <path d="M8 25L24 9" stroke="#2f5cff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M12.5 11.8V19.2H14.2V15.1L17.6 19.2H19.1V11.8H17.4V15.8L14.1 11.8H12.5Z" fill="white" />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 700, color: '#0057c1', letterSpacing: -2 }}>Nornia Tools</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 40, color: '#334155' }}>Developer Utility Toolkit</div>
        <div style={{ marginTop: 20, fontSize: 30, color: '#64748b' }}>
          JSON · Timestamp · UUID · Text Diff · URL Codec · Calculator
        </div>
      </div>
    ),
    size,
  );
}
