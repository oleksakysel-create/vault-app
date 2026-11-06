import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Plus, Minus, PiggyBank, CircleUserRound, ChevronRight, Flame, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { SectionHeader, Card, Tap, AnimatedNumber, BigBalance, money, signed, fmt } from '../components/ui'
import { StackedChart } from '../components/Chart'
import { makeSeries, user } from '../data'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}

const DAYS = 30
const COLORS = { savings: '#7C3AED', investments: '#00F59B', available: '#38BDF8' }

// 30-day shapes for each component, normalised so the last point is 1.
// They are scaled by the live values, so the chart always ends at today's balance.
function useShapes() {
  return useMemo(() => {
    // savings: regular weekly deposits, never goes down
    const savings = Array.from({ length: DAYS }, (_, i) => 0.84 + Math.floor(i / 7) * 0.035 + i * 0.0015)
    // investments: market walk with a dip in the middle
    const investments = makeSeries(31, DAYS, 1, 0.1, 0.018)
    // available cash: salary lands, then spending eats it down
    const available = Array.from({ length: DAYS }, (_, i) => {
      const sinceSalary = i < 4 ? i + 11 : i < 19 ? i - 4 : i - 19
      return 1.25 - sinceSalary * 0.035 + (i >= 19 ? 0.1 : 0)
    })
    const norm = (a) => a.map((v) => v / a[a.length - 1])
    return { savings: norm(savings), investments: norm(investments), available: norm(available) }
  }, [])
}

