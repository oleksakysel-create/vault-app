// Pocket — all money logic and on-device storage.
// Same rules as Vault: Available to spend = cash − unpaid bills − what is left in budgets.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  assets as baseAssets, incomeSources, fixedExpenses, variableExpenses, initialGoals,
  initialHoldings, recentActivity, initialRealized, taxOnProfit, bracketRate,
} from '../../src/data'

export const KEY = 'pocket-v1'
export const CARD_COLORS = ['#FFE234', '#2FE7BE', '#1EA0F2', '#FF8FC8', '#FF9F43', '#A98BFF']
export const CAT_COLORS = ['#00C27C', '#FB7185', '#38BDF8', '#F59E0B', '#A78BFA', '#F472B6']
export const INCOME_SOURCES = [
  { id: 'salary', name: 'Salary', emoji: '💼' },
  { id: 'freelance', name: 'Freelance', emoji: '🧑‍💻' },
  { id: 'business', name: 'Business', emoji: '☕️' },
  { id: 'passive', name: 'Dividends', emoji: '🌱' },
  { id: 'gifts', name: 'Gifts', emoji: '🎁' },
  { id: 'family', name: 'Family support', emoji: '👨‍👩‍👧' },
]

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const now = () => Date.now()

// an empty account: everything is entered by the user
export const EMPTY = {
  v: 1,
  onboarded: false,
  name: '',
  cash: 0,
  incomes: INCOME_SOURCES.map((s) => ({ ...s, amount: 0 })),
  bills: [],
  cats: [],
  goals: [],
  holdings: [],
  realized: 0,
  taxWithheld: 0,
  archivedSpent: 0,
  activity: [],
  hidden: false,
}

// sample data for a quick look (same numbers as the Vault demo)
export function sampleState(name = 'Alexandra') {
  return {
    ...EMPTY,
    onboarded: true,
    name,
    cash: 3240.5,
    incomes: incomeSources.map(({ id, name: n, emoji, amount }) => ({ id, name: n === 'Passive income' ? 'Dividends' : n, emoji, amount })),
    bills: fixedExpenses.map((b) => ({ ...b })),
    cats: variableExpenses.map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] })),
    goals: initialGoals.map((g, i) => ({ ...g, color: CARD_COLORS[i % CARD_COLORS.length] })),
    holdings: initialHoldings.map((h) => ({ ...h })),
    realized: initialRealized,
    taxWithheld: taxOnProfit(initialRealized),
    activity: recentActivity.map((a, i) => ({ ...a, ts: now() - (i + 1) * 3600e3 })),
  }
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s && s.v === 1) return { ...EMPTY, ...s }
  } catch { /* storage unavailable */ }
  return EMPTY
}

