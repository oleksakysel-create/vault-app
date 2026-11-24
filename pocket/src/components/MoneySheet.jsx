import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Delete, Check, X } from 'lucide-react'
import { Glyph, AssetBadge, haptic, fmt } from '../../../src/components/ui'
import { Sheet, SwipeConfirm, usd, spring } from './kit'

// ─── tiny calculator: "143×2+10" → 296 (× ÷ before + −) ───
const OPS = ['+', '−', '×', '÷']
export function evaluate(expr) {
  if (!expr) return 0
  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+−×÷])/g) || []
  if (OPS.includes(tokens[tokens.length - 1])) tokens.pop()
  const nums = []
  const ops = []
  tokens.forEach((t) => (OPS.includes(t) ? ops.push(t) : nums.push(parseFloat(t) || 0)))
  // first × and ÷
  const n2 = [nums[0] ?? 0]
  const o2 = []
  ops.forEach((op, i) => {
    const b = nums[i + 1] ?? 0
    if (op === '×') n2[n2.length - 1] *= b
    else if (op === '÷') n2[n2.length - 1] = b ? n2[n2.length - 1] / b : 0
    else { o2.push(op); n2.push(b) }
  })
  const r = o2.reduce((acc, op, i) => (op === '+' ? acc + n2[i + 1] : acc - n2[i + 1]), n2[0])
  return Math.round(r * 100) / 100
}

