import { useEffect, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import {
  ChevronRight, ChevronsRight, Check, Delete, Info, Pencil, Trash2,
  Briefcase, Laptop, Coffee, Sprout, Gift, Users, House, Lightbulb, Wifi, Headphones, Dumbbell, Receipt, Car,
  Stethoscope, GraduationCap, Smartphone, ShoppingBag, UtensilsCrossed, ShoppingCart, TreePalm, CarTaxiFront,
  Clapperboard, Dog, Baby, Pill, BookOpen, Plane, LifeBuoy, Gem, Guitar, Bike, Gamepad2, ArrowUpRight, Banknote,
  Rocket, CircleCheck, TriangleAlert, Repeat, Trophy, Tag, PiggyBank, Sparkles, TrendingUp,
} from 'lucide-react'

// ───────────── helpers ─────────────
export const fmt = (n, d = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
// Rule: summaries show whole dollars (d = 0), individual operations show cents.
export const money = (n, d = 2) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n), d)}`
export const signed = (n, d = 2) => `${n >= 0 ? '+' : '−'}$${fmt(Math.abs(n), d)}`
export const pct = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`

export const haptic = (ms = 8) => {
  try { navigator.vibrate?.(ms) } catch { /* noop */ }
}

export const spring = { type: 'spring', stiffness: 420, damping: 34 }

// ───────────── Unified icons (instead of platform-dependent emoji) ─────────────
const GLYPHS = {
  '💼': [Briefcase, '#7C3AED'], '🧑‍💻': [Laptop, '#00C27C'], '☕️': [Coffee, '#38BDF8'], '🌱': [Sprout, '#F59E0B'],
  '🎁': [Gift, '#F472B6'], '👨‍👩‍👧': [Users, '#FBBF24'], '🏠': [House, '#7C3AED'], '💡': [Lightbulb, '#F59E0B'],
  '📶': [Wifi, '#38BDF8'], '🎧': [Headphones, '#F472B6'], '🏋️': [Dumbbell, '#FB923C'], '🧾': [Receipt, '#94A3B8'],
  '🚗': [Car, '#38BDF8'], '🩺': [Stethoscope, '#F43F5E'], '🎓': [GraduationCap, '#7C3AED'], '📱': [Smartphone, '#64748B'],
  '🛍️': [ShoppingBag, '#00C27C'], '🍜': [UtensilsCrossed, '#FB7185'], '🥑': [ShoppingCart, '#38BDF8'], '🏝️': [TreePalm, '#F59E0B'],
  '🚕': [CarTaxiFront, '#FBBF24'], '🎬': [Clapperboard, '#A78BFA'], '🐶': [Dog, '#F59E0B'], '🧸': [Baby, '#F472B6'],
  '💊': [Pill, '#F43F5E'], '📚': [BookOpen, '#38BDF8'], '🗾': [Plane, '#00C27C'], '✈️': [Plane, '#00C27C'],
  '💻': [Laptop, '#7C3AED'], '🛟': [LifeBuoy, '#38BDF8'], '🏡': [House, '#00C27C'], '💍': [Gem, '#F472B6'],
  '🎸': [Guitar, '#FB923C'], '🏍️': [Bike, '#F43F5E'], '🎮': [Gamepad2, '#A78BFA'], '↗️': [ArrowUpRight, '#38BDF8'],
  '💸': [Banknote, '#00C27C'], '🚀': [Rocket, '#7C3AED'], '✅': [CircleCheck, '#00C27C'], '⚠️': [TriangleAlert, '#F59E0B'],
  '🗑️': [Trash2, '#94A3B8'], '🔁': [Repeat, '#38BDF8'], '🏆': [Trophy, '#F59E0B'], '💎': [Gem, '#A78BFA'],
  '🐷': [PiggyBank, '#A78BFA'], '✨': [Sparkles, '#A78BFA'], '📈': [TrendingUp, '#00C27C'],
}
export const glyphColor = (e, fallback = '#94A3B8') => GLYPHS[e]?.[1] || fallback

