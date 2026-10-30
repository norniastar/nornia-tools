// 结构化数据随静态 HTML 输出；转义 < 防止内容提前闭合 script 标签
const JsonLd = ({ data }: { data: object }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
);

export default JsonLd;
