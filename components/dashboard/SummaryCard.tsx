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
    <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm shadow-slate-100 sm:rounded-2xl sm:p-5">
      <div className="mb-1.5 flex items-center justify-between sm:mb-3">
        <span className="text-[11px] font-medium text-slate-500 sm:text-sm">{label}</span>
        {icon && (
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md text-xs sm:h-8 sm:w-8 sm:rounded-lg sm:text-base ${accentMap[accent]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-lg font-semibold text-slate-800 sm:text-2xl">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">{sub}</div>}
    </div>
  );
}
