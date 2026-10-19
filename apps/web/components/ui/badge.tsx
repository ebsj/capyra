import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border bg-transparent text-foreground hover:bg-muted/60",
        success:
          "border-transparent bg-[hsl(var(--chart-2)/0.18)] text-[hsl(80_40%_28%)] hover:bg-[hsl(var(--chart-2)/0.24)] dark:text-[hsl(80_50%_78%)]",
        warning:
          "border-transparent bg-[hsl(var(--chart-4)/0.52)] text-[hsl(25_39%_26%)] hover:bg-[hsl(var(--chart-4)/0.64)] dark:text-[hsl(46_81%_82%)]",
        danger: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        info: "border-transparent bg-accent text-primary hover:bg-accent/80",
        brandSoft:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        sage:
          "border-transparent bg-[hsl(var(--chart-2)/0.16)] text-[hsl(80_40%_30%)] hover:bg-[hsl(var(--chart-2)/0.22)] dark:text-[hsl(80_50%_78%)]",
        sand:
          "border-transparent bg-[hsl(var(--chart-4)/0.46)] text-[hsl(25_39%_26%)] hover:bg-[hsl(var(--chart-4)/0.58)] dark:text-[hsl(46_81%_82%)]",
        navy:
          "border-transparent bg-[hsl(var(--chart-5))] text-primary-foreground hover:bg-[hsl(var(--chart-5)/0.9)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
