export default function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (Array.isArray(payload) && !payload.length) return null;
  return (
    <script
      type="application/ld+json"
      // Listing descriptions are scraped Caixa prose; an unescaped "</script>" would break out.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }}
    />
  );
}
