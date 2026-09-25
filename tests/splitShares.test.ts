import { describe, it, expect } from 'vitest'
import {
  splitEqual,
  splitCustom,
  splitPercentage,
} from '../server/utils/splitShares'

const sum = (arr: { shareAmount: number }[]) =>
  Math.round(arr.reduce((a, s) => a + s.shareAmount, 0) * 100) / 100

describe('splitEqual', () => {
  it('يقسم 30 على 3 بالتساوي = 10 لكل واحد', () => {
    const res = splitEqual(30, ['A', 'B', 'C'])
    expect(res.map((r) => r.shareAmount)).toEqual([10, 10, 10])
    expect(sum(res)).toBe(30)
  })

  it('يوزّع الباقي كوحدات صحيحة عند 10 ÷ 3 ويحافظ على المجموع = 10', () => {
    const res = splitEqual(10, ['A', 'B', 'C'])
    // 10 / 3 = 4 و3 و3 (كلها أعداد صحيحة، المجموع = 10)
    expect(sum(res)).toBe(10)
    const vals = res.map((r) => r.shareAmount).sort()
    expect(vals).toEqual([3, 3, 4])
    // لا فواصل عشرية
    for (const r of res) expect(Number.isInteger(r.shareAmount)).toBe(true)
  })

  it('يتعامل مع مبلغ لا يقبل القسمة (100 ÷ 6)', () => {
    const res = splitEqual(100, ['A', 'B', 'C', 'D', 'E', 'F'])
    expect(sum(res)).toBe(100)
  })

  it('يرمي خطأ عند عدم وجود مشاركين', () => {
    expect(() => splitEqual(10, [])).toThrow()
  })
})

describe('splitCustom', () => {
  it('يقبل حصصاً مجموعها = المبلغ', () => {
    const res = splitCustom(20, [
      { userId: 'A', shareAmount: 10 },
      { userId: 'B', shareAmount: 10 },
    ])
    expect(sum(res)).toBe(20)
  })

  it('يرمي خطأ إذا لم يساوِ المجموع المبلغ', () => {
    expect(() =>
      splitCustom(20, [
        { userId: 'A', shareAmount: 10 },
        { userId: 'B', shareAmount: 5 },
      ]),
    ).toThrow()
  })
})

describe('splitPercentage', () => {
  it('يحوّل 50/50 على 20 = 10 و10', () => {
    const res = splitPercentage(20, [
      { userId: 'A', percentage: 50 },
      { userId: 'B', percentage: 50 },
    ])
    expect(sum(res)).toBe(20)
    expect(res.map((r) => r.shareAmount)).toEqual([10, 10])
  })

  it('يوزّع باقي القروش عند نسب غير متساوية ويحافظ على المجموع', () => {
    const res = splitPercentage(10, [
      { userId: 'A', percentage: 33.34 },
      { userId: 'B', percentage: 33.33 },
      { userId: 'C', percentage: 33.33 },
    ])
    expect(sum(res)).toBe(10)
  })

  it('يرمي خطأ إذا لم يكن مجموع النسب 100', () => {
    expect(() =>
      splitPercentage(10, [
        { userId: 'A', percentage: 50 },
        { userId: 'B', percentage: 40 },
      ]),
    ).toThrow()
  })
})
