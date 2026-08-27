import { useState } from "react";
import {
  Crosshair,
  Eye,
  EyeOff,
  Lock,
  Magnet,
  Minus,
  MousePointer2,
  Ruler,
  Spline,
  Square,
  Trash2,
  TrendingUp,
  Type,
  Unlock,
} from "lucide-react";
import { type DrawTool, useChartStore } from "@/lib/chart/store";
import { cn } from "@/lib/utils";
import { Flyout, MenuItem } from "./Flyout";

type Group = "cursor" | "trend" | "fib" | "shape" | "text";

const GROUPS: {
  id: Group;
  tools: { id: DrawTool; label: string; icon: typeof Crosshair }[];
}[] = [
  {
    id: "cursor",
    tools: [
      { id: "cross", label: "Cross", icon: Crosshair },
      { id: "cursor", label: "Cursor", icon: MousePointer2 },
    ],
  },
  {
    id: "trend",
    tools: [
      { id: "trend", label: "Trend line", icon: TrendingUp },
      { id: "ray", label: "Ray", icon: TrendingUp },
      { id: "hline", label: "Horizontal line", icon: Minus },
    ],
  },
  {
    id: "fib",
    tools: [{ id: "fib", label: "Fib retracement", icon: Spline }],
  },
  {
    id: "shape",
    tools: [{ id: "rect", label: "Rectangle", icon: Square }],
  },
  {
    id: "text",
    tools: [{ id: "text", label: "Text", icon: Type }],
  },
];

export function DrawTools() {
  const drawTool = useChartStore((s) => s.drawTool);
  const setDrawTool = useChartStore((s) => s.setDrawTool);
  const magnet = useChartStore((s) => s.magnet);
  const toggleMagnet = useChartStore((s) => s.toggleMagnet);
  const drawingsLocked = useChartStore((s) => s.drawingsLocked);
  const toggleLock = useChartStore((s) => s.toggleLock);
  const drawingsHidden = useChartStore((s) => s.drawingsHidden);
  const toggleHide = useChartStore((s) => s.toggleHideDrawings);
  const clearDrawings = useChartStore((s) => s.clearDrawings);
  const [fly, setFly] = useState<Group | "trash" | null>(null);

  return (
    <aside className="hidden w-11 shrink-0 flex-col items-center border-r border-tv-border bg-tv-surface py-1 md:flex">
      {GROUPS.map((g) => {
        const active = g.tools.find((t) => t.id === drawTool) ?? g.tools[0]!;
        const Icon = active.icon;
        const isOn = g.tools.some((t) => t.id === drawTool);
        return (
          <div key={g.id} className="relative">
            <button
              type="button"
              title={active.label}
              aria-label={active.label}
              aria-pressed={isOn}
              onClick={() => {
                if (g.tools.length === 1) {
                  setDrawTool(g.tools[0]!.id);
                  setFly(null);
                  return;
                }
                setFly(fly === g.id ? null : g.id);
              }}
              className={cn(
                "grid size-9 place-items-center rounded-sm text-tv-muted transition-colors hover:bg-tv-elevated hover:text-tv-fg",
                isOn && "bg-tv-elevated text-tv-blue",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </button>
            <Flyout open={fly === g.id} onClose={() => setFly(null)} className="left-10 top-0 w-44">
              {g.tools.map((t) => {
                const TIcon = t.icon;
                return (
                  <MenuItem
                    key={t.id}
                    active={drawTool === t.id}
                    onClick={() => {
                      setDrawTool(t.id);
                      setFly(null);
                    }}
                  >
                    <TIcon className="size-3.5" />
                    {t.label}
                  </MenuItem>
                );
              })}
            </Flyout>
          </div>
        );
      })}
      <button
        type="button"
        title="Measure"
        aria-pressed={drawTool === "measure"}
        onClick={() => setDrawTool("measure")}
        className={cn(
          "grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          drawTool === "measure" && "bg-tv-elevated text-tv-blue",
        )}
      >
        <Ruler className="size-4" />
      </button>
      <div className="my-1 h-px w-7 bg-tv-border" />
      <button
        type="button"
        title="Magnet"
        aria-pressed={magnet}
        onClick={toggleMagnet}
        className={cn(
          "grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          magnet && "text-tv-blue",
        )}
      >
        <Magnet className="size-4" />
      </button>
      <button
        type="button"
        title={drawingsLocked ? "Unlock drawings" : "Lock drawings"}
        aria-pressed={drawingsLocked}
        onClick={toggleLock}
        className={cn(
          "grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          drawingsLocked && "text-tv-blue",
        )}
      >
        {drawingsLocked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
      </button>
      <button
        type="button"
        title={drawingsHidden ? "Show drawings" : "Hide drawings"}
        aria-pressed={drawingsHidden}
        onClick={toggleHide}
        className={cn(
          "grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-fg",
          drawingsHidden && "text-tv-blue",
        )}
      >
        {drawingsHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <div className="relative">
        <button
          type="button"
          title="Remove drawings"
          onClick={() => setFly(fly === "trash" ? null : "trash")}
          className="grid size-9 place-items-center rounded-sm text-tv-muted hover:bg-tv-elevated hover:text-tv-down"
        >
          <Trash2 className="size-4" />
        </button>
        <Flyout open={fly === "trash"} onClose={() => setFly(null)} className="left-10 bottom-0 w-48">
          <MenuItem
            onClick={() => {
              clearDrawings();
              setFly(null);
            }}
          >
            Remove all drawings
          </MenuItem>
        </Flyout>
      </div>
    </aside>
  );
}
