import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ArrowLeft, Plus, PiggyBank, ListFilter, Search, X, TriangleAlert, Info } from 'lucide-react'
import { Glyph } from '../../../src/components/ui'
import { Money, Press, usd, signedUsd } from '../components/kit'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Income' },
  { id: 'out', label: 'Spending' },
]

function when(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const y = new Date(today); y.setDate(today.getDate() - 1)
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${t}`
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${t}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Home({ fin, openMoney, openSheet, setTab }) {
  const { s } = fin
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState(null) // null = search closed
  const hidden = s.hidden
  const short = fin.available < 0

  const topCats = s.cats.slice().sort((a, b) => b.spent - a.spent)
  const list = useMemo(() => s.activity.filter((a) =>
    (filter === 'all' || (filter === 'in' ? a.amount > 0 : a.amount < 0)) &&
    (!q || a.title.toLowerCase().includes(q.toLowerCase()))), [s.activity, filter, q])
  const alerts = short || fin.overBudget.length > 0

  return (
    <div className="pk-home-bg min-h-full flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-[max(54px,calc(env(safe-area-inset-top)+8px))]">
        <Press onClick={() => openSheet({ type: 'profile' })} aria-label="Profile"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFE234] via-[#2FE7BE] to-[#1EA0F2] p-[2px]">
          <span className="w-full h-full rounded-full bg-[#15171A] flex items-center justify-center text-[15px] font-semibold">{(s.name || 'P')[0].toUpperCase()}</span>
        </Press>
        <Press aria-label="Notifications" className="relative w-10 h-10 -mr-2 flex items-center justify-center text-white/85"
          onClick={() => (short ? openMoney({ mode: 'cover' }) : fin.overBudget.length ? setTab('budget') : fin.notify({ title: 'You’re all caught up', emoji: '✅' }))}>
          <Bell size={21} fill="currentColor" fillOpacity={0.9} />
          {alerts && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#FF453A]" />}
        </Press>
      </div>

      {/* balance + peeking goal cards */}
      <div className="relative px-5 pt-8">
        <button onClick={() => openSheet({ type: 'explain' })} className="flex items-center gap-1.5 text-[15px] text-white/65">
          Available to spend <Info size={14} className="opacity-70" />
        </button>
        <div className={`mt-1 ${short ? 'text-[#FF6B62]' : ''}`}><Money value={fin.available} hidden={hidden} size={40} /></div>
        <div className="flex gap-2 mt-4">
          <Press onClick={() => openMoney({ mode: 'spend' })} className="pk-pill-light h-10 pl-1.5 pr-4 rounded-full flex items-center gap-2 text-[15px] font-semibold">
            <span className="w-7 h-7 rounded-full bg-[#111113] text-pure flex items-center justify-center"><ArrowLeft size={15} strokeWidth={2.6} /></span>Spend
          </Press>
          <Press onClick={() => openMoney({ mode: 'income' })} className="pk-pill-dark h-10 px-4 rounded-full flex items-center gap-1.5 text-[15px] font-semibold"><Plus size={16} /> Income</Press>
          <Press onClick={() => openMoney({ mode: 'save' })} className="pk-pill-dark h-10 px-4 rounded-full flex items-center gap-1.5 text-[15px] font-semibold"><PiggyBank size={16} /> Save</Press>
        </div>

        {/* goal cards peeking from the right edge (tap → Goals) */}
        <button onClick={() => setTab('goals')} aria-label="Open goals" className="absolute right-0 top-[52px] h-[120px] w-[58px]">
          {(s.goals.length ? s.goals.slice(0, 3) : [{ color: 'transparent', id: 'x' }]).map((g, i, arr) => (
            <motion.span key={g.id} initial={{ x: 40 }} animate={{ x: 0 }} transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 24 }}
              className={`absolute top-0 h-full w-[60px] rounded-l-[16px] ${s.goals.length ? '' : 'border-2 border-dashed border-white/25'}`}
              style={{ right: -30 + (arr.length - 1 - i) * 9, background: g.color, boxShadow: '-6px 0 14px rgba(0,0,0,0.25)' }} />
          ))}
        </button>
      </div>

      {/* alert */}
      {(short || fin.overBudget.length > 0) && (
        <button onClick={() => (short ? openMoney({ mode: 'cover' }) : setTab('budget'))}
          className="mx-5 mt-5 rounded-[20px] bg-white/[0.07] px-4 py-3 flex items-center gap-3 text-left">
          <TriangleAlert size={19} className={short ? 'text-[#FF6B62]' : 'text-[#FFC53D]'} />
          <span className="flex-1 text-[14px] text-white/85">
            {short ? <><b>{usd(-fin.available, 0)} short.</b> Tap to cover it from savings</> : <><b>{fin.overBudget.map((c) => c.name).join(', ')}</b> over budget</>}
          </span>
        </button>
      )}

      {/* spending card */}
      <button onClick={() => setTab('budget')} className="mx-5 mt-4 mb-6 rounded-[22px] bg-white/[0.07] px-4 py-3.5 flex items-center justify-between text-left">
        <div>
          <div className="text-[14px] text-white/60">Spent this month</div>
          <div className="text-[18px] font-semibold tnum">{hidden ? '•••' : usd(fin.spentMonth, 0)}</div>
        </div>
        <div className="flex items-center">
          {topCats.slice(0, 3).map((c, i) => (
            <span key={c.id} className="rounded-full ring-2 ring-[#24282C] bg-[#24282C]" style={{ marginLeft: i ? -10 : 0, zIndex: 5 - i }}>
              <Glyph e={c.emoji} size={34} round />
            </span>
          ))}
          {topCats.length > 3 && <span className="ml-1 text-[12px] font-semibold text-white/70 bg-white/10 rounded-full px-2 py-0.5">+{topCats.length - 3}</span>}
          {topCats.length === 0 && <span className="text-[13px] text-white/50">Set up budgets →</span>}
        </div>
      </button>

      {/* activity sheet */}
      <div className="paper flex-1 rounded-t-[30px] pt-2 pb-[120px] min-h-[340px]">
        <div className="flex justify-center"><div className="w-9 h-[5px] rounded-full bg-black/10" /></div>
        <div className="flex items-center justify-between px-3 pt-1">
          <button aria-label="Filter" onClick={() => setFilter(FILTERS[(FILTERS.findIndex((f) => f.id === filter) + 1) % FILTERS.length].id)}
            className="w-11 h-11 flex items-center justify-center text-black/50"><ListFilter size={19} /></button>
          {q === null
            ? <div className="text-[17px] font-semibold">{filter === 'all' ? 'Activity' : FILTERS.find((f) => f.id === filter).label}</div>
            : <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity" aria-label="Search activity"
                className="flex-1 mx-1 h-10 rounded-full bg-black/[0.05] px-4 text-[16px] outline-none" />}
          <button aria-label={q === null ? 'Search' : 'Close search'} onClick={() => setQ(q === null ? '' : null)}
            className="w-11 h-11 flex items-center justify-center text-black/50">{q === null ? <Search size={19} /> : <X size={19} />}</button>
        </div>
        <div className="px-5">
          {list.length === 0 && (
            <div className="text-center py-10">
              <div className="text-[16px] font-semibold">{s.activity.length ? 'Nothing found' : 'No activity yet'}</div>
              <div className="text-[14px] text-mute mt-1">{s.activity.length ? 'Try another filter or search' : 'Add your income or first expense to start'}</div>
              {!s.activity.length && <Press onClick={() => openMoney({ mode: 'income' })} className="mt-4 h-11 px-5 rounded-full bg-[#111113] text-pure text-[15px] font-semibold">Add income</Press>}
            </div>
          )}
          {list.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3">
              <Glyph e={a.emoji} size={40} round />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate">{a.title}</div>
                <div className="text-[12px] text-mute truncate">{a.sub ? `${a.sub} · ` : ''}{a.time || when(a.ts)}</div>
              </div>
              <div className={`text-[15px] font-semibold tnum ${a.amount > 0 ? 'text-[#14A64C]' : ''}`}>{hidden ? '•••' : signedUsd(a.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
