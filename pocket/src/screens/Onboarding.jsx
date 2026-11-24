import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Glyph } from '../../../src/components/ui'
import { Press, usd } from '../components/kit'

const BILL_PRESETS = [
  { key: 'rent', name: 'Rent', emoji: '🏠', sub: 'Due on the 1st' },
  { key: 'utils', name: 'Utilities', emoji: '💡', sub: 'Monthly' },
  { key: 'net', name: 'Internet & phone', emoji: '📶', sub: 'Monthly' },
  { key: 'subs', name: 'Subscriptions', emoji: '🎧', sub: 'Monthly' },
  { key: 'tax', name: 'Income tax', emoji: '🧾', sub: 'Monthly estimate' },
]
const CAT_PRESETS = [
  { key: 'groc', name: 'Groceries', emoji: '🥑' },
  { key: 'food', name: 'Restaurants', emoji: '🍜' },
  { key: 'shop', name: 'Shopping', emoji: '🛍️' },
  { key: 'taxi', name: 'Transport', emoji: '🚕' },
  { key: 'fun', name: 'Fun', emoji: '🎬' },
]
const num = (v) => parseFloat(v) || 0
const clean = (v) => v.replace(/[^\d.]/g, '')

function AmountRow({ item, value, onChange }) {
  return (
    <label className="flex items-center gap-3 py-2.5 border-b border-white/[0.07]">
      <Glyph e={item.emoji} size={40} round />
      <span className="flex-1 text-[16px]">{item.name}</span>
      <span className="flex items-center h-11 w-[124px] rounded-full bg-white/[0.08] px-3.5 focus-within:ring-2 focus-within:ring-white/40">
        <span className="text-white/45 mr-1">$</span>
        <input value={value} onChange={(e) => onChange(clean(e.target.value))} inputMode="decimal" placeholder="0" aria-label={`${item.name} per month`}
          className="w-full bg-transparent outline-none text-[16px] tnum text-right placeholder:text-white/25" />
      </span>
    </label>
  )
}

