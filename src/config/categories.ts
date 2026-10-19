/**
 * Spending categories. The real category names are not decided yet.
 * Rename a category by changing its `name` here; nothing else needs to change.
 * Keep the ids stable: seed data and saved filters refer to them.
 */
export const CATEGORIES = [
  { id: 1, name: 'Category 1' },
  { id: 2, name: 'Category 2' },
  { id: 3, name: 'Category 3' },
  { id: 4, name: 'Category 4' },
  { id: 5, name: 'Category 5' },
  { id: 6, name: 'Category 6' },
  { id: 7, name: 'Category 7' },
  { id: 8, name: 'Category 8' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? `Category ${id}`;
}

export function isCategoryId(value: number): value is CategoryId {
  return CATEGORY_IDS.includes(value as CategoryId);
}
