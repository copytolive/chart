import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Flyout({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-40 overflow-hidden rounded-sm border border-tv-border bg-tv-surface py-1 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-2xs text-tv-fg hover:bg-tv-elevated",
        active && "text-tv-blue",
      )}
    >
      {children}
    </button>
  );
}

export function CheckRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-2xs text-tv-fg hover:bg-tv-elevated"
    >
      <span>{label}</span>
      <span className={cn("size-3.5 rounded-xs border", on ? "border-tv-blue bg-tv-blue" : "border-tv-muted")} />
    </button>
  );
}
