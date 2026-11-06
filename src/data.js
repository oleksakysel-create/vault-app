// ───────────────────────── Mock data ─────────────────────────

export const user = {
  name: 'Alexandra',
  email: 'alexandra@vault.app',
  memberSince: 'March 2024',
  handle: '@alexandra',
  level: 7,
  xp: 2340,
  xpNext: 3000,
  streak: 24,
}

export const incomeSources = [
  { id: 'salary', name: 'Salary', sub: 'Product Designer · Acme Inc', amount: 4200, emoji: '💼', color: '#7C3AED', trend: 0 },
  { id: 'freelance', name: 'Freelance', sub: '3 active projects', amount: 1850, emoji: '🧑‍💻', color: '#00F59B', trend: 18.4 },
  { id: 'business', name: 'Business', sub: 'Bean & Co. coffee shop', amount: 960, emoji: '☕️', color: '#38BDF8', trend: 6.2 },
  { id: 'passive', name: 'Passive income', sub: 'Dividends & cashback', amount: 214, emoji: '🌱', color: '#F59E0B', trend: 2.1 },
  { id: 'gifts', name: 'Gifts', sub: 'Birthday from friends', amount: 150, emoji: '🎁', color: '#F472B6', trend: 0 },
  { id: 'family', name: 'Family support', sub: 'Help from parents', amount: 300, emoji: '👨‍👩‍👧', color: '#FBBF24', trend: 0 },
]

export const initialGoals = [
  { id: 'trip', name: 'Trip to Japan', sub: 'Tokyo · April', emoji: '🗾', saved: 2380, target: 3500, color: '#00F59B' },
  { id: 'mac', name: 'New Mac', sub: 'MacBook Pro 16″', emoji: '💻', saved: 1640, target: 2899, color: '#7C3AED' },
  { id: 'cushion', name: 'Emergency fund', sub: '6 months of expenses', emoji: '🛟', saved: 7900, target: 12000, color: '#38BDF8' },
]

export const fixedExpenses = [
  { id: 'rent', name: 'Rent', sub: 'Due on the 1st', amount: 1100, emoji: '🏠', paid: true },
  { id: 'utils', name: 'Utilities', sub: 'Power, water, gas', amount: 142, emoji: '💡', paid: true },
  { id: 'net', name: 'Internet & phone', sub: 'Due Nov 12', amount: 38, emoji: '📶', paid: false },
  { id: 'subs', name: 'Subscriptions', sub: 'Spotify, iCloud, Netflix', amount: 41, emoji: '🎧', paid: false },
  { id: 'gym', name: 'Gym', sub: 'Due Nov 15', amount: 55, emoji: '🏋️', paid: false },
  { id: 'tax', name: 'Income tax', sub: 'Q4 estimate · due Dec 15', amount: 620, emoji: '🧾', paid: false },
]

export const variableExpenses = [
  { id: 'shop', name: 'Shopping', spent: 386, limit: 500, emoji: '🛍️', color: '#00F59B' },
  { id: 'food', name: 'Restaurants', spent: 412, limit: 400, emoji: '🍜', color: '#FF4D6D' },
  { id: 'groc', name: 'Groceries', spent: 268, limit: 450, emoji: '🥑', color: '#38BDF8' },
  { id: 'vac', name: 'Vacation', spent: 120, limit: 600, emoji: '🏝️', color: '#F59E0B' },
]

export const CATEGORY_COLORS = ['#00F59B', '#7C3AED', '#38BDF8', '#F59E0B', '#F472B6', '#FF4D6D']
export const CATEGORY_EMOJIS = ['🛍️', '🍜', '🥑', '🏝️', '🚕', '🎬', '🐶', '🧸', '🚗', '💊', '🎁', '📚']
export const GOAL_EMOJIS = ['✈️', '🚗', '🏡', '💍', '🎸', '📱', '🎓', '🐶', '🏍️', '🎮', '🛟', '💻']

// ───────── Investment tax (demo rules) ─────────
// Tax on realised profit for the calendar year, charged by bracket.
export const TAX_BRACKETS = [
  { upTo: 1000, rate: 0 },
  { upTo: 10000, rate: 0.15 },
  { upTo: Infinity, rate: 0.2 },
]
export function taxOnProfit(profit) {
  let tax = 0
  let prev = 0
  for (const b of TAX_BRACKETS) {
    if (profit <= prev) break
    tax += (Math.min(profit, b.upTo) - prev) * b.rate
    prev = b.upTo
  }
  return Math.max(tax, 0)
}
export function bracketRate(profit) {
  return (TAX_BRACKETS.find((b) => profit <= b.upTo) || TAX_BRACKETS[TAX_BRACKETS.length - 1]).rate
}
// already sold earlier this year
export const initialRealized = 2400

