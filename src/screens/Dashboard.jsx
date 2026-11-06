import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Minus, Plus, PiggyBank, CircleUserRound, ChevronRight, TriangleAlert, TrendingUp, TrendingDown, X } from 'lucide-react'
import { SectionHeader, Card, Tap, AnimatedNumber, BigBalance, Glyph, AssetBadge, InfoButton, EmptyState, money, signed, fmt, pct } from '../components/ui'
import { LineChart } from '../components/Chart'
import { makeSeries, user } from '../data'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

const DAYS = 30
const PARTS = [
  { key: 'savings', label: 'Savings', color: '#7C3AED' },
  { key: 'investments', label: 'Investments', color: '#00C27C' },
  { key: 'cash', label: 'Cash', color: '#38BDF8' },
]

// 30-day shapes for each part of the balance, normalised so the last point is 1
function useShapes() {
  return useMemo(() => {
    const savings = Array.from({ length: DAYS }, (_, i) => 0.84 + Math.floor(i / 7) * 0.035 + i * 0.0015)
    const investments = makeSeries(31, DAYS, 1, 0.1, 0.018)
    const cash = Array.from({ length: DAYS }, (_, i) => {
      const sinceSalary = i < 4 ? i + 11 : i < 19 ? i - 4 : i - 19
      return 1.25 - sinceSalary * 0.035 + (i >= 19 ? 0.1 : 0)
    })
    const norm = (a) => a.map((v) => v / a[a.length - 1])
    return { savings: norm(savings), investments: norm(investments), cash: norm(cash) }
  }, [])
}

function Insight({ e, title, text, action, onAction, color }) {
  return (
    <div className="snap-start shrink-0 w-[250px] rounded-[20px] bg-card border border-line p-3.5 flex flex-col">
      <div className="flex items-center gap-2.5">
        <Glyph e={e} size={34} round color={color} />
        <div className="text-[14px] font-semibold leading-tight">{title}</div>
      </div>
      <div className="text-[13px] text-white/70 mt-2 leading-snug flex-1">{text}</div>
      {action && (
        <button onClick={onAction} className="mt-3 h-10 rounded-xl bg-white/[0.07] text-[14px] font-semibold text-accent">{action}</button>
      )}
    </div>
  )
}

