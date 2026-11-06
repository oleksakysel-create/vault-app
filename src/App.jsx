import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Home, PieChart, TrendingUp, Signal, Wifi, BatteryFull, Lock } from 'lucide-react'
import { assets as baseAssets, initialGoals, initialHoldings, incomeSources, fixedExpenses, variableExpenses, recentActivity, initialRealized, taxOnProfit, bracketRate, STORAGE_KEY } from './data'
import { Toast, Burst, haptic, money } from './components/ui'
import { IncomeSheet, ExpenseSheet, PiggySheet, CoverSheet, GoalActionsSheet, GoalEditSheet, CategorySheet, BillSheet, TradeSheet, PaywallSheet, ExplainSheet } from './components/Sheets'
import Dashboard from './screens/Dashboard'
import Budget from './screens/Budget'
import Invest from './screens/Invest'
import Profile from './screens/Profile'
import Onboarding from './screens/Onboarding'

// Everything the user changes is kept on the device between launches
const STORED = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null } catch { return null }
})()
const S = (k, fallback) => (STORED && STORED[k] !== undefined ? STORED[k] : fallback)

const IS_ELECTRON = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'budget', label: 'Budget', icon: PieChart },
  { id: 'invest', label: 'Investments', icon: TrendingUp },
]

function StatusBar() {
  return (
    <div className="phone-status absolute top-0 inset-x-0 z-30 h-[50px] px-8 flex items-end justify-between pb-[6px] text-[16px] font-semibold pointer-events-none">
      <span className="tnum w-14 text-center">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={17} strokeWidth={2.6} />
        <Wifi size={17} strokeWidth={2.6} />
        <BatteryFull size={24} strokeWidth={1.8} />
      </div>
    </div>
  )
}

