const electron = require('electron')
// Module to control application life.
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
// Module to create native browser window.
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

  // mainWindow.hide()
}

function createLoginWindow() {

  loginWindow = new BrowserWindow({frame: false, width: 375, height: 667})

  loginWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/login.html'),
    protocol: 'file:',
    slashes: true
  }))

  loginWindow.hide()
}

ipcMain.on('main-saveAuth', (ev) => {
  loginWindow.hide()
  mainWindow.webContents.send('main-saveAuth')
})

app.on('ready', () => {
  createWindow()
  createLoginWindow()

  electron.powerMonitor.on('resume', () => {
    mainWindow.webContents.send('main-resume')
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


const showWebviewHandler = () => {
  const template = appIconTemplate[7];

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

const appIconTemplate = [
  {label: 'Initialize user name...', enabled: false},
  {type: 'separator'},
  {label: 'Initialize arrive...', enabled: false},
  {label: 'Initialize dismiss...', enabled: false},
  {type: 'separator'},
  {label: 'Login', click: () => { loginWindow.show() }},
  {type: 'separator'},
  {label: 'Hide Debug Webview', click: showWebviewHandler},
  {type: 'separator'},
  {label: 'Exit', accelerator: 'Command+Q', click: () => { app.quit() }}
];

let appIcon = null;
app.on('ready', () => {
  appIcon = new Tray(__dirname + '/app/img/tray-icon-rakuten@2x.png');
  const contextMenu = Menu.buildFromTemplate(appIconTemplate);

  appIcon.setToolTip('Rakuten Games');
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getArrivalTime', (ev, dt) => {
  const template = appIconTemplate[2];

  if (dt) {
    template.label = `Arrival on ${dt}`
    template.enabled = false
    template.click = null
  } else {
    template.label = `Click to Arrive`
    template.enabled = true
    template.click = () => {
      mainWindow.webContents.send('main-clickArrive')
    }
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getDismissTime', (ev, dt) => {
  const template = appIconTemplate[3];

  if (dt) {
    template.label = `Dismiss on ${dt}`
    template.enabled = false
    template.click = null
  } else {
    template.label = `Click to Dismiss`
    template.enabled = true
    template.click = () => {
      mainWindow.webContents.send('main-clickDismiss')
    }
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getOwner', (ev, owner) => {
  const template = appIconTemplate[0];
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