// Market / assets. price is current, change is today's %
export const assets = {
  VOO: { ticker: 'VOO', name: 'S&P 500 ETF', type: 'ETF', price: 548.32, change: 1.12, color: '#00F59B', emoji: '📈' },
  AAPL: { ticker: 'AAPL', name: 'Apple', type: 'Stocks', price: 241.87, change: 2.64, color: '#A3A3A3', emoji: '🍏' },
  NVDA: { ticker: 'NVDA', name: 'NVIDIA', type: 'Stocks', price: 186.4, change: 4.21, color: '#76B900', emoji: '🟩' },
  TSLA: { ticker: 'TSLA', name: 'Tesla', type: 'Stocks', price: 312.55, change: -2.38, color: '#E11D48', emoji: '⚡️' },
  BTC: { ticker: 'BTC', name: 'Bitcoin', type: 'Crypto', price: 98420, change: 5.73, color: '#F7931A', emoji: '₿' },
  ETH: { ticker: 'ETH', name: 'Ethereum', type: 'Crypto', price: 3612, change: -1.15, color: '#8B5CF6', emoji: '◆' },
  VNQ: { ticker: 'VNQ', name: 'Real Estate ETF', type: 'Real Estate', price: 94.18, change: 0.42, color: '#38BDF8', emoji: '🏢' },
}

export const initialHoldings = [
  { ticker: 'VOO', qty: 14.2, avg: 462.1 },
  { ticker: 'AAPL', qty: 22, avg: 198.4 },
  { ticker: 'NVDA', qty: 30, avg: 121.7 },
  { ticker: 'TSLA', qty: 8, avg: 344.9 },
  { ticker: 'BTC', qty: 0.085, avg: 61200 },
  { ticker: 'ETH', qty: 1.4, avg: 3890 },
]

export const showcase = [
  {
    ticker: 'VOO',
    category: 'ETF',
    title: 'The whole US market in one tap',
    plain: 'You buy a slice of America’s 500 biggest companies at once. If one drops, the others carry it.',
    risk: 2,
    potential: '≈ 8–10% a year',
    horizon: '5+ years',
    gradient: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
  },
  {
    ticker: 'NVDA',
    category: 'Stocks',
    title: 'Betting on one company',
    plain: 'It can grow fast — and fall fast. Like rooting for one team instead of the whole league.',
    risk: 4,
    potential: 'up to 30%+ a year',
    horizon: '3+ years',
    gradient: 'from-lime-500/25 via-lime-500/5 to-transparent',
  },
  {
    ticker: 'BTC',
    category: 'Crypto',
    title: 'A roller coaster',
    plain: 'The price can swing 20% in a week — either way. Only put in what you can afford to lose.',
    risk: 5,
    potential: '2x or −50%',
    horizon: '4+ years',
    gradient: 'from-orange-500/25 via-orange-500/5 to-transparent',
  },
  {
    ticker: 'VNQ',
    category: 'Real Estate',
    title: 'Property without a mortgage',
    plain: 'You co-own homes and offices and get a share of the rent every quarter.',
    risk: 2,
    potential: '≈ 4% + dividends',
    horizon: '5+ years',
    gradient: 'from-sky-500/25 via-sky-500/5 to-transparent',
  },
]

export const riskLabels = ['', 'Very calm', 'Calm', 'Moderate', 'Bumpy', 'Extreme']

export const recentActivity = [
  { id: 1, title: 'Upwork · Startup landing page', time: 'Today, 10:24 AM', amount: 640, emoji: '🧑‍💻' },
  { id: 2, title: 'Whole Foods', time: 'Today, 8:51 AM', amount: -34.2, emoji: '🥑' },
  { id: 3, title: 'Bought NVDA', time: 'Yesterday, 5:02 PM', amount: -372.8, emoji: '🟩' },
  { id: 4, title: 'Bean & Co. · revenue', time: 'Yesterday, 9:00 PM', amount: 212, emoji: '☕️' },
]

// Deterministic pseudo-random walk for charts
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeSeries(seed, points, end, drift, vol) {
  const rnd = mulberry32(seed)
  const raw = [1]
  for (let i = 1; i < points; i++) {
    const shock = (rnd() - 0.5) * 2 * vol
    raw.push(raw[i - 1] * (1 + drift / points + shock))
  }
  const k = end / raw[raw.length - 1]
  return raw.map((v) => v * k)
}

export const ranges = [
  { id: '1D', label: '1D', points: 60, drift: 0.034, vol: 0.004, seed: 11 },
  { id: '1W', label: '1W', points: 56, drift: 0.05, vol: 0.008, seed: 23 },
  { id: '1M', label: '1M', points: 60, drift: 0.09, vol: 0.012, seed: 7 },
  { id: '1Y', label: '1Y', points: 80, drift: 0.38, vol: 0.022, seed: 42 },
  { id: 'ALL', label: 'All', points: 90, drift: 0.85, vol: 0.03, seed: 99 },
]
