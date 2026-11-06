import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Lock, ChevronRight, TriangleAlert, Trophy, Receipt, X, Repeat } from 'lucide-react'
import { Card, Tap, AnimatedNumber, Glyph, SwipeRow, InfoButton, EmptyState, money, haptic, spring } from '../components/ui'
import { etaLabel } from '../components/Sheets'

const TABS = [
  { id: 'essentials', label: 'Essentials' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'savings', label: 'Savings' },
]

function Checkbox({ on }) {
  return (
    <motion.span
      animate={{ backgroundColor: on ? 'rgb(var(--gain))' : 'rgba(0,0,0,0)', borderColor: on ? 'rgb(var(--gain))' : 'rgb(var(--fg) / 0.3)' }}
      transition={{ duration: 0.2 }}
      className="w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center shrink-0"
    >
      {on && <Check size={15} strokeWidth={3.5} className="text-onbright" />}
    </motion.span>
  )
}

function AddRow({ label, onClick }) {
  return (
    <Tap onClick={onClick} className="w-full mt-3 h-[52px] rounded-[20px] border-2 border-dashed border-white/15 flex items-center justify-center gap-2 text-[15px] font-semibold text-white/70">
      <Plus size={18} /> {label}
    </Tap>
  )
}

const Hint = ({ children }) => <div className="text-[12px] text-mute text-center mt-2">{children}</div>

