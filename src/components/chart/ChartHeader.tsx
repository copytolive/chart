import { useState } from "react";
import {
  AreaChart,
  BarChart3,
  Bell,
  Camera,
  CandlestickChart,
  ChevronDown,
  Fullscreen,
  LayoutGrid,
  LineChart,
  Plus,
  Redo2,
  Save,
  Settings2,
  SquareStack,
  Star,
  Undo2,
} from "lucide-react";
import { INTERVALS, INTERVAL_GROUPS, getInterval } from "@/lib/chart/symbols";
import { type ChartType, useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";
import { Flyout, MenuItem } from "./Flyout";

const TYPES: { id: ChartType; label: string; icon: typeof CandlestickChart }[] = [
  { id: "candle", label: "Candles", icon: CandlestickChart },
  { id: "hollow", label: "Hollow candles", icon: CandlestickChart },
  { id: "ha", label: "Heikin Ashi", icon: CandlestickChart },
  { id: "bar", label: "Bars", icon: BarChart3 },
  { id: "line", label: "Line", icon: LineChart },
  { id: "area", label: "Area", icon: AreaChart },
];

export function ChartHeader({ ticker }: { ticker: string }) {
  const interval = useChartStore((s) => s.interval);
  const setInterval = useChartStore((s) => s.setInterval);
  const chartType = useChartStore((s) => s.chartType);
  const setChartType = useChartStore((s) => s.setChartType);
  const overlays = useChartStore((s) => s.overlays);
  const oscillators = useChartStore((s) => s.oscillators);
  const setSearchOpen = useChartStore((s) => s.setSearchOpen);
  const undoDrawing = useChartStore((s) => s.undoDrawing);
  const replay = useChartStore((s) => s.replay);
  const setReplay = useChartStore((s) => s.setReplay);
  const setDialog = useChartStore((s) => s.setDialog);
  const requestShot = useChartStore((s) => s.requestShot);
  const favorites = useChartStore((s) => s.favorites);
  const symbol = useChartStore((s) => s.symbol);
  const toggleFavorite = useChartStore((s) => s.toggleFavorite);
  const compare = useChartStore((s) => s.compare);
  const [open, setOpen] = useState<"type" | "iv" | null>(null);

  const TypeIcon = TYPES.find((t) => t.id === chartType)?.icon ?? CandlestickChart;
  const iv = getInterval(interval);
  const starred = favorites.includes(symbol);

  return (
    <div className="relative flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-tv-border bg-tv-surface px-1 text-tv-fg">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-7 items-center gap-1 rounded-sm px-2 text-2xs font-semibold hover:bg-tv-elevated"
      >
        {ticker}
        <ChevronDown className="size-3 text-tv-muted" />
      </button>
      <button
        type="button"
        aria-label={starred ? "Unstar" : "Star"}
        onClick={() => toggleFavorite(symbol)}
        className={cn(
          "hidden size-7 place-items-center rounded-sm hover:bg-tv-elevated sm:grid",
          starred ? "text-tv-blue" : "text-tv-muted",
        )}
      >
        <Star className={cn("size-3.5", starred && "fill-tv-blue")} />
      </button>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden size-7 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated sm:grid"
        aria-label="Add symbol"
      >
        <Plus className="size-3.5" />
      </button>
      <Sep />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === "iv" ? null : "iv")}
          className="flex h-7 items-center gap-0.5 rounded-sm px-2 font-mono text-2xs font-semibold text-tv-fg hover:bg-tv-elevated"
        >
          {iv.label}
          <ChevronDown className="size-3 text-tv-muted" />
        </button>
        <Flyout open={open === "iv"} onClose={() => setOpen(null)} className="left-0 top-8 w-[28rem] p-2">
          <div className="grid grid-cols-5 gap-3 px-1 py-1">
            {INTERVAL_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="mb-1 px-1 text-micro uppercase tracking-wide text-tv-muted">{g.label}</p>
                {INTERVALS.filter((item) => item.group === g.id).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setInterval(item.key);
                      setOpen(null);
                    }}
                    className={cn(
                      "flex h-7 w-full items-center rounded-sm px-2 font-mono text-2xs text-tv-fg hover:bg-tv-elevated",
                      interval === item.key && "bg-tv-elevated text-tv-blue",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Flyout>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === "type" ? null : "type")}
          className="flex h-7 items-center gap-1 rounded-sm px-1.5 text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
          aria-label="Chart type"
        >
          <TypeIcon className="size-3.5" />
          <ChevronDown className="size-3" />
        </button>
        <Flyout open={open === "type"} onClose={() => setOpen(null)} className="left-0 top-8 w-48">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <MenuItem
                key={t.id}
                active={chartType === t.id}
                onClick={() => {
                  setChartType(t.id);
                  setOpen(null);
                }}
              >
                <Icon className="size-3.5" />
                {t.label}
              </MenuItem>
            );
          })}
        </Flyout>
      </div>
      <button
        type="button"
        onClick={() => setDialog("indicators")}
        className={cn(
          "h-7 rounded-sm px-2 text-2xs font-medium text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          (overlays.length > 0 || oscillators.length > 0) && "text-tv-fg",
        )}
      >
        Indicators
      </button>
      <button
        type="button"
        onClick={() => setDialog("compare")}
        className={cn(
          "hidden h-7 items-center gap-1 rounded-sm px-2 text-2xs font-medium text-tv-muted hover:bg-tv-elevated hover:text-tv-fg sm:flex",
          compare.length > 0 && "text-tv-blue",
        )}
      >
        <SquareStack className="size-3.5" />
        Compare
      </button>
      <button
        type="button"
        onClick={() => setDialog("alert")}
        className="hidden h-7 items-center gap-1 rounded-sm px-2 text-2xs font-medium text-tv-muted hover:bg-tv-elevated hover:text-tv-fg sm:flex"
      >
        <Bell className="size-3.5" />
        Alert
      </button>
      <button
        type="button"
        onClick={() => setReplay(!replay)}
        className={cn(
          "h-7 rounded-sm px-2 text-2xs font-medium text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          replay && "bg-tv-elevated text-tv-blue",
        )}
      >
        Replay
      </button>
      <Sep />
      <IconBtn label="Undo" onClick={undoDrawing}>
        <Undo2 className="size-3.5" />
      </IconBtn>
      <IconBtn label="Redo">
        <Redo2 className="size-3.5" />
      </IconBtn>
      <div className="ml-auto flex items-center">
        <IconBtn label="Layout" onClick={() => setDialog("layout")}>
          <LayoutGrid className="size-3.5" />
        </IconBtn>
        <IconBtn label="Save layout">
          <Save className="size-3.5" />
        </IconBtn>
        <IconBtn label="Snapshot" onClick={requestShot}>
          <Camera className="size-3.5" />
        </IconBtn>
        <IconBtn label="Settings" onClick={() => setDialog("settings")}>
          <Settings2 className="size-3.5" />
        </IconBtn>
        <IconBtn
          label="Fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
            else void document.exitFullscreen();
          }}
        >
          <Fullscreen className="size-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function Sep() {
  return <div className="mx-1 h-4 w-px bg-tv-border" />;
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg"
    >
      {children}
    </button>
  );
}

