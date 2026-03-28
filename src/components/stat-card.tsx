import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}

export function StatCard({ icon, label, value, sub, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-4 flex flex-col items-center justify-center gap-1 min-w-[100px]",
        className
      )}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-bold text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
      {sub && <span className="text-[10px] text-text-muted">{sub}</span>}
    </div>
  );
}