// ───────────── Essentials (bills, taxes) ─────────────
function Essentials({ fin, setSheet, setTab }) {
  const total = fin.fixed.reduce((s, b) => s + b.amount, 0)
  const paid = fin.fixed.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0)
  return (
    <>
      <Card className="overflow-hidden">
        <div className="px-4 pt-3">
          <div className="flex justify-between text-[13px] text-mute">
            <span>{fin.fixed.filter((x) => x.paid).length} of {fin.fixed.length} paid</span>
            <span className="tnum"><span className="text-white font-semibold">{money(paid, 0)}</span> of {money(total, 0)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] mt-2 overflow-hidden">
            <motion.div className="h-full bg-violet rounded-full" animate={{ width: `${total ? (paid / total) * 100 : 0}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
          </div>
        </div>
        {fin.fixed.length === 0 && <EmptyState icon="🏠" title="No essential payments" text="Add rent, bills or taxes — we’ll set the money aside each month." />}
        <div className="mt-1">
          {fin.fixed.map((x) => (
            <SwipeRow key={x.id} onTap={() => { haptic(12); fin.toggleBill(x.id) }} onEdit={() => setSheet({ type: 'bill', id: x.id })} onDelete={() => fin.deleteBill(x.id)}>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-line">
                <Checkbox on={x.paid} />
                <Glyph e={x.emoji} size={38} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[15px] font-medium truncate ${x.paid ? 'text-white/55 line-through' : ''}`}>{x.name}</div>
                  <div className="text-[12px] text-mute truncate flex items-center gap-1"><Repeat size={11} />{x.paid ? 'Paid this month' : x.sub}</div>
                </div>
                <div className={`text-[15px] font-semibold tnum ${x.paid ? 'text-white/55' : ''}`}>{money(x.amount, 0)}</div>
              </div>
            </SwipeRow>
          ))}
          {/* investment tax is withheld automatically when you sell */}
          <button onClick={() => setTab('invest')} className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-line">
            <span className="w-[26px] h-[26px] rounded-full bg-neon/15 flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} className="text-neon" /></span>
            <span className="w-[38px] h-[38px] rounded-xl bg-white/[0.06] flex items-center justify-center"><Receipt size={19} className="text-white/70" /></span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">Investment tax</div>
              <div className="text-[12px] text-mute truncate">Withheld automatically when you sell</div>
            </div>
            <div className="text-[15px] font-semibold tnum text-white/70">{money(fin.taxWithheld, 0)}</div>
            <ChevronRight size={16} className="text-white/35 -ml-1" />
          </button>
        </div>
      </Card>
      <Hint>Tap to mark as paid · swipe left to edit or delete</Hint>
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
      <Card className="overflow-hidden">
        <div className="flex justify-between text-[13px] text-mute px-4 pt-3 pb-1">
          <span>{money(fin.envelopes, 0)} left of {money(limit, 0)}</span>
          <span className="tnum"><span className="text-white font-semibold">{money(spent, 0)}</span> spent</span>
        </div>
        {fin.flexible.length === 0 && <EmptyState icon="🛍️" title="No categories yet" text="Create a category like Groceries or Taxi with a monthly budget." action="Add category" onAction={() => setSheet({ type: 'category' })} />}
        {fin.flexible.map((x, i) => {
          const p = x.limit ? x.spent / x.limit : 1
          const over = x.spent > x.limit
          return (
            <SwipeRow key={x.id} onTap={() => setSheet({ type: 'expense', catId: x.id })} onEdit={() => setSheet({ type: 'category', id: x.id })} onDelete={() => setSheet({ type: 'category', id: x.id, del: true })}>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-line">
                <Glyph e={x.emoji} size={38} color={over ? '#FF4D6D' : x.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[15px] font-medium flex items-center gap-1.5 truncate">{x.name}{over && <TriangleAlert size={14} className="text-loss shrink-0" />}</span>
                    <span className="text-[14px] tnum shrink-0"><span className={`font-semibold ${over ? 'text-loss' : ''}`}>{money(x.spent, 0)}</span><span className="text-mute"> / {money(x.limit, 0)}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.08] mt-1.5 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: over ? '#FF4D6D' : x.color }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(p, 1) * 100}%` }} transition={{ duration: 0.8, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <div className={`text-[12px] mt-1 ${over ? 'text-loss' : 'text-mute'}`}>
                    {over ? `${money(x.spent - x.limit, 0)} over — paid from your free money` : `${money(x.limit - x.spent, 0)} left`}
                  </div>
                </div>
              </div>
            </SwipeRow>
          )
        })}
      </Card>
      <Hint>Tap a category to add an expense · swipe left to edit or delete</Hint>
      <AddRow label="Add category" onClick={() => setSheet({ type: 'category' })} />

      {/* Premium preview */}
      <Tap onClick={() => !premium && setSheet({ type: 'paywall' })} className="relative w-full mt-3 rounded-[20px] bg-card border border-line p-4 text-left overflow-hidden">
        <div className={`flex items-center gap-3 ${premium ? '' : 'blur-[4px] opacity-60'}`}>
          <Glyph e="✨" size={40} />
          <div>
            <div className="text-[15px] font-semibold">AI forecast for December</div>
            <div className="text-[13px] text-mute">You’ll likely spend {money(spent * 1.08, 0)} — Restaurants trending up</div>
          </div>
        </div>
        {!premium && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full bg-violet text-pure">
            <Lock size={11} strokeWidth={3} /> Premium
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
  const eta = etaLabel(g)
  return (
    <Card className="p-4 cursor-pointer" onClick={onOpen} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <div className="flex items-center gap-3">
        <Glyph e={g.emoji} size={46} radius={14} color={g.color} />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold truncate">{g.name}</div>
          <div className="text-[13px] text-mute truncate">
            {funded ? 'Fully funded 🎉' : eta ? `Reach by ${eta} · ${money(g.monthly, 0)}/mo` : 'No auto-save yet'}
          </div>
        </div>
        <Tap onClick={(e) => { e.stopPropagation(); funded ? onOpen() : onAdd() }} aria-label={funded ? 'Complete goal' : `Add money to ${g.name}`}
          className="w-11 h-11 rounded-full flex items-center justify-center text-pure" style={{ background: funded ? '#00C27C' : g.color }}>
          {funded ? <Trophy size={19} /> : <Plus size={21} strokeWidth={2.8} />}
        </Tap>
      </div>
      <div className="mt-3.5 h-3 rounded-full bg-white/[0.08] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: g.color }}
          initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 1, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      <div className="flex justify-between mt-2 text-[14px]">
        <span className="tnum"><AnimatedNumber value={g.saved} format={(v) => money(v, 0)} className="font-bold" /><span className="text-mute"> of {money(g.target, 0)}</span></span>
        <span className="tnum font-semibold">{Math.round(p * 100)}%</span>
      </div>
    </Card>
  )
}

function Savings({ fin, setSheet }) {
  const active = fin.goals.filter((g) => !g.done)
  const done = fin.goals.filter((g) => g.done)
  return (
    <>
      {active.length === 0 && (
        <Card><EmptyState icon="🐷" title="No goals yet" text="Save for a trip, a gadget or a safety cushion — we’ll show when you’ll get there." action="Create a goal" onAction={() => setSheet({ type: 'goal' })} /></Card>
      )}
      <div className="space-y-3">
        {active.map((g, i) => (
          <GoalCard key={g.id} g={g} i={i} onOpen={() => setSheet({ type: 'goalActions', id: g.id })} onAdd={() => setSheet({ type: 'piggy', goalId: g.id })} />
        ))}
      </div>
      {active.length > 0 && <AddRow label="New goal" onClick={() => setSheet({ type: 'goal' })} />}

      {done.length > 0 && (
        <>
          <div className="text-[13px] text-mute font-semibold uppercase tracking-wide mt-6 mb-2 px-1">Completed</div>
          <Card className="px-4 divide-y divide-white/[0.06]">
            {done.map((g) => (
              <button key={g.id} onClick={() => setSheet({ type: 'goalActions', id: g.id })} className="w-full flex items-center gap-3 py-3 text-left">
                <Glyph e={g.emoji} size={40} color={g.color} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold flex items-center gap-1.5">{g.name} <Trophy size={14} className="text-neon" /></div>
                  <div className="text-[12px] text-mute">{g.saved > 0 ? `${money(g.saved, 0)} ready to use` : 'Money used'}</div>
                </div>
                {g.saved > 0 && <span className="text-[14px] text-accent font-semibold">Use</span>}
                <ChevronRight size={16} className="text-white/35" />
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
  const overKey = 'over-' + fin.overBudget.map((c) => c.id).join(',')
  const showOver = !short && fin.overBudget.length > 0 && !fin.dismissed.includes(overKey)
  const bar = [
    { label: 'Bills', v: fin.billsLeft, c: '#7C3AED' },
    { label: 'Budgets', v: fin.envelopes, c: '#38BDF8' },
    { label: 'Free', v: Math.max(fin.available, 0), c: 'rgb(var(--gain))' },
  ]
  const barTotal = bar.reduce((s, x) => s + x.v, 0) || 1

  return (
    <div className="px-4">
      <div className="flex items-end justify-between pt-2">
        <h1 className="text-[34px] font-extrabold tracking-tight">Budget</h1>
        <span className="mb-2.5 text-[15px] text-mute font-medium">November</span>
      </div>

      {/* Available to spend */}
      <Card className="p-4 mt-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[14px] text-mute flex items-center gap-1.5">Available to spend <InfoButton onClick={() => setSheet({ type: 'explain' })} /></div>
        <AnimatedNumber value={fin.available} format={(v) => money(v, 0)} className={`text-[34px] font-extrabold tracking-tight block leading-tight ${short ? 'text-loss' : ''}`} />
        <div className="flex h-2.5 rounded-full overflow-hidden gap-[3px] mt-3">
          {bar.map((x) => (
            <motion.div key={x.label} className="h-full rounded-full" style={{ background: x.c }} animate={{ width: `${(x.v / barTotal) * 100}%` }} transition={spring} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[12px] text-white/70">
          {bar.map((x) => (
            <span key={x.label} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.label} <b className="tnum">{money(x.v, 0)}</b></span>
          ))}
        </div>
      </Card>

      {short && (
        <Tap onClick={() => setSheet({ type: 'cover' })} className="w-full mt-3 rounded-[20px] bg-loss/10 border border-loss/30 px-4 py-3 flex items-center gap-3 text-left">
          <TriangleAlert size={20} className="text-loss shrink-0" />
          <div className="flex-1 text-[14px]"><b>{money(-fin.available, 0)} short.</b> Cover it from savings.</div>
          <span className="text-[14px] font-bold text-pure bg-violet rounded-full px-3.5 h-10 flex items-center shrink-0">Use savings</span>
        </Tap>
      )}
      {showOver && (
        <div className="mt-3 rounded-[20px] bg-amber-500/10 border border-amber-500/25 pl-4 pr-1 py-1.5 flex items-center gap-3">
          <TriangleAlert size={20} className="text-amber-500 shrink-0" />
          <button onClick={() => setBudgetTab('flexible')} className="flex-1 text-left text-[14px] py-1.5">
            <b>{fin.overBudget.map((c) => c.name).join(', ')}</b> over budget — raise the budget if this happens often
          </button>
          <button onClick={() => fin.dismiss(overKey)} aria-label="Dismiss" className="w-11 h-11 flex items-center justify-center text-white/60"><X size={18} /></button>
        </div>
      )}

      {/* tabs */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-2 bg-ink/90 backdrop-blur-md">
        <div className="relative grid grid-cols-3 p-1 rounded-2xl bg-white/[0.07]" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={budgetTab === t.id} onClick={() => { haptic(); setBudgetTab(t.id) }}
              className={`relative h-10 rounded-xl text-[15px] font-semibold z-10 ${budgetTab === t.id ? 'text-ink' : 'text-white/70'}`}>
              {budgetTab === t.id && <motion.div layoutId="budget-tab" className="absolute inset-0 rounded-xl bg-white -z-10" transition={spring} />}
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[13px] text-mute mt-2 px-1">
          {budgetTab === 'essentials' && 'Rent, bills and taxes — paid every month'}
          {budgetTab === 'flexible' && 'Everyday spending with a monthly budget'}
          {budgetTab === 'savings' && `Goals & piggy bank · ${money(fin.saved, 0)} saved`}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={budgetTab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.16 }}>
          {budgetTab === 'essentials' && <Essentials fin={fin} setSheet={setSheet} setTab={setTab} />}
          {budgetTab === 'flexible' && <Flexible fin={fin} setSheet={setSheet} premium={premium} />}
          {budgetTab === 'savings' && <Savings fin={fin} setSheet={setSheet} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
