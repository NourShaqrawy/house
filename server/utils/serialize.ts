/**
 * تحويل حقول Decimal (من Prisma) إلى أرقام عادية في استجابات الـ API،
 * وتنسيق التواريخ. يبقّي المنطق الداخلي على Decimal، والخرج على JSON نظيف.
 */
import type { Prisma } from '@prisma/client'

export function decToNum(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  return typeof v === 'number' ? v : Number(v.toString())
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function serializeExpense(e: any) {
  return {
    ...e,
    amount: decToNum(e.amount),
    shares: e.shares?.map((s: any) => ({
      ...s,
      shareAmount: decToNum(s.shareAmount),
    })),
  }
}

export function serializeRecipe(r: any) {
  const ingredients = r.ingredients?.map((i: any) => ({
    ...i,
    estimatedPrice: decToNum(i.estimatedPrice),
  }))
  const estimatedTotal = ingredients
    ? ingredients.reduce((acc: number, i: any) => acc + (i.estimatedPrice ?? 0), 0)
    : undefined
  return {
    ...r,
    ingredients,
    ...(estimatedTotal !== undefined
      ? { estimatedTotal: Math.round(estimatedTotal * 100) / 100 }
      : {}),
  }
}

export function serializeSettlement(s: any) {
  return { ...s, amount: decToNum(s.amount) }
}
