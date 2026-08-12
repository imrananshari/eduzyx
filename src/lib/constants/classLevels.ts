export const classLevels = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`)];
export const sectionLevels = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function classLevelIndex(value?: string | null) {
  const index = classLevels.findIndex((item) => item.toLowerCase() === String(value ?? "").toLowerCase());
  return index < 0 ? 0 : index;
}

export function classOptionsForRange(from?: string | null, to?: string | null) {
  const start = classLevelIndex(from);
  const end = Math.max(start, classLevelIndex(to ?? classLevels[classLevels.length - 1]));
  return classLevels.slice(start, end + 1);
}

export function isClassInRange(className: string, from?: string | null, to?: string | null) {
  return classOptionsForRange(from, to).some((item) => item.toLowerCase() === className.toLowerCase());
}
