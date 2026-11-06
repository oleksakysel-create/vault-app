const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

const isDev = !app.isPackaged && process.env.ELECTRON_DEV === '1'
const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5173'


function createWindow() {
  const win = new BrowserWindow({
    width: 393,
    height: 852,
    minWidth: 360,
    minHeight: 640,
    resizable: true,
    title: 'Vault',
    backgroundColor: '#0D0F12',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // open external links in the default browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
