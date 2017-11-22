const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const ipcMain = require('electron').ipcMain;

let mainWindow
let loginWindow

function createWindow() {
  mainWindow = new BrowserWindow({width: 800, height: 600})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    app.quit()
  })

  mainWindow.hide()
}

function createLoginWindow() {

  loginWindow = new BrowserWindow({frame: false, width: 375, height: 667})

  loginWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/login.html'),
    protocol: 'file:',
    slashes: true
  }))

  loginWindow.setResizable(false)

  loginWindow.hide()
}

ipcMain.on('main-saveAuth', (ev) => {
  loginWindow.hide()
  mainWindow.webContents.send('webview-saveAuth')
})

app.on('ready', () => {
  createWindow()
  createLoginWindow()

  electron.powerMonitor.on('resume', () => {
    mainWindow.webContents.send('webview-resume')
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('window-all-closed', function () {
  if (appIcon) appIcon.destroy()
})

app.dock.hide()


const appIconIndex = {
    OWNER:            0,
    ARRIVE_TIME:      2,
    DISMISS_TIME:     3,
    WEBVEIW_HANDLER:  8,
}

const showWebviewHandler = () => {
  const template = appIconTemplate[appIconIndex.WEBVEIW_HANDLER];

  if (mainWindow.isVisible()) {
    mainWindow.hide()
    template.label = 'Show Debug Webview'
  } else {
    mainWindow.show()
    template.label = 'Hide Debug Webview'
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
}

const syncStateHandler = () => {
  mainWindow.webContents.send('webview-clickSyncState')
}

const appIconTemplate = [
  {label: 'Initialize user name...', enabled: false},
  {type: 'separator'},
  {label: 'Initialize arrive...', enabled: false},
  {label: 'Initialize dismiss...', enabled: false},
  {type: 'separator'},
  {label: 'Login', click: () => { loginWindow.show() }},
  {type: 'separator'},
  {label: 'Sync State', click: syncStateHandler},
  {label: 'Show Debug Webview', click: showWebviewHandler},
  {type: 'separator'},
  {label: 'Exit', accelerator: 'Command+Q', click: () => { app.quit() }}
];

let appIcon = null;
app.on('ready', () => {
  appIcon = new Tray(__dirname + '/app/img/tray-icon-rakuten@2x.png');
  const contextMenu = Menu.buildFromTemplate(appIconTemplate);

  appIcon.setToolTip('Rakuten Games')
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getArriveTime', (ev, dt) => {
  const arriveTemplate = appIconTemplate[appIconIndex.ARRIVE_TIME]
  const dismissTemplate = appIconTemplate[appIconIndex.DISMISS_TIME]

  if (dt) {
    arriveTemplate.label = `Arrive on ${dt}`
    arriveTemplate.enabled = false
    arriveTemplate.click = null
  } else {
    arriveTemplate.label = `Click to Arrive`
    arriveTemplate.enabled = true
    arriveTemplate.click = () => {
      mainWindow.webContents.send('webview-clickArrive')
    }

    dismissTemplate.enabled = false
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getDismissTime', (ev, dt) => {
  const dismissTemplate = appIconTemplate[appIconIndex.DISMISS_TIME]

  if (dt) {
    dismissTemplate.label = `Dismiss on ${dt}`
    dismissTemplate.enabled = false
    dismissTemplate.click = null
  } else {
    dismissTemplate.label = `Click to Dismiss`
    dismissTemplate.enabled = true
    dismissTemplate.click = () => {
      mainWindow.webContents.send('webview-clickDismiss')
    }
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getOwner', (ev, owner) => {
  const template = appIconTemplate[appIconIndex.OWNER]
  if (owner) {
    template.label = `${owner}`
  } else {
    template.label = `Unknown user`
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-showLogin', (ev) => {
  loginWindow.show()
})