export default function Onboarding({ fin }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [cash, setCash] = useState('')
  const [bills, setBills] = useState({})
  const [cats, setCats] = useState({})

  const billList = BILL_PRESETS.filter((b) => num(bills[b.key]) > 0).map(({ name: n, emoji, sub, key }) => ({ name: n, emoji, sub, amount: num(bills[key]) }))
  const catList = CAT_PRESETS.filter((c) => num(cats[c.key]) > 0).map(({ name: n, emoji, key }) => ({ name: n, emoji, limit: num(cats[key]) }))
  const free = num(cash) - billList.reduce((t, b) => t + b.amount, 0) - catList.reduce((t, c) => t + c.limit, 0)

  const finish = () => fin.finishOnboarding({ name, cash: num(cash), bills: billList, cats: catList })

  const screens = [
    // 0 welcome
    <div key="w" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative h-[190px]">
          {['#1EA0F2', '#2FE7BE', '#FFE234'].map((c, i) => (
            <motion.div key={c} initial={{ y: 40, opacity: 0, rotate: -8 }} animate={{ y: i * 34, opacity: 1, rotate: -6 + i * 3 }} transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 200, damping: 18 }}
              className="pk-card absolute left-2 w-[230px] h-[120px] rounded-[22px] p-4 text-[#111113]" style={{ background: c, '--glow': c + '99' }}>
              <div className="relative z-10 flex justify-between text-[13px] font-medium"><span>{['Savings', 'Budget', 'Pocket'][i]}</span><span>•••• {['3413', '5123', '7642'][i]}</span></div>
            </motion.div>
          ))}
        </div>
        <h1 className="text-[40px] font-semibold tracking-tight leading-tight mt-16">Pocket</h1>
        <p className="text-[18px] text-white/65 mt-2">Know what you can spend, save for goals and grow your money.</p>
      </div>
      <Press onClick={() => setStep(1)} className="pk-pill-light h-14 rounded-full text-[17px] font-semibold">Start from scratch</Press>
      <Press onClick={() => fin.loadSample(name || 'Alexandra')} className="h-12 mt-2 rounded-full text-[15px] text-white/65">Try with sample data</Press>
    </div>,

    // 1 name
    <div key="n" className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-[30px] font-semibold tracking-tight leading-tight">What should we call you?</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" autoFocus
          className="mt-8 w-full h-14 rounded-2xl bg-white/[0.08] px-4 text-[20px] outline-none focus:ring-2 focus:ring-white/40 placeholder:text-white/30" />
      </div>
      <Press disabled={!name.trim()} onClick={() => setStep(2)} className="pk-pill-light h-14 rounded-full text-[17px] font-semibold disabled:opacity-30">Continue</Press>
    </div>,

    // 2 cash now
    <div key="c" className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-[30px] font-semibold tracking-tight leading-tight">How much money do you have right now?</h2>
        <p className="text-[15px] text-white/55 mt-2">On your cards and accounts, not counting savings or investments.</p>
        <div className="mt-8 flex items-center h-20 rounded-[24px] bg-white/[0.08] px-5 focus-within:ring-2 focus-within:ring-white/40">
          <span className="text-[36px] font-semibold text-white/40 mr-1">$</span>
          <input value={cash} onChange={(e) => setCash(clean(e.target.value))} inputMode="decimal" placeholder="0" aria-label="Money right now" autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[40px] font-semibold tnum placeholder:text-white/20" />
        </div>
      </div>
      <Press onClick={() => setStep(3)} className="pk-pill-light h-14 rounded-full text-[17px] font-semibold">Continue</Press>
    </div>,

    // 3 bills
    <div key="b" className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <h2 className="text-[30px] font-semibold tracking-tight leading-tight">Monthly bills</h2>
        <p className="text-[15px] text-white/55 mt-2">Leave empty what you don’t pay. This money will be set aside.</p>
        <div className="mt-4">{BILL_PRESETS.map((b) => <AmountRow key={b.key} item={b} value={bills[b.key] || ''} onChange={(v) => setBills({ ...bills, [b.key]: v })} />)}</div>
      </div>
      <Press onClick={() => setStep(4)} className="pk-pill-light h-14 mt-4 rounded-full text-[17px] font-semibold">Continue</Press>
    </div>,

    // 4 budgets
    <div key="g" className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <h2 className="text-[30px] font-semibold tracking-tight leading-tight">Spending budgets</h2>
        <p className="text-[15px] text-white/55 mt-2">How much do you want to spend per month? You can change it any time.</p>
        <div className="mt-4">{CAT_PRESETS.map((c) => <AmountRow key={c.key} item={c} value={cats[c.key] || ''} onChange={(v) => setCats({ ...cats, [c.key]: v })} />)}</div>
      </div>
      <Press onClick={() => setStep(5)} className="pk-pill-light h-14 mt-4 rounded-full text-[17px] font-semibold">Continue</Press>
    </div>,

    // 5 result
    <div key="r" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-[17px] text-white/65">{name.trim() || 'You'}, this month you can spend</div>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className={`text-[56px] font-semibold tracking-tight tnum mt-1 ${free < 0 ? 'text-[#FF6B62]' : ''}`}>{usd(free, 0)}</motion.div>
        <div className="mt-5 rounded-[22px] bg-white/[0.06]">
          {[['Money right now', usd(num(cash), 0)], ['Bills set aside', '−' + usd(billList.reduce((t, b) => t + b.amount, 0), 0)], ['Budgets set aside', '−' + usd(catList.reduce((t, c) => t + c.limit, 0), 0)]].map(([l, v], i) => (
            <div key={l} className={`flex justify-between px-4 py-3.5 text-[15px] ${i ? 'border-t border-white/[0.07]' : ''}`}><span className="text-white/65">{l}</span><b className="tnum">{v}</b></div>
          ))}
        </div>
        {free < 0 && <p className="text-[14px] text-[#FF6B62] mt-3">Your plans are bigger than your money — you can lower budgets later.</p>}
      </div>
      <Press onClick={finish} className="pk-pill-light h-14 rounded-full text-[17px] font-semibold">Start using Pocket</Press>
    </div>,
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="pk-home-bg absolute inset-0 z-[80] flex flex-col px-6 pt-[max(56px,calc(env(safe-area-inset-top)+12px))] pb-[max(24px,env(safe-area-inset-bottom))] sm:pb-[34px]">
      <div className="h-10 flex items-center justify-between">
        {step > 0 ? <button onClick={() => setStep(step - 1)} aria-label="Back" className="w-11 h-11 -ml-3 flex items-center justify-center"><ChevronLeft size={26} /></button> : <span />}
        {step > 0 && <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-5 bg-white' : 'w-2.5 bg-white/20'}`} />)}</div>}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="flex-1 min-h-0 pt-2">
          {screens[step]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
