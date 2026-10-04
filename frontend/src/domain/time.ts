/** O mock envia datas em UTC sem o sufixo de fuso (ex.: "2026-09-23T13:51:57"). */
export function parseServerDate(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

export function elapsedMinutes(createdAt: string, now: Date): number {
  const elapsedMs = now.getTime() - parseServerDate(createdAt).getTime()
  return Math.max(0, elapsedMs / 60_000)
}
