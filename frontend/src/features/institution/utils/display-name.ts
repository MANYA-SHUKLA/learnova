export function displayName<T extends { id: string }>(
  items: T[] | undefined,
  id: string | null | undefined,
  pick: (item: T) => string,
): string | null {
  if (!id) return null;
  const found = items?.find((item) => item.id === id);
  return found ? pick(found) : null;
}

export function displayNames<T extends { id: string }>(
  items: T[] | undefined,
  ids: string[],
  pick: (item: T) => string,
): string | null {
  const labels = ids
    .map((id) => displayName(items, id, pick))
    .filter((label): label is string => Boolean(label));
  return labels.length > 0 ? labels.join(', ') : null;
}
