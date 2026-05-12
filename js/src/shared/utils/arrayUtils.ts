export function compareBySortOrder<T extends { sortOrder: number | null }>(
  first: T,
  second: T,
) {
  return (first.sortOrder ?? Number.MAX_SAFE_INTEGER) - (second.sortOrder ?? Number.MAX_SAFE_INTEGER);
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

export function moveItemById<T, TId extends string | number>(
  items: T[],
  sourceId: TId,
  targetId: TId,
  getId: (item: T) => TId,
) {
  const fromIndex = items.findIndex((item) => getId(item) === sourceId);
  const toIndex = items.findIndex((item) => getId(item) === targetId);
  return moveItem(items, fromIndex, toIndex);
}