export function usePocket() {
  const [s, setS] = useState(load)
  const [prices, setPrices] = useState(() => Object.fromEntries(Object.entries(baseAssets).map(([k, a]) => [k, a.price])))
  const [toast, setToast] = useState(null)
  const undoRef = useRef(null)

  // save every change on this device
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage unavailable */ }
  }, [s])

  // calm live prices (every 6 s)
  useEffect(() => {
    const id = setInterval(() => {
      setPrices((p) => {
        const n = { ...p }
        for (const k of Object.keys(n)) n[k] *= 1 + (Math.random() - 0.46) * (baseAssets[k].type === 'Crypto' ? 0.0012 : 0.0005)
        return n
      })
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const notify = useCallback((t) => {
    const id = now()
    undoRef.current = t.undo || null
    setToast({ ...t, id, undo: !!t.undo })
    setTimeout(() => setToast((c) => (c?.id === id ? null : c)), t.undo ? 5000 : 2600)
  }, [])
  const runUndo = () => { undoRef.current?.(); undoRef.current = null; setToast(null) }

  const assets = useMemo(() => Object.fromEntries(Object.entries(baseAssets).map(([k, a]) => {
    const open = a.price / (1 + a.change / 100)
    return [k, { ...a, price: prices[k], change: ((prices[k] - open) / open) * 100, open }]
  })), [prices])

  const portfolio = useMemo(() => {
    const rows = s.holdings.map((h) => {
      const a = assets[h.ticker]
      const value = h.qty * a.price
      const cost = h.qty * h.avg
      return { ...h, asset: a, value, cost, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, dayPnl: h.qty * (a.price - a.open) }
    })
    const value = rows.reduce((t, r) => t + r.value, 0)
    const cost = rows.reduce((t, r) => t + r.cost, 0)
    const day = rows.reduce((t, r) => t + r.dayPnl, 0)
    return { rows, value, cost, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, day, dayPct: value - day ? (day / (value - day)) * 100 : 0 }
  }, [s.holdings, assets])

  // ─── derived money picture ───
  const saved = s.goals.reduce((t, g) => t + g.saved, 0)
  const billsLeft = s.bills.filter((b) => !b.paid).reduce((t, b) => t + b.amount, 0)
  const envelopes = s.cats.reduce((t, c) => t + Math.max(c.limit - c.spent, 0), 0)
  const available = s.cash - billsLeft - envelopes
  const spentMonth = s.bills.filter((b) => b.paid).reduce((t, b) => t + b.amount, 0) + s.cats.reduce((t, c) => t + c.spent, 0) + s.archivedSpent
  const incomeMonth = s.incomes.reduce((t, x) => t + x.amount, 0)
  const netWorth = s.cash + saved + portfolio.value
  const overBudget = s.cats.filter((c) => c.spent > c.limit)

  // ─── helpers ───
  const log = (st, a) => ({ ...st, activity: [{ id: uid('a'), ts: now(), ...a }, ...st.activity].slice(0, 80) })
  const update = (fn) => setS((st) => fn(st))
  const withUndo = (title, sub, emoji, fn) => {
    const before = s
    update(fn)
    notify({ title, sub, emoji, undo: () => setS(before) })
  }

  const actions = {
    // onboarding
    finishOnboarding({ name, cash, bills, cats }) {
      setS({
        ...EMPTY,
        onboarded: true,
        name: name.trim() || 'Friend',
        cash,
        bills: bills.map((b) => ({ id: uid('b'), paid: false, ...b })),
        cats: cats.map((c, i) => ({ id: uid('c'), spent: 0, color: CAT_COLORS[i % CAT_COLORS.length], ...c })),
      })
    },
    loadSample(name) { setS(sampleState(name || 'Alexandra')) },
    reset() { setS(EMPTY) },
    setName(name) { update((st) => ({ ...st, name })) },
    setHidden(hidden) { update((st) => ({ ...st, hidden })) },

    addIncome(srcId, amount) {
      const src = s.incomes.find((x) => x.id === srcId)
      update((st) => log({ ...st, cash: st.cash + amount, incomes: st.incomes.map((x) => (x.id === srcId ? { ...x, amount: x.amount + amount } : x)) },
        { title: src.name, sub: 'Income', amount, emoji: src.emoji }))
      return `Added from ${src.name}`
    },

    // spending from a budget, paid from free money or straight from a goal
    addExpense(catId, amount, goalId) {
      const cat = s.cats.find((c) => c.id === catId)
      if (goalId) {
        const g = s.goals.find((x) => x.id === goalId)
        update((st) => log({
          ...st,
          goals: st.goals.map((x) => (x.id === goalId ? { ...x, saved: x.saved - amount } : x)),
          cats: st.cats.map((c) => (c.id === catId ? { ...c, spent: c.spent + amount, limit: c.limit + amount } : c)),
        }, { title: cat.name, sub: `Paid from ${g.name}`, amount: -amount, emoji: cat.emoji }))
        return `Paid from ${g.name}`
      }
      update((st) => log({ ...st, cash: st.cash - amount, cats: st.cats.map((c) => (c.id === catId ? { ...c, spent: c.spent + amount } : c)) },
        { title: cat.name, sub: 'Spending', amount: -amount, emoji: cat.emoji }))
      return `Spent on ${cat.name}`
    },

    toggleBill(id) {
      const b = s.bills.find((x) => x.id === id)
      update((st) => {
        const next = { ...st, cash: b.paid ? st.cash + b.amount : st.cash - b.amount, bills: st.bills.map((x) => (x.id === id ? { ...x, paid: !x.paid } : x)) }
        return b.paid ? next : log(next, { title: b.name, sub: 'Bill paid', amount: -b.amount, emoji: b.emoji })
      })
    },
    saveBill(bill) {
      update((st) => ({ ...st, bills: bill.id ? st.bills.map((x) => (x.id === bill.id ? { ...x, ...bill } : x)) : [...st.bills, { ...bill, id: uid('b'), paid: false }] }))
      notify({ title: bill.id ? 'Bill updated' : 'Bill added', sub: `${bill.name} · set aside every month`, emoji: bill.emoji })
    },
    deleteBill(id) {
      const b = s.bills.find((x) => x.id === id)
      withUndo(`${b.name} removed`, b.paid ? 'Payment stays in this month’s spending' : 'Its money is free to spend again', '🗑️',
        (st) => ({ ...st, archivedSpent: st.archivedSpent + (b.paid ? b.amount : 0), bills: st.bills.filter((x) => x.id !== id) }))
    },

    saveCat(cat) {
      update((st) => ({ ...st, cats: cat.id ? st.cats.map((x) => (x.id === cat.id ? { ...x, ...cat } : x)) : [...st.cats, { ...cat, id: uid('c'), spent: 0, color: CAT_COLORS[st.cats.length % CAT_COLORS.length] }] }))
      notify({ title: cat.id ? 'Budget updated' : 'Category added', sub: `${cat.name} · $${cat.limit} a month`, emoji: cat.emoji })
    },
    // unspent budget returns to Available; spent history can move to another category
    deleteCat(id, moveTo) {
      const c = s.cats.find((x) => x.id === id)
      withUndo(`${c.name} deleted`, 'Unspent budget is free to spend again', '🗑️', (st) => ({
        ...st,
        archivedSpent: st.archivedSpent + (moveTo ? 0 : c.spent),
        cats: st.cats.filter((x) => x.id !== id).map((x) => (x.id === moveTo ? { ...x, spent: x.spent + c.spent, limit: x.limit + c.spent } : x)),
      }))
    },

    toGoal(goalId, amount) {
      const g = s.goals.find((x) => x.id === goalId)
      update((st) => log({ ...st, cash: st.cash - amount, goals: st.goals.map((x) => (x.id === goalId ? { ...x, saved: x.saved + amount } : x)) },
        { title: g.name, sub: 'Saved', amount: -amount, emoji: g.emoji }))
      return g.saved + amount >= g.target ? `${g.name} is fully funded` : `Saved to ${g.name}`
    },
    withdrawGoal(goalId, amount) {
      const g = s.goals.find((x) => x.id === goalId)
      update((st) => log({ ...st, cash: st.cash + amount, goals: st.goals.map((x) => (x.id === goalId ? { ...x, saved: x.saved - amount } : x)) },
        { title: g.name, sub: 'Moved to free money', amount, emoji: g.emoji }))
      return `Moved from ${g.name}`
    },
    moveGoal(fromId, toId, amount) {
      const a = s.goals.find((x) => x.id === fromId)
      const b = s.goals.find((x) => x.id === toId)
      update((st) => ({ ...st, goals: st.goals.map((x) => (x.id === fromId ? { ...x, saved: x.saved - amount } : x.id === toId ? { ...x, saved: x.saved + amount } : x)) }))
      return `${a.name} → ${b.name}`
    },
    setGoalDone(goalId, done) { update((st) => ({ ...st, goals: st.goals.map((x) => (x.id === goalId ? { ...x, done } : x)) })) },
    setGoalMonthly(goalId, monthly) {
      const g = s.goals.find((x) => x.id === goalId)
      update((st) => ({ ...st, goals: st.goals.map((x) => (x.id === goalId ? { ...x, monthly } : x)) }))
      notify(monthly ? { title: `Auto-save $${monthly}/mo`, sub: g.name, emoji: '🔁' } : { title: 'Auto-save off', sub: g.name, emoji: '🔁' })
    },
    saveGoal(goal) {
      update((st) => ({ ...st, goals: goal.id ? st.goals.map((x) => (x.id === goal.id ? { ...x, ...goal } : x)) : [...st.goals, { monthly: 0, ...goal, id: uid('g'), saved: 0, done: false, color: CARD_COLORS[st.goals.length % CARD_COLORS.length] }] }))
      notify({ title: goal.id ? 'Goal updated' : 'Goal created', sub: goal.name, emoji: goal.emoji })
    },
    deleteGoal(goalId, moveTo) {
      const g = s.goals.find((x) => x.id === goalId)
      withUndo(`${g.name} deleted`, moveTo ? 'Money moved to another goal' : 'Money moved to free money', '🗑️', (st) => ({
        ...st,
        cash: moveTo ? st.cash : st.cash + g.saved,
        goals: st.goals.filter((x) => x.id !== goalId).map((x) => (x.id === moveTo ? { ...x, saved: x.saved + g.saved } : x)),
      }))
    },

    // sell: profit is taxed by the yearly bracket, tax withheld from the payout
    trade(ticker, side, usd) {
      const price = assets[ticker].price
      const qty = usd / price
      const h = s.holdings.find((x) => x.ticker === ticker)
      let tax = 0
      let gain = 0
      if (side === 'sell') {
        gain = (price - h.avg) * qty
        tax = Math.max(taxOnProfit(s.realized + gain) - taxOnProfit(s.realized), 0)
      }
      update((st) => {
        let holdings = st.holdings
        if (side === 'buy') {
          holdings = h ? holdings.map((x) => (x.ticker === ticker ? { ...x, qty: x.qty + qty, avg: (x.qty * x.avg + usd) / (x.qty + qty) } : x)) : [...holdings, { ticker, qty, avg: price }]
        } else {
          const left = h.qty - qty
          holdings = left <= 1e-9 ? holdings.filter((x) => x.ticker !== ticker) : holdings.map((x) => (x.ticker === ticker ? { ...x, qty: left } : x))
        }
        return log({
          ...st, holdings,
          cash: side === 'buy' ? st.cash - usd : st.cash + usd - tax,
          realized: side === 'sell' ? st.realized + gain : st.realized,
          taxWithheld: st.taxWithheld + tax,
        }, { title: `${side === 'buy' ? 'Bought' : 'Sold'} ${ticker}`, sub: tax ? `Tax withheld $${tax.toFixed(2)}` : 'Investments', amount: side === 'buy' ? -usd : usd - tax, emoji: side === 'buy' ? '📈' : '💸' })
      })
      return side === 'buy' ? `Bought ${ticker}` : tax ? `Sold ${ticker} · tax $${tax.toFixed(2)} withheld` : `Sold ${ticker}`
    },
  }

  return {
    s, assets, portfolio, toast, notify, runUndo,
    saved, billsLeft, envelopes, available, spentMonth, incomeMonth, netWorth, overBudget,
    taxOnProfit, bracketRate,
    ...actions,
  }
}
