import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * The project's only class-name helper.
 *
 * `clsx` resolves conditionals; `twMerge` then settles conflicts so a caller's
 * `className` can override a component's default. Without the merge step,
 * `<MetricCard className="p-2" />` would produce `p-4 p-2` and lose to source order
 * rather than to intent.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