function Keypad({ expr, setExpr }) {
  const lastNum = expr.split(/[+−×÷]/).pop()
  const press = (k) => {
    haptic(5)
    if (k === '⌫') return setExpr(expr.slice(0, -1))
    if (OPS.includes(k)) {
      if (!expr) return
      return setExpr(OPS.includes(expr.slice(-1)) ? expr.slice(0, -1) + k : expr + k)
    }
    if (k === '.' && lastNum.includes('.')) return
    if (lastNum.includes('.') && lastNum.split('.')[1].length >= 2) return
    if (lastNum.replace('.', '').length >= 7) return
    if (lastNum === '0' && k !== '.') return setExpr(expr.slice(0, -1) + k)
    setExpr(expr + (k === '.' && !lastNum ? '0.' : k))
  }
  return (
    <div data-nodrag>
      <div className="grid grid-cols-4 mb-2">
        {OPS.map((o) => (
          <motion.button key={o} whileTap={{ scale: 0.85 }} onClick={() => press(o)} aria-label={o}
            className="h-11 text-[26px] font-light text-black/70">{o === '−' ? '–' : o}</motion.button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.94, backgroundColor: '#7a7a80', color: '#fff' }} transition={{ duration: 0.08 }}
            onClick={() => press(k)} aria-label={k === '⌫' ? 'Delete' : k}
            className={`h-[54px] rounded-[18px] text-[24px] font-medium flex items-center justify-center ${k === '.' || k === '⌫' ? 'text-black/60' : 'pk-key text-[#111113]'}`}>
            {k === '⌫' ? <Delete size={22} /> : k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// list shown when the target line is tapped
function Picker({ items, value, onPick, onClose }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="absolute inset-0 z-20 bg-white rounded-t-[32px] px-5 pt-5 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[19px] font-semibold">Choose</div>
        <button onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center"><X size={20} /></button>
      </div>
      {items.length === 0 && <div className="text-[15px] text-mute py-6 text-center">Nothing here yet</div>}
      {items.map((it) => (
        <button key={it.id} onClick={() => onPick(it.id)} className="w-full flex items-center gap-3 py-3 border-b border-black/[0.06] text-left">
          {it.asset ? <AssetBadge a={it.asset} size={40} /> : <Glyph e={it.emoji} size={40} round />}
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-medium truncate">{it.name}</div>
            {it.sub && <div className="text-[13px] text-mute tnum">{it.sub}</div>}
          </div>
          {it.id === value && <Check size={20} />}
        </button>
      ))}
    </motion.div>
  )
}

const TITLES = { spend: 'Spend', income: 'Income', save: 'Save', withdraw: 'To free money', move: 'Move', buy: 'Buy', sell: 'Sell', cover: 'Cover' }

/**
 * init = { mode, target, from } — mode: spend | income | save | withdraw | move | buy | sell | cover
 */
export default function MoneySheet({ open, onClose, fin, init, onSuccess }) {
  const [mode, setMode] = useState('spend')
  const [target, setTarget] = useState(null)
  const [from, setFrom] = useState(null) // spend: goal id when paying from savings; move: source goal
  const [expr, setExpr] = useState('')
  const [picking, setPicking] = useState(null) // 'target' | 'from'

  useEffect(() => {
    if (!open) return
    setMode(init?.mode || 'spend')
    setTarget(init?.target ?? null)
    setFrom(init?.from ?? null)
    setExpr('')
    setPicking(null)
  }, [open]) // eslint-disable-line

  const { s, assets } = fin
  const goalsWithMoney = s.goals.filter((g) => g.saved > 0)

  // default target per mode
  useEffect(() => {
    if (!open) return
    const ok = {
      spend: s.cats.some((c) => c.id === target),
      income: s.incomes.some((x) => x.id === target),
      save: s.goals.some((g) => g.id === target),
      withdraw: s.goals.some((g) => g.id === target),
      cover: s.goals.some((g) => g.id === target),
      move: s.goals.some((g) => g.id === target),
      buy: !!assets[target],
      sell: s.holdings.some((h) => h.ticker === target),
    }[mode]
    if (ok) return
    const first = {
      spend: s.cats[0]?.id,
      income: 'salary',
      save: s.goals.find((g) => !g.done)?.id,
      withdraw: goalsWithMoney[0]?.id,
      cover: goalsWithMoney.slice().sort((a, b) => b.saved - a.saved)[0]?.id,
      move: s.goals.find((g) => g.id !== from)?.id,
      buy: 'VOO',
      sell: s.holdings[0]?.ticker,
    }[mode]
    setTarget(first ?? null)
  }, [open, mode]) // eslint-disable-line

  const value = useMemo(() => evaluate(expr), [expr])
  const hasOp = /[+−×÷]/.test(expr)

  // ─── context for the current mode ───
  const cat = s.cats.find((c) => c.id === target)
  const goal = s.goals.find((g) => g.id === target)
  const src = s.incomes.find((x) => x.id === target)
  const asset = assets[target]
  const holding = s.holdings.find((h) => h.ticker === target)
  const payGoal = s.goals.find((g) => g.id === from)

  let targetLine = 'Choose'
  let targetItems = []
  let availLabel = ''
  let note = null
  let blocked = !value
  let swipeText = 'Swipe right to confirm'

  const A = fin.available
  if (mode === 'spend') {
    targetItems = s.cats.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name, sub: `${usd(Math.max(c.limit - c.spent, 0), 0)} left of ${usd(c.limit, 0)}` }))
    if (cat) targetLine = `${cat.name} · ${usd(Math.max(cat.limit - cat.spent, 0), 0)} left`
    const left = cat ? Math.max(cat.limit - cat.spent, 0) : 0
    if (payGoal) {
      availLabel = `In ${payGoal.name}  ${usd(payGoal.saved)}`
      if (value > payGoal.saved) { note = { tone: 'bad', text: `${payGoal.name} only has ${usd(payGoal.saved)}` }; blocked = true }
      else if (value) note = { tone: 'info', text: 'Paid from savings — your free money stays the same' }
    } else {
      availLabel = `Available  ${usd(A)}`
      const over = Math.max(value - left, 0)
      if (value && over > 0 && A - over < 0) note = { tone: 'bad', text: `Not enough free money — ${usd(-(A - over))} short`, action: goalsWithMoney.length ? 'Pay from savings' : null }
      else if (value && over > 0) note = { tone: 'warn', text: `${usd(over)} over the ${cat?.name} budget — taken from free money` }
      else if (value) note = { tone: 'good', text: `${usd(left - value)} left in ${cat?.name}` }
    }
    if (!cat) blocked = true
    swipeText = 'Swipe right to spend'
  } else if (mode === 'income') {
    targetItems = s.incomes.map((x) => ({ id: x.id, emoji: x.emoji, name: x.name, sub: x.amount ? `${usd(x.amount, 0)} this month` : null }))
    if (src) targetLine = src.name
    availLabel = `Available  ${usd(A)}`
    if (value) note = { tone: 'good', text: `Available to spend becomes ${usd(A + value)}` }
    swipeText = 'Swipe right to add'
  } else if (mode === 'save') {
    targetItems = s.goals.filter((g) => !g.done).map((g) => ({ id: g.id, emoji: g.emoji, name: g.name, sub: `${usd(g.saved, 0)} of ${usd(g.target, 0)}` }))
    if (goal) targetLine = `${goal.name} · ${usd(goal.saved, 0)} of ${usd(goal.target, 0)}`
    availLabel = `Available  ${usd(A)}`
    if (value > A) { note = { tone: 'bad', text: `Only ${usd(Math.max(A, 0))} is free — bills and budgets are set aside` }; blocked = true }
    if (!goal) blocked = true
    swipeText = 'Swipe right to save'
  } else if (mode === 'withdraw' || mode === 'cover') {
    targetItems = goalsWithMoney.map((g) => ({ id: g.id, emoji: g.emoji, name: g.name, sub: usd(g.saved) }))
    if (goal) targetLine = `From ${goal.name}`
    availLabel = goal ? `In this goal  ${usd(goal.saved)}` : ''
    if (mode === 'cover' && A < 0 && !value) note = { tone: 'bad', text: `You’re ${usd(-A)} short this month` }
    if (goal && value > goal.saved) { note = { tone: 'bad', text: `Only ${usd(goal.saved)} in ${goal.name}` }; blocked = true }
    else if (value) note = { tone: 'good', text: `Available to spend becomes ${usd(A + value)}` }
    if (!goal) blocked = true
    swipeText = 'Swipe right to move'
  } else if (mode === 'move') {
    targetItems = s.goals.filter((g) => g.id !== from).map((g) => ({ id: g.id, emoji: g.emoji, name: g.name, sub: usd(g.saved, 0) }))
    if (goal) targetLine = `${payGoal?.name} → ${goal.name}`
    availLabel = payGoal ? `In ${payGoal.name}  ${usd(payGoal.saved)}` : ''
    if (payGoal && value > payGoal.saved) { note = { tone: 'bad', text: `Only ${usd(payGoal.saved)} in ${payGoal.name}` }; blocked = true }
    if (!goal || !payGoal) blocked = true
    swipeText = 'Swipe right to move'
  } else if (mode === 'buy') {
    targetItems = Object.values(assets).map((a) => ({ id: a.ticker, asset: a, name: a.name, sub: `${a.ticker} · ${usd(a.price)}` }))
    if (asset) targetLine = `${asset.name} · ${usd(asset.price)}`
    availLabel = `Available  ${usd(A)}`
    if (value > A) { note = { tone: 'bad', text: `Only ${usd(Math.max(A, 0))} is free to invest` }; blocked = true }
    else if (value && asset) note = { tone: 'info', text: `≈ ${fmt(value / asset.price, asset.price > 1000 ? 6 : 4)} ${asset.ticker}` }
    swipeText = 'Swipe right to buy'
  } else if (mode === 'sell') {
    targetItems = s.holdings.map((h) => ({ id: h.ticker, asset: assets[h.ticker], name: assets[h.ticker].name, sub: usd(h.qty * assets[h.ticker].price) }))
    const own = holding && asset ? holding.qty * asset.price : 0
    if (asset) targetLine = `${asset.name} · you own ${usd(own, 0)}`
    availLabel = `You own  ${usd(own)}`
    if (value > own + 0.001) { note = { tone: 'bad', text: `You only own ${usd(own)}` }; blocked = true }
    else if (value && holding) {
      const gain = (asset.price - holding.avg) * (value / asset.price)
      const tax = Math.max(fin.taxOnProfit(s.realized + gain) - fin.taxOnProfit(s.realized), 0)
      note = gain >= 0
        ? { tone: 'info', text: `Profit ${usd(gain)} · tax ${Math.round(fin.bracketRate(Math.max(s.realized + gain, 0)) * 100)}% withheld ${usd(tax)} · you get ${usd(value - tax)}` }
        : { tone: 'good', text: `Loss ${usd(-gain)} — no tax on this sale` }
    }
    if (!holding) blocked = true
    swipeText = 'Swipe right to sell'
  }

  const fromItems = goalsWithMoney.map((g) => ({ id: g.id, emoji: g.emoji, name: g.name, sub: usd(g.saved) }))
  const tabs = ['spend', 'income', 'save'].includes(mode) ? ['spend', 'income', 'save'] : ['buy', 'sell'].includes(mode) ? ['buy', 'sell'] : [mode]
  const counterparty = cat || src || goal
  const toneColor = { good: 'text-[#14A64C]', warn: 'text-[#C27803]', bad: 'text-[#E5342B]', info: 'text-black/55' }

  const confirm = () => {
    let text = ''
    if (mode === 'spend') text = fin.addExpense(target, value, payGoal?.id)
    if (mode === 'income') text = fin.addIncome(target, value)
    if (mode === 'save') text = fin.toGoal(target, value)
    if (mode === 'withdraw' || mode === 'cover') text = fin.withdrawGoal(target, value)
    if (mode === 'move') text = fin.moveGoal(from, target, value)
    if (mode === 'buy' || mode === 'sell') text = fin.trade(target, mode, value)
    onClose()
    onSuccess({ amount: value, text })
  }

  return (
    <Sheet open={open} onClose={onClose} full>
      <div className="relative flex flex-col h-full">
        {/* tabs (Send / Request in the reference) */}
        <div className="flex justify-center gap-1 pt-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => { haptic(); setMode(t); setFrom(null) }}
              className={`h-9 px-4 rounded-full text-[15px] font-semibold ${mode === t ? 'bg-black/[0.06] text-[#111113]' : 'text-black/40'}`}>{TITLES[t]}</button>
          ))}
        </div>
        <button onClick={() => setPicking('target')} className="mx-auto mt-1 min-h-[36px] px-3 flex items-center gap-1 text-[13px] text-black/55 font-medium max-w-full">
          <span className="truncate">{targetLine}</span><ChevronDown size={14} className="shrink-0" />
        </button>
        {mode === 'spend' && (
          <button onClick={() => (payGoal ? setFrom(null) : fromItems.length && setPicking('from'))}
            className="mx-auto -mt-1 min-h-[32px] px-3 rounded-full text-[12px] font-semibold text-black/50">
            {payGoal ? `Paying from ${payGoal.name} · use free money` : fromItems.length ? 'Pay from free money · switch to savings' : 'Paying from free money'}
          </button>
        )}

        {/* amount */}
        <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center relative">
          <div className="flex items-center gap-3 max-w-full">
            <motion.div key={expr ? 'v' : 'e'} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
              className={`text-[52px] font-bold tracking-tight tnum leading-none truncate ${expr ? 'text-[#111113]' : 'text-black/15'}`}>
              {expr ? `$${expr.replace(/([+−×÷])/g, ' $1 ')}` : '$0.00'}
            </motion.div>
            {counterparty && !hasOp && expr && <Glyph e={counterparty.emoji} size={32} round />}
            {asset && !hasOp && expr && <AssetBadge a={asset} size={32} />}
          </div>
          <AnimatePresence>
            {hasOp && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 px-3 py-1 rounded-full bg-black/[0.05] text-[15px] font-semibold text-black/60 tnum">= {fmt(value)}</motion.div>
            )}
          </AnimatePresence>
          <div className="mt-2.5 text-[13px] text-black/40 tnum">{availLabel}</div>
          {note && (
            <div className={`mt-2 text-[13px] font-medium text-center px-2 ${toneColor[note.tone]}`}>
              {note.text}
              {note.action && <button onClick={() => setPicking('from')} className="ml-1 underline underline-offset-2 text-[#111113]">{note.action}</button>}
            </div>
          )}
        </div>

        {/* confirm */}
        <div className="h-14 flex items-center">
          {value > 0 ? <SwipeConfirm key={mode + target + from} label={swipeText} disabled={blocked} onConfirm={confirm} /> : <div className="w-full text-center text-[13px] text-black/30">Enter an amount</div>}
        </div>

        <div className="mt-2"><Keypad expr={expr} setExpr={setExpr} /></div>

        <AnimatePresence>
          {picking && (
            <Picker
              items={picking === 'from' ? fromItems : targetItems}
              value={picking === 'from' ? from : target}
              onClose={() => setPicking(null)}
              onPick={(id) => { picking === 'from' ? setFrom(id) : setTarget(id); setPicking(null) }}
            />
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

export { spring }
