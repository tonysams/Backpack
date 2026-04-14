import type { PackingListItem, GearItem } from '../types'

export function itemWeight(item: PackingListItem, gearItems: GearItem[]): number {
  const gear = gearItems.find(g => g.id === item.gearItemId)
  const base = item.customWeight ?? gear?.weight ?? 0
  return base * Math.max(1, item.quantity)
}

/** Convert decimal lbs → { pounds, ounces }, ounces rounded to 1 decimal */
export function lbsToLbOz(lbs: number): { pounds: number; ounces: number } {
  const totalOz = Math.round(lbs * 16 * 10) / 10
  const pounds = Math.floor(totalOz / 16)
  const ounces = Math.round((totalOz - pounds * 16) * 10) / 10
  return { pounds, ounces }
}

/** Convert lbs + oz back to decimal lbs */
export function lbOzToLbs(pounds: number, ounces: number): number {
  return pounds + ounces / 16
}

/** Format decimal lbs as "X lb Y oz", "X lb", or "Y oz" */
export function formatWeight(lbs: number): string {
  const { pounds, ounces } = lbsToLbOz(lbs)
  const ozStr = ounces % 1 === 0 ? String(ounces) : ounces.toFixed(1)
  if (pounds === 0) return `${ozStr} oz`
  if (ounces === 0) return `${pounds} lb`
  return `${pounds} lb ${ozStr} oz`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
