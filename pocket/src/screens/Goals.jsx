import { motion } from 'framer-motion'
import { Plus, ArrowDownToLine, MoreHorizontal, Trophy } from 'lucide-react'
import { Glyph, haptic } from '../../../src/components/ui'
import { Press, usd } from '../components/kit'

function eta(g) {
  if (!g.monthly || g.saved >= g.target) return null
  const d = new Date()
  d.setMonth(d.getMonth() + Math.ceil((g.target - g.saved) / g.monthly))
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function GoalCard({ g, i, fin, openMoney, openSheet }) {
  const p = Math.min(g.saved / (g.target || 1), 1)
  const funded = p >= 1
  const when = eta(g)
  const btn = 'relative z-10 w-11 h-11 rounded-full bg-black/[0.16] flex items-center justify-center text-black/80 active:bg-black/25'
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 26 }}
      className={`pk-card rounded-[24px] p-4 text-[#111113] ${g.done ? 'opacity-70' : ''}`} style={{ background: g.color, '--glow': g.color + '99' }}>
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-full bg-black/[0.12] flex items-center justify-center shrink-0"><Glyph e={g.emoji} size={30} round color="#111113" /></span>
          <span className="text-[15px] font-medium truncate">{g.name}</span>
        </div>
        <span className="text-[13px] font-semibold tnum shrink-0 opacity-80">{Math.round(p * 100)}%</span>
      </div>
      <div className="relative z-10 mt-3 flex items-end justify-between">
        <div>
          <div className="text-[28px] font-semibold tracking-tight tnum leading-none">{fin.s.hidden ? '$•••' : usd(g.saved, 0)}</div>
          <div className="text-[13px] opacity-70 mt-1 tnum">
            of {usd(g.target, 0)}{g.done ? ' · completed' : funded ? ' · fully funded' : when ? ` · by ${when}` : ''}
          </div>
        </div>
      </div>
      <div className="relative z-10 h-1.5 rounded-full bg-black/[0.12] mt-3 overflow-hidden">
        <motion.div className="h-full rounded-full bg-[#111113]/70" initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }} />
      </div>
      <div className="relative z-10 mt-3 flex items-center gap-2">
        {!g.done && <button onClick={() => openMoney({ mode: 'save', target: g.id })} aria-label={`Add money to ${g.name}`} className={btn}><Plus size={19} strokeWidth={2.4} /></button>}
        {g.saved > 0 && <button onClick={() => openMoney({ mode: 'withdraw', target: g.id })} aria-label="Move to free money" className={btn}><ArrowDownToLine size={18} strokeWidth={2.2} /></button>}
        <button onClick={() => openSheet({ type: 'goalMenu', id: g.id })} aria-label="More" className={btn}><MoreHorizontal size={19} /></button>
        {funded && !g.done && (
          <button onClick={() => { fin.setGoalDone(g.id, true); fin.notify({ title: `${g.name} completed`, emoji: '🏆' }) }} className="relative z-10 h-11 px-3.5 rounded-full bg-[#111113] text-pure text-[13px] font-semibold flex items-center gap-1.5">
            <Trophy size={15} /> Complete
          </button>
        )}
        {/* auto-save toggle */}
        {!g.done && (
          <button onClick={() => { haptic(); fin.setGoalMonthly(g.id, g.monthly ? 0 : 200) }} role="switch" aria-checked={!!g.monthly}
            aria-label="Auto-save every month" className="relative z-10 ml-auto flex items-center gap-2 h-11">
            <span className="text-[12px] font-medium opacity-70">{g.monthly ? `$${g.monthly}/mo` : 'Auto-save'}</span>
            <span className={`w-[42px] h-[26px] rounded-full relative transition-colors ${g.monthly ? 'bg-[#111113]/80' : 'bg-black/[0.16]'}`}>
              <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all ${g.monthly ? 'left-[19px]' : 'left-[3px]'}`} />
            </span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function Goals({ fin, openMoney, openSheet }) {
  const { s } = fin
  const active = s.goals.filter((g) => !g.done)
  const done = s.goals.filter((g) => g.done)
  return (
    <div className="bg-[#0E0F11] min-h-full px-4 pb-[120px]">
      <div className="flex items-center justify-between px-1 pt-[max(58px,calc(env(safe-area-inset-top)+12px))]">
        <h1 className="text-[30px] font-semibold tracking-tight">Goals</h1>
        <Press onClick={() => openSheet({ type: 'goal' })} className="pk-pill-light h-9 px-4 rounded-full text-[14px] font-semibold">New goal</Press>
      </div>
      <p className="px-1 mt-1 text-[14px] text-white/55 tnum">{usd(fin.saved, 0)} saved · {usd(Math.max(fin.available, 0), 0)} free to save</p>

      <div className="mt-5 space-y-4">
        {s.goals.length === 0 && (
          <button onClick={() => openSheet({ type: 'goal' })} className="w-full rounded-[24px] border-2 border-dashed border-white/20 p-6 text-left">
            <div className="text-[17px] font-semibold">Create your first goal</div>
            <div className="text-[14px] text-white/55 mt-1">A trip, a laptop or a safety cushion. We’ll show when you’ll get there.</div>
          </button>
        )}
        {active.map((g, i) => <GoalCard key={g.id} g={g} i={i} fin={fin} openMoney={openMoney} openSheet={openSheet} />)}
        {done.length > 0 && <div className="text-[13px] text-white/50 font-medium px-1 pt-2">Completed</div>}
        {done.map((g, i) => <GoalCard key={g.id} g={g} i={i} fin={fin} openMoney={openMoney} openSheet={openSheet} />)}
      </div>
    </div>
  )
}
