import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function DataTable({ rows }: { rows: Record<string, string | number>[] }) {
  const headers = Object.keys(rows[0] ?? {});
  if (!rows.length) {
    return <div className="rounded-card bg-white p-8 text-center text-sm font-bold text-[#72706c]">No records yet.</div>;
  }
  return (
    <div className="overflow-hidden rounded-card bg-white">
      <Table>
        <THead>
          <TR>{headers.map((header) => <TH key={header}>{header}</TH>)}</TR>
        </THead>
        <TBody>
          {rows.map((row, index) => (
            <TR key={`${index}-${Object.values(row).join("-")}`}>
              {headers.map((header) => (
                <TD key={header}>
                  {String(header).toLowerCase().includes("status") ? <Badge tone={String(row[header]).toLowerCase().includes("paid") ? "yellow" : "orange"}>{row[header]}</Badge> : row[header]}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
