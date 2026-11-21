// PLACEHOLDER: the ticket says "a fixed set" but does not list it. Confirm the real list with
// your manager or product owner, and whether money in and money out need different lists.
export const CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'bills', label: 'Bills' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['value'];