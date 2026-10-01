/**
 * Injecte un ou plusieurs objets JSON-LD.
 * `<` est échappé pour empêcher toute injection de balise (recommandation Next.js).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null | (Record<string, unknown> | null)[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter(
    (d): d is Record<string, unknown> => d !== null,
  );
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
