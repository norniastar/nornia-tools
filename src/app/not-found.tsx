import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="border border-slate-200 bg-white py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">页面不存在</h1>
      <p className="mt-3 text-sm text-slate-500">你访问的地址没有对应的工具。</p>
      <Link href="/" className="mt-6 inline-block text-sm text-[#0057c1] hover:underline">
        返回首页
      </Link>
    </section>
  );
}
