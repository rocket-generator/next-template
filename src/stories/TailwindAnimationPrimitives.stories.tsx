import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/button";
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/atoms/alert-dialog";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import {
  Popover as PopoverRoot,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { selectContentBaseClassName } from "@/components/atoms/select";
import {
  Sheet as SheetRoot,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/atoms/sheet";
import { tooltipContentBaseClassName } from "@/components/atoms/tooltip";
import { cn } from "@/libraries/css";

const meta = {
  title: "Testing/Tailwind Animation Primitives",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function StoryFrame({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[320px] w-[640px] items-center justify-center p-12">
      {children}
    </div>
  );
}

function DialogExample() {
  return (
    <StoryFrame>
      <DialogRoot>
        <DialogTrigger asChild>
          <Button data-testid="dialog-trigger">Open dialog</Button>
        </DialogTrigger>
        <DialogContent forceMount data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </StoryFrame>
  );
}

function AlertDialogExample() {
  return (
    <StoryFrame>
      <AlertDialogRoot>
        <AlertDialogTrigger asChild>
          <Button data-testid="alert-dialog-trigger" variant="destructive">
            Open alert dialog
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent forceMount data-testid="alert-dialog-content">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>
    </StoryFrame>
  );
}

function DropdownMenuExample() {
  return (
    <StoryFrame>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button data-testid="dropdown-menu-trigger" variant="outline">
            Open menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent forceMount data-testid="dropdown-menu-content">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </StoryFrame>
  );
}

function PopoverExample() {
  return (
    <StoryFrame>
      <PopoverRoot>
        <PopoverTrigger asChild>
          <Button data-testid="popover-trigger" variant="outline">
            Open popover
          </Button>
        </PopoverTrigger>
        <PopoverContent forceMount data-testid="popover-content">
          Popover content
        </PopoverContent>
      </PopoverRoot>
    </StoryFrame>
  );
}

function TooltipExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <StoryFrame>
      <div className="flex flex-col items-center gap-4">
        <Button
          data-testid="tooltip-trigger"
          type="button"
          variant="secondary"
          onClick={() => setOpen((current) => !current)}
        >
          Toggle tooltip
        </Button>
        <div
          data-testid="tooltip-content"
          data-side="top"
          data-state={open ? "open" : "closed"}
          style={
            {
              "--radix-tooltip-content-transform-origin": "center bottom",
            } as React.CSSProperties
          }
          className={cn(
            tooltipContentBaseClassName,
            open ? "" : "pointer-events-none"
          )}
        >
          Tooltip content
        </div>
      </div>
    </StoryFrame>
  );
}

function SelectExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <StoryFrame>
      <div className="flex flex-col items-center gap-4">
        <Button
          data-testid="select-trigger"
          type="button"
          variant="outline"
          onClick={() => setOpen((current) => !current)}
        >
          Toggle select
        </Button>
        <div
          data-testid="select-content"
          data-side="bottom"
          data-state={open ? "open" : "closed"}
          className={cn(
            selectContentBaseClassName,
            "min-w-[16rem] p-1",
            open
              ? "data-[side=bottom]:translate-y-1"
              : "pointer-events-none data-[side=bottom]:translate-y-1"
          )}
        >
          <div className="rounded-sm px-2 py-1.5 text-sm">Admin</div>
          <div className="rounded-sm px-2 py-1.5 text-sm">Editor</div>
          <div className="rounded-sm px-2 py-1.5 text-sm">Viewer</div>
        </div>
      </div>
    </StoryFrame>
  );
}

function SheetExample() {
  return (
    <StoryFrame>
      <SheetRoot>
        <SheetTrigger asChild>
          <Button data-testid="sheet-trigger" variant="outline">
            Open sheet
          </Button>
        </SheetTrigger>
        <SheetContent forceMount data-testid="sheet-content" side="right">
          <SheetHeader>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </SheetRoot>
    </StoryFrame>
  );
}

export const Dialog: Story = {
  render: () => <DialogExample />,
};

export const AlertDialog: Story = {
  render: () => <AlertDialogExample />,
};

export const DropdownMenu: Story = {
  render: () => <DropdownMenuExample />,
};

export const Popover: Story = {
  render: () => <PopoverExample />,
};

export const Tooltip: Story = {
  render: () => <TooltipExample />,
};

export const Select: Story = {
  render: () => <SelectExample />,
};

export const Sheet: Story = {
  render: () => <SheetExample />,
};
