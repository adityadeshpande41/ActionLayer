import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-xl font-bold mb-2" data-testid="text-404-title">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            "No decisions found. That meeting could've been an email."
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
