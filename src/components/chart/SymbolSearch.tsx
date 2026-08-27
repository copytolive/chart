import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SYMBOLS } from "@/lib/chart/symbols";
import { useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";

export function SymbolSearch() {
  const open = useChartStore((s) => s.searchOpen);
  const setOpen = useChartStore((s) => s.setSearchOpen);
  const setSymbol = useChartStore((s) => s.setSymbol);
  const addWatch = useChartStore((s) => s.addWatch);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "crypto" | "metal">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    return SYMBOLS.filter((s) => (tab === "all" ? true : s.kind === tab)).filter(
      (s) =>
        !n ||
        s.ticker.toLowerCase().includes(n) ||
        s.name.toLowerCase().includes(n) ||
        s.exchange.toLowerCase().includes(n),
    );
  }, [q, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-tv-bg/70 px-3 pt-16">
      <div className="w-full max-w-xl overflow-hidden rounded-md border border-tv-border bg-tv-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-tv-border px-3">
          <Search className="size-4 text-tv-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol"
            className="h-11 w-full bg-transparent text-sm text-tv-fg outline-none placeholder:text-tv-muted"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-tv-border px-2 py-1">
          {(["all", "crypto", "metal"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-7 rounded-sm px-2 text-2xs capitalize text-tv-muted hover:text-tv-fg",
                tab === id && "text-tv-fg",
              )}
            >
              {id}
            </button>
          ))}
        </div>
        <ul className="tv-scroll max-h-80 overflow-auto py-1">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setSymbol(s.id);
                  addWatch(s.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-2xs hover:bg-tv-elevated"
              >
                <span>
                  <span className="font-semibold text-tv-fg">{s.ticker}</span>
                  <span className="ml-2 text-tv-muted">{s.name}</span>
                </span>
                <span className="text-micro text-tv-subtle">{s.exchange}</span>
              </button>
            </li>
          ))}
          {results.length === 0 ? <li className="px-3 py-6 text-2xs text-tv-muted">No symbols match.</li> : null}
        </ul>
      </div>
    </div>
  );
}
