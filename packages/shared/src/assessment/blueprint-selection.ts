export interface BlueprintSlot {
  difficulty?: string | null;
  category?: string | null;
  marks?: number | null;
  count: number;
}

export interface SelectableQuestionRow {
  id: string;
  difficulty: string;
  category: string | null;
  marks: number;
}

function matchesSlot(question: SelectableQuestionRow, slot: BlueprintSlot): boolean {
  if (slot.difficulty && question.difficulty !== slot.difficulty) return false;
  if (slot.category && question.category !== slot.category) return false;
  if (slot.marks != null && question.marks !== slot.marks) return false;
  return true;
}

/**
 * Select questions from a pool according to blueprint distribution slots.
 * Falls back to any remaining pool questions if a slot cannot be fully filled.
 */
export function selectQuestionsByBlueprint(
  pool: SelectableQuestionRow[],
  slots: BlueprintSlot[],
): string[] {
  const remaining = [...pool];
  const selected: string[] = [];

  for (const slot of slots) {
    const matches = remaining.filter((q) => matchesSlot(q, slot));
    const shuffled = matches.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, slot.count);
    for (const q of picked) {
      selected.push(q.id);
      const idx = remaining.findIndex((r) => r.id === q.id);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  }

  return [...new Set(selected)];
}
