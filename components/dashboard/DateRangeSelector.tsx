"use client";

import { useState } from "react";
import { DateRangePreset } from "@/lib/types";

export interface ResolvedRange {
  preset: DateRangePreset;
  from: string; // ISO date
  to: string; // ISO date
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function DateRangeSelector({
  onChange,
}: {
  onChange: (range: ResolvedRange) => void;
}) {
  const [preset, setPreset] = useState<DateRangePreset>("7d");
  const [customFrom, setCustomFrom] = useState(isoDaysAgo(30));
  const [customTo, setCustomTo] = useState(todayISO());

  function applyPreset(p: DateRangePreset) {
    setPreset(p);
    if (p === "7d") onChange({ preset: p, from: isoDaysAgo(6), to: todayISO() });
    else if (p === "30d") onChange({ preset: p, from: isoDaysAgo(29), to: todayISO() });
    else if (p === "1y") onChange({ preset: p, from: isoDaysAgo(364), to: todayISO() });
    else if (p === "thisMonth") onChange({ preset: p, from: startOfMonthISO(), to: todayISO() });
    else onChange({ preset: p, from: customFrom, to: customTo });
  }

  function applyCustom(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setPreset("custom");
    onChange({ preset: "custom", from, to });
  }

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: "7d", label: "7일" },
    { key: "30d", label: "30일" },
    { key: "1y", label: "1년" },
    { key: "thisMonth", label: "이번 달" },
    { key: "custom", label: "직접 설정" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => applyPreset(p.key)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            preset === p.key
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          type="button"
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-1.5 pl-1">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => applyCustom(e.target.value, customTo)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
          />
          <span className="text-xs text-slate-400">–</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => applyCustom(customFrom, e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
          />
        </div>
      )}
    </div>
  );
}
