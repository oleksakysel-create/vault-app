import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScanFace, Bell, EyeOff, CreditCard, LogOut, ChevronRight, ChevronLeft, Crown, Mail, CalendarDays, Flame } from 'lucide-react'
import { Card, Tap, Toggle, money } from '../components/ui'
import { user } from '../data'

function Row({ icon: Icon, color, label, right, last, onClick }) {
  return (
    <motion.div role="button" whileTap={{ backgroundColor: 'rgba(255,255,255,0.04)' }} onClick={onClick} className="w-full flex items-center gap-3 pl-4 text-left cursor-pointer">
      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: color }}><Icon size={17} className="text-white" /></div>
      <div className={`flex-1 min-w-0 flex items-center justify-between gap-3 py-3 pr-4 ${last ? '' : 'border-b border-white/[0.06]'}`}>
        <span className="text-[16px] shrink-0">{label}</span>
        {right ?? <ChevronRight size={18} className="text-white/25" />}
      </div>
    </motion.div>
  )
}

const Value = ({ children }) => <span className="text-white/45 text-[15px] truncate tnum">{children}</span>
const GroupTitle = ({ children }) => <div className="mt-7 mb-2 px-4 text-[13px] text-white/45 uppercase tracking-wide">{children}</div>

export default function Profile({ premium, setPremium, hidden, setHidden, setSheet, onBack, netWorth, incomes }) {
  const [faceId, setFaceId] = useState(true)
  const [push, setPush] = useState(true)
  const monthly = incomes.reduce((s, x) => s + x.amount, 0)

  return (
    <div className="px-4">
      {/* iOS navigation bar */}
      <div className="relative flex items-center h-11 -mx-2">
        <button onClick={onBack} className="flex items-center text-neon text-[17px] active:opacity-50">
          <ChevronLeft size={28} strokeWidth={2.2} className="-mr-0.5" /> Home
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold">Profile</span>
      </div>

      <div className="flex flex-col items-center pt-4">
        <div className="rounded-full p-[3px] bg-gradient-to-br from-violet to-neon"><div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-violet to-[#3b1a7a] border-[3px] border-ink flex items-center justify-center text-[34px] font-extrabold">{user.name[0]}</div></div>
        <div className="text-[24px] font-extrabold mt-3 flex items-center gap-2">{user.name} {premium && <Crown size={20} className="text-neon" />}</div>
        <div className="text-[14px] text-white/45">{user.handle}</div>
      </div>

      <GroupTitle>Account</GroupTitle>
      <Card className="overflow-hidden">
        <Row icon={Mail} color="#3B82F6" label="Email" right={<Value>{user.email}</Value>} />
        <Row icon={CalendarDays} color="#64748B" label="Member since" right={<Value>{user.memberSince}</Value>} />
        <Row icon={Flame} color="#F97316" label="Streak" right={<Value>{user.streak} days</Value>} />
        <Row icon={CreditCard} color="#7C3AED" label="Plan" last onClick={() => (premium ? setPremium(false) : setSheet({ type: 'paywall' }))}
          right={<span className="flex items-center gap-1"><Value>{premium ? 'Premium' : 'Free'}</Value><ChevronRight size={18} className="text-white/25" /></span>} />
      </Card>

      <GroupTitle>Overview</GroupTitle>
      <Card className="grid grid-cols-2 divide-x divide-white/[0.06]">
        <div className="p-4">
          <div className="text-[12px] text-white/45">Balance</div>
          <div className="text-[20px] font-bold mt-0.5 tnum">{hidden ? '•••' : money(netWorth, 0)}</div>
        </div>
        <div className="p-4">
          <div className="text-[12px] text-white/45">Income this month</div>
          <div className="text-[20px] font-bold mt-0.5 tnum">{hidden ? '•••' : money(monthly, 0)}</div>
        </div>
      </Card>

      {!premium && (
        <Tap onClick={() => setSheet({ type: 'paywall' })} className="w-full mt-4 relative overflow-hidden rounded-[22px] px-4 py-3.5 text-left bg-gradient-to-br from-violet to-[#3b1a7a] shadow-violet flex items-center gap-3">
          <Crown size={22} />
          <div className="flex-1">
            <div className="text-[15px] font-bold">Vault Premium</div>
            <div className="text-[12px] text-white/75">Custom and advanced budget categories</div>
          </div>
          <span className="text-[12px] font-bold bg-white text-ink rounded-full px-3 py-1.5">Try free</span>
        </Tap>
      )}

      <GroupTitle>Settings</GroupTitle>
      <Card className="overflow-hidden">
        <Row icon={ScanFace} color="#22C55E" label="Face ID" right={<Toggle on={faceId} onChange={setFaceId} />} />
        <Row icon={EyeOff} color="#64748B" label="Hide balances" right={<Toggle on={hidden} onChange={setHidden} />} />
        <Row icon={Bell} color="#EF4444" label="Notifications" last right={<Toggle on={push} onChange={setPush} />} />
      </Card>

      <Tap className="w-full mt-6 rounded-[22px] bg-card border border-line py-3.5 text-loss font-semibold flex items-center justify-center gap-2">
        <LogOut size={18} /> Sign out
      </Tap>
    </div>
  )
}
