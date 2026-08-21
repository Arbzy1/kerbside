import type { CityDto } from "@kerbside/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignedR2 } from "@/lib/verdicts";

type CityTableProps = {
  cities: CityDto[];
};

export function CityTable({ cities }: CityTableProps) {
  return (
    <Table data-testid="city-transfer-table">
      <TableHeader>
        <TableRow>
          <TableHead>City</TableHead>
          <TableHead className="text-right">n</TableHead>
          <TableHead className="text-right">LOCO r²</TableHead>
          <TableHead className="text-right">LOCO R²</TableHead>
          <TableHead className="text-right">Local-10 R²</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cities.map((city) => (
          <TableRow key={city.id} data-city={city.name}>
            <TableCell className="font-medium">{city.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {city.nCountPoints}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSignedR2(city.heldOutR2Corr)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSignedR2(city.heldOutR2)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSignedR2(city.local10R2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
