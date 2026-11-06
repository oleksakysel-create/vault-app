import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScanFace, Bell, EyeOff, CreditCard, LogOut, ChevronRight, ChevronLeft, Crown, Mail, CalendarDays, Flame, RotateCcw, Smartphone, Share } from 'lucide-react'
import { Card, Tap, Toggle, money } from '../components/ui'
import { user } from '../data'

function Row({ icon: Icon, color, label, right, last, onClick }) {
  return (
    <motion.div role={onClick ? 'button' : undefined} whileTap={onClick ? { backgroundColor: 'rgb(var(--fg) / 0.05)' } : undefined} onClick={onClick}
      className={`w-full flex items-center gap-3 pl-4 text-left min-h-[52px] ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: color }}><Icon size={17} className="text-pure" /></div>
      <div className={`flex-1 min-w-0 flex items-center justify-between gap-3 py-3 pr-4 ${last ? '' : 'border-b border-line'}`}>
        <span className="text-[16px] shrink-0">{label}</span>
        {right ?? <ChevronRight size={18} className="text-white/35" />}
      </div>
    </motion.div>
  )
}

const Value = ({ children }) => <span className="text-white/60 text-[15px] truncate tnum">{children}</span>
const GroupTitle = ({ children }) => <div className="mt-7 mb-2 px-4 text-[13px] text-white/60 uppercase tracking-wide font-medium">{children}</div>

export default function Profile({ fin, notify, premium, setPremium, hidden, setHidden, setSheet, onBack, netWorth, incomes }) {
  const [faceId, setFaceId] = useState(true)
  const [push, setPush] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false) // in-app confirmation, no system dialog
  const monthly = incomes.reduce((s, x) => s + x.amount, 0)

  // native share sheet on iPhone; copy the link where sharing isn't available
  const APP_URL = 'https://oleksakysel-create.github.io/vault-app/'
  const shareApp = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Vault', text: 'Know exactly what you can spend', url: APP_URL }); return }
    } catch (e) { if (e?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(APP_URL); notify({ title: 'Link copied', sub: APP_URL, emoji: '✅' }) }
    catch { notify({ title: 'Share this link', sub: APP_URL, emoji: '↗️' }) }
  }

  return (
    <div className="px-4">
      {/* iOS navigation bar */}
      <div className="relative flex items-center h-11 -mx-2">
        <button onClick={onBack} className="flex items-center text-accent text-[17px] min-h-[44px] pr-3 active:opacity-50">
          <ChevronLeft size={28} strokeWidth={2.2} className="-mr-0.5" /> Home
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold">Profile</span>
      </div>

      <div className="flex flex-col items-center pt-4">
        <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-violet to-[#4C1D95] flex items-center justify-center text-[36px] font-extrabold text-pure">{user.name[0]}</div>
        <div className="text-[24px] font-extrabold mt-3 flex items-center gap-2">{user.name} {premium && <Crown size={20} className="text-accent" />}</div>
        <div className="text-[15px] text-white/60">{user.handle}</div>
      </div>

      {/* streak lives here now — motivating, but not needed on Home */}
      <Card className="mt-6 px-4 py-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center"><Flame size={22} className="text-orange-500" /></div>
        <div className="flex-1">
          <div className="text-[15px] font-semibold">{user.streak} days in a row in the green</div>
          <div className="text-[13px] text-mute">7 more days for the “Iron Will” badge</div>
        </div>
      </Card>

      <GroupTitle>Overview</GroupTitle>
      <Card className="grid grid-cols-2 divide-x divide-white/[0.08]">
        <div className="p-4">
          <div className="text-[13px] text-white/60">Net worth</div>
          <div className="text-[20px] font-bold mt-0.5 tnum">{hidden ? '•••' : money(netWorth, 0)}</div>
        </div>
        <div className="p-4">
          <div className="text-[13px] text-white/60">Income this month</div>
          <div className="text-[20px] font-bold mt-0.5 tnum">{hidden ? '•••' : money(monthly, 0)}</div>
        </div>
      </Card>

      <GroupTitle>Account</GroupTitle>
      <Card className="overflow-hidden">
        <Row icon={Mail} color="#3B82F6" label="Email" right={<Value>{user.email}</Value>} />
        <Row icon={CalendarDays} color="#64748B" label="Member since" right={<Value>{user.memberSince}</Value>} />
        <Row icon={CreditCard} color="#7C3AED" label="Plan" last onClick={() => (premium ? setPremium(false) : setSheet({ type: 'paywall' }))}
          right={<span className="flex items-center gap-1"><Value>{premium ? 'Premium' : 'Free'}</Value><ChevronRight size={18} className="text-white/35" /></span>} />
      </Card>

      {!premium && (
        <Tap onClick={() => setSheet({ type: 'paywall' })} className="w-full mt-4 rounded-[22px] px-4 py-3.5 text-left bg-gradient-to-br from-violet to-[#4C1D95] text-pure flex items-center gap-3">
          <Crown size={22} />
          <div className="flex-1">
            <div className="text-[15px] font-bold">Vault Premium</div>
            <div className="text-[13px] opacity-80">AI forecasts and smart alerts</div>
          </div>
          <span className="text-[13px] font-bold bg-pure text-onbright rounded-full px-3 h-9 flex items-center">Try free</span>
        </Tap>
      )}

      <GroupTitle>Appearance</GroupTitle>
      <Card className="p-1.5">
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Theme">
          {[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([id, l]) => (
            <button key={id} role="radio" aria-checked={fin.theme === id} onClick={() => fin.setTheme(id)}
              className={`h-11 rounded-[14px] text-[15px] font-semibold ${fin.theme === id ? 'bg-violet text-pure' : 'text-white/70'}`}>{l}</button>
          ))}
        </div>
      </Card>

      <GroupTitle>Privacy & security</GroupTitle>
      <Card className="overflow-hidden">
        <Row icon={ScanFace} color="#22C55E" label="Face ID" right={<Toggle on={faceId} onChange={setFaceId} label="Face ID" />} />
        <Row icon={EyeOff} color="#64748B" label="Hide balances" right={<Toggle on={hidden} onChange={setHidden} label="Hide balances" />} />
        <Row icon={Bell} color="#EF4444" label="Notifications" last right={<Toggle on={push} onChange={setPush} label="Notifications" />} />
      </Card>
      <div className="text-[13px] text-mute px-4 mt-2">Amounts are hidden automatically when you leave the app.</div>

      <GroupTitle>Prototype</GroupTitle>
      <Card className="overflow-hidden">
        <Row icon={Share} color="#7C3AED" label="Share Vault" onClick={shareApp} right={<Value>Send link</Value>} />
        <Row icon={Smartphone} color="#0EA5E9" label="Home Screen widget" right={<Value>Coming soon</Value>} />
        <Row icon={RotateCcw} color="#F59E0B" label={confirmReset ? 'Tap again to reset' : 'Reset demo data'} last
          onClick={() => (confirmReset ? fin.resetDemo() : (setConfirmReset(true), setTimeout(() => setConfirmReset(false), 4000)))}
          right={confirmReset ? <span className="text-[14px] text-loss font-semibold">All data will be cleared</span> : undefined} />
      </Card>

      <Tap className="w-full mt-6 rounded-[22px] bg-card border border-line h-[52px] text-loss font-semibold flex items-center justify-center gap-2">
        <LogOut size={18} /> Sign out
      </Tap>
    </div>
  )
}