function TabBar({ tab, setTab, onTab }) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pointer-events-none">
      <nav className="liquid pointer-events-auto rounded-[30px] h-[66px] flex px-1.5" aria-label="Main">
        {TABS.map((t) => {
          const active = tab === t.id
          const Icon = t.icon
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptic(); setTab(t.id); onTab?.() }}
              className="flex-1 my-1.5 flex flex-col items-center justify-center gap-0.5 relative rounded-[24px]"
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-[24px] bg-white/[0.09]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <Icon size={23} strokeWidth={active ? 2.3 : 1.9} className={`relative ${active ? 'text-accent' : 'text-white/60'}`} />
              <span className={`relative text-[11px] font-semibold ${active ? 'text-accent' : 'text-white/60'}`}>{t.label}</span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [budgetTab, setBudgetTab] = useState('essentials')
  const [cash, setCash] = useState(S('cash', 3240.5))
  const [prices, setPrices] = useState(() => Object.fromEntries(Object.entries(baseAssets).map(([k, a]) => [k, a.price])))
  const [holdings, setHoldings] = useState(S('holdings', initialHoldings))
  const [goals, setGoals] = useState(S('goals', initialGoals))
  const [incomes, setIncomes] = useState(S('incomes', incomeSources))
  const [fixed, setFixed] = useState(S('fixed', fixedExpenses))
  const [flexible, setFlexible] = useState(S('flexible', variableExpenses))
  const [archivedSpent, setArchivedSpent] = useState(S('archivedSpent', 0)) // paid bills that were deleted stay in this month's spending
  const [realized, setRealized] = useState(S('realized', initialRealized)) // realised investment profit this year
  const [taxWithheld, setTaxWithheld] = useState(S('taxWithheld', taxOnProfit(initialRealized)))
  const [activity, setActivity] = useState(S('activity', recentActivity))
  const [premium, setPremium] = useState(S('premium', false))
  const [hidden, setHidden] = useState(S('hidden', false))
  const [theme, setTheme] = useState(S('theme', 'system')) // system | dark | light
  const [onboarded, setOnboarded] = useState(S('onboarded', false))
  const [dismissed, setDismissed] = useState([]) // alerts the user closed this session
  const [privacy, setPrivacy] = useState(false)
  const undoRef = useRef(null)
  const [toast, setToast] = useState(null)
  const [burst, setBurst] = useState(0)
  const [sheet, setSheet] = useState(null) // {type, ...}

  // save on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cash, holdings, goals, incomes, fixed, flexible, archivedSpent, realized, taxWithheld, activity, premium, hidden, theme, onboarded }))
    } catch { /* storage unavailable */ }
  }, [cash, holdings, goals, incomes, fixed, flexible, archivedSpent, realized, taxWithheld, activity, premium, hidden, theme, onboarded])

  // theme: follow the system unless the user picked one
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => { document.documentElement.dataset.theme = theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  // hide amounts when the app goes to the background (app switcher privacy)
  useEffect(() => {
    const onHide = () => setPrivacy(true)
    const onShow = () => setPrivacy(false)
    const onVis = () => (document.hidden ? onHide() : onShow())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // live price ticks (calm: every 6 s)
  useEffect(() => {
    const id = setInterval(() => {
      setPrices((p) => {
        const n = { ...p }
        for (const k of Object.keys(n)) {
          const vol = baseAssets[k].type === 'Crypto' ? 0.0012 : 0.0005
          n[k] = n[k] * (1 + (Math.random() - 0.46) * vol)
        }
        return n
      })
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const assets = useMemo(
    () => Object.fromEntries(Object.entries(baseAssets).map(([k, a]) => {
      const open = a.price / (1 + a.change / 100)
      return [k, { ...a, price: prices[k], change: ((prices[k] - open) / open) * 100, open }]
    })),
    [prices],
  )

  const portfolio = useMemo(() => {
    const rows = holdings.map((h) => {
      const a = assets[h.ticker]
      const value = h.qty * a.price
      const cost = h.qty * h.avg
      return { ...h, asset: a, value, cost, pnl: value - cost, pnlPct: ((value - cost) / cost) * 100, dayPnl: h.qty * (a.price - a.open) }
    })
    const value = rows.reduce((s, r) => s + r.value, 0)
    const cost = rows.reduce((s, r) => s + r.cost, 0)
    const day = rows.reduce((s, r) => s + r.dayPnl, 0)
    return { rows, value, cost, pnl: value - cost, pnlPct: ((value - cost) / cost) * 100, day, dayPct: (day / (value - day)) * 100 }
  }, [holdings, assets])

  // ─── money model ───
  // cash        = money on the account (not in savings, not invested)
  // billsLeft   = unpaid essentials, reserved until paid
  // envelopes   = what is still left in each flexible budget, reserved for it
  // available   = cash − billsLeft − envelopes  → the money you can freely spend or save
  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const netWorth = cash + portfolio.value + saved
  const billsLeft = fixed.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0)
  const envelopes = flexible.reduce((s, c) => s + Math.max(c.limit - c.spent, 0), 0)
  const available = cash - billsLeft - envelopes
  const spentMonth = fixed.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0) + flexible.reduce((s, c) => s + c.spent, 0) + archivedSpent
  const incomeMonth = incomes.reduce((s, x) => s + x.amount, 0)
  const overBudget = flexible.filter((c) => c.spent > c.limit)

  const notify = useCallback((t) => {
    const id = Date.now()
    undoRef.current = t.undo || null
    setToast({ ...t, id, undo: !!t.undo })
    setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), t.undo ? 5000 : 3000)
  }, [])
  const runUndo = () => { undoRef.current?.(); undoRef.current = null; setToast(null); haptic(10) }
  // snapshot of everything a delete can touch, so Undo restores it exactly
  const snapshot = () => {
    const snap = { cash, goals, flexible, fixed, archivedSpent }
    return () => { setCash(snap.cash); setGoals(snap.goals); setFlexible(snap.flexible); setFixed(snap.fixed); setArchivedSpent(snap.archivedSpent) }
  }

  const celebrate = () => setBurst(Date.now())
  const pushActivity = (a) => setActivity((list) => [{ id: Date.now() + Math.random(), time: 'Just now', ...a }, ...list].slice(0, 12))
  const patchGoal = (id, f) => setGoals((l) => l.map((g) => (g.id === id ? { ...g, ...f(g) } : g)))
  const patchCat = (id, f) => setFlexible((l) => l.map((c) => (c.id === id ? { ...c, ...f(c) } : c)))

  // ─── actions ───
  const actions = {
    addIncome(sourceId, amount) {
      const src = incomes.find((s) => s.id === sourceId)
      setIncomes((l) => l.map((s) => (s.id === sourceId ? { ...s, amount: s.amount + amount } : s)))
      setCash((c) => c + amount)
      pushActivity({ title: `${src.name} · income`, amount, emoji: src.emoji })
      notify({ title: `+${money(amount)} added`, sub: `${src.name} · now ${money(available + amount, 0)} available to spend`, emoji: src.emoji })
    },

    // spend from a flexible category, paid from Available or straight from a savings goal
    addExpense(catId, amount, goalId) {
      const cat = flexible.find((c) => c.id === catId)
      const left = Math.max(cat.limit - cat.spent, 0)
      if (goalId) {
        const g = goals.find((x) => x.id === goalId)
        patchGoal(goalId, (x) => ({ saved: x.saved - amount }))
        patchCat(catId, (c) => ({ spent: c.spent + amount, limit: c.limit + amount })) // funded by savings, budget untouched
        pushActivity({ title: `${cat.name} · paid from ${g.name}`, amount: -amount, emoji: cat.emoji })
        notify({ title: `${money(amount)} spent from savings`, sub: `${g.name}: ${money(g.saved - amount, 0)} left`, emoji: g.emoji })
        return
      }
      const overflow = Math.max(amount - left, 0)
      const newAvailable = available - overflow
      patchCat(catId, (c) => ({ spent: c.spent + amount }))
      setCash((c) => c - amount)
      pushActivity({ title: cat.name, amount: -amount, emoji: cat.emoji })
      if (newAvailable < 0) {
        notify({ title: 'Not enough free money', sub: `You're short ${money(-newAvailable)} — cover it from savings`, emoji: '⚠️' })
        setTimeout(() => setSheet({ type: 'cover' }), 400)
      } else if (overflow > 0) {
        notify({ title: `${cat.name} is over budget`, sub: `${money(overflow)} came from Available to spend`, emoji: '⚠️' })
      } else {
        notify({ title: `${money(amount)} · ${cat.name}`, sub: `${money(left - amount)} left in this budget`, emoji: cat.emoji })
      }
    },

    toggleBill(id) {
      const b = fixed.find((x) => x.id === id)
      setFixed((l) => l.map((x) => (x.id === id ? { ...x, paid: !x.paid } : x)))
      setCash((c) => (b.paid ? c + b.amount : c - b.amount))
      if (!b.paid) {
        pushActivity({ title: `${b.name} · paid`, amount: -b.amount, emoji: b.emoji })
        notify({ title: `${b.name} paid`, sub: `${money(b.amount)} · it was already set aside`, emoji: '✅' })
      }
    },
    saveBill(bill) {
      if (bill.id) setFixed((l) => l.map((x) => (x.id === bill.id ? { ...x, ...bill } : x)))
      else setFixed((l) => [...l, { ...bill, id: 'b' + Date.now(), paid: false }])
      notify({ title: bill.id ? 'Payment updated' : 'Payment added', sub: `${bill.name} · ${money(bill.amount)} set aside each month`, emoji: bill.emoji })
    },
    deleteBill(id) {
      const undo = snapshot()
      const b = fixed.find((x) => x.id === id)
      if (b.paid) setArchivedSpent((s) => s + b.amount)
      setFixed((l) => l.filter((x) => x.id !== id))
      notify({ title: `${b.name} removed`, sub: b.paid ? 'Its payment stays in this month’s spending' : `${money(b.amount)} returned to Available to spend`, emoji: '🗑️', undo })
    },

    saveCategory(cat) {
      if (cat.id) patchCat(cat.id, () => cat)
      else setFlexible((l) => [...l, { ...cat, id: 'c' + Date.now(), spent: 0 }])
      notify({ title: cat.id ? 'Budget updated' : 'Category added', sub: `${cat.name} · ${money(cat.limit, 0)} a month`, emoji: cat.emoji })
    },
    // unspent budget goes back to Available; what was spent can move to another category
    deleteCategory(id, moveTo) {
      const undo = snapshot()
      const c = flexible.find((x) => x.id === id)
      setFlexible((l) => l.filter((x) => x.id !== id).map((x) => (x.id === moveTo ? { ...x, spent: x.spent + c.spent, limit: x.limit + c.spent } : x)))
      if (!moveTo) setArchivedSpent((s) => s + c.spent)
      const back = Math.max(c.limit - c.spent, 0)
      notify({ title: `${c.name} deleted`, sub: `${money(back)} returned to Available${moveTo ? ` · history moved to ${flexible.find((x) => x.id === moveTo).name}` : ''}`, emoji: '🗑️', undo })
    },

    toGoal(goalId, amount) {
      const g = goals.find((x) => x.id === goalId)
      const reached = g.saved < g.target && g.saved + amount >= g.target
      patchGoal(goalId, (x) => ({ saved: x.saved + amount }))
      setCash((c) => c - amount)
      pushActivity({ title: `Saved · ${g.name}`, amount: -amount, emoji: g.emoji })
      notify(reached
        ? { title: `“${g.name}” is fully funded! 🎉`, sub: 'Mark it complete or keep saving', emoji: '🏆' }
        : { title: `${money(amount)} saved`, sub: `${g.name}: ${Math.round(((g.saved + amount) / g.target) * 100)}% funded`, emoji: g.emoji })
      celebrate()
    },
    withdrawGoal(goalId, amount) {
      const g = goals.find((x) => x.id === goalId)
      patchGoal(goalId, (x) => ({ saved: x.saved - amount }))
      setCash((c) => c + amount)
      pushActivity({ title: `From savings · ${g.name}`, amount, emoji: g.emoji })
      notify({ title: `${money(amount)} moved to Available`, sub: `From ${g.name}`, emoji: '💸' })
    },
    moveGoal(fromId, toId, amount) {
      const a = goals.find((x) => x.id === fromId)
      const b = goals.find((x) => x.id === toId)
      patchGoal(fromId, (x) => ({ saved: x.saved - amount }))
      patchGoal(toId, (x) => ({ saved: x.saved + amount }))
      notify({ title: `${money(amount)} moved`, sub: `${a.name} → ${b.name}`, emoji: '🔁' })
    },
    setGoalDone(goalId, done) {
      const g = goals.find((x) => x.id === goalId)
      patchGoal(goalId, () => ({ done }))
      if (done) { notify({ title: `“${g.name}” completed 🏆`, sub: 'Use the money, move it or keep it here', emoji: '🏆' }); celebrate() }
    },
    // onboarding: monthly salary and which essential payments the user has
    setupIncome(amount) {
      const cur = incomes.find((x) => x.id === 'salary')?.amount || 0
      setIncomes((l) => l.map((x) => (x.id === 'salary' ? { ...x, amount } : x)))
      setCash((c) => c + (amount - cur))
    },
    keepBills(ids) {
      setFixed((l) => l.filter((b) => ids.includes(b.id)))
    },
    setGoalMonthly(goalId, monthly) {
      const g = goals.find((x) => x.id === goalId)
      patchGoal(goalId, () => ({ monthly }))
      notify(monthly
        ? { title: `Auto-save ${money(monthly, 0)}/mo`, sub: `${g.name} · moved on the 1st of each month`, emoji: '🔁' }
        : { title: 'Auto-save turned off', sub: g.name, emoji: '🔁' })
    },
    saveGoal(goal) {
      if (goal.id) patchGoal(goal.id, () => goal)
      else setGoals((l) => [...l, { ...goal, id: 'g' + Date.now(), saved: 0, done: false }])
      notify({ title: goal.id ? 'Goal updated' : 'New goal created', sub: `${goal.name} · ${money(goal.target, 0)}`, emoji: goal.emoji })
    },
    deleteGoal(goalId, moveTo) {
      const undo = snapshot()
      const g = goals.find((x) => x.id === goalId)
      if (moveTo) patchGoal(moveTo, (x) => ({ saved: x.saved + g.saved }))
      else setCash((c) => c + g.saved)
      setGoals((l) => l.filter((x) => x.id !== goalId))
      notify({ title: `${g.name} deleted`, sub: `${money(g.saved)} moved to ${moveTo ? goals.find((x) => x.id === moveTo).name : 'Available to spend'}`, emoji: '🗑️', undo })
    },

    // sell: profit is taxed automatically by yearly bracket, tax is withheld from the proceeds
    trade(ticker, side, usd) {
      const price = assets[ticker].price
      const qty = usd / price
      const h = holdings.find((x) => x.ticker === ticker)
      let tax = 0
      if (side === 'sell') {
        const gain = (price - h.avg) * qty
        tax = Math.max(taxOnProfit(realized + gain) - taxOnProfit(realized), 0)
        setRealized((r) => r + gain)
        setTaxWithheld((t) => t + tax)
      }
      setHoldings((list) => {
        if (side === 'buy') {
          if (!h) return [...list, { ticker, qty, avg: price }]
          return list.map((x) => (x.ticker === ticker ? { ...x, qty: x.qty + qty, avg: (x.qty * x.avg + usd) / (x.qty + qty) } : x))
        }
        const left = h.qty - qty
        if (left <= 1e-9) return list.filter((x) => x.ticker !== ticker)
        return list.map((x) => (x.ticker === ticker ? { ...x, qty: left } : x))
      })
      setCash((c) => (side === 'buy' ? c - usd : c + usd - tax))
      pushActivity({ title: `${side === 'buy' ? 'Bought' : 'Sold'} ${ticker}${tax ? ` · tax ${money(tax)}` : ''}`, amount: side === 'buy' ? -usd : usd - tax, emoji: side === 'buy' ? '📈' : '💸' })
      return tax
    },
  }

  const fin = {
    cash, available, billsLeft, envelopes, spentMonth, incomeMonth, saved, netWorth, overBudget,
    goals, flexible, fixed, incomes, holdings, assets, portfolio, realized, taxWithheld, taxOnProfit, bracketRate,
    ...actions,
    dismissed,
    dismiss: (key) => setDismissed((d) => [...d, key]),
    resetDemo: () => { try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ } window.location.reload() },
    theme, setTheme,
  }

  const screenProps = { fin, cash, netWorth, portfolio, assets, goals, incomes, fixed, activity, premium, hidden, setHidden, setTab, setSheet, notify, saved, openProfile: () => setProfileOpen(true), budgetTab, setBudgetTab, goBudget: (t) => { setBudgetTab(t); setTab('budget') } }

  const screens = {
    home: <Dashboard {...screenProps} />,
    budget: <Budget {...screenProps} />,
    invest: <Invest {...screenProps} />,
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="h-full w-full flex items-center justify-center sm:py-8 sm:overflow-auto">
      {/* phone frame on desktop, full-bleed on mobile */}
      <div className="phone relative w-full h-full sm:w-[393px] sm:h-[852px] sm:rounded-[56px] sm:p-[11px] sm:bg-[#1a1c20] sm:shadow-[0_0_0_2px_#2c2f35,0_40px_120px_rgba(0,0,0,0.7),0_0_80px_rgba(124,58,237,0.15)]">
        <div className="relative w-full h-full bg-ink overflow-hidden sm:rounded-[46px] isolate">
          {/* window drag strip when running as a desktop app */}
          {IS_ELECTRON && <div className="drag-region absolute top-0 inset-x-0 h-[44px] z-[45]" />}
          {/* dynamic island */}
          <div className="hidden sm:block absolute top-[11px] left-1/2 -translate-x-1/2 w-[122px] h-[35px] rounded-full bg-black z-50" />
          <div className="hidden sm:block"><StatusBar /></div>

          {/* ambient glow */}
          <div className="pointer-events-none absolute -top-40 -left-24 w-[420px] h-[420px] rounded-full bg-violet/20 blur-[100px]" />
          <div className="pointer-events-none absolute top-40 -right-40 w-[300px] h-[300px] rounded-full bg-neon/[0.07] blur-[90px]" />


          {/* root stack: slides back a little when Profile is pushed (iOS parallax) */}
          <motion.div className="absolute inset-0" animate={{ x: profileOpen ? -90 : 0, opacity: profileOpen ? 0.5 : 1 }} transition={{ type: 'spring', stiffness: 380, damping: 40 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto no-scrollbar pt-[max(54px,env(safe-area-inset-top))] pb-[110px]"
            >
              {screens[tab]}
            </motion.div>
          </AnimatePresence>
          </motion.div>

          {/* pushed page: Profile */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                key="profile"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 1 }}
                onDragEnd={(_, info) => { if (info.offset.x > 110 || info.velocity.x > 600) setProfileOpen(false) }}
                className="absolute inset-0 z-[25] bg-ink overflow-y-auto no-scrollbar pt-[max(54px,env(safe-area-inset-top))] pb-[120px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
              >
                <Profile {...screenProps} setPremium={setPremium} onBack={() => setProfileOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <TabBar tab={tab} setTab={setTab} onTab={() => setProfileOpen(false)} />
          <Toast toast={toast} onAction={runUndo} />
          <Burst trigger={burst} />

          <IncomeSheet open={sheet?.type === 'income'} onClose={() => setSheet(null)} fin={fin} />
          <ExpenseSheet open={sheet?.type === 'expense'} onClose={() => setSheet(null)} fin={fin} initialCat={sheet?.catId} initialGoal={sheet?.goalId} setSheet={setSheet} />
          <PiggySheet open={sheet?.type === 'piggy'} onClose={() => setSheet(null)} fin={fin} initialGoal={sheet?.goalId} />
          <CoverSheet open={sheet?.type === 'cover'} onClose={() => setSheet(null)} fin={fin} />
          <GoalActionsSheet open={sheet?.type === 'goalActions'} onClose={() => setSheet(null)} fin={fin} goalId={sheet?.id} setSheet={setSheet} />
          <GoalEditSheet open={sheet?.type === 'goal'} onClose={() => setSheet(null)} fin={fin} goalId={sheet?.id} />
          <CategorySheet open={sheet?.type === 'category'} onClose={() => setSheet(null)} fin={fin} catId={sheet?.id} startDelete={sheet?.del} setSheet={setSheet} />
          <BillSheet open={sheet?.type === 'bill'} onClose={() => setSheet(null)} fin={fin} billId={sheet?.id} />
          <TradeSheet open={sheet?.type === 'trade'} onClose={() => setSheet(null)} fin={fin} ticker={sheet?.ticker} initialSide={sheet?.side} celebrate={() => {}} />
          <ExplainSheet open={sheet?.type === 'explain'} onClose={() => setSheet(null)} fin={fin} />

          {/* first launch */}
          <AnimatePresence>
            {!onboarded && <Onboarding fin={fin} onDone={() => setOnboarded(true)} />}
          </AnimatePresence>

          {/* app-switcher privacy cover */}
          <AnimatePresence>
            {privacy && hidden === false && onboarded && (
              <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[80] backdrop-blur-2xl bg-ink/60 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-violet flex items-center justify-center"><Lock size={28} className="text-pure" /></div>
                <div className="text-[15px] font-semibold">Vault is locked</div>
              </motion.div>
            )}
          </AnimatePresence>
          <PaywallSheet open={sheet?.type === 'paywall'} onClose={() => setSheet(null)} onBuy={() => { setPremium(true); setSheet(null); celebrate(); notify({ title: 'Vault Premium activated', sub: 'Smart forecasts unlocked', emoji: '💎' }) }} />
        </div>
      </div>
    </div>
    </MotionConfig>
  )
}