// Icon in a tinted rounded tile. Unknown symbols fall back to Tag.
export function Glyph({ e, size = 40, radius = 12, color, round }) {
  const [Icon, c] = GLYPHS[e] || [Tag, '#94A3B8']
  const col = color || c
  return (
    <span className="inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: round ? 999 : radius, background: col + '22', color: col }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  )
}

// Ticker badge for assets (brokerage-style)
export function AssetBadge({ a, size = 40 }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0 rounded-full font-bold"
      style={{ width: size, height: size, background: a.color + '26', color: a.color, fontSize: size * (a.ticker.length > 3 ? 0.27 : 0.32) }}>
      {a.ticker}
    </span>
  )
}

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

// Large summary number (whole dollars), hideable
export function BigBalance({ value, hidden, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[44px] font-extrabold tracking-tight leading-none">$ •••••</motion.div>
        ) : (
          <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[44px] font-extrabold tracking-tight leading-none">
            <AnimatedNumber value={value} format={(v) => money(v, 0)} />
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
        <button onClick={onAction} className="text-[15px] text-accent font-semibold flex items-center min-h-[44px] -my-2 active:opacity-60">
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
    <span className={`tnum inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[12px] font-semibold ${up ? 'text-neon bg-neon/[0.12]' : 'text-loss bg-loss/[0.14]'} ${className}`}>
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

export function InfoButton({ onClick, label = 'How is this calculated?' }) {
  return (
    <button onClick={onClick} aria-label={label} className="w-11 h-11 -m-3 inline-flex items-center justify-center text-white/55 active:text-white">
      <Info size={16} />
    </button>
  )
}

// ───────────── iOS Bottom Sheet (sticky footer for the main action) ─────────────
export function BottomSheet({ open, onClose, children, title, footer }) {
  const y = useMotionValue(0)
  const controls = useDragControls()
  const backdrop = useTransform(y, [0, 400], [1, 0])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="absolute inset-0 z-40 bg-black/50"
            style={{ opacity: backdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[30px] bg-card2 border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] max-h-[94%] flex flex-col"
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
            <div className="touch-none cursor-grab active:cursor-grabbing shrink-0" onPointerDown={(e) => controls.start(e)}>
              <div className="pt-2.5 pb-1 flex justify-center">
                <div className="w-10 h-[5px] rounded-full bg-white/25" />
              </div>
              {title && <div className="px-5 pt-1.5 pb-2 text-[17px] font-semibold text-center">{title}</div>}
            </div>
            <div className={`overflow-y-auto no-scrollbar px-5 min-h-0 ${footer ? 'pb-3' : 'pb-[max(24px,env(safe-area-inset-bottom))]'}`}>
              {children}
            </div>
            {footer && (
              <div className="shrink-0 px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] border-t border-white/[0.06] bg-card2">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ───────────── Swipe to confirm ─────────────
export function SwipeToConfirm({ label = 'Swipe to confirm', onConfirm, color = '#7C3AED', disabled }) {
  const trackRef = useRef(null)
  const x = useMotionValue(0)
  const [width, setWidth] = useState(300)
  const [done, setDone] = useState(false)
  const KNOB = 52
  const max = width - KNOB - 8

  useEffect(() => {
    if (trackRef.current) setWidth(trackRef.current.offsetWidth)
  }, [])

  const fill = useTransform(x, (v) => v + KNOB + 4)
  const textOpacity = useTransform(x, [0, max * 0.6], [1, 0])
  const light = color !== '#7C3AED' && color !== '#FF4D6D'

  return (
    <div
      ref={trackRef}
      data-nodrag
      className={`relative h-[60px] rounded-full overflow-hidden border border-white/10 bg-white/[0.04] ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <motion.div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: fill, background: `linear-gradient(90deg, ${color}10, ${color}55)` }} />
      <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-white/80 pl-10">
        {label}
      </motion.div>
      <motion.div
        drag={done ? false : 'x'}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.02}
        dragMomentum={false}
        role="slider"
        aria-label={label}
        style={{ x, background: color }}
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
        className={`absolute top-1 left-1 h-[52px] w-[52px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${light ? 'text-onbright' : 'text-pure'}`}
      >
        {done ? <Check size={24} strokeWidth={3} /> : <ChevronsRight size={24} strokeWidth={2.6} />}
      </motion.div>
    </div>
  )
}

// ───────────── Toast (with optional Undo) ─────────────
export function Toast({ toast, onAction }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          className="absolute left-3 right-3 top-[max(50px,calc(env(safe-area-inset-top)+4px))] z-[60] liquid rounded-[22px] pl-3 pr-2 py-2.5 flex items-center gap-3"
        >
          <Glyph e={toast.emoji || '✅'} size={36} round />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">{toast.title}</div>
            {toast.sub && <div className="text-[12px] text-mute truncate">{toast.sub}</div>}
          </div>
          {toast.undo && (
            <button onClick={onAction} className="shrink-0 h-10 px-3.5 rounded-full bg-white/10 text-[14px] font-bold text-accent">Undo</button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ───────────── Confetti burst (only on real achievements) ─────────────
export function Burst({ trigger, colors = ['#00F59B', '#7C3AED', '#38BDF8', '#F59E0B', '#A78BFA'] }) {
  if (!trigger) return null
  return (
    <div key={trigger} className="pointer-events-none absolute inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2
        const dist = 120 + (i % 5) * 34
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={{ width: i % 3 ? 7 : 10, height: i % 3 ? 7 : 4, background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 160, opacity: 0, rotate: 360 + i * 20 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.3, 1] }}
          />
        )
      })}
    </div>
  )
}

// ───────────── Amount keypad (compact) ─────────────
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
    <div className="grid grid-cols-3 gap-1" data-nodrag>
      {keys.map((k) => (
        <motion.button key={k} whileTap={{ scale: 0.9, backgroundColor: 'rgb(var(--fg) / 0.12)' }}
          onClick={() => press(k)}
          aria-label={k === '⌫' ? 'Delete' : k}
          className="h-[46px] rounded-2xl text-[23px] font-medium text-white/90 flex items-center justify-center">
          {k === '⌫' ? <Delete size={22} strokeWidth={1.8} /> : k}
        </motion.button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); haptic(); onChange(!on) }} role="switch" aria-checked={on} aria-label={label}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-violet' : 'bg-white/15'}`}>
      <motion.span initial={false} animate={{ left: on ? 22 : 2 }} transition={spring} className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-pure shadow" />
    </button>
  )
}

// ───────────── Swipeable list row (iOS: swipe left → Edit / Delete) ─────────────
export function SwipeRow({ children, onEdit, onDelete, onTap, className = '' }) {
  const x = useMotionValue(0)
  const W = (onEdit ? 72 : 0) + (onDelete ? 72 : 0)
  const [openRow, setOpenRow] = useState(false)
  const dragged = useRef(false) // a swipe must never count as a tap
  const close = () => { animate(x, 0, spring); setOpenRow(false) }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-y-0 right-0 flex">
        {onEdit && (
          <button onClick={() => { close(); onEdit() }} className="w-[72px] bg-white/[0.10] flex flex-col items-center justify-center gap-1 text-[12px] font-semibold">
            <Pencil size={18} /> Edit
          </button>
        )}
        {onDelete && (
          <button onClick={() => { close(); onDelete() }} className="w-[72px] bg-loss text-pure flex flex-col items-center justify-center gap-1 text-[12px] font-semibold">
            <Trash2 size={18} /> Delete
          </button>
        )}
      </div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -W, right: 0 }}
        dragElastic={0.08}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={(_, info) => {
          setTimeout(() => { dragged.current = false }, 50)
          const opened = info.offset.x < -W / 2 || info.velocity.x < -400
          animate(x, opened ? -W : 0, spring)
          setOpenRow(opened)
          if (opened) haptic(6)
        }}
        onTap={(_, info) => {
          if (dragged.current || Math.abs(info?.offset?.x || 0) > 6 || Math.abs(x.get()) > 6) return
          openRow ? close() : onTap?.()
        }}
        className="relative bg-card cursor-pointer"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function EmptyState({ icon = '✨', title, text, action, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-7 px-4">
      <Glyph e={icon} size={52} round />
      <div className="text-[16px] font-semibold mt-3">{title}</div>
      {text && <div className="text-[13px] text-mute mt-1 max-w-[260px]">{text}</div>}
      {action && <button onClick={onAction} className="mt-4 h-11 px-5 rounded-full bg-violet text-pure text-[15px] font-semibold">{action}</button>}
    </div>
  )
}
