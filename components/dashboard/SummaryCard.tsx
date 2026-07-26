export default function SummaryCard({
  label,
  value,
  sub,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "amber" | "rose" | "violet" | "slate";
}) {
  const accentMap: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
    violet: "text-violet-600 bg-violet-50",
    slate: "text-slate-600 bg-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${accentMap[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
