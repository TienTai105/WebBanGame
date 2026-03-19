/**
 * Merge Tailwind CSS class names
 * Handles conflicting classes and removes duplicates
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter((c) => typeof c === 'string') // Remove undefined, null, false
    .join(' ')
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}
