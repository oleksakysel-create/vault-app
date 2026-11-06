// Starts Electron for `npm run desktop`. Adds --no-sandbox only when running
// as root on Linux (containers/CI); on macOS it is a plain `electron .`.
const { spawn } = require('child_process')
const electron = require('electron')
const path = require('path')

const args = [path.join(__dirname, '..')]
if (process.platform === 'linux' && process.getuid?.() === 0) args.push('--no-sandbox')

const child = spawn(electron, args, { stdio: 'inherit', env: { ...process.env, ELECTRON_DEV: '1' } })
child.on('close', (code) => process.exit(code ?? 0))
