import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Signal, Wifi, BatteryFull } from 'lucide-react'
import { usePocket } from './store'
import { NavBar, Toast, Success } from './components/kit'
import MoneySheet from './components/MoneySheet'
import { BillSheet, CatSheet, GoalSheet, GoalMenu, ProfileSheet, ExplainSheet } from './components/Forms'
import Home from './screens/Home'
import Budget from './screens/Budget'
import Goals from './screens/Goals'
import Invest from './screens/Invest'
import Onboarding from './screens/Onboarding'

// iPhone 13 Pro status bar for the desktop frame
function StatusBar() {
  return (
    <div className="absolute top-0 inset-x-0 z-[46] h-[47px] flex items-center justify-between px-[30px] pt-[3px] text-[16px] font-semibold text-white pointer-events-none">
      <span className="tnum w-[54px] text-center">9:41</span>
      <div className="flex items-center gap-[6px] w-[78px] justify-end">
        <Signal size={16} strokeWidth={2.8} /><Wifi size={16} strokeWidth={2.8} /><BatteryFull size={24} strokeWidth={1.8} />
      </div>
    </div>
  )
}

const ORDER = ['budget', 'home', 'goals', 'invest']

export default function App() {
  const fin = usePocket()
  const [tab, setTabState] = useState('home')
  const [dir, setDir] = useState(0)
  const [money, setMoney] = useState({ open: false, init: null })
  const [sheet, setSheet] = useState(null) // { type, id }
  const [success, setSuccess] = useState(null)

  const setTab = (t) => { setDir(ORDER.indexOf(t) > ORDER.indexOf(tab) ? 1 : -1); setTabState(t) }
  const openMoney = (init) => { setSheet(null); setMoney({ open: true, init }) }
  const openSheet = (s) => setSheet(s)
  const closeSheet = () => setSheet(null)
  const props = { fin, openMoney, openSheet, setTab }

  return (
    <div className="h-full w-full flex sm:py-8 sm:overflow-auto">
      {/* full screen on a phone, iPhone 13 Pro frame (390×844) on a desktop */}
      <div className="relative w-full h-full sm:m-auto sm:shrink-0 sm:w-[412px] sm:h-[866px] sm:rounded-[58px] sm:p-[11px] sm:bg-[#1B1C1F] sm:shadow-[0_0_0_2px_#3A3C41,0_50px_100px_-20px_rgba(20,30,50,0.45)]">
        <div className="relative w-full h-full bg-[#0E0F11] overflow-hidden sm:rounded-[47px] isolate">
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-[162px] h-[32px] rounded-b-[20px] bg-black z-[60]" />
          <div className="hidden sm:block"><StatusBar /></div>
          <div className="hidden sm:block absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full bg-white/80 z-[60] pointer-events-none" />

          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div key={tab} custom={dir}
              initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto no-scrollbar">
              {tab === 'home' && <Home {...props} />}
              {tab === 'budget' && <Budget {...props} />}
              {tab === 'goals' && <Goals {...props} />}
              {tab === 'invest' && <Invest {...props} />}
            </motion.div>
          </AnimatePresence>

          <NavBar tab={tab} setTab={setTab} />

          <MoneySheet open={money.open} init={money.init} fin={fin} onClose={() => setMoney((m) => ({ ...m, open: false }))} onSuccess={setSuccess} />
          <BillSheet open={sheet?.type === 'bill'} id={sheet?.id} fin={fin} onClose={closeSheet} />
          <CatSheet open={sheet?.type === 'cat'} id={sheet?.id} fin={fin} onClose={closeSheet} />
          <GoalSheet open={sheet?.type === 'goal'} id={sheet?.id} fin={fin} onClose={closeSheet} />
          <GoalMenu open={sheet?.type === 'goalMenu'} id={sheet?.id} fin={fin} onClose={closeSheet}
            openMoney={openMoney} openGoal={(id) => setSheet({ type: 'goal', id })} />
          <ProfileSheet open={sheet?.type === 'profile'} fin={fin} onClose={closeSheet} />
          <ExplainSheet open={sheet?.type === 'explain'} fin={fin} onClose={closeSheet} />

          <Success data={success} onClose={() => setSuccess(null)} />
          <Toast toast={fin.toast} onUndo={fin.runUndo} />

          <AnimatePresence>{!fin.s.onboarded && <Onboarding key="onb" fin={fin} />}</AnimatePresence>
        </div>
      </div>
    </div>
  )
}
