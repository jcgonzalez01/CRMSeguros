import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  tone = "default",
  children,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success";
  children?: React.ReactNode;
}) {
  const toneClass = tone === "success" ? "text-success-700" : "text-gray-900";

  return (
    <Card className="flex flex-col gap-2.5 px-[22px] py-5">
      <p className="text-[13px] font-medium text-gray-600">{label}</p>
      <p
        className={`text-[34px] font-semibold leading-tight tracking-[-0.03em] tabular-nums ${toneClass}`}
      >
        {value}
      </p>
      {children}
    </Card>
  );
}
