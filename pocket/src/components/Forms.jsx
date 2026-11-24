import { useEffect, useState } from 'react'
import { ArrowLeftRight, ShoppingBag, Pencil, Trophy, RotateCcw, Trash2, Share, EyeOff, Database, ChevronRight } from 'lucide-react'
import { Glyph } from '../../../src/components/ui'
import { CATEGORY_EMOJIS, GOAL_EMOJIS } from '../../../src/data'
import { Sheet, Field, TextInput, AmountInput, IconPicker, PrimaryButton, DeleteButton, Chips, usd } from './kit'

const num = (v) => parseFloat(v) || 0
const BILL_ICONS = ['🏠', '💡', '📶', '🎧', '🏋️', '🧾', '🚗', '🩺', '🎓', '📱']

// ───────────── Bill (essential payment) ─────────────
export function BillSheet({ open, onClose, fin, id }) {
  const b = fin.s.bills.find((x) => x.id === id)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [sub, setSub] = useState('')
  const [amount, setAmount] = useState('')
  useEffect(() => { if (open) { setName(b?.name || ''); setEmoji(b?.emoji || '🏠'); setSub(b?.sub || ''); setAmount(b ? String(b.amount) : '') } }, [open, id]) // eslint-disable-line
  return (
    <Sheet open={open} onClose={onClose} title={b ? 'Edit bill' : 'New bill'}>
      <IconPicker list={BILL_ICONS} value={emoji} onChange={setEmoji} />
      <Field label="Name"><TextInput id="bill-name" value={name} onChange={setName} placeholder="e.g. Rent" /></Field>
      <Field label="Every month"><AmountInput id="bill-amount" value={amount} onChange={setAmount} /></Field>
      <Field label="When it’s due"><TextInput id="bill-due" value={sub} onChange={setSub} placeholder="e.g. Due on the 1st" /></Field>
      <p className="text-[13px] text-mute mt-3 px-1">Until it’s paid, this money is set aside and not counted as free to spend.</p>
      <PrimaryButton disabled={!name.trim() || !num(amount)} onClick={() => { fin.saveBill({ ...(b || {}), name: name.trim(), emoji, sub: sub.trim() || 'Monthly', amount: num(amount) }); onClose() }}>
        {b ? 'Save' : 'Add bill'}
      </PrimaryButton>
      {b && <DeleteButton onClick={() => { fin.deleteBill(b.id); onClose() }}>Delete bill</DeleteButton>}
    </Sheet>
  )
}