const dayLabel = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard({ fin, netWorth, cash, portfolio, saved, incomes, activity, hidden, setHidden, setSheet, openProfile, setTab, goBudget }) {
  const shapes = useShapes()
  const [scrub, setScrub] = useState(null)

  const current = { savings: saved, investments: portfolio.value, available: cash }
  const series = {
    savings: shapes.savings.map((v) => v * current.savings),
    investments: shapes.investments.map((v) => v * current.investments),
    available: shapes.available.map((v) => v * current.available),
  }
  // the chart shows change since day 0 for each component
  const delta = (k) => series[k].map((v) => v - series[k][0])
  const layers = [
    // available swings around zero (salary in, spending out), so it sits next to the zero line
    { key: 'available', color: COLORS.available, data: delta('available') },
    { key: 'savings', color: COLORS.savings, data: delta('savings') },
    { key: 'investments', color: COLORS.investments, data: delta('investments') },
  ]

  const at = scrub ?? DAYS - 1
  const valueAt = (k) => series[k][at]
  const balance = scrub == null ? netWorth : valueAt('savings') + valueAt('investments') + valueAt('available')
  const start = series.savings[0] + series.investments[0] + series.available[0]
  const shownChange = balance - start
  const totalIncome = incomes.reduce((s, x) => s + x.amount, 0)

  const parts = [
    { key: 'savings', label: 'Savings' },
    { key: 'investments', label: 'Investments' },
    { key: 'available', label: 'Cash' },
  ]
  const short = fin.available < 0
  const movers = portfolio.rows.slice().sort((a, b) => b.pnlPct - a.pnlPct)
  const best = movers[0]
  const worst = movers[movers.length - 1]

  const hide = (v) => (hidden ? '•••' : v)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-4">
      {/* iOS large-title header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2 pb-4">
        <button onClick={openProfile} className="text-left active:opacity-60 transition-opacity">
          <div className="text-[15px] text-mute">Hello,</div>
          <div className="text-[32px] font-extrabold tracking-tight leading-tight flex items-center gap-0.5">
            {user.name}<ChevronRight size={24} strokeWidth={2.6} className="text-white/30 mt-1" />
          </div>
        </button>
        <Tap onClick={openProfile} aria-label="Profile" className="mb-1 w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-neon">
          <CircleUserRound size={26} strokeWidth={1.8} />
        </Tap>
      </motion.div>

      {/* Hero: what you can spend, what you saved, what you spent */}
      <motion.div variants={item}>
        <div className={`relative rounded-[28px] p-[1px] bg-gradient-to-br ${short ? 'from-loss/80 via-white/10 to-loss/40' : 'from-violet/70 via-white/10 to-neon/50'}`}>
          <div className="relative rounded-[27px] bg-[#111318] overflow-hidden">
            <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-violet/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-neon/10 blur-3xl" />
            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-white/60 font-medium">Available to spend</span>
                <Tap onClick={() => setHidden(!hidden)} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center">
                  {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </Tap>
              </div>
              <div className={short ? 'text-loss' : ''}><BigBalance value={fin.available} hidden={hidden} className="mt-2" /></div>
              <div className="text-[13px] text-white/45 mt-2">
                {short ? 'Your free money doesn’t cover this month' : <>Free money after <b className="text-white/70">{money(fin.billsLeft, 0)}</b> bills and <b className="text-white/70">{money(fin.envelopes, 0)}</b> budgets</>}
              </div>
            </div>
            <div className="relative grid grid-cols-3 border-t border-white/[0.06]">
              {[
                { l: 'Saved', v: saved, sub: `${fin.goals.filter((g) => !g.done).length} goals`, c: '#A78BFA', on: () => goBudget('savings') },
                { l: 'Spent', v: fin.spentMonth, sub: 'this month', c: '#fff', on: () => goBudget('flexible') },
                { l: 'Invested', v: portfolio.value, sub: `${portfolio.pnl >= 0 ? '+' : '−'}${Math.abs(portfolio.pnlPct).toFixed(1)}% profit`, c: '#00F59B', on: () => setTab('invest') },
              ].map((x, i) => (
                <button key={x.l} onClick={x.on} className={`px-3 py-3 text-left active:bg-white/[0.04] ${i ? 'border-l border-white/[0.06]' : ''}`}>
                  <div className="text-[11px] text-white/45">{x.l}</div>
                  <div className="text-[16px] font-bold mt-0.5 tnum" style={{ color: x.c }}>{hide('$' + fmt(x.v, 0))}</div>
                  <div className="text-[11px] text-white/35">{x.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alerts: shortfall or over budget → offer savings */}
      {short && (
        <motion.div variants={item}>
          <Tap onClick={() => setSheet({ type: 'cover' })} className="w-full mt-3 rounded-[20px] bg-loss/10 border border-loss/30 px-4 py-3 flex items-center gap-3 text-left">
            <AlertTriangle size={20} className="text-loss shrink-0" />
            <div className="flex-1 text-[13px]"><b>Not enough free money — {money(-fin.available)} short.</b> Cover it from your savings.</div>
            <span className="text-[13px] font-bold text-ink bg-neon rounded-full px-3 py-1.5 shrink-0">Use savings</span>
          </Tap>
        </motion.div>
      )}
      {!short && fin.overBudget.length > 0 && (
        <motion.div variants={item}>
          <Tap onClick={() => goBudget('flexible')} className="w-full mt-3 rounded-[20px] bg-amber-500/10 border border-amber-500/25 px-4 py-3 flex items-center gap-3 text-left">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <div className="flex-1 text-[13px]"><b>{fin.overBudget.map((c) => c.name).join(', ')}</b> over budget by {money(fin.overBudget.reduce((s, c) => s + c.spent - c.limit, 0), 0)} — taken from Available to spend.</div>
            <ChevronRight size={18} className="text-white/30" />
          </Tap>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div variants={item} className="grid grid-cols-3 gap-2.5 mt-3">
        {[
          { icon: Minus, label: 'Add expense', on: () => setSheet({ type: 'expense' }), cls: 'bg-white text-ink' },
          { icon: Plus, label: 'Add income', on: () => setSheet({ type: 'income' }), cls: 'bg-neon text-ink shadow-[0_10px_30px_rgba(0,245,155,0.25)]' },
          { icon: PiggyBank, label: 'Move to savings', on: () => setSheet({ type: 'piggy' }), cls: 'bg-violet text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)]' },
        ].map((a) => (
          <Tap key={a.label} onClick={a.on} className={`relative overflow-hidden rounded-[20px] p-3.5 text-left ${a.cls}`}>
            <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center"><a.icon size={20} strokeWidth={2.6} /></div>
            <div className="text-[14px] font-bold mt-2.5 leading-tight">{a.label}</div>
          </Tap>
        ))}
      </motion.div>

      {/* Balance chart: savings / investments / cash over 30 days */}
      <motion.div variants={item}>
        <SectionHeader title="Balance" />
        <Card className="overflow-hidden">
          <div className="px-4 pt-4">
            <div className="flex items-end justify-between">
              <AnimatedNumber value={balance} duration={scrub != null ? 0.15 : 0.9} format={(v) => (hidden ? '$•••••' : money(v))} className="text-[26px] font-extrabold tracking-tight" />
              <span className={`text-[13px] font-semibold tnum mb-1 ${shownChange >= 0 ? 'text-neon' : 'text-loss'}`}>
                {hide(`${signed(shownChange, 0)} (${shownChange >= 0 ? '+' : '−'}${Math.abs((shownChange / start) * 100).toFixed(1)}%)`)}
              </span>
            </div>
            <div className="text-[12px] text-mute">{scrub != null ? `${dayLabel(DAYS - 1)} → ${dayLabel(DAYS - 1 - scrub)}` : 'Savings + investments + cash · last 30 days'}</div>
          </div>
          <div className="mt-2"><StackedChart layers={layers} height={110} onScrub={setScrub} /></div>
          <div className="flex justify-between px-4 mt-1 text-[11px] text-white/35 tnum">
            {[DAYS - 1, 20, 10, 0].map((o) => <span key={o}>{dayLabel(o)}</span>)}
          </div>
          <div className="grid grid-cols-3 border-t border-white/[0.06] mt-2">
            {parts.map((p, i) => {
              const ch = series[p.key][at] - series[p.key][0]
              return (
                <div key={p.key} className={`px-3 py-2.5 ${i ? 'border-l border-white/[0.06]' : ''}`}>
                  <div className="text-[11px] text-white/45 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS[p.key] }} />{p.label}</div>
                  <div className={`text-[13px] font-semibold tnum ${ch >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(signed(ch, 0))}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Investments summary */}
      <motion.div variants={item}>
        <SectionHeader title="Investments" action="Open" onAction={() => setTab('invest')} />
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] text-mute">Portfolio</div>
              <AnimatedNumber value={portfolio.value} format={(v) => (hidden ? '$•••••' : money(v))} className="text-[24px] font-extrabold tracking-tight block" />
              <div className={`text-[12px] font-semibold tnum ${portfolio.day >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(`${signed(portfolio.day, 0)} (${portfolio.dayPct >= 0 ? '+' : '−'}${Math.abs(portfolio.dayPct).toFixed(1)}%) today`)}</div>
            </div>
            <div className="text-right">
              <div className={`text-[14px] font-bold tnum ${portfolio.pnl >= 0 ? 'text-neon' : 'text-loss'}`}>{hide(signed(portfolio.pnl, 0))}</div>
              <div className="text-[11px] text-mute">earned all time</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[best, worst].filter(Boolean).map((r, i) => (
              <button key={r.ticker + i} onClick={() => setSheet({ type: 'trade', ticker: r.ticker })} className="rounded-2xl bg-white/[0.04] p-3 text-left">
                <div className="text-[11px] text-mute flex items-center gap-1">{i === 0 ? <TrendingUp size={12} className="text-neon" /> : <TrendingDown size={12} className="text-loss" />}{i === 0 ? 'Best' : 'Weakest'}</div>
                <div className="text-[14px] font-bold mt-0.5">{r.asset.emoji} {r.ticker}</div>
                <div className={`text-[12px] font-semibold tnum ${r.pnl >= 0 ? 'text-neon' : 'text-loss'}`}>{signed(r.pnl, 0)} · {r.pnlPct >= 0 ? '+' : '−'}{Math.abs(r.pnlPct).toFixed(1)}%</div>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Streak */}
      <motion.div variants={item}>
        <Tap onClick={openProfile} className="w-full mt-3 rounded-[20px] bg-card border border-line px-4 py-3 flex items-center gap-3 text-left">
          <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center"><Flame size={22} className="text-orange-400" /></motion.div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{user.streak} days in a row in the green</div>
            <div className="text-[12px] text-mute">7 more days — “Iron Will” badge 🏅</div>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </Tap>
      </motion.div>

      {/* Income sources */}
      <motion.div variants={item}>
        <SectionHeader title="Income sources" action="Add" onAction={() => setSheet({ type: 'income' })} />
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] text-mute">This month · total</div>
              <AnimatedNumber value={totalIncome} className="text-[26px] font-extrabold tracking-tight" />
            </div>
            <span className="text-[12px] font-semibold text-neon bg-neon/10 rounded-full px-2 py-1">+12.8% vs last month</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-[3px] mt-3">
            {incomes.map((s, i) => (
              <motion.div key={s.id} className="h-full rounded-full" style={{ background: s.color }}
                initial={{ width: 0 }} animate={{ width: `${(s.amount / totalIncome) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }} />
            ))}
          </div>
          <div className="mt-2 divide-y divide-white/[0.05]">
            {incomes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: s.color + '1f' }}>{s.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{s.name}</div>
                  <div className="text-[12px] text-mute truncate">{s.sub}</div>
                </div>
                <div className="text-right">
                  <AnimatedNumber value={s.amount} format={(v) => money(v, 0)} className="text-[15px] font-bold block" />
                  <div className="text-[12px] tnum" style={{ color: s.trend > 0 ? '#00F59B' : '#8A919E' }}>
                    {s.trend > 0 ? `▲ ${s.trend}% · ` : ''}{Math.round((s.amount / totalIncome) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={item}>
        <SectionHeader title="Recent activity" />
        <Card className="px-4 divide-y divide-white/[0.05]">
          {activity.slice(0, 6).map((a) => (
            <motion.div layout key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-lg">{a.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">{a.title}</div>
                <div className="text-[12px] text-mute">{a.time}</div>
              </div>
              <div className={`text-[15px] font-semibold tnum ${a.amount > 0 ? 'text-neon' : 'text-white'}`}>{signed(a.amount)}</div>
            </motion.div>
          ))}
        </Card>
      </motion.div>
    </motion.div>
  )
}
