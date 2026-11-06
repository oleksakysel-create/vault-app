import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, Sparkles, BarChart3, Wand2, Bell, Info, AlertTriangle, Trash2, Plus, ArrowDownToLine, ArrowLeftRight, ShoppingBag, Pencil, Trophy, RotateCcw, Wand2 as Magic, CalendarClock } from 'lucide-react'
import { BottomSheet, Keypad, SwipeToConfirm, Tap, AnimatedNumber, ChangePill, Glyph, AssetBadge, money, fmt, haptic, spring } from './ui'
import { LineChart } from './Chart'
import { makeSeries, CATEGORY_COLORS, CATEGORY_EMOJIS, GOAL_EMOJIS, parseQuick } from '../data'

// ───────────── building blocks ─────────────
function AmountDisplay({ value, color = '#fff', error }) {
  const num = value || '0'
  return (
    <motion.div
      key={error ? 'err' : 'ok'}
      animate={error ? { x: [0, -10, 10, -6, 6, 0] } : {}}
      transition={{ duration: 0.35 }}
      className="text-center py-2"
    >
      <span className="text-[50px] font-extrabold tracking-tight tnum" style={{ color: error ? '#FF4D6D' : color }}>
        <span className="text-white/55 text-[36px] align-top mr-0.5">$</span>
        {num.split('').map((ch, i) => (
          <motion.span key={i + ch} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring} className="inline-block">{ch}</motion.span>
        ))}
      </span>
    </motion.div>
  )
}

function Chips({ items, onPick }) {
  return (
    <div className="flex gap-2 justify-center mb-3">
      {items.map((it) => (
        <Tap key={it.label} onClick={() => onPick(it.value)} className="px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[13px] font-semibold text-white/85">
          {it.label}
        </Tap>
      ))}
    </div>
  )
}

function PrimaryButton({ children, disabled, onClick, color = '#7C3AED' }) {
  const light = color !== '#7C3AED' && color !== '#FF4D6D'
  return (
    <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 mt-1 bg-card2 z-10">
      <Tap
        disabled={disabled}
        onClick={onClick}
        className={`w-full h-14 rounded-2xl font-bold text-[17px] disabled:opacity-35 ${light ? 'text-onbright' : 'text-pure'}`}
        style={{ background: color, boxShadow: disabled ? 'none' : `0 8px 24px ${color}44` }}
      >
        {children}
      </Tap>
    </div>
  )
}

// horizontal picker of goals / categories / sources
function Picker({ items, value, onChange, accent = '#7C3AED' }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
      {items.map((it) => {
        const active = it.id === value
        return (
          <Tap key={String(it.id)} onClick={() => onChange(it.id)}
            className="shrink-0 flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-2xl border transition-colors"
            style={{ borderColor: active ? accent : 'rgb(var(--fg) / 0.1)', background: active ? accent + '1f' : 'rgb(var(--fg) / 0.04)' }}>
            <Glyph e={it.emoji} size={30} radius={9} />
            <span className="text-left">
              <span className="block text-[14px] font-semibold leading-tight" style={{ color: 'rgb(var(--fg) / 0.9)' }}>{it.name}</span>
              {it.sub && <span className="block text-[12px] text-mute tnum">{it.sub}</span>}
            </span>
          </Tap>
        )
      })}
    </div>
  )
}

// plain-language note explaining where the money goes
function Note({ tone = 'info', children }) {
  const t = {
    info: { c: '#8A919E', bg: 'rgb(var(--fg) / 0.04)', I: Info },
    good: { c: 'rgb(var(--gain))', bg: 'rgb(var(--gain) / 0.10)', I: Check },
    warn: { c: '#F59E0B', bg: 'rgba(245,158,11,0.10)', I: AlertTriangle },
    bad: { c: '#FF4D6D', bg: 'rgba(255,77,109,0.10)', I: AlertTriangle },
  }[tone]
  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 items-start rounded-2xl px-3.5 py-3 text-[13px] leading-snug" style={{ background: t.bg }}>
      <t.I size={16} className="shrink-0 mt-[1px]" style={{ color: t.c }} />
      <div className="text-white/80">{children}</div>
    </motion.div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="relative grid p-1 rounded-2xl bg-white/[0.05]" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.id} onClick={() => { haptic(); onChange(o.id) }} disabled={o.disabled}
          className={`relative h-10 rounded-xl text-[14px] font-semibold z-10 disabled:opacity-30 ${value === o.id ? 'text-pure' : 'text-white/70'}`}>
          {value === o.id && <motion.div layoutId={'seg-' + options.map((x) => x.id).join()} className="absolute inset-0 rounded-xl -z-10" style={{ background: o.color || '#7C3AED' }} transition={spring} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function TextField({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-4 text-[16px] outline-none focus:border-neon/60 placeholder:text-white/30" />
  )
}

function EmojiRow({ list, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
      {list.map((e) => (
        <Tap key={e} onClick={() => onChange(e)} aria-label="Choose icon" className={`shrink-0 rounded-[14px] p-0.5 ${value === e ? 'ring-2 ring-violet' : ''}`}>
          <Glyph e={e} size={42} radius={12} />
        </Tap>
      ))}
    </div>
  )
}

// "Mar 2027" — when a goal is reached with its monthly auto-save
export function etaLabel(g) {
  if (!g.monthly) return null
  const months = Math.ceil(Math.max(g.target - g.saved, 0) / g.monthly)
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const Label = ({ children }) => <div className="text-[12px] text-mute font-medium mb-2 mt-4 px-1">{children}</div>
const num = (s) => parseFloat(s) || 0
const goalItems = (goals, filter = () => true) => goals.filter(filter).map((g) => ({ id: g.id, emoji: g.emoji, name: g.name, sub: money(g.saved, 0) }))
const catItems = (cats) => cats.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name, sub: `${money(Math.max(c.limit - c.spent, 0), 0)} left` }))

