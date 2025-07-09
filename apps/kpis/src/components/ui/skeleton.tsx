"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse bg-muted rounded-md", className)}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };