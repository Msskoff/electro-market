import type { SpecGroup } from "@/lib/catalog/types";

/**
 * Tableau de caractéristiques sémantique (<table>, <th scope>) :
 * lisible par les lecteurs d'écran, les moteurs et les assistants IA.
 */
export function SpecTable({ groups, caption }: { groups: SpecGroup[]; caption: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {groups.map((group) => (
          <tbody key={group.label} className="border-b border-border last:border-b-0">
            <tr>
              <th
                scope="colgroup"
                colSpan={2}
                className="eyebrow bg-surface-2 px-5 py-2.5 text-muted"
              >
                {group.label}
              </th>
            </tr>
            {group.specs.map((spec) => (
              <tr key={spec.label} className="border-t border-border first:border-t-0">
                <th scope="row" className="w-2/5 px-5 py-3 align-top font-normal text-muted">
                  {spec.label}
                </th>
                <td className="px-5 py-3 font-medium tabular text-fg">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
