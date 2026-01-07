import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a Tailwind font-size class based on the string length.
 * This is a pragmatic way to keep currency values inside cards without wrapping.
 */
export function fitAmountTextClass(text: string) {
  const len = [...text].length

  if (len <= 6) return "text-3xl"
  if (len <= 10) return "text-2xl"
  if (len <= 14) return "text-xl"
  return "text-lg"
}
