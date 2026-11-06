import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShieldCheck, Wallet, PiggyBank, ChevronLeft } from 'lucide-react'
import { Glyph, money } from '../components/ui'

// First launch: 3 quick questions, then show what the user can spend.
export default function Onboarding({ fin, onDone }) {
  const [step, setStep] = useState(0)
  const salary = fin.incomes.find((x) => x.id === 'salary')?.amount || 0
  const [income, setIncome] = useState(String(salary))
  const [bills, setBills] = useState(fin.fixed.map((b) => b.id))

  const next = () => {
    if (step === 1) fin.setupIncome(parseFloat(income) || 0)
    if (step === 2) fin.keepBills(bills)
    setStep(step + 1)
  }

  const steps = [
    // 0 — welcome
    <div key="w" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-[20px] bg-violet flex items-center justify-center"><Wallet size={30} className="text-pure" /></div>
        <h1 className="text-[34px] font-extrabold tracking-tight leading-tight mt-6">Know exactly what you can spend</h1>
        <div className="mt-6 space-y-4">
          {[
            [Wallet, 'Available to spend', 'Your free money after bills and budgets'],
            [PiggyBank, 'Savings goals', 'Put money aside and see when you’ll get there'],
            [ShieldCheck, 'Investments made simple', 'Profit and taxes calculated for you'],
          ].map(([I, t, d]) => (
            <div key={t} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0"><I size={20} className="text-accent" /></div>
              <div><div className="text-[16px] font-semibold">{t}</div><div className="text-[14px] text-mute">{d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={next} className="h-14 rounded-2xl bg-violet text-pure text-[17px] font-bold">Get started</button>
      <button onClick={onDone} className="h-12 mt-1 text-[15px] text-mute">Explore with demo data</button>
    </div>,

    // 1 — income
    <div key="i" className="flex flex-col h-full">
      <div className="flex-1">
        <div className="text-[13px] text-mute font-semibold">STEP 1 OF 3</div>
        <h2 className="text-[28px] font-extrabold tracking-tight mt-1">How much is your monthly salary?</h2>
        <p className="text-[15px] text-mute mt-2">You can add freelance, gifts or family support later.</p>
        <div className="mt-8 flex items-center h-16 rounded-2xl bg-white/[0.06] border border-white/10 px-4 focus-within:border-violet">
          <span className="text-[28px] font-bold text-white/55 mr-1">$</span>
          <input value={income} onChange={(e) => setIncome(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" aria-label="Monthly salary"
            className="flex-1 bg-transparent outline-none text-[28px] font-bold tnum" />
        </div>
        <div className="flex gap-2 mt-3">
          {[2500, 4200, 6000].map((v) => (
            <button key={v} onClick={() => setIncome(String(v))} className="h-10 px-4 rounded-full bg-white/[0.06] text-[14px] font-semibold">{money(v, 0)}</button>
          ))}
        </div>
      </div>
      <button onClick={next} disabled={!parseFloat(income)} className="h-14 rounded-2xl bg-violet text-pure text-[17px] font-bold disabled:opacity-40">Continue</button>
    </div>,

    // 2 — essentials
    <div key="b" className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="text-[13px] text-mute font-semibold">STEP 2 OF 3</div>
        <h2 className="text-[28px] font-extrabold tracking-tight mt-1">Which payments do you have every month?</h2>
        <p className="text-[15px] text-mute mt-2">We’ll set this money aside so you never spend it by accident.</p>
        <div className="mt-5 rounded-[20px] bg-card border border-line overflow-hidden">
          {fin.fixed.map((b, i) => {
            const on = bills.includes(b.id)
            return (
              <button key={b.id} onClick={() => setBills(on ? bills.filter((x) => x !== b.id) : [...bills, b.id])} role="checkbox" aria-checked={on}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
                <Glyph e={b.emoji} size={38} />
                <div className="flex-1"><div className="text-[15px] font-medium">{b.name}</div><div className="text-[13px] text-mute tnum">{money(b.amount, 0)} a month</div></div>
                <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center ${on ? 'bg-violet border-violet' : 'border-white/30'}`}>{on && <Check size={15} strokeWidth={3} className="text-pure" />}</span>
              </button>
            )
          })}
        </div>
      </div>
      <button onClick={next} className="h-14 mt-4 rounded-2xl bg-violet text-pure text-[17px] font-bold">Continue</button>
    </div>,

    // 3 — result
    <div key="r" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center text-center items-center">
        <div className="text-[13px] text-mute font-semibold">STEP 3 OF 3</div>
        <div className="text-[17px] text-white/70 mt-3">This month you can spend</div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`text-[52px] font-extrabold tracking-tight tnum ${fin.available < 0 ? 'text-loss' : ''}`}>{money(fin.available, 0)}</motion.div>
        <div className="mt-4 w-full rounded-[20px] bg-card border border-line text-left divide-y divide-white/[0.08]">
          {[
            ['Money on your account', money(fin.cash, 0)],
            ['Bills set aside', '−' + money(fin.billsLeft, 0)],
            ['Monthly budgets left', '−' + money(fin.envelopes, 0)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between px-4 py-3 text-[15px]"><span className="text-white/70">{l}</span><b className="tnum">{v}</b></div>
          ))}
        </div>
        <p className="text-[14px] text-mute mt-4 max-w-[290px]">Spend or save it freely — your bills and budgets are already covered.</p>
      </div>
      <button onClick={onDone} className="h-14 rounded-2xl bg-violet text-pure text-[17px] font-bold">Start using Vault</button>
    </div>,
  ]

  return (
    <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 30 }}
      className="absolute inset-0 z-[75] bg-ink px-6 pt-[max(56px,calc(env(safe-area-inset-top)+12px))] pb-[max(24px,env(safe-area-inset-bottom))] sm:pb-[34px] flex flex-col">
      <div className="h-8 flex items-center justify-between mb-2">
        {step > 0 && step < 3 ? (
          <button onClick={() => setStep(step - 1)} aria-label="Back" className="w-11 h-11 -ml-3 flex items-center justify-center text-accent"><ChevronLeft size={26} /></button>
        ) : <span />}
        {step > 0 && (
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-6 bg-violet' : 'w-3 bg-white/15'}`} />)}
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="flex-1 min-h-0">
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
