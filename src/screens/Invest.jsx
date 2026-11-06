import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ChevronRight, ChevronDown, Clock, Info, Receipt } from 'lucide-react'
import { SectionHeader, Card, Tap, AnimatedNumber, ChangePill, AssetBadge, EmptyState, money, signed, fmt, haptic, spring } from '../components/ui'
import { LineChart, Sparkline, Donut } from '../components/Chart'
import { makeSeries, ranges, showcase, riskLabels, TAX_BRACKETS } from '../data'

const TYPE_COLORS = { ETF: '#00C27C', 'Stocks': '#7C3AED', 'Crypto': '#F59E0B', 'Real Estate': '#38BDF8' }

function RiskMeter({ level }) {
  const colors = ['#00C27C', '#7DEB5B', '#F5D90A', '#FF9F43', '#FF4D6D']
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.span key={i} className="h-1.5 w-5 rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
          style={{ background: i <= level ? colors[level - 1] : 'rgb(var(--fg) / 0.1)', originX: 0 }} />
      ))}
    </div>
  )
}

export default function Invest({ fin, portfolio, assets, hidden, setSheet }) {
  const [range, setRange] = useState('1D')
  const [scrub, setScrub] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const r = ranges.find((x) => x.id === range)
  const series = useMemo(() => makeSeries(r.seed, r.points, portfolio.value, r.drift, r.vol), [range, Math.round(portfolio.value / 20)]) // eslint-disable-line
  const shown = scrub != null ? series[scrub] : portfolio.value
  const startVal = series[0]
  const delta = range === '1D' && scrub == null ? portfolio.day : shown - startVal
  const deltaPct = range === '1D' && scrub == null ? portfolio.dayPct : (delta / startVal) * 100
  const up = delta >= 0
  const color = up ? '#00C27C' : '#FF4D6D'

  const alloc = useMemo(() => {
    const m = {}
    portfolio.rows.forEach((row) => { m[row.asset.type] = (m[row.asset.type] || 0) + row.value })
    return Object.entries(m).map(([label, value]) => ({ label, value, color: TYPE_COLORS[label] })).sort((a, b) => b.value - a.value)
  }, [portfolio])

  const rangeLabel = { '1D': 'today', '1W': 'past week', '1M': 'past month', '1Y': 'past year', ALL: 'all time' }[range]

  return (
    <div className="px-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[34px] font-extrabold tracking-tight">Investments</h1>
      </div>

      {/* Portfolio hero */}
      <div className="mt-2">
        <div className="text-[14px] text-mute">My portfolio</div>
        <div className="text-[40px] font-extrabold tracking-tight leading-tight">
          {hidden ? '$ •••••' : <AnimatedNumber value={shown} duration={scrub != null ? 0.15 : 0.9} />}
        </div>
        <motion.div animate={{ color }} className="flex items-center gap-2 text-[15px] font-semibold tnum">
          <span>{signed(delta)}</span>
          <span>({deltaPct >= 0 ? '+' : '−'}{Math.abs(deltaPct).toFixed(2)}%)</span>
          <span className="text-white/55 font-normal">{scrub != null ? 'at selected point' : rangeLabel}</span>
        </motion.div>
      </div>

      <div className="-mx-4 mt-4">
        <LineChart key={range} data={series} color={color} height={180} onScrub={setScrub} />
      </div>

      <div className="flex justify-between mt-3 relative">
        {ranges.map((x) => (
          <button key={x.id} onClick={() => { haptic(); setRange(x.id) }} className="relative px-4 py-1.5 text-[13px] font-bold">
            {range === x.id && <motion.div layoutId="range" className="absolute inset-0 rounded-full" style={{ background: color + '22' }} transition={spring} />}
            <span className="relative" style={{ color: range === x.id ? color : 'rgb(var(--fg) / 0.5)' }}>{x.label}</span>
          </button>
        ))}
      </div>

      {/* P&L + buying power */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Card className="p-3.5">
          <div className="text-[12px] text-mute">You earned</div>
          <div className={`text-[18px] font-bold tnum mt-0.5 ${portfolio.pnl >= 0 ? 'text-neon drop-shadow-[0_0_10px_rgba(0,245,155,0.5)]' : 'text-loss'}`}>
            <AnimatedNumber value={portfolio.pnl} format={(v) => signed(v)} />
          </div>
          <div className={portfolio.pnl >= 0 ? 'text-neon' : 'text-loss'}>{portfolio.pnlPct >= 0 ? '+' : '−'}{Math.abs(portfolio.pnlPct).toFixed(2)}% all time</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[12px] text-mute flex items-center gap-1"><Wallet size={12} /> Available to invest</div>
          <div className="text-[18px] font-bold tnum mt-0.5"><AnimatedNumber value={Math.max(fin.available, 0)} /></div>
          <div className="text-[12px] text-mute">free money, bills set aside</div>
        </Card>
      </div>


      {/* Holdings */}
      <SectionHeader title="My holdings" />
      <p className="text-[13px] text-mute -mt-2 mb-3 px-1">Tap any asset to buy more or sell</p>
      <Card className="px-4 divide-y divide-white/[0.06]">
        {portfolio.rows.length === 0 && <EmptyState icon="📈" title="No investments yet" text="Pick something below — you can start with any amount." />}
        {portfolio.rows.map((row) => {
          const a = row.asset
          const spark = makeSeries(a.ticker.charCodeAt(1) + 3, 24, a.price, a.change / 100, 0.01)
          return (
            <motion.button layout key={row.ticker} whileTap={{ scale: 0.98 }}
              onClick={() => { haptic(); setSheet({ type: 'trade', ticker: row.ticker }) }}
              className="w-full flex items-center gap-3 py-3 text-left">
              <AssetBadge a={a} size={42} />
              <div className="w-[70px]">
                <div className="text-[15px] font-bold">{a.ticker}</div>
                <div className="text-[12px] text-mute tnum">{fmt(row.qty, row.qty < 1 ? 4 : 2)} sh</div>
              </div>
              <div className="flex-1 flex justify-center"><Sparkline data={spark} color={a.change >= 0 ? '#00C27C' : '#FF4D6D'} w={64} h={26} /></div>
              <div className="text-right">
                <AnimatedNumber value={row.value} className="text-[15px] font-semibold block" />
                <div className={`text-[12px] tnum font-semibold ${row.pnl >= 0 ? 'text-neon' : 'text-loss'}`}>
                  {row.pnl >= 0 ? 'earned ' : 'lost '}{money(Math.abs(row.pnl), 0)} · {row.pnlPct >= 0 ? '+' : '−'}{Math.abs(row.pnlPct).toFixed(1)}%
                </div>
              </div>
            </motion.button>
          )
        })}
      </Card>

      {/* Showcase */}
      <SectionHeader title="New opportunities" />
      <p className="text-[13px] text-mute -mt-2 mb-3 px-1">Learn in plain words, then join with any amount 🙌</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory pb-2">
        {showcase.map((s, i) => {
          const a = assets[s.ticker]
          return (
            <motion.div key={s.ticker} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className={`snap-start shrink-0 w-[272px] rounded-[24px] border border-line bg-gradient-to-b ${s.gradient} bg-card p-4 flex flex-col`}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: TYPE_COLORS[s.category] + '22', color: TYPE_COLORS[s.category] }}>{s.category}</span>
                <ChangePill value={a.change} />
              </div>
              <div className="flex items-center gap-2.5 mt-3">
                <AssetBadge a={a} size={40} />
                <div>
                  <div className="text-[15px] font-bold leading-tight">{a.name}</div>
                  <div className="text-[12px] text-mute tnum">{a.ticker} · {money(a.price)}</div>
                </div>
              </div>
              <div className="text-[17px] font-bold mt-3 leading-snug">{s.title}</div>
              <p className="text-[13px] text-white/65 mt-1 leading-snug flex-1">{s.plain}</p>
              <div className="mt-3 space-y-2 rounded-2xl bg-white/[0.05] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-mute">Risk</span>
                  <div className="flex items-center gap-2"><RiskMeter level={s.risk} /><span className="text-[12px] font-semibold w-[88px] text-right">{riskLabels[s.risk]}</span></div>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-mute">Potential</span><span className="font-semibold">{s.potential}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-mute flex items-center gap-1"><Clock size={11} />Hold for</span><span className="font-semibold">{s.horizon}</span>
                </div>
              </div>
              <Tap onClick={() => setSheet({ type: 'trade', ticker: s.ticker, side: 'buy' })}
                className="mt-3 h-12 rounded-xl bg-violet text-pure font-bold text-[15px] flex items-center justify-center gap-1">
                Invest <ChevronRight size={17} />
              </Tap>
            </motion.div>
          )
        })}
      </div>


      {/* Details: taxes and allocation, collapsed by default */}
      <button onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails}
        className="w-full mt-7 h-[52px] rounded-[20px] bg-card border border-line px-4 flex items-center justify-between text-[15px] font-semibold">
        <span>Taxes & allocation</span>
        <span className="flex items-center gap-2 text-mute text-[13px] font-medium">{money(fin.taxWithheld, 0)} tax withheld <ChevronDown size={18} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} /></span>
      </button>
      {showDetails && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
      {/* Taxes on investment profit */}
      <div className="text-[16px] font-bold mt-1 mb-2 px-1">Taxes</div>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center"><Receipt size={19} className="text-white/80" /></div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Withheld automatically</div>
            <div className="text-[12px] text-mute">When you sell with a profit, tax is taken from the payout</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="rounded-2xl bg-white/[0.04] p-2.5">
            <div className="text-[12px] text-mute">Profit sold</div>
            <div className={`text-[15px] font-bold tnum ${fin.realized >= 0 ? 'text-neon' : 'text-loss'}`}>{signed(fin.realized, 0)}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-2.5">
            <div className="text-[12px] text-mute">Tax withheld</div>
            <div className="text-[15px] font-bold tnum">{money(fin.taxWithheld, 0)}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-2.5">
            <div className="text-[12px] text-mute">Your rate now</div>
            <div className="text-[15px] font-bold tnum">{Math.round(fin.bracketRate(Math.max(fin.realized, 0)) * 100)}%</div>
          </div>
        </div>
        <div className="text-[12px] text-white/55 mt-3 leading-snug">
          If you sold everything today: profit {signed(portfolio.pnl, 0)}, tax ≈ <b className="text-white">{money(Math.max(fin.taxOnProfit(fin.realized + Math.max(portfolio.pnl, 0)) - fin.taxOnProfit(fin.realized), 0), 0)}</b>.
        </div>
        <div className="flex gap-1.5 mt-3">
          {TAX_BRACKETS.map((b, i) => {
            const from = i ? TAX_BRACKETS[i - 1].upTo : 0
            const active = fin.realized > from && fin.realized <= b.upTo
            return (
              <div key={i} className={`flex-1 rounded-xl px-2 py-1.5 text-center text-[12px] ${active ? 'bg-neon/15 text-neon' : 'bg-white/[0.04] text-white/50'}`}>
                <b>{Math.round(b.rate * 100)}%</b> {b.upTo === Infinity ? `over $${fmt(from, 0)}` : `to $${fmt(b.upTo, 0)}`}
              </div>
            )
          })}
        </div>
        <div className="text-[11px] text-white/30 mt-2">Demo tax rules for the prototype — real rates depend on your country.</div>
      </Card>

      {/* Allocation */}
      <div className="text-[16px] font-bold mt-5 mb-2 px-1">Asset allocation</div>
      <Card className="p-4 flex items-center gap-4">
        <Donut segments={alloc} size={118} stroke={14}>
          <div className="text-[12px] text-mute">Assets</div>
          <div className="text-[20px] font-extrabold">{portfolio.rows.length}</div>
        </Donut>
        <div className="flex-1 space-y-2.5">
          {alloc.map((a) => (
            <div key={a.label} className="flex items-center gap-2 text-[13px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
              <span className="flex-1 text-white/80">{a.label}</span>
              <span className="font-semibold tnum">{((a.value / portfolio.value) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </Card>

        </motion.div>
      )}
      <div className="mt-6 flex gap-2 items-start text-[12px] text-white/55 px-1">
        <Info size={13} className="shrink-0 mt-[1px]" />
        Prices are demo data that update live for this prototype. Not investment advice.
      </div>
    </div>
  )
}