export default function Dashboard({ fin, portfolio, saved, incomes, activity, hidden, setHidden, setSheet, openProfile, setTab, goBudget }) {
  const shapes = useShapes()
  const [view, setView] = useState('total')
  const [showAllIncome, setShowAllIncome] = useState(false)
  const hide = (v) => (hidden ? '•••' : v)

  const now = { savings: saved, investments: portfolio.value, cash: fin.cash }
  const series = Object.fromEntries(PARTS.map((p) => [p.key, shapes[p.key].map((v) => v * now[p.key])]))
  const total = series.savings.map((_, i) => series.savings[i] + series.investments[i] + series.cash[i])
  const start = total[0]
  const change = total[DAYS - 1] - start

  const short = fin.available < 0
  const overKey = 'over-' + fin.overBudget.map((c) => c.id).join(',')
  const showOver = !short && fin.overBudget.length > 0 && !fin.dismissed.includes(overKey)
  const movers = portfolio.rows.slice().sort((a, b) => b.pnlPct - a.pnlPct)
  const totalIncome = incomes.reduce((s, x) => s + x.amount, 0)
  const incomeList = incomes.slice().sort((a, b) => b.amount - a.amount)

  // proactive tips
  const nextBill = fin.fixed.find((b) => !b.paid)
  const nearGoal = fin.goals.filter((g) => !g.done && g.saved < g.target).sort((a, b) => b.saved / b.target - a.saved / a.target)[0]
  const safeSave = Math.floor((fin.available * 0.3) / 10) * 10
  const insights = [
    safeSave >= 50 && { e: '🐷', title: `You can safely save ${money(safeSave, 0)}`, text: 'Bills and budgets are covered. Put part of the free money towards a goal.', action: 'Move to savings', onAction: () => setSheet({ type: 'piggy' }), color: '#A78BFA' },
    nextBill && { e: nextBill.emoji, title: `${nextBill.name} · ${money(nextBill.amount, 0)}`, text: `${nextBill.sub}. The money is already set aside.`, action: 'Mark as paid', onAction: () => fin.toggleBill(nextBill.id) },
    nearGoal && { e: nearGoal.emoji, title: `${nearGoal.name} is ${Math.round((nearGoal.saved / nearGoal.target) * 100)}% funded`, text: `${money(nearGoal.target - nearGoal.saved, 0)} to go.${nearGoal.monthly ? '' : ' Turn on auto-save to reach it on time.'}`, action: 'Open goal', onAction: () => setSheet({ type: 'goalActions', id: nearGoal.id }), color: nearGoal.color },
  ].filter(Boolean)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-4">
      {/* iOS large-title header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2 pb-4">
        <button onClick={openProfile} className="text-left active:opacity-60 transition-opacity">
          <div className="text-[15px] text-mute">Hello,</div>
          <div className="text-[32px] font-extrabold tracking-tight leading-tight flex items-center gap-0.5">
            {user.name}<ChevronRight size={24} strokeWidth={2.6} className="text-white/35 mt-1" />
          </div>
        </button>
        <Tap onClick={openProfile} aria-label="Profile and settings" className="mb-0.5 w-11 h-11 rounded-full bg-white/[0.07] flex items-center justify-center text-accent">
          <CircleUserRound size={26} strokeWidth={1.8} />
        </Tap>
      </motion.div>

      {/* Hero: what you can spend, what you saved, what you spent */}
      <motion.div variants={item}>
        <div className={`relative rounded-[28px] p-[1px] bg-gradient-to-br ${short ? 'from-loss/80 via-white/10 to-loss/40' : 'from-violet/60 via-white/10 to-neon/40'}`}>
          <div className="relative rounded-[27px] bg-card overflow-hidden">
            <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-violet/25 blur-3xl" />
            <div className="relative p-5 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-white/70 font-medium flex items-center gap-1.5">
                  Available to spend <InfoButton onClick={() => setSheet({ type: 'explain' })} />
                </span>
                <Tap onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Show amounts' : 'Hide amounts'} className="w-11 h-11 -m-1.5 rounded-full flex items-center justify-center text-white/70">
                  {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
                </Tap>
              </div>
              <div className={short ? 'text-loss' : ''}><BigBalance value={fin.available} hidden={hidden} className="mt-1" /></div>
              <div className="text-[13px] text-white/60 mt-2">
                {short ? 'Your free money doesn’t cover this month' : 'Free to spend or save — bills and budgets already set aside'}
              </div>
            </div>
            <div className="relative grid grid-cols-3 border-t border-line">
              {[
                { l: 'Saved', v: saved, sub: `${fin.goals.filter((g) => !g.done).length} goals`, on: () => goBudget('savings') },
                { l: 'Spent', v: fin.spentMonth, sub: 'this month', on: () => goBudget('flexible') },
                { l: 'Invested', v: portfolio.value, sub: `${pct(portfolio.pnlPct)} profit`, on: () => setTab('invest') },
              ].map((x, i) => (
                <button key={x.l} onClick={x.on} className={`px-3 py-3 text-left active:bg-white/[0.04] ${i ? 'border-l border-line' : ''}`}>
                  <div className="text-[12px] text-white/60">{x.l}</div>
                  <div className="text-[17px] font-bold mt-0.5 tnum">{hide('$' + fmt(x.v, 0))}</div>
                  <div className="text-[12px] text-white/55">{x.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* One alert at a time */}
      {short && (
        <motion.div variants={item}>
          <Tap onClick={() => setSheet({ type: 'cover' })} className="w-full mt-3 rounded-[20px] bg-loss/10 border border-loss/30 px-4 py-3 flex items-center gap-3 text-left">
            <TriangleAlert size={20} className="text-loss shrink-0" />
            <div className="flex-1 text-[14px]"><b>{money(-fin.available, 0)} short this month.</b> Cover it from your savings.</div>
            <span className="text-[14px] font-bold text-pure bg-violet rounded-full px-3.5 h-10 flex items-center shrink-0">Use savings</span>
          </Tap>
        </motion.div>
      )}
      {showOver && (
        <motion.div variants={item} className="mt-3 rounded-[20px] bg-amber-500/10 border border-amber-500/25 pl-4 pr-1 py-1.5 flex items-center gap-3">
          <TriangleAlert size={20} className="text-amber-500 shrink-0" />
          <button onClick={() => goBudget('flexible')} className="flex-1 text-left text-[14px] py-1.5">
            <b>{fin.overBudget.map((c) => c.name).join(', ')}</b> over budget by {money(fin.overBudget.reduce((s, c) => s + c.spent - c.limit, 0), 0)}
          </button>
          <button onClick={() => fin.dismiss(overKey)} aria-label="Dismiss" className="w-11 h-11 flex items-center justify-center text-white/60"><X size={18} /></button>
        </motion.div>
      )}

      {/* Actions: one primary, two secondary */}
      <motion.div variants={item} className="grid grid-cols-4 gap-2.5 mt-3">
        <Tap onClick={() => setSheet({ type: 'expense' })} className="col-span-2 h-[64px] rounded-[20px] bg-violet text-pure flex items-center justify-center gap-2 text-[16px] font-bold shadow-[0_10px_30px_rgba(124,58,237,0.30)]">
          <Minus size={20} strokeWidth={2.8} /> Add expense
        </Tap>
        {[
          { icon: Plus, label: 'Income', on: () => setSheet({ type: 'income' }) },
          { icon: PiggyBank, label: 'Save', on: () => setSheet({ type: 'piggy' }) },
        ].map((a) => (
          <Tap key={a.label} onClick={a.on} className="h-[64px] rounded-[20px] bg-card border border-line flex flex-col items-center justify-center gap-1 text-[13px] font-semibold">
            <a.icon size={20} strokeWidth={2.2} className="text-accent" /> {a.label}
          </Tap>
        ))}
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div variants={item}>
          <SectionHeader title="For you" />
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory pb-1">
            {insights.map((x) => <Insight key={x.title} {...x} />)}
          </div>
        </motion.div>
      )}

      {/* Net worth */}
      <motion.div variants={item}>
        <SectionHeader title="Net worth" />
        <Card className="overflow-hidden">
          <div className="px-4 pt-4 flex items-start justify-between gap-3">
            <div>
              <AnimatedNumber value={fin.netWorth} format={(v) => (hidden ? '$•••••' : money(v, 0))} className="text-[26px] font-extrabold tracking-tight block" />
              <div className={`text-[13px] font-semibold tnum ${change >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(`${signed(change, 0)} (${pct((change / start) * 100)})`)} <span className="text-mute font-normal">30 days</span></div>
            </div>
            <div className="flex p-0.5 rounded-xl bg-white/[0.06] shrink-0" role="tablist">
              {[['total', 'Total'], ['parts', 'By part']].map(([id, l]) => (
                <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
                  className={`h-9 px-3 rounded-[10px] text-[13px] font-semibold ${view === id ? 'bg-white/[0.12] text-white' : 'text-white/60'}`}>{l}</button>
              ))}
            </div>
          </div>
          {view === 'total' ? (
            <div className="mt-3 pb-3"><LineChart data={total} color={change >= 0 ? '#00C27C' : '#FF4D6D'} height={110} baseline /></div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {PARTS.map((p) => {
                const v = series[p.key][DAYS - 1]
                const ch = v - series[p.key][0]
                return (
                  <div key={p.key}>
                    <div className="flex justify-between text-[14px]">
                      <span className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.label}</span>
                      <span className="tnum"><b>{hide(money(v, 0))}</b> <span className={ch >= 0 ? 'text-neon' : 'text-loss'}>{hide(signed(ch, 0))}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: p.color }} initial={{ width: 0 }} animate={{ width: `${(v / fin.netWorth) * 100}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Investments summary */}
      <motion.div variants={item}>
        <SectionHeader title="Investments" action="Open" onAction={() => setTab('invest')} />
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] text-mute">Portfolio</div>
              <AnimatedNumber value={portfolio.value} format={(v) => (hidden ? '$•••••' : money(v, 0))} className="text-[24px] font-extrabold tracking-tight block" />
              <div className={`text-[13px] font-semibold tnum ${portfolio.day >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(`${signed(portfolio.day, 0)} today`)}</div>
            </div>
            <div className="text-right">
              <div className={`text-[15px] font-bold tnum ${portfolio.pnl >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(signed(portfolio.pnl, 0))}</div>
              <div className="text-[12px] text-mute">earned all time</div>
            </div>
          </div>
          {movers.length > 1 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[movers[0], movers[movers.length - 1]].map((r, i) => (
                <button key={r.ticker + i} onClick={() => setSheet({ type: 'trade', ticker: r.ticker })} className="rounded-2xl bg-white/[0.05] p-3 text-left flex items-center gap-2.5">
                  <AssetBadge a={r.asset} size={36} />
                  <div className="min-w-0">
                    <div className="text-[12px] text-mute flex items-center gap-1">{i === 0 ? <TrendingUp size={12} className="text-neon" /> : <TrendingDown size={12} className="text-loss" />}{i === 0 ? 'Best' : 'Weakest'}</div>
                    <div className={`text-[13px] font-semibold tnum ${r.pnl >= 0 ? 'text-neon' : 'text-loss'}`}>{pct(r.pnlPct)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={item}>
        <SectionHeader title="Recent activity" />
        <Card className="px-4 divide-y divide-white/[0.06]">
          {activity.length === 0 && <EmptyState icon="✨" title="No activity yet" text="Your income, expenses and savings will appear here." />}
          {activity.slice(0, 5).map((a) => (
            <motion.div layout key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-3">
              <Glyph e={a.emoji} size={40} round />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate">{a.title}</div>
                <div className="text-[12px] text-mute">{a.time}</div>
              </div>
              <div className={`text-[15px] font-semibold tnum ${a.amount > 0 ? 'text-neon' : ''}`}>{hide(signed(a.amount))}</div>
            </motion.div>
          ))}
        </Card>
      </motion.div>

      {/* Income sources: top 3 */}
      <motion.div variants={item}>
        <SectionHeader title="Income this month" action={showAllIncome ? 'Less' : `All ${incomes.length}`} onAction={() => setShowAllIncome(!showAllIncome)} />
        <Card className="px-4 pt-3.5 pb-1">
          <div className="flex items-end justify-between">
            <AnimatedNumber value={totalIncome} format={(v) => (hidden ? '$•••••' : money(v, 0))} className="text-[24px] font-extrabold tracking-tight" />
            <Tap onClick={() => setSheet({ type: 'income' })} className="h-10 px-3.5 rounded-full bg-white/[0.07] text-[14px] font-semibold text-accent flex items-center gap-1"><Plus size={16} /> Add</Tap>
          </div>
          <div className="mt-1 divide-y divide-white/[0.06]">
            {(showAllIncome ? incomeList : incomeList.slice(0, 3)).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <Glyph e={s.emoji} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{s.name}</div>
                  <div className="text-[12px] text-mute truncate">{s.sub}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold tnum">{hide(money(s.amount, 0))}</div>
                  <div className="text-[12px] text-mute tnum">{Math.round((s.amount / totalIncome) * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
