import type { ModelResultDto } from "@kerbside/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignedR2 } from "@/lib/verdicts";

type ModelLadderTableProps = {
  results: ModelResultDto[];
};

export function ModelLadderTable({ results }: ModelLadderTableProps) {
  return (
    <Table data-testid="model-ladder-table">
      <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          <TableHead className="text-right">k</TableHead>
          <TableHead className="text-right">Random R²</TableHead>
          <TableHead className="text-right">Spatial R²</TableHead>
          <TableHead className="text-right">n</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.modelName}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.k ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSignedR2(row.randomR2)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSignedR2(row.spatialR2)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.n ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
