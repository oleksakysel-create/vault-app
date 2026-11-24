import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, ChevronRight, Receipt } from 'lucide-react'
import { Glyph, haptic } from '../../../src/components/ui'
import { Press, Chips, usd } from '../components/kit'

export default function Budget({ fin, openMoney, openSheet, setTab }) {
  const { s } = fin
  const [tab, setTabInner] = useState('bills')
  const billsTotal = s.bills.reduce((t, b) => t + b.amount, 0)
  const billsPaid = s.bills.filter((b) => b.paid).reduce((t, b) => t + b.amount, 0)

  return (
    <div className="bg-[#0E0F11] min-h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-[max(58px,calc(env(safe-area-inset-top)+12px))]">
        <h1 className="text-[30px] font-semibold tracking-tight">Budget</h1>
        <Press onClick={() => openSheet({ type: 'cat' })} className="pk-pill-light h-9 px-4 rounded-full text-[14px] font-semibold">Add</Press>
      </div>
      <p className="px-5 mt-1 text-[14px] text-white/55">Tap a category to log spending</p>

      {/* categories as round avatars */}
      <div className="grid grid-cols-3 gap-y-5 px-3 pt-5 pb-7">
        {s.cats.map((c, i) => {
          const left = c.limit - c.spent
          return (
            <motion.button key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              onClick={() => openMoney({ mode: 'spend', target: c.id })} className="flex flex-col items-center gap-1.5">
              <span className="relative">
                <Glyph e={c.emoji} size={64} round color={left < 0 ? '#FF453A' : c.color} />
                <svg className="absolute inset-0 -rotate-90" width="64" height="64" aria-hidden>
                  <circle cx="32" cy="32" r="30.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle cx="32" cy="32" r="30.5" fill="none" stroke={left < 0 ? '#FF453A' : c.color} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${Math.min(c.spent / (c.limit || 1), 1) * 191.6} 191.6`} />
                </svg>
              </span>
              <span className="text-[15px] font-medium leading-tight mt-1 max-w-[100px] truncate">{c.name}</span>
              <span className={`text-[12px] tnum ${left < 0 ? 'text-[#FF6B62]' : 'text-white/50'}`}>{left < 0 ? `${usd(-left, 0)} over` : `${usd(left, 0)} left`}</span>
            </motion.button>
          )
        })}
        <button onClick={() => openSheet({ type: 'cat' })} className="flex flex-col items-center gap-1.5">
          <span className="w-16 h-16 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center text-white/60"><Plus size={24} /></span>
          <span className="text-[15px] font-medium mt-1 text-white/70">New</span>
          <span className="text-[12px] text-white/40">category</span>
        </button>
      </div>

      {/* white sheet */}
      <div className="paper flex-1 rounded-t-[30px] pt-2 pb-[120px]">
        <div className="flex justify-center"><div className="w-9 h-[5px] rounded-full bg-black/10" /></div>
        <div className="px-5 pt-3">
          <button onClick={() => openSheet({ type: 'explain' })} className="w-full rounded-[20px] bg-black/[0.04] p-4 text-left">
            <div className="text-[13px] text-mute">Available to spend</div>
            <div className={`text-[26px] font-semibold tnum tracking-tight ${fin.available < 0 ? 'text-[#E5342B]' : ''}`}>{usd(fin.available, 0)}</div>
            <div className="text-[13px] text-black/55 mt-0.5 tnum">after {usd(fin.billsLeft, 0)} bills and {usd(fin.envelopes, 0)} budgets set aside</div>
          </button>

          <div className="mt-4">
            <Chips value={tab} onChange={setTabInner} items={[{ id: 'bills', label: 'Bills' }, { id: 'budgets', label: 'Budgets' }, { id: 'income', label: 'Income' }]} />
          </div>

          {tab === 'bills' && (
            <div className="mt-2">
              <div className="flex justify-between text-[13px] text-mute py-2 tnum">
                <span>{s.bills.filter((b) => b.paid).length} of {s.bills.length} paid</span>
                <span>{usd(billsPaid, 0)} of {usd(billsTotal, 0)}</span>
              </div>
              {s.bills.length === 0 && <p className="text-[14px] text-mute py-4">Add rent, utilities, subscriptions or taxes. Their money is set aside every month.</p>}
              {s.bills.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-black/[0.06]">
                  <button onClick={() => { haptic(12); fin.toggleBill(b.id) }} aria-label={b.paid ? `Mark ${b.name} unpaid` : `Mark ${b.name} paid`}
                    className="w-11 h-11 -ml-2 flex items-center justify-center shrink-0">
                    <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-colors ${b.paid ? 'bg-[#18D52B] border-[#18D52B]' : 'border-black/25'}`}>
                      {b.paid && <Check size={15} strokeWidth={3.5} className="text-white" />}
                    </span>
                  </button>
                  <button onClick={() => openSheet({ type: 'bill', id: b.id })} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <Glyph e={b.emoji} size={38} round />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[15px] font-medium truncate ${b.paid ? 'line-through text-black/40' : ''}`}>{b.name}</span>
                      <span className="block text-[12px] text-mute truncate">{b.paid ? 'Paid this month' : b.sub}</span>
                    </span>
                    <span className={`text-[15px] font-semibold tnum ${b.paid ? 'text-black/40' : ''}`}>{usd(b.amount, 0)}</span>
                  </button>
                </div>
              ))}
              <button onClick={() => setTab('invest')} className="w-full flex items-center gap-3 py-3 text-left">
                <span className="w-11 -ml-2 flex justify-center"><Receipt size={19} className="text-black/45" /></span>
                <span className="flex-1"><span className="block text-[15px] font-medium">Investment tax</span><span className="block text-[12px] text-mute">Withheld automatically when you sell</span></span>
                <span className="text-[15px] font-semibold tnum text-black/55">{usd(s.taxWithheld, 0)}</span>
              </button>
              <Press onClick={() => openSheet({ type: 'bill' })} className="w-full h-12 mt-2 rounded-full bg-black/[0.05] text-[15px] font-semibold flex items-center justify-center gap-1.5"><Plus size={17} /> Add bill</Press>
            </div>
          )}

          {tab === 'budgets' && (
            <div className="mt-2">
              {s.cats.length === 0 && <p className="text-[14px] text-mute py-4">Create categories like Groceries or Restaurants with a monthly budget.</p>}
              {s.cats.map((c) => {
                const over = c.spent > c.limit
                return (
                  <button key={c.id} onClick={() => openSheet({ type: 'cat', id: c.id })} className="w-full flex items-center gap-3 py-3 border-b border-black/[0.06] text-left">
                    <Glyph e={c.emoji} size={38} round color={over ? '#E5342B' : c.color} />
                    <span className="flex-1 min-w-0">
                      <span className="flex justify-between text-[15px]"><span className="font-medium truncate">{c.name}</span><span className="tnum"><b className={over ? 'text-[#E5342B]' : ''}>{usd(c.spent, 0)}</b><span className="text-mute"> / {usd(c.limit, 0)}</span></span></span>
                      <span className="block h-1.5 rounded-full bg-black/[0.07] mt-2 overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(c.spent / (c.limit || 1), 1) * 100}%`, background: over ? '#E5342B' : c.color }} />
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-black/25" />
                  </button>
                )
              })}
              <Press onClick={() => openSheet({ type: 'cat' })} className="w-full h-12 mt-3 rounded-full bg-black/[0.05] text-[15px] font-semibold flex items-center justify-center gap-1.5"><Plus size={17} /> Add category</Press>
            </div>
          )}

          {tab === 'income' && (
            <div className="mt-2">
              <div className="flex justify-between text-[13px] text-mute py-2"><span>This month</span><b className="text-[#111113] tnum">{usd(fin.incomeMonth, 0)}</b></div>
              {s.incomes.map((x) => (
                <button key={x.id} onClick={() => openMoney({ mode: 'income', target: x.id })} className="w-full flex items-center gap-3 py-3 border-b border-black/[0.06] text-left">
                  <Glyph e={x.emoji} size={38} round />
                  <span className="flex-1 text-[15px] font-medium">{x.name}</span>
                  <span className={`text-[15px] font-semibold tnum ${x.amount ? '' : 'text-black/30'}`}>{usd(x.amount, 0)}</span>
                  <Plus size={17} className="text-black/35" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
