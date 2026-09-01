import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/money";

export interface RolloverInfo {
  required: number;
  progress: number;
  remaining: number;
  percent: number;
  completed: boolean;
}

/** Barra de progresso do rollover de depósito exigido para liberar saques. */
export function RolloverProgress({
  rollover,
  compact = false,
}: {
  rollover?: RolloverInfo | null | undefined;
  compact?: boolean | undefined;
}) {
  if (!rollover || rollover.required <= 0) return null;

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-border/60 bg-card/70 p-3"
          : "rounded-xl border border-border/60 bg-card/70 p-4"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {rollover.completed ? "Rollover concluído — saque liberado" : "Rollover para liberar saque"}
        </span>
        <span className="text-xs font-semibold text-foreground">{rollover.percent}%</span>
      </div>
      <Progress value={rollover.percent} className="mt-2 h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        {formatBRL(rollover.progress)} de {formatBRL(rollover.required)} apostados
        {rollover.completed ? "" : ` · faltam ${formatBRL(rollover.remaining)}`}
      </p>
    </div>
  );
}
