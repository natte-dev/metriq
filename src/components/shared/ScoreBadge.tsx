import { Badge } from "@/components/ui/badge";
import { scoreBgColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const colorClass = scoreBgColor(score);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {score.toFixed(2)}
    </span>
  );
}