// ───────────── Add income ─────────────
export function IncomeSheet({ open, onClose, fin }) {
  const [src, setSrc] = useState('freelance')
  const [amount, setAmount] = useState('')
  useEffect(() => { if (open) setAmount('') }, [open])
  const n = num(amount)
  return (
    <BottomSheet open={open} onClose={onClose} title="Add income">
      <Picker items={fin.incomes.map((s) => ({ id: s.id, emoji: s.emoji, name: s.name }))} value={src} onChange={setSrc} />
      <AmountDisplay value={amount} color="rgb(var(--gain))" />
      <Chips items={[{ label: '+$100', value: 100 }, { label: '+$500', value: 500 }, { label: '+$1,000', value: 1000 }]} onPick={(v) => setAmount(String(n + v))} />
      <Note tone="good">Goes straight to <b>Available to spend</b>: {money(fin.available)} → {money(fin.available + n)}</Note>
      <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
      <PrimaryButton disabled={!n} onClick={() => { fin.addIncome(src, n); onClose() }}>Add {n ? money(n) : 'income'}</PrimaryButton>
    </BottomSheet>
  )
}

// ───────────── Add expense ─────────────
export function ExpenseSheet({ open, onClose, fin, initialCat, initialGoal }) {
  const [cat, setCat] = useState(null)
  const [from, setFrom] = useState('available')
  const [gid, setGid] = useState(null)
  const [amount, setAmount] = useState('')
  useEffect(() => {
    if (!open) return
    setAmount('')
    setCat(initialCat || fin.flexible[0]?.id)
    setFrom(initialGoal ? 'savings' : 'available')
    setGid(initialGoal || fin.goals.find((g) => g.saved > 0)?.id)
  }, [open]) // eslint-disable-line
  const [quick, setQuick] = useState('')
  useEffect(() => { if (open) setQuick('') }, [open])
  const onQuick = (t) => {
    setQuick(t)
    const r = parseQuick(t, fin.flexible)
    if (r.amount) setAmount(String(r.amount))
    if (r.catId) setCat(r.catId)
  }
  const n = num(amount)
  const c = fin.flexible.find((x) => x.id === cat)
  const g = fin.goals.find((x) => x.id === gid)
  if (!c) return <BottomSheet open={open && false} onClose={onClose} />

  const left = Math.max(c.limit - c.spent, 0)
  const overflow = Math.max(n - left, 0)
  const after = fin.available - overflow
  let note
  let blocked = false
  if (from === 'savings') {
    blocked = !g || n > g.saved
    note = g && (blocked
      ? <Note tone="bad">{g.name} only has {money(g.saved)}.</Note>
      : <Note tone="info">Paid from <b>{g.name}</b>: {money(g.saved)} → {money(g.saved - n)}. Your {c.name} budget stays untouched.</Note>)
  } else if (!n) {
    note = <Note>{c.name}: {money(left)} left of {money(c.limit, 0)} this month.</Note>
  } else if (overflow === 0) {
    note = <Note tone="good">Within your {c.name} budget — {money(left - n)} left after this.</Note>
  } else if (after >= 0) {
    note = <Note tone="warn">{money(overflow)} over the {c.name} budget. It comes from <b>Available to spend</b>: {money(fin.available)} → {money(after)}.</Note>
  } else {
    note = (
      <Note tone="bad">
        Not enough free money — you’d be <b>{money(-after)}</b> short.{' '}
        <button className="text-accent font-semibold underline underline-offset-2" onClick={() => setFrom('savings')}>Pay from savings</button>
      </Note>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add expense">
      <div className="flex items-center gap-2 h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-3.5 mb-3 focus-within:border-violet">
        <Magic size={18} className="text-accent shrink-0" />
        <input value={quick} onChange={(e) => onQuick(e.target.value)} placeholder="Quick add: “coffee 4.50”"
          aria-label="Quick add" className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-white/55" />
      </div>
      <Picker items={catItems(fin.flexible)} value={cat} onChange={setCat} />
      <AmountDisplay value={amount} error={from === 'savings' ? blocked && n > 0 : after < 0} />
      <Segmented value={from} onChange={setFrom} options={[
        { id: 'available', label: 'From Available' },
        { id: 'savings', label: 'From savings', color: '#7C3AED', disabled: !fin.goals.some((x) => x.saved > 0) },
      ]} />
      {from === 'savings' && <div className="mt-3"><Picker items={goalItems(fin.goals, (x) => x.saved > 0)} value={gid} onChange={setGid} accent="#A78BFA" /></div>}
      <div className="mt-3">{note}</div>
      <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
      <PrimaryButton color={after < 0 && from === 'available' ? '#FF4D6D' : '#7C3AED'} disabled={!n || (from === 'savings' && blocked)}
        onClick={() => { fin.addExpense(cat, n, from === 'savings' ? gid : null); onClose() }}>
        {after < 0 && from === 'available' ? 'Add anyway' : `Add ${n ? money(n) : 'expense'}`}
      </PrimaryButton>
    </BottomSheet>
  )
}

// ───────────── Move to savings ─────────────
export function PiggySheet({ open, onClose, fin, initialGoal }) {
  const active = fin.goals.filter((g) => !g.done)
  const [gid, setGid] = useState(null)
  const [amount, setAmount] = useState('')
  useEffect(() => { if (open) { setAmount(''); setGid(initialGoal || active[0]?.id) } }, [open, initialGoal]) // eslint-disable-line
  const n = num(amount)
  const g = fin.goals.find((x) => x.id === gid)
  const over = n > fin.available
  const p = g ? Math.min((g.saved + n) / g.target, 1) : 0
  return (
    <BottomSheet open={open} onClose={onClose} title="Move to savings">
      <Picker items={goalItems(active)} value={gid} onChange={setGid} accent="#A78BFA" />
      {g && (
        <div className="mt-4">
          <div className="flex justify-between text-[12px] text-mute mb-1.5">
            <span>{g.name} after this</span>
            <span className="tnum">{money(g.saved + n, 0)} / {money(g.target, 0)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#7C3AED,#00F59B)' }} animate={{ width: `${p * 100}%` }} transition={spring} />
          </div>
        </div>
      )}
      <AmountDisplay value={amount} error={over} />
      <Chips items={[{ label: '+$50', value: 50 }, { label: '+$200', value: 200 }, { label: 'Fill the goal', value: 'rest' }]}
        onPick={(v) => setAmount(String(v === 'rest' ? Math.max(+(g.target - g.saved).toFixed(2), 0) : n + v))} />
      {over
        ? <Note tone="bad">You have {money(Math.max(fin.available, 0))} free right now — bills and budgets are already set aside.</Note>
        : <Note>From <b>Available to spend</b>: {money(fin.available)} → {money(fin.available - n)}</Note>}
      <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
      <PrimaryButton color="#7C3AED" disabled={!n || over || !g} onClick={() => { fin.toGoal(gid, n); onClose() }}>Save {n ? money(n) : ''}</PrimaryButton>
    </BottomSheet>
  )
}

// ───────────── Cover a shortfall from savings ─────────────
export function CoverSheet({ open, onClose, fin }) {
  const short = Math.max(-fin.available, 0)
  const withMoney = fin.goals.filter((g) => g.saved > 0)
  const [gid, setGid] = useState(null)
  const [amount, setAmount] = useState('')
  useEffect(() => {
    if (!open) return
    const first = withMoney.slice().sort((a, b) => b.saved - a.saved)[0]
    setGid(first?.id)
    setAmount(first ? String(+Math.min(short || 100, first.saved).toFixed(2)) : '')
  }, [open]) // eslint-disable-line
  const n = num(amount)
  const g = fin.goals.find((x) => x.id === gid)
  const tooMuch = g && n > g.saved
  return (
    <BottomSheet open={open} onClose={onClose} title="Cover from savings">
      {short > 0
        ? <Note tone="bad">Your free money is <b>{money(short)}</b> short this month. Take it from a savings goal to stay in control.</Note>
        : <Note>Move money from a goal back to <b>Available to spend</b>.</Note>}
      <Label>Take from</Label>
      <Picker items={goalItems(withMoney)} value={gid} onChange={setGid} accent="#A78BFA" />
      <AmountDisplay value={amount} error={tooMuch} />
      {g && <Note tone={tooMuch ? 'bad' : 'info'}>{tooMuch ? `${g.name} only has ${money(g.saved)}.` : <>{g.name}: {money(g.saved)} → {money(g.saved - n)} · Available: {money(fin.available)} → {money(fin.available + n)}</>}</Note>}
      <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
      <PrimaryButton disabled={!n || tooMuch || !g} onClick={() => { fin.withdrawGoal(gid, n); onClose() }}>Cover {n ? money(n) : ''}</PrimaryButton>
    </BottomSheet>
  )
}

// ───────────── Goal: actions (add / withdraw / move / spend / complete) ─────────────
export function GoalActionsSheet({ open, onClose, fin, goalId, setSheet }) {
  const [mode, setMode] = useState(null)
  const [amount, setAmount] = useState('')
  const [target, setTarget] = useState(null)
  const [keep, setKeep] = useState(null)
  useEffect(() => { if (open) { setMode(null); setAmount('') } }, [open, goalId])
  const g = fin.goals.find((x) => x.id === goalId) || keep
  useEffect(() => { if (g && g !== keep && fin.goals.includes(g)) setKeep(g) }, [g]) // eslint-disable-line
  if (!g) return <BottomSheet open={false} onClose={onClose} />

  const n = num(amount)
  const p = Math.min(g.saved / g.target, 1)
  const others = fin.goals.filter((x) => x.id !== g.id)
  const tooMuch = n > g.saved

  const start = (m) => {
    setMode(m); setAmount(String(+g.saved.toFixed(2)))
    if (m === 'move') setTarget(others.find((x) => !x.done)?.id || others[0]?.id)
    if (m === 'spend') setTarget(fin.flexible[0]?.id)
  }

  const actions = [
    { id: 'add', icon: Plus, label: 'Add money', on: () => setSheet({ type: 'piggy', goalId: g.id }), hide: g.done },
    { id: 'withdraw', icon: ArrowDownToLine, label: 'To Available', on: () => start('withdraw'), hide: !g.saved },
    { id: 'move', icon: ArrowLeftRight, label: 'Move to goal', on: () => start('move'), hide: !g.saved || !others.length },
    { id: 'spend', icon: ShoppingBag, label: 'Spend', on: () => start('spend'), hide: !g.saved || !fin.flexible.length },
    { id: 'edit', icon: Pencil, label: 'Edit', on: () => setSheet({ type: 'goal', id: g.id }) },
  ].filter((a) => !a.hide)

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex items-center gap-3 pt-1">
        <Glyph e={g.emoji} size={56} radius={16} color={g.color} />
        <div className="flex-1 min-w-0">
          <div className="text-[19px] font-bold truncate flex items-center gap-2">{g.name}{g.done && <span className="text-[12px] font-bold px-2 py-0.5 rounded-md bg-neon/15 text-neon">COMPLETED</span>}</div>
          <div className="text-[13px] text-mute tnum">{money(g.saved)} of {money(g.target, 0)}</div>
        </div>
        <div className="text-[20px] font-extrabold tnum" style={{ color: g.color }}>{Math.round(p * 100)}%</div>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden mt-3">
        <motion.div className="h-full rounded-full" style={{ background: g.color }} initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      </div>

      <AnimatePresence mode="wait">
        {!mode ? (
          <motion.div key="menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="grid grid-cols-5 gap-2 mt-5">
              {actions.map((a) => (
                <Tap key={a.id} onClick={a.on} className="flex flex-col items-center gap-1.5">
                  <span className="w-12 h-12 rounded-full bg-white/[0.07] flex items-center justify-center"><a.icon size={20} /></span>
                  <span className="text-[12px] text-white/75 text-center leading-tight">{a.label}</span>
                </Tap>
              ))}
            </div>
            <div className="mt-5">
              {g.done ? (
                <>
                  <Note tone="good">Goal completed. Use the money (Spend), move it to <b>Available</b> or to another goal.</Note>
                  <Tap onClick={() => fin.setGoalDone(g.id, false)} className="w-full mt-3 h-12 rounded-2xl bg-white/[0.06] text-[15px] font-semibold flex items-center justify-center gap-2"><RotateCcw size={16} /> Reopen goal</Tap>
                </>
              ) : (
                <>
                  {g.saved >= g.target
                    ? <Note tone="good">Fully funded! Mark it complete to celebrate and decide what to do with the money.</Note>
                    : <Note>{money(g.target - g.saved, 0)} to go · {g.monthly ? <>with auto-save you’ll reach it in <b>{etaLabel(g)}</b></> : 'turn on auto-save to get a date'}.</Note>}
                  <Label>Auto-save every month</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 100, 200, 400].map((v) => (
                      <Tap key={v} onClick={() => fin.setGoalMonthly(g.id, v)}
                        className={`h-11 rounded-xl text-[14px] font-semibold border ${(g.monthly || 0) === v ? 'border-violet bg-violet/15 text-white' : 'border-white/10 bg-white/[0.04] text-white/70'}`}>
                        {v ? `$${v}` : 'Off'}
                      </Tap>
                    ))}
                  </div>
                  <PrimaryButton color="#00F59B" onClick={() => fin.setGoalDone(g.id, true)}><span className="inline-flex items-center gap-2"><Trophy size={18} /> Mark as completed</span></PrimaryButton>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex items-center justify-between mt-5">
              <span className="text-[16px] font-bold">{{ withdraw: 'Move to Available', move: 'Move to another goal', spend: 'Spend from savings' }[mode]}</span>
              <button onClick={() => setMode(null)} className="text-[14px] text-neon">Back</button>
            </div>
            {mode === 'move' && <div className="mt-3"><Picker items={goalItems(others)} value={target} onChange={setTarget} accent="#A78BFA" /></div>}
            {mode === 'spend' && <div className="mt-3"><Picker items={catItems(fin.flexible)} value={target} onChange={setTarget} /></div>}
            <AmountDisplay value={amount} error={tooMuch} />
            <Note tone={tooMuch ? 'bad' : 'info'}>
              {tooMuch ? `Only ${money(g.saved)} in this goal.` : {
                withdraw: <>Available to spend: {money(fin.available)} → {money(fin.available + n)}</>,
                move: <>{g.name} → {others.find((x) => x.id === target)?.name}: {money(n)}</>,
                spend: <>Recorded as {fin.flexible.find((x) => x.id === target)?.name} spending, paid from {g.name}. Your free money stays the same.</>,
              }[mode]}
            </Note>
            <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
            <PrimaryButton color="#7C3AED" disabled={!n || tooMuch} onClick={() => {
              if (mode === 'withdraw') fin.withdrawGoal(g.id, n)
              if (mode === 'move') fin.moveGoal(g.id, target, n)
              if (mode === 'spend') fin.addExpense(target, n, g.id)
              setMode(null); setAmount('')
            }}>Confirm {n ? money(n) : ''}</PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  )
}

// ───────────── Goal: create / edit / delete ─────────────
export function GoalEditSheet({ open, onClose, fin, goalId }) {
  const g = fin.goals.find((x) => x.id === goalId)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✈️')
  const [target, setTarget] = useState('')
  const [del, setDel] = useState(false)
  const [moveTo, setMoveTo] = useState(null)
  useEffect(() => {
    if (!open) return
    setDel(false); setMoveTo(null)
    setName(g?.name || ''); setEmoji(g?.emoji || '✈️'); setTarget(g ? String(g.target) : '')
  }, [open, goalId]) // eslint-disable-line
  const n = num(target)
  const color = g?.color || CATEGORY_COLORS[(fin.goals.length + 1) % CATEGORY_COLORS.length]
  const others = fin.goals.filter((x) => x.id !== goalId)

  if (del && g) {
    return (
      <BottomSheet open={open} onClose={onClose} title={`Delete “${g.name}”`}>
        <Note tone="warn">This goal has <b>{money(g.saved)}</b>. Choose where the money goes:</Note>
        <Label>Move money to</Label>
        <Picker items={[{ id: null, emoji: '💸', name: 'Available to spend', sub: money(fin.available, 0) }, ...goalItems(others)]} value={moveTo} onChange={setMoveTo} />
        <PrimaryButton color="#FF4D6D" onClick={() => { fin.deleteGoal(g.id, moveTo); onClose() }}>Delete and move {money(g.saved)}</PrimaryButton>
        <Tap onClick={() => setDel(false)} className="w-full h-12 mt-2 text-[15px] text-white/70">Cancel</Tap>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={g ? 'Edit goal' : 'New goal'}>
      <div className="rounded-[22px] p-4 border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent flex items-center gap-3">
        <motion.div key={emoji} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
          <Glyph e={emoji} size={56} radius={16} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name"
            className="w-full bg-transparent outline-none text-[18px] font-semibold placeholder:text-white/30" />
          <div className="text-[13px] text-mute tnum">Target: {n ? money(n, 0) : '—'}{g ? ` · saved ${money(g.saved, 0)}` : ''}</div>
        </div>
      </div>
      <div className="mt-3"><EmojiRow list={GOAL_EMOJIS} value={emoji} onChange={setEmoji} /></div>
      <AmountDisplay value={target} />
      <Chips items={[{ label: '$500', value: 500 }, { label: '$2,000', value: 2000 }, { label: '$10,000', value: 10000 }]} onPick={(v) => setTarget(String(v))} />
      <Keypad value={target} onChange={setTarget} />
      <PrimaryButton disabled={!name.trim() || !n} onClick={() => { fin.saveGoal({ ...(g || {}), name: name.trim(), emoji, target: n, color, sub: g?.sub || 'New goal', monthly: g?.monthly ?? 0 }); onClose() }}>
        {g ? 'Save changes' : 'Create goal'}
      </PrimaryButton>
      {g && (
        <Tap onClick={() => (g.saved > 0 ? setDel(true) : (fin.deleteGoal(g.id, null), onClose()))} className="w-full h-12 mt-2 text-[15px] text-loss font-semibold flex items-center justify-center gap-2">
          <Trash2 size={16} /> Delete goal
        </Tap>
      )}
    </BottomSheet>
  )
}

// ───────────── Flexible category: add / edit / delete ─────────────
export function CategorySheet({ open, onClose, fin, catId, setSheet, startDelete }) {
  const c = fin.flexible.find((x) => x.id === catId)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛍️')
  const [limit, setLimit] = useState('')
  const [del, setDel] = useState(false)
  const [moveTo, setMoveTo] = useState(null)
  useEffect(() => {
    if (!open) return
    setDel(!!startDelete)
    setName(c?.name || ''); setEmoji(c?.emoji || '🛍️'); setLimit(c ? String(c.limit) : '')
    setMoveTo(fin.flexible.find((x) => x.id !== catId)?.id || null)
  }, [open, catId]) // eslint-disable-line
  const n = num(limit)
  const color = c?.color || CATEGORY_COLORS[fin.flexible.length % CATEGORY_COLORS.length]
  // how much this change takes from (or returns to) Available
  const reservedNow = c ? Math.max(c.limit - c.spent, 0) : 0
  const reservedNew = Math.max(n - (c?.spent || 0), 0)
  const diff = reservedNew - reservedNow
  const others = fin.flexible.filter((x) => x.id !== catId)

  if (del && c) {
    return (
      <BottomSheet open={open} onClose={onClose} title={`Delete “${c.name}”`}>
        <Note tone="good">Unspent budget <b>{money(reservedNow)}</b> returns to Available to spend.</Note>
        {c.spent > 0 && (
          <>
            <Label>{money(c.spent)} already spent this month — move it to</Label>
            <Picker items={[...catItems(others), { id: null, emoji: '🧾', name: 'Other', sub: 'keep in totals' }]} value={moveTo} onChange={setMoveTo} />
          </>
        )}
        <PrimaryButton color="#FF4D6D" onClick={() => { fin.deleteCategory(c.id, moveTo); onClose() }}>Delete category</PrimaryButton>
        <Tap onClick={() => setDel(false)} className="w-full h-12 mt-2 text-[15px] text-white/70">Cancel</Tap>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={c ? c.name : 'New category'}>
      {c && (
        <Tap onClick={() => setSheet({ type: 'expense', catId: c.id })} className="w-full h-12 rounded-2xl bg-violet text-pure font-bold text-[15px] flex items-center justify-center gap-2 mb-1">
          <Plus size={18} strokeWidth={2.6} /> Add expense
        </Tap>
      )}
      <Label>Name</Label>
      <TextField value={name} onChange={setName} placeholder="e.g. Taxi" />
      <div className="mt-3"><EmojiRow list={CATEGORY_EMOJIS} value={emoji} onChange={setEmoji} /></div>
      <Label>Monthly budget{c ? ` · spent ${money(c.spent, 0)}` : ''}</Label>
      <AmountDisplay value={limit} />
      {n > 0 && (diff > 0
        ? <Note tone={fin.available - diff < 0 ? 'bad' : 'info'}>{money(diff)} will be set aside from <b>Available to spend</b>: {money(fin.available)} → {money(fin.available - diff)}</Note>
        : diff < 0
          ? <Note tone="good">{money(-diff)} returns to <b>Available to spend</b>: {money(fin.available)} → {money(fin.available - diff)}</Note>
          : <Note>No change to Available to spend.</Note>)}
      <div className="mt-3"><Keypad value={limit} onChange={setLimit} /></div>
      <PrimaryButton disabled={!name.trim() || !n} onClick={() => { fin.saveCategory({ ...(c || {}), name: name.trim(), emoji, limit: n, color: c?.color || color }); onClose() }}>
        {c ? 'Save changes' : 'Add category'}
      </PrimaryButton>
      {c && (
        <Tap onClick={() => setDel(true)} className="w-full h-12 mt-2 text-[15px] text-loss font-semibold flex items-center justify-center gap-2">
          <Trash2 size={16} /> Delete category
        </Tap>
      )}
    </BottomSheet>
  )
}

// ───────────── Essential payment: add / edit / delete ─────────────
export function BillSheet({ open, onClose, fin, billId }) {
  const b = fin.fixed.find((x) => x.id === billId)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [sub, setSub] = useState('')
  const [amount, setAmount] = useState('')
  useEffect(() => {
    if (!open) return
    setName(b?.name || ''); setEmoji(b?.emoji || '🏠'); setSub(b?.sub || ''); setAmount(b ? String(b.amount) : '')
  }, [open, billId]) // eslint-disable-line
  const n = num(amount)
  const diff = b?.paid ? 0 : n - (b?.amount || 0)
  return (
    <BottomSheet open={open} onClose={onClose} title={b ? 'Edit payment' : 'New essential payment'}>
      <Label>Name</Label>
      <TextField value={name} onChange={setName} placeholder="e.g. Car insurance" />
      <div className="mt-3"><TextField value={sub} onChange={setSub} placeholder="Due date, e.g. Due Nov 20" /></div>
      <div className="mt-3"><EmojiRow list={['🏠', '💡', '📶', '🎧', '🏋️', '🧾', '🚗', '🩺', '🎓', '📱']} value={emoji} onChange={setEmoji} /></div>
      <AmountDisplay value={amount} />
      {n > 0 && diff !== 0 && (
        <Note tone={diff > 0 ? (fin.available - diff < 0 ? 'bad' : 'info') : 'good'}>
          {diff > 0 ? <>{money(diff)} set aside from Available to spend until it’s paid: {money(fin.available)} → {money(fin.available - diff)}</>
            : <>{money(-diff)} returns to Available to spend.</>}
        </Note>
      )}
      <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
      <PrimaryButton disabled={!name.trim() || !n} onClick={() => { fin.saveBill({ ...(b || {}), name: name.trim(), emoji, sub: sub.trim() || 'Monthly', amount: n }); onClose() }}>
        {b ? 'Save changes' : 'Add payment'}
      </PrimaryButton>
      {b && (
        <Tap onClick={() => { fin.deleteBill(b.id); onClose() }} className="w-full h-12 mt-2 text-[15px] text-loss font-semibold flex items-center justify-center gap-2">
          <Trash2 size={16} /> Delete payment
        </Tap>
      )}
    </BottomSheet>
  )
}

// ───────────── Buy / sell ─────────────
export function TradeSheet({ open, onClose, fin, ticker: tickerProp, initialSide = 'buy', celebrate }) {
  const [side, setSide] = useState('buy')
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState(null)
  const [ticker, setTicker] = useState(tickerProp)
  useEffect(() => { if (tickerProp) setTicker(tickerProp) }, [tickerProp])
  useEffect(() => { if (open) { setSide(initialSide || 'buy'); setAmount(''); setDone(null) } }, [open, initialSide])

  const a = ticker ? fin.assets[ticker] : null
  const h = fin.holdings.find((x) => x.ticker === ticker)
  const series = useMemo(() => (a ? makeSeries(ticker.charCodeAt(0) * 7 + ticker.length, 50, a.price, a.change / 100 * 4, 0.012) : [1, 1]), [ticker]) // eslint-disable-line
  if (!a) return <BottomSheet open={false} onClose={onClose} />

  const holdValue = h ? h.qty * a.price : 0
  const n = num(amount)
  const max = side === 'buy' ? Math.max(fin.available, 0) : holdValue
  const over = n > max + 0.001
  const color = side === 'buy' ? '#7C3AED' : '#FF4D6D'
  const earned = h ? holdValue - h.qty * h.avg : 0
  // tax preview for a sale
  const gain = h ? (a.price - h.avg) * (n / a.price) : 0
  const tax = side === 'sell' ? Math.max(fin.taxOnProfit(fin.realized + gain) - fin.taxOnProfit(fin.realized), 0) : 0
  const rate = fin.bracketRate(Math.max(fin.realized + gain, 0))

  return (
    <BottomSheet open={open} onClose={onClose}>
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="form" exit={{ opacity: 0, scale: 0.96 }}>
            <div className="flex items-center gap-3 pt-1">
              <AssetBadge a={a} size={44} />
              <div className="flex-1">
                <div className="text-[17px] font-bold">{a.name}</div>
                <div className="text-[13px] text-mute">{a.ticker} · {a.type}</div>
              </div>
              <div className="text-right">
                <AnimatedNumber value={a.price} className="text-[17px] font-bold block" />
                <ChangePill value={a.change} />
              </div>
            </div>
            <div className="mt-2 -mx-1"><LineChart data={series} color={a.change >= 0 ? '#00C27C' : '#FF4D6D'} height={56} baseline={false} /></div>

            {h && (
              <div className="grid grid-cols-3 gap-2 mt-2 rounded-2xl bg-white/[0.04] p-3 text-center">
                <div><div className="text-[12px] text-mute">You own</div><div className="text-[14px] font-bold tnum">{money(holdValue, 0)}</div></div>
                <div><div className="text-[12px] text-mute">Avg. price</div><div className="text-[14px] font-bold tnum">{money(h.avg)}</div></div>
                <div><div className="text-[12px] text-mute">You earned</div><div className={`text-[14px] font-bold tnum ${earned >= 0 ? 'text-neon' : 'text-loss'}`}>{earned >= 0 ? '+' : '−'}{money(Math.abs(earned), 0)}</div></div>
              </div>
            )}

            <div className="mt-3">
              <Segmented value={side} onChange={(s) => { setSide(s); setAmount('') }} options={[
                { id: 'buy', label: h ? 'Buy more' : 'Buy' },
                { id: 'sell', label: 'Sell', color: '#FF4D6D', disabled: !h },
              ]} />
            </div>

            <AmountDisplay value={amount} color={color} error={over} />
            <div className="flex justify-between text-[12px] text-mute -mt-1 mb-2 px-1 tnum">
              <span>≈ {fmt(n / a.price, a.price > 1000 ? 6 : 4)} {a.ticker}</span>
              <span className={over ? 'text-loss' : ''}>{side === 'buy' ? 'Available' : 'You own'} {money(max)}</span>
            </div>
            <Chips items={[{ label: '25%', value: 0.25 }, { label: '50%', value: 0.5 }, { label: 'Max', value: 1 }]}
              onPick={(v) => setAmount(String(Math.floor(max * v * 100) / 100))} />
            {side === 'sell' && n > 0 && !over && (
              <Note tone={gain >= 0 ? 'info' : 'good'}>
                {gain >= 0
                  ? <>Profit on this sale <b className="text-neon">+{money(gain)}</b> · tax {Math.round(rate * 100)}% withheld automatically: <b>{money(tax)}</b>. You get <b>{money(n - tax)}</b>.</>
                  : <>Loss on this sale {money(gain)} — no tax, and it lowers this year’s taxable profit.</>}
              </Note>
            )}
            {side === 'buy' && n > 0 && !over && <Note>Paid from Available to spend: {money(fin.available)} → {money(fin.available - n)}</Note>}
            <div className="mt-3"><Keypad value={amount} onChange={setAmount} /></div>
            <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-card2 z-10">
              <SwipeToConfirm
                key={side + open}
                color={color}
                disabled={!n || over}
                label={side === 'buy' ? `Swipe to buy ${money(n)}` : `Swipe to sell ${money(n)}`}
                onConfirm={() => {
                  const t = fin.trade(ticker, side, n)
                  setDone({ side, n, qty: n / a.price, tax: t || 0, gain })
                  celebrate()
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
              className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: color, boxShadow: `0 0 60px ${color}99` }}>
              <Check size={48} strokeWidth={3.2} className="text-pure" />
            </motion.div>
            <div className="text-[24px] font-bold mt-6">{done.side === 'buy' ? 'Order filled' : 'Sale complete'}</div>
            <div className="text-mute mt-1 tnum">{fmt(done.qty, a.price > 1000 ? 6 : 4)} {a.ticker} at {money(a.price)}</div>
            <div className="w-full mt-7 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-left space-y-3">
              <Row label="Order total" value={money(done.n)} />
              {done.side === 'sell' && <Row label="Profit on sale" value={`${done.gain >= 0 ? '+' : '−'}${money(Math.abs(done.gain))}`} accent={done.gain >= 0} />}
              {done.side === 'sell' && <Row label="Tax withheld" value={money(done.tax)} />}
              <Row label="Fee" value="$0.00" accent />
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-mute text-[14px]">Available to spend</span>
                <AnimatedNumber value={fin.available} className="text-[18px] font-bold" duration={1.4} />
              </div>
            </div>
            <PrimaryButton color={color} onClick={onClose}>Done</PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between text-[14px]">
      <span className="text-mute">{label}</span>
      <span className={`tnum font-semibold ${accent ? 'text-neon' : ''}`}>{value}</span>
    </div>
  )
}

// ───────────── Paywall ─────────────
export function PaywallSheet({ open, onClose, onBuy }) {
  const [plan, setPlan] = useState('year')
  const features = [
    { icon: Wand2, text: 'AI forecast of next month’s spending' },
    { icon: Bell, text: 'Alerts before you go over budget' },
    { icon: BarChart3, text: 'Advanced analytics & tax reports' },
  ]
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="relative -mx-5 -mt-1 px-5 pt-4 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet/40 via-violet/10 to-transparent" />
        <motion.div
          className="absolute -top-24 left-1/2 -ml-[160px] w-[320px] h-[320px] rounded-full opacity-40"
          style={{ background: 'conic-gradient(from 0deg, #7C3AED, #00F59B, #4F5BEF, #7C3AED)', filter: 'blur(60px)' }} />
        <div className="relative flex flex-col items-center text-center">
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="w-20 h-20 rounded-[26px] bg-gradient-to-br from-violet to-[#4C1D95] flex items-center justify-center shadow-violet">
            <Crown size={40} className="text-white" />
          </motion.div>
          <div className="text-[26px] font-extrabold mt-4">Vault <span className="bg-gradient-to-r from-violet to-neon bg-clip-text text-transparent">Premium</span></div>
          <div className="text-[14px] text-white/60 mt-1">Full control over every dollar</div>
        </div>
      </div>
      <div className="space-y-3">
        {features.map((f, i) => (
          <motion.div key={f.text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet/20 flex items-center justify-center"><f.icon size={17} className="text-violet-300" /></div>
            <span className="text-[15px]">{f.text}</span>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-6">
        {[
          { id: 'month', title: 'Monthly', price: '$4.99', sub: 'per month' },
          { id: 'year', title: 'Yearly', price: '$34.99', sub: '$2.91/mo', badge: '−42%' },
        ].map((p) => (
          <Tap key={p.id} onClick={() => setPlan(p.id)}
            className={`relative rounded-2xl p-3.5 text-left border-2 transition-colors ${plan === p.id ? 'border-neon bg-neon/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
            {p.badge && <span className="absolute -top-2.5 right-3 text-[12px] font-bold bg-neon text-onbright px-2 py-0.5 rounded-full">{p.badge}</span>}
            <div className="text-[13px] text-mute">{p.title}</div>
            <div className="text-[22px] font-bold mt-0.5">{p.price}</div>
            <div className="text-[12px] text-mute">{p.sub}</div>
          </Tap>
        ))}
      </div>
      <PrimaryButton onClick={onBuy}><span className="inline-flex items-center gap-2"><Sparkles size={18} /> Try 7 days free</span></PrimaryButton>
      <div className="text-center text-[12px] text-white/55 mt-3">This is a prototype — you won’t be charged</div>
    </BottomSheet>
  )
}


// ───────────── How "Available to spend" is calculated ─────────────
export function ExplainSheet({ open, onClose, fin }) {
  const rows = [
    { l: 'Money on your account', v: fin.cash, sign: '' },
    { l: 'Bills not paid yet', v: -fin.billsLeft, sign: '−', sub: 'Rent, utilities, taxes… set aside until you pay' },
    { l: 'Left in your budgets', v: -fin.envelopes, sign: '−', sub: 'Shopping, groceries… reserved for this month' },
  ]
  return (
    <BottomSheet open={open} onClose={onClose} title="Available to spend">
      <p className="text-[14px] text-white/75 leading-snug">This is money you can spend or save right now without touching your bills or monthly budgets.</p>
      <div className="mt-4 rounded-2xl bg-white/[0.04] divide-y divide-white/[0.06]">
        {rows.map((r) => (
          <div key={r.l} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <div className="text-[15px]">{r.l}</div>
              {r.sub && <div className="text-[12px] text-mute mt-0.5">{r.sub}</div>}
            </div>
            <div className="text-[15px] font-semibold tnum shrink-0">{r.sign}{money(Math.abs(r.v), 0)}</div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="text-[15px] font-bold">Available to spend</div>
          <div className={`text-[18px] font-extrabold tnum ${fin.available < 0 ? 'text-loss' : 'text-neon'}`}>{money(fin.available, 0)}</div>
        </div>
      </div>
      <div className="mt-3"><Note>Savings ({money(fin.saved, 0)}) and investments are not included — they’re yours, but set aside for goals.</Note></div>
      <PrimaryButton onClick={onClose}>Got it</PrimaryButton>
    </BottomSheet>
  )
}