// ───────────── Spending category (monthly budget) ─────────────
export function CatSheet({ open, onClose, fin, id }) {
  const c = fin.s.cats.find((x) => x.id === id)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛍️')
  const [limit, setLimit] = useState('')
  const [del, setDel] = useState(false)
  const [moveTo, setMoveTo] = useState(null)
  useEffect(() => {
    if (!open) return
    setName(c?.name || ''); setEmoji(c?.emoji || '🛍️'); setLimit(c ? String(c.limit) : ''); setDel(false)
    setMoveTo(fin.s.cats.find((x) => x.id !== id)?.id || null)
  }, [open, id]) // eslint-disable-line
  const n = num(limit)
  const diff = Math.max(n - (c?.spent || 0), 0) - (c ? Math.max(c.limit - c.spent, 0) : 0)
  const others = fin.s.cats.filter((x) => x.id !== id)

  if (c && del) {
    return (
      <Sheet open={open} onClose={onClose} title={`Delete ${c.name}?`}>
        <p className="text-[15px] text-black/70">The unspent <b>{usd(Math.max(c.limit - c.spent, 0))}</b> becomes free to spend again.</p>
        {c.spent > 0 && (
          <>
            <Field label={`${usd(c.spent)} already spent — keep it under`}>
              <Chips value={moveTo} onChange={setMoveTo} items={[...others.map((x) => ({ id: x.id, label: x.name })), { id: null, label: 'Other' }]} />
            </Field>
          </>
        )}
        <PrimaryButton danger onClick={() => { fin.deleteCat(c.id, moveTo); onClose() }}>Delete category</PrimaryButton>
        <button onClick={() => setDel(false)} className="w-full h-12 mt-1 text-[15px] text-black/60">Cancel</button>
      </Sheet>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title={c ? c.name : 'New category'}>
      <IconPicker list={CATEGORY_EMOJIS} value={emoji} onChange={setEmoji} />
      <Field label="Name"><TextInput id="cat-name" value={name} onChange={setName} placeholder="e.g. Groceries" /></Field>
      <Field label={`Monthly budget${c ? ` · spent ${usd(c.spent, 0)}` : ''}`}><AmountInput id="cat-limit" value={limit} onChange={setLimit} /></Field>
      {n > 0 && diff !== 0 && (
        <p className={`text-[13px] mt-3 px-1 font-medium ${diff > 0 && fin.available - diff < 0 ? 'text-[#E5342B]' : 'text-black/55'}`}>
          {diff > 0 ? `${usd(diff)} will be set aside from your free money (${usd(fin.available)} → ${usd(fin.available - diff)})` : `${usd(-diff)} goes back to your free money`}
        </p>
      )}
      <PrimaryButton disabled={!name.trim() || !n} onClick={() => { fin.saveCat({ ...(c || {}), name: name.trim(), emoji, limit: n }); onClose() }}>
        {c ? 'Save' : 'Add category'}
      </PrimaryButton>
      {c && <DeleteButton onClick={() => setDel(true)}>Delete category</DeleteButton>}
    </Sheet>
  )
}

// ───────────── Goal: create / edit / delete ─────────────
export function GoalSheet({ open, onClose, fin, id }) {
  const g = fin.s.goals.find((x) => x.id === id)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✈️')
  const [target, setTarget] = useState('')
  const [monthly, setMonthly] = useState(0)
  const [del, setDel] = useState(false)
  const [moveTo, setMoveTo] = useState(null)
  useEffect(() => {
    if (!open) return
    setName(g?.name || ''); setEmoji(g?.emoji || '✈️'); setTarget(g ? String(g.target) : ''); setMonthly(g?.monthly || 0); setDel(false); setMoveTo(null)
  }, [open, id]) // eslint-disable-line
  const others = fin.s.goals.filter((x) => x.id !== id)

  if (g && del) {
    return (
      <Sheet open={open} onClose={onClose} title={`Delete ${g.name}?`}>
        <p className="text-[15px] text-black/70">This goal has <b>{usd(g.saved)}</b>. Where should the money go?</p>
        <Field label="Move money to">
          <Chips value={moveTo} onChange={setMoveTo} items={[{ id: null, label: 'Free money' }, ...others.map((x) => ({ id: x.id, label: x.name }))]} />
        </Field>
        <PrimaryButton danger onClick={() => { fin.deleteGoal(g.id, moveTo); onClose() }}>Delete and move {usd(g.saved)}</PrimaryButton>
        <button onClick={() => setDel(false)} className="w-full h-12 mt-1 text-[15px] text-black/60">Cancel</button>
      </Sheet>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title={g ? 'Edit goal' : 'New goal'}>
      <IconPicker list={GOAL_EMOJIS} value={emoji} onChange={setEmoji} />
      <Field label="Name"><TextInput id="goal-name" value={name} onChange={setName} placeholder="e.g. Trip to Japan" /></Field>
      <Field label="Target"><AmountInput id="goal-target" value={target} onChange={setTarget} /></Field>
      <Field label="Auto-save every month">
        <Chips value={monthly} onChange={setMonthly} items={[0, 50, 100, 200, 400].map((v) => ({ id: v, label: v ? `$${v}` : 'Off' }))} />
      </Field>
      <PrimaryButton disabled={!name.trim() || !num(target)} onClick={() => { fin.saveGoal({ ...(g || {}), name: name.trim(), emoji, target: num(target), monthly }); onClose() }}>
        {g ? 'Save' : 'Create goal'}
      </PrimaryButton>
      {g && <DeleteButton onClick={() => (g.saved > 0 ? setDel(true) : (fin.deleteGoal(g.id, null), onClose()))}>Delete goal</DeleteButton>}
    </Sheet>
  )
}

// ───────────── Goal menu (⋯ on a goal card) ─────────────
export function GoalMenu({ open, onClose, fin, id, openMoney, openGoal }) {
  const g = fin.s.goals.find((x) => x.id === id)
  if (!g) return <Sheet open={false} onClose={onClose} />
  const rows = [
    g.saved > 0 && fin.s.goals.length > 1 && { icon: ArrowLeftRight, label: 'Move to another goal', on: () => openMoney({ mode: 'move', from: g.id }) },
    g.saved > 0 && fin.s.cats.length > 0 && { icon: ShoppingBag, label: 'Spend from this goal', on: () => openMoney({ mode: 'spend', from: g.id }) },
    { icon: g.done ? RotateCcw : Trophy, label: g.done ? 'Reopen goal' : 'Mark as completed', on: () => { fin.setGoalDone(g.id, !g.done); fin.notify({ title: g.done ? 'Goal reopened' : `${g.name} completed`, emoji: '🏆' }); onClose() } },
    { icon: Pencil, label: 'Edit goal', on: () => openGoal(g.id) },
    { icon: Trash2, label: 'Delete goal', on: () => openGoal(g.id), danger: true },
  ].filter(Boolean)
  return (
    <Sheet open={open} onClose={onClose} title={g.name}>
      <div className="text-[14px] text-mute -mt-1 mb-2 tnum">{usd(g.saved)} of {usd(g.target, 0)}{g.done ? ' · completed' : ''}</div>
      <div className="rounded-2xl bg-black/[0.03]">
        {rows.map((r, i) => (
          <button key={r.label} onClick={r.on} className={`w-full flex items-center gap-3 px-4 h-14 text-left ${i ? 'border-t border-black/[0.06]' : ''} ${r.danger ? 'text-[#E5342B]' : ''}`}>
            <r.icon size={19} /> <span className="flex-1 text-[16px]">{r.label}</span> <ChevronRight size={17} className="opacity-30" />
          </button>
        ))}
      </div>
    </Sheet>
  )
}

// ───────────── Profile ─────────────
export function ProfileSheet({ open, onClose, fin }) {
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState(null) // 'reset' | 'sample'
  useEffect(() => { if (open) { setName(fin.s.name); setConfirm(null) } }, [open]) // eslint-disable-line
  const URL = 'https://oleksakysel-create.github.io/vault-app/pocket/'
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'Pocket', url: URL }); return } } catch (e) { if (e?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(URL); fin.notify({ title: 'Link copied', sub: URL }) } catch { fin.notify({ title: 'Share this link', sub: URL, emoji: '↗️' }) }
  }
  const Row = ({ icon: I, label, on, right, danger }) => (
    <button onClick={on} className={`w-full flex items-center gap-3 px-4 min-h-[56px] text-left border-t border-black/[0.06] first:border-0 ${danger ? 'text-[#E5342B]' : ''}`}>
      <I size={19} /> <span className="flex-1 text-[16px]">{label}</span> {right}
    </button>
  )
  return (
    <Sheet open={open} onClose={onClose} title="Profile">
      <Field label="Your name"><TextInput id="profile-name" value={name} onChange={setName} placeholder="Name" /></Field>
      {name.trim() && name.trim() !== fin.s.name && <PrimaryButton onClick={() => { fin.setName(name.trim()); fin.notify({ title: 'Name saved' }) }}>Save name</PrimaryButton>}
      <div className="rounded-2xl bg-black/[0.03] mt-5">
        <Row icon={EyeOff} label="Hide amounts" on={() => fin.setHidden(!fin.s.hidden)} right={<span className={`w-[51px] h-[31px] rounded-full relative transition-colors ${fin.s.hidden ? 'bg-[#18D52B]' : 'bg-black/15'}`}><span className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-all ${fin.s.hidden ? 'left-[22px]' : 'left-[2px]'}`} /></span>} />
        <Row icon={Share} label="Share Pocket" on={share} right={<ChevronRight size={17} className="opacity-30" />} />
      </div>
      <div className="text-[13px] text-mute mt-5 mb-2 px-1">Everything you enter is stored only on this device.</div>
      <div className="rounded-2xl bg-black/[0.03]">
        <Row icon={Database} label={confirm === 'sample' ? 'Tap again — replaces your data' : 'Load sample data'} on={() => (confirm === 'sample' ? (fin.loadSample(fin.s.name), onClose()) : setConfirm('sample'))} />
        <Row icon={Trash2} danger label={confirm === 'reset' ? 'Tap again to erase everything' : 'Erase all data'} on={() => (confirm === 'reset' ? (fin.reset(), onClose()) : setConfirm('reset'))} />
      </div>
    </Sheet>
  )
}

// ───────────── How "Available to spend" is calculated ─────────────
export function ExplainSheet({ open, onClose, fin }) {
  const rows = [
    ['Money on your account', usd(fin.s.cash, 0)],
    ['Bills not paid yet', '−' + usd(fin.billsLeft, 0)],
    ['Left in your budgets', '−' + usd(fin.envelopes, 0)],
  ]
  return (
    <Sheet open={open} onClose={onClose} title="Available to spend">
      <p className="text-[15px] text-black/70">Money you can spend or save right now without touching bills or monthly budgets.</p>
      <div className="rounded-2xl bg-black/[0.03] mt-4">
        {rows.map(([l, v], i) => (
          <div key={l} className={`flex justify-between px-4 py-3.5 text-[15px] ${i ? 'border-t border-black/[0.06]' : ''}`}><span className="text-black/70">{l}</span><b className="tnum">{v}</b></div>
        ))}
        <div className="flex justify-between px-4 py-3.5 border-t border-black/[0.06]"><span className="font-semibold">Available to spend</span><b className={`tnum text-[17px] ${fin.available < 0 ? 'text-[#E5342B]' : ''}`}>{usd(fin.available, 0)}</b></div>
      </div>
      <p className="text-[13px] text-mute mt-3 px-1">Savings ({usd(fin.saved, 0)}) and investments are yours too, but they’re set aside for goals.</p>
      <PrimaryButton onClick={onClose}>Got it</PrimaryButton>
    </Sheet>
  )
}

export { Glyph }
