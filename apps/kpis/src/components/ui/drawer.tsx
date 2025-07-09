"use client";
import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent as ModalContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Drawer = Dialog;
const DrawerTrigger = DialogTrigger;

type DrawerContentProps = React.ComponentPropsWithoutRef<typeof ModalContent> & {
  title: string;
};
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof ModalContent>,
  DrawerContentProps
>(({ title, className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay
      className={cn(
        "fixed inset-0 bg-black/50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out"
      )}
    />
    <ModalContent
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background p-6 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-0 data-[state=open]:slide-in-from-right-0",
        className
      )}
      {...props}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <div className="flex items-center justify-end">
        <DialogClose className="p-1">
          <X className="h-4 w-4" />
        </DialogClose>
      </div>
      {children}
    </ModalContent>
  </DialogPortal>
));
DrawerContent.displayName = "DrawerContent";

export { Drawer, DrawerTrigger, DrawerContent };