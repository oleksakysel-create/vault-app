import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Lock, ChevronDown, ChevronRight, AlertTriangle, Trophy, Receipt } from 'lucide-react'
import { Card, Tap, AnimatedNumber, money, haptic, spring } from '../components/ui'

const TABS = [
  { id: 'essentials', label: 'Essentials' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'savings', label: 'Savings' },
]

function Checkbox({ on, onClick }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={on ? 'Mark as unpaid' : 'Mark as paid'}
      animate={{ background: on ? '#00F59B' : 'rgba(255,255,255,0)', borderColor: on ? '#00F59B' : 'rgba(255,255,255,0.25)', scale: on ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className="w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center shrink-0"
    >
      <AnimatePresence>
        {on && (
          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
            <Check size={15} strokeWidth={3.5} className="text-ink" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function AddRow({ label, onClick }) {
  return (
    <Tap onClick={onClick} className="w-full mt-3 rounded-[22px] border-2 border-dashed border-white/10 py-3.5 flex items-center justify-center gap-2 text-[15px] font-semibold text-white/60">
      <Plus size={18} /> {label}
    </Tap>
  )
}

// ───────────── Essentials (bills, taxes) ─────────────
function Essentials({ fin, setSheet, setTab }) {
  const total = fin.fixed.reduce((s, b) => s + b.amount, 0)
  const paid = fin.fixed.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0)
  return (
    <>
      <Card className="px-4 pt-3">
        <div className="flex justify-between text-[12px] text-mute">
          <span>{fin.fixed.filter((x) => x.paid).length} of {fin.fixed.length} paid · {money(total - paid, 0)} set aside</span>
          <span className="tnum"><span className="text-white font-semibold">{money(paid, 0)}</span> / {money(total, 0)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
          <motion.div className="h-full bg-violet rounded-full shadow-violet" animate={{ width: `${total ? (paid / total) * 100 : 0}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
        </div>
        <div className="divide-y divide-white/[0.05] mt-1">
          {fin.fixed.map((x) => (
            <motion.div layout key={x.id} role="button" onClick={() => setSheet({ type: 'bill', id: x.id })} className="w-full flex items-center gap-3 py-3 text-left cursor-pointer">
              <Checkbox on={x.paid} onClick={() => { haptic(12); fin.toggleBill(x.id) }} />
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-lg">{x.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-[15px] font-medium truncate ${x.paid ? 'text-white/40 line-through' : ''}`}>{x.name}</div>
                <div className="text-[12px] text-mute truncate">{x.paid ? 'Paid' : x.sub}</div>
              </div>
              <div className={`text-[15px] font-semibold tnum ${x.paid ? 'text-white/40' : ''}`}>{money(x.amount, 0)}</div>
              <ChevronRight size={16} className="text-white/20 -ml-1" />
            </motion.div>
          ))}
          {/* investment tax is withheld automatically when you sell */}
          <button onClick={() => setTab('invest')} className="w-full flex items-center gap-3 py-3 text-left">
            <div className="w-[26px] h-[26px] rounded-full bg-neon/15 flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} className="text-neon" /></div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center"><Receipt size={18} className="text-white/70" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">Investment tax</div>
              <div className="text-[12px] text-mute truncate">Withheld automatically · {money(fin.realized, 0)} profit this year</div>
            </div>
            <div className="text-[15px] font-semibold tnum text-white/60">{money(fin.taxWithheld, 0)}</div>
            <ChevronRight size={16} className="text-white/20 -ml-1" />
          </button>
        </div>
      </Card>
      <AddRow label="Add payment" onClick={() => setSheet({ type: 'bill' })} />
    </>
  )
}

// ───────────── Flexible (spending categories) ─────────────
function Flexible({ fin, setSheet, premium }) {
  const limit = fin.flexible.reduce((s, c) => s + c.limit, 0)
  const spent = fin.flexible.reduce((s, c) => s + c.spent, 0)
  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="flex justify-between text-[12px] text-mute">
          <span>Budgeted {money(limit, 0)} · {money(fin.envelopes, 0)} left</span>
          <span className="tnum"><span className="text-white font-semibold">{money(spent, 0)}</span> spent</span>
        </div>
        {fin.flexible.length === 0 && <div className="text-[14px] text-mute text-center py-2">No categories yet</div>}
        {fin.flexible.map((x, i) => {
          const p = x.limit ? x.spent / x.limit : 1
          const over = x.spent > x.limit
          return (
            <motion.button layout key={x.id} onClick={() => setSheet({ type: 'category', id: x.id })} className="w-full flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: (over ? '#FF4D6D' : x.color) + '1f' }}>{x.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[15px] font-medium flex items-center gap-1.5 truncate">{x.name}{over && <AlertTriangle size={14} className="text-loss shrink-0" />}</span>
                  <span className="text-[13px] tnum shrink-0"><span className={`font-semibold ${over ? 'text-loss' : ''}`}>{money(x.spent, 0)}</span><span className="text-mute"> / {money(x.limit, 0)}</span></span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: over ? '#FF4D6D' : x.color, boxShadow: over ? '0 0 12px #FF4D6D' : 'none' }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(p, 1) * 100}%` }} transition={{ duration: 1, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }} />
                </div>
                <div className={`text-[11px] mt-1 ${over ? 'text-loss' : 'text-mute'}`}>
                  {over ? `Over by ${money(x.spent - x.limit, 0)} — taken from Available to spend` : `${money(x.limit - x.spent, 0)} left`}
                </div>
              </div>
            </motion.button>
          )
        })}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <AddRow label="Category" onClick={() => setSheet({ type: 'category' })} />
        <Tap onClick={() => setSheet({ type: 'expense' })} className="w-full mt-3 rounded-[22px] bg-neon text-ink py-3.5 flex items-center justify-center gap-2 text-[15px] font-bold">
          <Plus size={18} strokeWidth={2.6} /> Expense
        </Tap>
      </div>

      {/* Premium preview */}
      <Tap onClick={() => !premium && setSheet({ type: 'paywall' })} className="relative w-full mt-3 rounded-[20px] bg-card border border-line p-4 text-left overflow-hidden">
        <div className={`flex items-center gap-3 transition-all duration-500 ${premium ? '' : 'blur-[4px] opacity-60'}`}>
          <div className="text-2xl">🔮</div>
          <div>
            <div className="text-[14px] font-semibold">AI forecast for December</div>
            <div className="text-[12px] text-mute">You’ll likely spend {money(spent * 1.08, 0)} — Restaurants trending up</div>
          </div>
        </div>
        {!premium && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-violet/90 shadow-violet">
            <Lock size={10} strokeWidth={3} /> Premium
          </div>
        )}
      </Tap>
    </>
  )
}

// ───────────── Savings (goals & piggy bank) ─────────────
function GoalCard({ g, i, onOpen, onAdd }) {
  const p = Math.min(g.saved / g.target, 1)
  const funded = p >= 1
  return (
    <Card className="p-4 relative overflow-hidden cursor-pointer" onClick={onOpen} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: g.color }} />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[26px]" style={{ background: g.color + '22' }}>{g.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold truncate">{g.name}</span>
            <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: g.color + '26', color: g.color }}>
              {funded ? 'FUNDED' : `LVL ${Math.floor(p * 4) + 1}`}
            </span>
          </div>
          <div className="text-[12px] text-mute truncate">{g.sub}</div>
        </div>
        <Tap onClick={(e) => { e.stopPropagation(); funded ? onOpen() : onAdd() }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: g.color, color: '#0D0F12' }}>
          {funded ? <Trophy size={18} /> : <Plus size={20} strokeWidth={2.8} />}
        </Tap>
      </div>
      <div className="relative mt-4 h-3.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${g.color}99, ${g.color})`, boxShadow: `0 0 16px ${g.color}88` }}
          initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 1.2, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}>
          <div className="absolute inset-0 shimmer opacity-60" />
        </motion.div>
      </div>
      <div className="flex justify-between mt-2.5 text-[13px]">
        <span className="tnum"><AnimatedNumber value={g.saved} format={(v) => money(v, 0)} className="font-bold" /><span className="text-mute"> of {money(g.target, 0)}</span></span>
        <span className="tnum font-semibold" style={{ color: g.color }}>{Math.round(p * 100)}%</span>
      </div>
      <div className="text-[11px] text-white/40 mt-1">{funded ? 'Tap to complete the goal' : `${money(g.target - g.saved, 0)} to go · ≈ ${Math.ceil((g.target - g.saved) / 400)} mo. at $400/mo`}</div>
    </Card>
  )
}

function Savings({ fin, setSheet }) {
  const active = fin.goals.filter((g) => !g.done)
  const done = fin.goals.filter((g) => g.done)
  return (
    <>
      <div className="space-y-3">
        {active.map((g, i) => (
          <GoalCard key={g.id} g={g} i={i} onOpen={() => setSheet({ type: 'goalActions', id: g.id })} onAdd={() => setSheet({ type: 'piggy', goalId: g.id })} />
        ))}
      </div>
      <AddRow label="New goal" onClick={() => setSheet({ type: 'goal' })} />

      {done.length > 0 && (
        <>
          <div className="text-[13px] text-mute font-medium mt-6 mb-2 px-1">Completed</div>
          <Card className="px-4 divide-y divide-white/[0.05]">
            {done.map((g) => (
              <button key={g.id} onClick={() => setSheet({ type: 'goalActions', id: g.id })} className="w-full flex items-center gap-3 py-3 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: g.color + '22' }}>{g.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold flex items-center gap-1.5">{g.name} <Trophy size={14} className="text-neon" /></div>
                  <div className="text-[12px] text-mute">{g.saved > 0 ? `${money(g.saved, 0)} ready to use` : 'Money used'}</div>
                </div>
                <span className="text-[13px] text-neon font-semibold">{g.saved > 0 ? 'Use' : ''}</span>
                <ChevronRight size={16} className="text-white/25" />
              </button>
            ))}
          </Card>
        </>
      )}
    </>
  )
}

// ───────────── Screen ─────────────
export default function Budget({ fin, setSheet, premium, budgetTab, setBudgetTab, setTab }) {
  const short = fin.available < 0
  const bar = [
    { label: 'Bills', v: fin.billsLeft, c: '#7C3AED' },
    { label: 'Budgets', v: fin.envelopes, c: '#38BDF8' },
    { label: 'Free', v: Math.max(fin.available, 0), c: '#00F59B' },
  ]
  const barTotal = bar.reduce((s, x) => s + x.v, 0) || 1

  return (
    <div className="px-4">
      <div className="flex items-end justify-between pt-2">
        <h1 className="text-[34px] font-extrabold tracking-tight">Budget</h1>
        <Tap className="mb-2 flex items-center gap-1 text-[14px] font-semibold bg-white/[0.06] rounded-full px-3 py-1.5">November <ChevronDown size={16} /></Tap>
      </div>

      {/* Available to spend */}
      <Card className="p-4 mt-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[13px] text-mute">Available to spend</div>
        <AnimatedNumber value={fin.available} className={`text-[34px] font-extrabold tracking-tight block leading-tight ${short ? 'text-loss' : ''}`} />
        <div className="text-[12px] text-white/45">Free money after bills and budgets are set aside</div>
        <div className="flex h-2.5 rounded-full overflow-hidden gap-[3px] mt-3">
          {bar.map((x) => (
            <motion.div key={x.label} className="h-full rounded-full" style={{ background: x.c }} animate={{ width: `${(x.v / barTotal) * 100}%` }} transition={spring} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-white/55">
          {bar.map((x) => (
            <span key={x.label} className="flex items-center gap-1"><i className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.label} <b className="text-white/80 tnum">{money(x.v, 0)}</b></span>
          ))}
        </div>
      </Card>

      {/* alerts */}
      {short && (
        <Tap onClick={() => setSheet({ type: 'cover' })} className="w-full mt-3 rounded-[20px] bg-loss/10 border border-loss/30 px-4 py-3 flex items-center gap-3 text-left">
          <AlertTriangle size={20} className="text-loss shrink-0" />
          <div className="flex-1 text-[13px]"><b>{money(-fin.available)} short.</b> Your free money doesn’t cover this month.</div>
          <span className="text-[13px] font-bold text-ink bg-neon rounded-full px-3 py-1.5 shrink-0">Use savings</span>
        </Tap>
      )}
      {!short && fin.overBudget.length > 0 && (
        <Tap onClick={() => { setBudgetTab('flexible'); setSheet({ type: 'category', id: fin.overBudget[0].id }) }} className="w-full mt-3 rounded-[20px] bg-amber-500/10 border border-amber-500/25 px-4 py-3 flex items-center gap-3 text-left">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div className="flex-1 text-[13px]"><b>{fin.overBudget.map((c) => c.name).join(', ')}</b> over budget by {money(fin.overBudget.reduce((s, c) => s + c.spent - c.limit, 0), 0)} — covered from your free money. Raise the budget if this happens often.</div>
          <ChevronRight size={18} className="text-white/30" />
        </Tap>
      )}

      {/* tabs */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-3 bg-ink/90 backdrop-blur-md">
        <div className="relative grid grid-cols-3 p-1 rounded-2xl bg-white/[0.06]">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { haptic(); setBudgetTab(t.id) }} className={`relative h-10 rounded-xl text-[14px] font-semibold z-10 ${budgetTab === t.id ? 'text-ink' : 'text-white/70'}`}>
              {budgetTab === t.id && <motion.div layoutId="budget-tab" className="absolute inset-0 rounded-xl bg-white -z-10" transition={spring} />}
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[12px] text-mute mt-2 px-1">
          {budgetTab === 'essentials' && 'Rent, bills and taxes — paid every month'}
          {budgetTab === 'flexible' && 'Everyday spending with a monthly budget'}
          {budgetTab === 'savings' && `Goals & piggy bank · ${money(fin.saved, 0)} saved`}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={budgetTab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          {budgetTab === 'essentials' && <Essentials fin={fin} setSheet={setSheet} setTab={setTab} />}
          {budgetTab === 'flexible' && <Flexible fin={fin} setSheet={setSheet} premium={premium} />}
          {budgetTab === 'savings' && <Savings fin={fin} setSheet={setSheet} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
