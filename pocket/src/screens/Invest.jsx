import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { AssetBadge, fmt, haptic } from '../../../src/components/ui'
import { LineChart } from '../../../src/components/Chart'
import { makeSeries, ranges, showcase, riskLabels, TAX_BRACKETS } from '../../../src/data'
import { Money, Press, Chips, usd, signedUsd } from '../components/kit'
import { CARD_COLORS } from '../store'

export default function Invest({ fin, openMoney }) {
  const { s, portfolio, assets } = fin
  const [range, setRange] = useState('1M')
  const [tab, setTab] = useState(portfolio.rows.length ? 'holdings' : 'explore')
  const [scrub, setScrub] = useState(null)
  // after the first purchase show what the user now owns
  const count = useRef(portfolio.rows.length)
  useEffect(() => {
    if (portfolio.rows.length > count.current) setTab('holdings')
    count.current = portfolio.rows.length
  }, [portfolio.rows.length])
  const r = ranges.find((x) => x.id === range)
  const value = portfolio.value
  const series = useMemo(() => (value > 0 ? makeSeries(r.seed, r.points, value, r.drift, r.vol) : Array(20).fill(0)), [range, Math.round(value / 20)]) // eslint-disable-line
  const shown = scrub != null ? series[scrub] : value
  const delta = range === '1D' && scrub == null ? portfolio.day : shown - series[0]
  const up = delta >= 0
  const estTax = Math.max(fin.taxOnProfit(s.realized + Math.max(portfolio.pnl, 0)) - fin.taxOnProfit(s.realized), 0)

  return (
    <div className="bg-[#0E0F11] min-h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-[max(58px,calc(env(safe-area-inset-top)+12px))]">
        <h1 className="text-[30px] font-semibold tracking-tight">Investing</h1>
        <Press onClick={() => openMoney({ mode: 'buy' })} className="pk-pill-light h-9 px-4 rounded-full text-[14px] font-semibold">Buy</Press>
      </div>

      <div className="px-5 mt-4">
        <div className="text-[15px] text-white/60">Portfolio</div>
        <Money value={shown} hidden={s.hidden} size={38} />
        <div className={`text-[14px] font-medium tnum mt-1 ${up ? 'text-[#30D158]' : 'text-[#FF6B62]'}`}>
          {value > 0 ? `${signedUsd(delta)} ${scrub != null ? 'at this point' : { '1D': 'today', '1W': 'this week', '1M': 'this month', '1Y': 'this year', ALL: 'all time' }[range]}` : 'No investments yet'}
        </div>
      </div>
      <div className="mt-3 -mx-0">{value > 0 ? <LineChart key={range} data={series} color={up ? '#30D158' : '#FF453A'} height={130} onScrub={setScrub} /> : <div className="h-[60px]" />}</div>
      <div className="px-5 mt-3 mb-6">
        <Chips dark value={range} onChange={(v) => { haptic(); setRange(v) }} items={ranges.map((x) => ({ id: x.id, label: x.label }))} />
      </div>

      <div className="paper flex-1 rounded-t-[30px] pt-2 pb-[120px]">
        <div className="flex justify-center"><div className="w-9 h-[5px] rounded-full bg-black/10" /></div>
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[18px] bg-black/[0.04] p-3.5">
              <div className="text-[12px] text-mute">You earned</div>
              <div className={`text-[18px] font-semibold tnum ${portfolio.pnl >= 0 ? 'text-[#14A64C]' : 'text-[#E5342B]'}`}>{signedUsd(portfolio.pnl, 0)}</div>
              <div className="text-[12px] text-mute tnum">{portfolio.pnlPct >= 0 ? '+' : '−'}{Math.abs(portfolio.pnlPct).toFixed(1)}% all time</div>
            </div>
            <div className="rounded-[18px] bg-black/[0.04] p-3.5">
              <div className="text-[12px] text-mute">Free to invest</div>
              <div className="text-[18px] font-semibold tnum">{usd(Math.max(fin.available, 0), 0)}</div>
              <div className="text-[12px] text-mute">bills set aside</div>
            </div>
          </div>

          <div className="mt-4"><Chips value={tab} onChange={setTab} items={[{ id: 'holdings', label: 'My assets' }, { id: 'explore', label: 'Explore' }, { id: 'taxes', label: 'Taxes' }]} /></div>

          {tab === 'holdings' && (
            <div className="mt-2">
              {portfolio.rows.length === 0 && (
                <div className="py-6 text-center">
                  <div className="text-[16px] font-semibold">No investments yet</div>
                  <div className="text-[14px] text-mute mt-1">Start with any amount — see Explore</div>
                </div>
              )}
              {portfolio.rows.map((row) => (
                <button key={row.ticker} onClick={() => openMoney({ mode: 'buy', target: row.ticker })} className="w-full flex items-center gap-3 py-3 border-b border-black/[0.06] text-left">
                  <AssetBadge a={row.asset} size={42} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium truncate">{row.asset.name}</span>
                    <span className="block text-[12px] text-mute tnum">{fmt(row.qty, row.qty < 1 ? 4 : 2)} {row.ticker} · avg {usd(row.avg)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[15px] font-semibold tnum">{s.hidden ? '•••' : usd(row.value, 0)}</span>
                    <span className={`block text-[12px] font-semibold tnum ${row.pnl >= 0 ? 'text-[#14A64C]' : 'text-[#E5342B]'}`}>{row.pnl >= 0 ? 'earned ' : 'lost '}{usd(Math.abs(row.pnl), 0)}</span>
                  </span>
                </button>
              ))}
              {portfolio.rows.length > 0 && <p className="text-[12px] text-mute mt-2">Tap an asset to buy more or sell</p>}
            </div>
          )}

          {tab === 'explore' && (
            <div className="mt-3 space-y-3">
              {showcase.map((x, i) => {
                const a = assets[x.ticker]
                const color = CARD_COLORS[i % CARD_COLORS.length]
                return (
                  <div key={x.ticker} className="pk-card rounded-[24px] p-4 text-[#111113]" style={{ background: color, '--glow': color + '88' }}>
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[13px] font-semibold opacity-75">{x.category}</span>
                      <span className="text-[13px] font-semibold tnum opacity-75">{a.ticker} · {usd(a.price)}</span>
                    </div>
                    <div className="relative z-10 text-[19px] font-semibold mt-2 leading-snug">{x.title}</div>
                    <p className="relative z-10 text-[14px] opacity-75 mt-1 leading-snug">{x.plain}</p>
                    <div className="relative z-10 flex items-center gap-3 mt-3 text-[12px] font-semibold">
                      <span className="flex items-center gap-1">Risk {[1, 2, 3, 4, 5].map((k) => <i key={k} className={`w-1.5 h-3 rounded-full ${k <= x.risk ? 'bg-[#111113]' : 'bg-black/15'}`} />)} {riskLabels[x.risk]}</span>
                      <span className="opacity-75">{x.potential}</span>
                      <span className="opacity-75 flex items-center gap-1"><Clock size={11} />{x.horizon}</span>
                    </div>
                    <Press onClick={() => openMoney({ mode: 'buy', target: x.ticker })} className="relative z-10 mt-3 h-11 px-5 rounded-full bg-[#111113] text-pure text-[14px] font-semibold flex items-center gap-1">
                      Invest <ChevronRight size={16} />
                    </Press>
                  </div>
                )
              })}
              <p className="text-[12px] text-mute">Prices are demo data. Not investment advice.</p>
            </div>
          )}

          {tab === 'taxes' && (
            <div className="mt-3">
              <p className="text-[14px] text-black/65">When you sell with a profit, tax is taken from the payout automatically. The rate depends on how much profit you’ve made this year.</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {[['Profit sold', signedUsd(s.realized, 0)], ['Tax withheld', usd(s.taxWithheld, 0)], ['Your rate', `${Math.round(fin.bracketRate(Math.max(s.realized, 0)) * 100)}%`]].map(([l, v]) => (
                  <div key={l} className="rounded-[16px] bg-black/[0.04] p-2.5"><div className="text-[12px] text-mute">{l}</div><div className="text-[16px] font-semibold tnum">{v}</div></div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-3">
                {TAX_BRACKETS.map((b, i) => {
                  const lo = i ? TAX_BRACKETS[i - 1].upTo : 0
                  const on = s.realized > lo && s.realized <= b.upTo || (i === 0 && s.realized <= 0)
                  return <div key={i} className={`flex-1 rounded-xl py-2 text-center text-[12px] ${on ? 'bg-[#111113] text-pure' : 'bg-black/[0.04] text-black/55'}`}><b>{Math.round(b.rate * 100)}%</b> {b.upTo === Infinity ? `over $${fmt(lo, 0)}` : `to $${fmt(b.upTo, 0)}`}</div>
                })}
              </div>
              <p className="text-[14px] text-black/65 mt-3 tnum">If you sold everything today: profit {signedUsd(portfolio.pnl, 0)}, tax ≈ <b>{usd(estTax, 0)}</b>.</p>
              <p className="text-[12px] text-mute mt-2">Demo tax rules — real rates depend on your country.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
