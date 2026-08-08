import { describe, expect, it } from 'vitest';
import { selectQuestionsByBlueprint } from '@learnova/shared';

describe('selectQuestionsByBlueprint', () => {
  const pool = [
    { id: 'q1', difficulty: 'easy', category: 'math', marks: 2 },
    { id: 'q2', difficulty: 'easy', category: 'math', marks: 2 },
    { id: 'q3', difficulty: 'hard', category: 'physics', marks: 5 },
    { id: 'q4', difficulty: 'medium', category: 'math', marks: 3 },
  ];

  it('selects by difficulty and category slots', () => {
    const selected = selectQuestionsByBlueprint(pool, [
      { difficulty: 'easy', category: 'math', count: 2 },
      { difficulty: 'hard', category: 'physics', count: 1 },
    ]);
    expect(selected).toHaveLength(3);
    expect(selected).toContain('q3');
  });

  it('deduplicates selected ids', () => {
    const selected = selectQuestionsByBlueprint(pool, [{ count: 2 }]);
    expect(new Set(selected).size).toBe(selected.length);
  });
});
