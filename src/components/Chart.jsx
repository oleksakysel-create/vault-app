import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Robinhood-style line chart with scrubbing
export function LineChart({ data, color = '#00F59B', height = 170, onScrub, baseline = true }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 360
  const H = height
  const pad = 10

  const { path, area, pts } = useMemo(() => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * W,
      pad + (1 - (v - min) / span) * (H - pad * 2),
    ])
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    return { path, area: `${path} L${W},${H} L0,${H} Z`, pts }
  }, [data, H])

  const handle = (clientX) => {
    const r = ref.current.getBoundingClientRect()
    const rel = Math.min(Math.max((clientX - r.left) / r.width, 0), 1)
    const idx = Math.round(rel * (data.length - 1))
    setHover(idx)
    onScrub?.(idx)
  }
  const end = () => { setHover(null); onScrub?.(null) }
  const gid = `g-${color.replace('#', '')}`
  const key = data.length + '-' + Math.round(data[0] * 100)

  return (
    <div
      ref={ref}
      className="relative touch-none"
      style={{ height: H }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handle(e.clientX) }}
      onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && handle(e.clientX)}
      onPointerUp={end}
      onPointerLeave={end}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="55%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clip-${gid}-${key}`}>
            <motion.rect x="-10" y="-20" height={H + 40} initial={{ width: 0 }} animate={{ width: W + 30 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
          </clipPath>
          <filter id={`glow-${gid}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {baseline && (
          <line x1="0" x2={W} y1={pts[0][1]} y2={pts[0][1]} stroke="rgba(255,255,255,0.18)" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
        )}
        <motion.path key={'a' + key} d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
        <motion.path
          key={'l' + key}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#glow-${gid})`}
          clipPath={`url(#clip-${gid}-${key})`}
          style={{ opacity: hover == null ? 1 : 0.9 }}
        />
      </svg>
      {hover != null && (
        <>
          <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: `${(pts[hover][0] / W) * 100}%` }} />
          <div
            className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 border-ink"
            style={{ left: `${(pts[hover][0] / W) * 100}%`, top: pts[hover][1], background: color, boxShadow: `0 0 14px ${color}` }}
          />
        </>
      )}
      {hover == null && (
        <motion.div
          className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full"
          style={{ left: '100%', top: pts[pts.length - 1][1], background: color }}
          animate={{ boxShadow: [`0 0 0 0 ${color}aa`, `0 0 0 10px ${color}00`] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
    </div>
  )
}

export function Sparkline({ data, color = '#00F59B', w = 80, h = 30 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const d = data
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (data.length - 1)) * w).toFixed(1)},${(2 + (1 - (v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Donut({ segments, size = 120, stroke = 14, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const gap = 3
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const offset = acc
          acc += len
          return (
            <motion.circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${Math.max(len - gap, 0)} ${c}` }}
              style={{ strokeDashoffset: -offset }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// Contribution chart: how each component (savings / investments / available)
// added to or took away from the balance since the start of the period.
// layers: [{ key, color, data: number[] }] where data are changes from day 0.
// Gains stack upwards from the zero line, losses stack downwards; the white
// line is the net change of the whole balance.
export function StackedChart({ layers, height = 180, onScrub }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 360
  const H = height
  const n = layers[0].data.length

  const geo = useMemo(() => {
    const pos = Array(n).fill(0)
    const neg = Array(n).fill(0)
    const raw = layers.map((l) => {
      const lower = []
      const upper = []
      l.data.forEach((v, i) => {
        if (v >= 0) { lower.push(pos[i]); pos[i] += v; upper.push(pos[i]) }
        else { upper.push(neg[i]); neg[i] += v; lower.push(neg[i]) }
      })
      return { ...l, lower, upper }
    })
    const net = Array.from({ length: n }, (_, i) => layers.reduce((s, l) => s + l.data[i], 0))
    const top = Math.max(...pos, ...net, 1)
    const bottom = Math.min(...neg, ...net, 0)
    const span = (top - bottom) * 1.12
    const lo = bottom - span * 0.04
    const x = (i) => (i / (n - 1)) * W
    const y = (v) => H - ((v - lo) / span) * H
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    const bands = raw.map((b) => ({
      key: b.key,
      color: b.color,
      area: `${path(b.upper)} ${b.lower.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse().join(' ')} Z`,
    }))
    return { bands, netLine: path(net), netPts: net.map((v, i) => [x(i), y(v)]), zeroY: y(0) }
  }, [layers, n, H])

  const handle = (clientX) => {
    const r = ref.current.getBoundingClientRect()
    const rel = Math.min(Math.max((clientX - r.left) / r.width, 0), 1)
    const idx = Math.round(rel * (n - 1))
    setHover(idx)
    onScrub?.(idx)
  }
  const end = () => { setHover(null); onScrub?.(null) }
  const p = hover != null ? geo.netPts[hover] : geo.netPts[n - 1]

  return (
    <div
      ref={ref}
      className="relative touch-none"
      style={{ height: H }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handle(e.clientX) }}
      onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && handle(e.clientX)}
      onPointerUp={end}
      onPointerLeave={end}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <clipPath id="sb-reveal">
            <motion.rect x="-10" y="-20" height={H + 40} initial={{ width: 0 }} animate={{ width: W + 30 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
          </clipPath>
          <filter id="sb-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <line x1="0" x2={W} y1={geo.zeroY} y2={geo.zeroY} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        <g clipPath="url(#sb-reveal)">
          {geo.bands.map((b) => (
            <path key={b.key} d={b.area} fill={b.color} fillOpacity="0.42" stroke={b.color} strokeOpacity="0.9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={geo.netLine} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="url(#sb-glow)" />
        </g>
      </svg>
      <span className="absolute right-1 text-[10px] text-white/35 -translate-y-full pb-0.5" style={{ top: geo.zeroY }}>$0</span>
      {hover != null && <div className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: `${(p[0] / W) * 100}%` }} />}
      <motion.div
        className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border-2 border-ink"
        style={{ left: `${(p[0] / W) * 100}%`, top: p[1] }}
        animate={hover == null ? { boxShadow: ['0 0 0 0 rgba(255,255,255,0.6)', '0 0 0 8px rgba(255,255,255,0)'] } : {}}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </div>
  )
}
