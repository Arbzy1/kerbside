import { Link } from "react-router";
import type { VerdictDto } from "@kerbside/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { badgeVariantForVerdict } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

type VerdictCardProps = {
  verdict: VerdictDto;
};

export function VerdictCard({ verdict }: VerdictCardProps) {
  const badgeVariant = badgeVariantForVerdict(verdict.verdict);
  const experimentSlug = verdict.experimentSlug;
  const card = (
    <Card
      data-testid="verdict-card"
      data-verdict={verdict.verdict}
      className={cn(experimentSlug && "transition-colors hover:bg-muted/40")}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <CardTitle className="text-base leading-snug">{verdict.claim}</CardTitle>
        <Badge
          variant={badgeVariant}
          className={cn(
            verdict.verdict === "untested" &&
              "bg-muted text-muted-foreground border-transparent",
          )}
        >
          {verdict.verdict}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {verdict.evidence}
        </p>
      </CardContent>
    </Card>
  );

  if (!experimentSlug) {
    return card;
  }

  return (
    <Link
      to={`/experiments/${experimentSlug}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="verdict-card-link"
    >
      {card}
    </Link>
  );
}
