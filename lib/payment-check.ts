// The M-Pesa amount check on Payments: nothing typed yet, matched, or short or over by some amount.
export type Check = { kind: "enter" } | { kind: "matched" } | { kind: "short" | "over"; difference: number }

export function checkAmount(amount: string, expected: number): Check {
  if (amount === "") return { kind: "enter" }
  const typed = Number(amount)
  if (typed === expected) return { kind: "matched" }
  return typed < expected ? { kind: "short", difference: expected - typed } : { kind: "over", difference: typed - expected }
}
