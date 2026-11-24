import { useEffect, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { Check, ChevronRight, LayoutGrid, Home, CreditCard, TrendingUp, Trash2 } from 'lucide-react'
import { Glyph, haptic, fmt } from '../../../src/components/ui'

export const spring = { type: 'spring', stiffness: 420, damping: 36 }
export const usd = (n, d = 2) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n), d)}`
export const signedUsd = (n, d = 2) => `${n >= 0 ? '+' : '−'}$${fmt(Math.abs(n), d)}`

// "$ 7,854 .43" — big whole part, small grey cents
export function Money({ value, hidden, size = 44, className = '' }) {
  if (hidden) return <span className={`font-semibold tracking-tight ${className}`} style={{ fontSize: size }}>$ •••••</span>
  const [i, c] = fmt(Math.abs(value)).split('.')
  return (
    <span className={`font-semibold tracking-tight tnum whitespace-nowrap ${className}`} style={{ fontSize: size, lineHeight: 1.05 }}>
      {value < 0 ? '−' : ''}$ {i}<span className="opacity-45" style={{ fontSize: size * 0.5 }}> .{c}</span>
    </span>
  )
}

export function Press({ children, className = '', onClick, ...rest }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} transition={spring} onClick={(e) => { haptic(); onClick?.(e) }} className={className} {...rest}>
      {children}
    </motion.button>
  )
}

// White bottom sheet with a drag handle
export function Sheet({ open, onClose, children, title, right, full }) {
  const y = useMotionValue(0)
  const controls = useDragControls()
  const fade = useTransform(y, [0, 400], [1, 0])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" className="absolute inset-0 z-40 bg-black/55" style={{ opacity: fade }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div key="sh" role="dialog" aria-label={title}
            className={`paper absolute inset-x-0 bottom-0 z-50 rounded-t-[32px] flex flex-col shadow-[0_-24px_60px_rgba(0,0,0,0.35)] ${full ? 'top-[max(44px,calc(env(safe-area-inset-top)+4px))]' : 'max-h-[92%]'}`}
            style={{ y }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.04, bottom: 0.8 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose() }}>
            <div className="touch-none cursor-grab shrink-0" onPointerDown={(e) => controls.start(e)}>
              <div className="pt-2.5 flex justify-center"><div className="w-9 h-[5px] rounded-full bg-black/15" /></div>
              {(title || right) && (
                <div className="flex items-center justify-between px-5 pt-3 pb-2 min-h-[44px]">
                  <div className="text-[19px] font-semibold">{title}</div>
                  {right}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Small knob with "Swipe right to confirm" (as in the reference)
export function SwipeConfirm({ label = 'Swipe right to confirm', onConfirm, disabled }) {
  const track = useRef(null)
  const x = useMotionValue(0)
  const [w, setW] = useState(300)
  const [done, setDone] = useState(false)
  const K = 48
  const max = w - K
  useEffect(() => { if (track.current) setW(track.current.offsetWidth) }, [])
  const textOpacity = useTransform(x, [0, max * 0.5], [1, 0])
  const fill = useTransform(x, (v) => v + K)
  return (
    <div ref={track} className={`relative w-full h-12 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <motion.div className="absolute left-0 top-0 bottom-0 rounded-full bg-black/[0.05]" style={{ width: fill }} />
      <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center text-[14px] text-black/45 font-medium pointer-events-none">{label}</motion.div>
      <motion.div
        drag={done ? false : 'x'} dragConstraints={{ left: 0, right: max }} dragElastic={0.02} dragMomentum={false}
        role="slider" aria-label={label} style={{ x }}
        onDragEnd={() => {
          if (x.get() > max * 0.8) { animate(x, max, { duration: 0.15 }); setDone(true); haptic([10, 40, 20]); setTimeout(() => onConfirm?.(), 200) }
          else animate(x, 0, spring)
        }}
        className="absolute top-0 left-0 w-12 h-12 rounded-full bg-[#111113] text-pure flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_6px_16px_rgba(0,0,0,0.25)]">
        {done ? <Check size={20} strokeWidth={3} /> : <ChevronRight size={22} strokeWidth={2.6} />}
      </motion.div>
    </div>
  )
}

