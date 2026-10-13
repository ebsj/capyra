import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function Alert({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "destructive" ? "border-destructive/50 text-destructive" : "border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

function AlertIcon() {
  return <AlertCircle className="h-4 w-4" />;
}

export { Alert, AlertTitle, AlertDescription, AlertIcon };
