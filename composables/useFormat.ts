/** أدوات تنسيق العرض (العملة، التاريخ) — الأرقام دائماً بالإنجليزية (Latin). */

export function useFormat() {
  const currency = useState<string>('currency', () => 'SAR')

  // أعداد صحيحة فقط (بلا فواصل عشرية)، مع فاصل الآلاف
  const nf = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const money = (v: number | null | undefined) => {
    const n = typeof v === 'number' ? v : 0
    return `${nf.format(Math.round(Math.abs(n)))} ${currency.value}`
  }

  const signedMoney = (v: number | null | undefined) => {
    const n = typeof v === 'number' ? v : 0
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    return `${sign}${money(n)}`
  }

  const num = (v: number | null | undefined) =>
    new Intl.NumberFormat('en-US').format(typeof v === 'number' ? v : 0)

  // تاريخ: أسماء الأشهر بالعربية مع أرقام لاتينية
  const date = (v: string | Date | null | undefined) => {
    if (!v) return ''
    const d = typeof v === 'string' ? new Date(v) : v
    return new Intl.DateTimeFormat('ar', {
      numberingSystem: 'latn',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d)
  }

  return { currency, money, signedMoney, num, date }
}
