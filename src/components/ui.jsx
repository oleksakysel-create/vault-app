import { useEffect, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { ChevronRight, ChevronsRight, Check, Delete } from 'lucide-react'

// ───────────── helpers ─────────────
export const fmt = (n, d = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const money = (n, d = 2) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n), d)}`
export const signed = (n, d = 2) => `${n >= 0 ? '+' : '−'}$${fmt(Math.abs(n), d)}`
export const pct = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`

export const haptic = (ms = 8) => {
  try { navigator.vibrate?.(ms) } catch { /* noop */ }
}

export const spring = { type: 'spring', stiffness: 420, damping: 34 }

// ───────────── Animated number ─────────────
export function AnimatedNumber({ value, format = (v) => money(v), className = '', duration = 0.9 }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])
  return <span className={`tnum ${className}`}>{format(display)}</span>
}

// Large balance with smaller cents, hideable
export function BigBalance({ value, hidden, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <motion.div key="h" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(8px)' }}
            className="text-[44px] font-extrabold tracking-tight leading-none">$ •••••</motion.div>
        ) : (
          <motion.div key="v" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(8px)' }}
            className="text-[44px] font-extrabold tracking-tight leading-none">
            <AnimatedNumber
              value={value}
              format={(v) => {
                const [i, c] = fmt(v).split('.')
                return (
                  <>
                    ${i}<span className="text-[28px] text-white/50">.{c}</span>
                  </>
                )
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ───────────── Layout bits ─────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-1 mb-3 mt-7">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[14px] text-neon font-medium flex items-center active:opacity-60">
          {action}<ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '', ...rest }) {
  return (
    <motion.div className={`bg-card rounded-[22px] border border-line ${className}`} {...rest}>
      {children}
    </motion.div>
  )
}

export function ChangePill({ value, className = '' }) {
  const up = value >= 0
  return (
    <span className={`tnum inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[12px] font-semibold ${up ? 'bg-neon/12 text-neon' : 'bg-loss/15 text-loss'} ${className}`}
      style={{ backgroundColor: up ? 'rgba(0,245,155,0.12)' : 'rgba(255,77,109,0.14)' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  )
}

export function Tap({ children, className = '', onClick, ...rest }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={spring}
      onClick={(e) => { haptic(); onClick?.(e) }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

// ───────────── iOS Bottom Sheet ─────────────
export function BottomSheet({ open, onClose, children, title }) {
  const y = useMotionValue(0)
  const controls = useDragControls()
  const backdrop = useTransform(y, [0, 400], [1, 0])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="absolute inset-0 z-40 bg-black/60"
            style={{ opacity: backdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[30px] bg-[#16191F] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] max-h-[92%] flex flex-col"
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="touch-none cursor-grab active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
              <div className="pt-2.5 pb-1 flex justify-center">
                <div className="w-10 h-[5px] rounded-full bg-white/25" />
              </div>
              {title && <div className="px-5 pt-2 pb-2 text-[17px] font-semibold text-center">{title}</div>}
            </div>
            <div className="overflow-y-auto no-scrollbar px-5 pb-[max(28px,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ───────────── Swipe to confirm ─────────────
export function SwipeToConfirm({ label = 'Swipe to confirm', onConfirm, color = '#00F59B', disabled }) {
  const trackRef = useRef(null)
  const x = useMotionValue(0)
  const [width, setWidth] = useState(300)
  const [done, setDone] = useState(false)
  const KNOB = 56
  const max = width - KNOB - 8

  useEffect(() => {
    if (trackRef.current) setWidth(trackRef.current.offsetWidth)
  }, [])

  const fill = useTransform(x, (v) => v + KNOB + 4)
  const textOpacity = useTransform(x, [0, max * 0.6], [1, 0])

  return (
    <div
      ref={trackRef}
      data-nodrag
      className={`relative h-16 rounded-full overflow-hidden border border-white/10 bg-white/[0.04] ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <motion.div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: fill, background: `linear-gradient(90deg, ${color}10, ${color}55)` }} />
      <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-white/80 pl-10">
        <span className="shimmer bg-clip-text text-transparent" style={{ backgroundColor: 'rgba(255,255,255,0.75)', WebkitBackgroundClip: 'text' }}>{label}</span>
      </motion.div>
      <motion.div
        drag={done ? false : 'x'}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.02}
        dragMomentum={false}
        style={{ x, background: color, boxShadow: `0 0 24px ${color}88` }}
        onDragEnd={() => {
          if (x.get() > max * 0.85) {
            animate(x, max, { duration: 0.15 })
            setDone(true)
            haptic([10, 40, 20])
            setTimeout(() => onConfirm?.(), 220)
          } else {
            animate(x, 0, spring)
          }
        }}
        className="absolute top-1 left-1 h-14 w-14 rounded-full flex items-center justify-center text-ink cursor-grab active:cursor-grabbing z-10"
      >
        {done ? <Check size={26} strokeWidth={3} /> : <ChevronsRight size={26} strokeWidth={2.6} />}
      </motion.div>
    </div>
  )
}

// ───────────── Toast ─────────────
export function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute left-3 right-3 top-[54px] z-[60] glass border border-white/10 rounded-[22px] px-4 py-3 flex items-center gap-3 shadow-2xl"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: 'rgba(0,245,155,0.16)' }}>{toast.emoji || '✅'}</div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold">{toast.title}</div>
            {toast.sub && <div className="text-[12px] text-mute truncate">{toast.sub}</div>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ───────────── Confetti burst ─────────────
export function Burst({ trigger, colors = ['#00F59B', '#7C3AED', '#38BDF8', '#00F59B', '#fff'] }) {
  if (!trigger) return null
  return (
    <div key={trigger} className="pointer-events-none absolute inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 34 }).map((_, i) => {
        const angle = (i / 34) * Math.PI * 2
        const dist = 120 + (i % 5) * 34
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={{ width: i % 3 ? 7 : 10, height: i % 3 ? 7 : 4, background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 160, opacity: 0, rotate: 360 + i * 20 }}
            transition={{ duration: 1.3, ease: [0.2, 0.8, 0.3, 1] }}
          />
        )
      })}
    </div>
  )
}

// ───────────── Amount keypad ─────────────
export function Keypad({ value, onChange }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']
  const press = (k) => {
    haptic(5)
    if (k === '⌫') return onChange(value.slice(0, -1))
    if (k === '.' && value.includes('.')) return
    if (value.includes('.') && value.split('.')[1].length >= 2) return
    if (value.replace('.', '').length >= 7) return
    if (value === '0' && k !== '.') return onChange(k)
    onChange(value + k)
  }
  return (
    <div className="grid grid-cols-3 gap-1.5" data-nodrag>
      {keys.map((k) => (
        <motion.button key={k} whileTap={{ scale: 0.9, backgroundColor: 'rgba(255,255,255,0.12)' }}
          onClick={() => press(k)}
          className="h-[50px] rounded-2xl text-[24px] font-medium text-white/90 flex items-center justify-center">
          {k === '⌫' ? <Delete size={24} strokeWidth={1.8} /> : k}
        </motion.button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange }) {
  return (
    <button onClick={() => { haptic(); onChange(!on) }}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${on ? 'bg-neon' : 'bg-white/15'}`}>
      <motion.span initial={false} animate={{ left: on ? 22 : 2 }} transition={spring} className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow" />
    </button>
  )
}

// ───────────── Header capsule (avatar · name · details · bell) ─────────────
export function Avatar({ initials = 'A', from = '#C4B5FD', to = '#38BDF8', size = 48, ring = true }) {
  return (
    <div className="rounded-full p-[2px] shrink-0" style={{ width: size, height: size, background: ring ? 'linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))' : 'transparent' }}>
      <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white"
        style={{ background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 45%), linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.38 }}>
        {initials}
      </div>
    </div>
  )
}

export function ProfileCapsule({ name, onDetails, right }) {
  return (
    <div className="surface rounded-full flex items-center gap-3 p-1.5 pr-1.5">
      <Avatar initials={name[0]} />
      <button onClick={onDetails} className="flex-1 text-left min-w-0">
        <div className="text-[17px] font-semibold leading-tight truncate">{name}</div>
        <div className="text-[14px] text-white/55 flex items-center gap-0.5">Details <ChevronRight size={15} /></div>
      </button>
      {right}
    </div>
  )
}

export function RoundIcon({ children, onClick, size = 48, className = '' }) {
  return (
    <Tap onClick={onClick} className={`surface-raised rounded-full flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {children}
    </Tap>
  )
}