// Full-screen green confirmation
export function Success({ data, onClose }) {
  return (
    <AnimatePresence>
      {data && (
        <motion.button key="ok" onClick={onClose} aria-label="Close"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-[90] bg-[#18D52B] text-pure flex flex-col items-center justify-center">
          <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.05 }}>
            <Check size={64} strokeWidth={3} />
          </motion.div>
          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-[40px] font-semibold tnum mt-3">{usd(data.amount)}</motion.div>
          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }} className="text-[17px] font-medium mt-1 px-8 text-center">{data.text}</motion.div>
          <div className="absolute bottom-[max(40px,calc(env(safe-area-inset-bottom)+16px))] text-[13px] opacity-75">Tap anywhere to close</div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

const NAV = [
  { id: 'budget', icon: LayoutGrid, label: 'Budget' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'goals', icon: CreditCard, label: 'Goals' },
  { id: 'invest', icon: TrendingUp, label: 'Invest' },
]
export function NavBar({ tab, setTab }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(16px,env(safe-area-inset-bottom))] sm:pb-[28px] pointer-events-none">
      <nav className="pk-nav pointer-events-auto rounded-full p-1.5 flex gap-1" aria-label="Main">
        {NAV.map((n) => {
          const active = tab === n.id
          return (
            <motion.button key={n.id} whileTap={{ scale: 0.9 }} onClick={() => { haptic(); setTab(n.id) }}
              aria-label={n.label} aria-current={active ? 'page' : undefined}
              className="relative h-11 w-[58px] rounded-full flex items-center justify-center">
              {active && <motion.span layoutId="pk-nav" className="absolute inset-0 rounded-full bg-white" transition={spring} />}
              <n.icon size={20} strokeWidth={2.2} className={`relative ${active ? 'text-[#111113]' : 'text-white/60'}`} />
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}

export function Toast({ toast, onUndo }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div key={toast.id} role="status" initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -70, opacity: 0 }}
          className="absolute left-3 right-3 top-[max(50px,calc(env(safe-area-inset-top)+4px))] z-[95] rounded-[22px] bg-[#1C1D20] border border-white/10 text-white pl-3 pr-2 py-2.5 flex items-center gap-3 shadow-2xl">
          <Glyph e={toast.emoji || '✅'} size={34} round />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">{toast.title}</div>
            {toast.sub && <div className="text-[12px] text-white/60 truncate">{toast.sub}</div>}
          </div>
          {toast.undo && <button onClick={onUndo} className="h-10 px-4 rounded-full bg-white text-[#111113] text-[14px] font-semibold">Undo</button>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── form bits (used inside white sheets) ───
export function Field({ label, children }) {
  return (
    <label className="block mt-4">
      <span className="block text-[13px] text-mute font-medium mb-1.5 px-1">{label}</span>
      {children}
    </label>
  )
}
export function TextInput({ value, onChange, placeholder, id }) {
  return <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="w-full h-12 rounded-2xl bg-black/[0.05] px-4 text-[16px] outline-none focus:ring-2 focus:ring-black/20 placeholder:text-black/35" />
}
export function AmountInput({ value, onChange, placeholder = '0', id }) {
  return (
    <div className="flex items-center h-12 rounded-2xl bg-black/[0.05] px-4 focus-within:ring-2 focus-within:ring-black/20">
      <span className="text-[16px] text-black/45 mr-1">$</span>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} placeholder={placeholder} inputMode="decimal"
        className="flex-1 bg-transparent text-[16px] outline-none tnum placeholder:text-black/35" />
    </div>
  )
}
export function IconPicker({ list, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
      {list.map((e) => (
        <button key={e} onClick={() => onChange(e)} aria-label="Choose icon" className={`shrink-0 rounded-[15px] p-0.5 ${value === e ? 'ring-2 ring-[#111113]' : ''}`}>
          <Glyph e={e} size={44} radius={13} />
        </button>
      ))}
    </div>
  )
}
export function PrimaryButton({ children, onClick, disabled, danger }) {
  return (
    <Press onClick={onClick} disabled={disabled}
      className={`w-full h-[52px] mt-5 rounded-full text-[16px] font-semibold disabled:opacity-30 ${danger ? 'bg-[#FF453A] text-pure' : 'bg-[#111113] text-pure'}`}>
      {children}
    </Press>
  )
}
export function DeleteButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="w-full h-12 mt-2 text-[15px] font-semibold text-[#FF453A] flex items-center justify-center gap-2">
      <Trash2 size={16} /> {children}
    </button>
  )
}
export function Chips({ items, value, onChange, dark }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {items.map((it) => {
        const on = it.id === value
        return (
          <button key={String(it.id)} onClick={() => { haptic(); onChange(it.id) }}
            className={`shrink-0 h-9 px-4 rounded-full text-[14px] font-medium transition-colors ${on ? (dark ? 'bg-white text-[#111113]' : 'bg-[#111113] text-pure') : dark ? 'bg-white/10 text-white/70' : 'bg-black/[0.05] text-black/60'}`}>
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
