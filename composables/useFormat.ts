/** أدوات تنسيق العرض (العملة، التاريخ). */

export function useFormat() {
  const currency = useState<string>('currency', () => 'SAR')

  const money = (v: number | null | undefined) => {
    const n = typeof v === 'number' ? v : 0
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(n))
    return `${formatted} ${currency.value}`
  }

  const signedMoney = (v: number | null | undefined) => {
    const n = typeof v === 'number' ? v : 0
    const sign = n > 0 ? '+' : n < 0 ? '−' : ''
    return `${sign}${money(n)}`
  }

  const date = (v: string | Date | null | undefined) => {
    if (!v) return ''
    const d = typeof v === 'string' ? new Date(v) : v
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d)
  }

  return { currency, money, signedMoney, date }
}
