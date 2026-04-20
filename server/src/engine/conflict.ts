import type { Campaign, ConflictMode } from "../types/index";

export interface ConflictResult {
  winners: Campaign[];
  suppressed: Array<{ campaign: Campaign; reason: string }>;
}

function sortByPriority(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority; // lower = higher
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function resolveConflicts(
  qualified: Campaign[],
  mode?: ConflictMode,
  maxPerPlacement?: number
): ConflictResult {
  if (qualified.length === 0) {
    return { winners: [], suppressed: [] };
  }

  const sorted = sortByPriority(qualified);

  // Use the top campaign's conflict mode if not overridden
  const resolvedMode: ConflictMode = mode ?? sorted[0].conflictMode ?? "replace";
  const max = maxPerPlacement ?? sorted[0].maxPerPlacement ?? 1;

  let winners: Campaign[];
  let suppressed: Array<{ campaign: Campaign; reason: string }>;

  switch (resolvedMode) {
    case "replace": {
      winners = sorted.slice(0, 1);
      suppressed = sorted.slice(1).map((c) => ({
        campaign: c,
        reason: `Replaced by "${sorted[0].name}" (priority ${sorted[0].priority} vs ${c.priority}).`,
      }));
      break;
    }
    case "stack": {
      winners = sorted.slice(0, max);
      suppressed = sorted.slice(max).map((c, i) => ({
        campaign: c,
        reason: `Exceeds max-per-placement (${max}). Position: ${max + i + 1}.`,
      }));
      break;
    }
    case "suppress": {
      // Top priority suppresses all others
      winners = sorted.slice(0, 1);
      suppressed = sorted.slice(1).map((c) => ({
        campaign: c,
        reason: `Suppressed by "${sorted[0].name}" (suppress mode active at priority ${sorted[0].priority}).`,
      }));
      break;
    }
    default: {
      winners = sorted.slice(0, 1);
      suppressed = sorted.slice(1).map((c) => ({
        campaign: c,
        reason: "Default single-winner resolution.",
      }));
    }
  }

  return { winners, suppressed };
}
