import type { ReactNode } from 'react';

export const ToolPage = ({
  children,
  fullHeight = false,
}: {
  children: ReactNode;
  fullHeight?: boolean;
}) => (
  <div className={`${fullHeight ? 'h-full ' : ''}flex flex-col gap-4 pb-1`}>{children}</div>
);

export const ToolHeader = ({
  title,
  icon,
  actions,
  wrap = false,
}: {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  wrap?: boolean;
}) => (
  <header className={`flex items-center justify-between ${wrap ? 'gap-4 flex-wrap' : ''}`}>
    <div className="flex items-center gap-4">
      <h1 className={`text-2xl font-bold tracking-tight text-slate-900 ${icon ? 'flex items-center gap-2' : ''}`}>
        {icon}
        {title}
      </h1>
    </div>
    {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
  </header>
);
