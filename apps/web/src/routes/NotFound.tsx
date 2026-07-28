import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type NotFoundProps = {
  title?: string;
  message?: string;
};

export function NotFound({
  title = "Page not found",
  message = "That route does not exist in this build of kerbside.",
}: NotFoundProps) {
  return (
    <div className="space-y-6" data-testid="not-found">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link to="/">Back to scoreboard</Link>
      </Button>
    </div>
  );
}
