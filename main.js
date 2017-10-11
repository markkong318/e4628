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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let loginWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // mainWindow = null
  })

  // Hide on production mode
  // mainWindow.hide()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

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
  {label: 'Login'},
  {type: 'separator'},
  {label: 'Hide Debug Webview', click: showWebviewHandler},
  {type: 'separator'},
  {label: 'Exit', accelerator: 'Command+Q', click: () => { app.quit() }}
];

let appIcon = null;
app.on('ready', () => {
  appIcon = new Tray('app/img/tray-icon-rakuten@2x.png');
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
      console.log('click')
      mainWindow.webContents.send('main-clickDismiss')
    }
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

ipcMain.on('main-getOwner', (ev, owner) => {
  const template = appIconTemplate[0];
  console.log(owner);
  if (owner) {
    template.label = `${owner}`
  } else {
    template.label = `Unknown user`
  }

  const contextMenu = Menu.buildFromTemplate(appIconTemplate);
  appIcon.setContextMenu(contextMenu)
})

app.on('window-all-closed', function () {
  if (appIcon) appIcon.destroy()
})

function createLoginWindow() {

  loginWindow = new BrowserWindow({frame: false, width: 375, height: 667})

  loginWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/login.html'),
    protocol: 'file:',
    slashes: true
  }))
}

ipcMain.on('main-saveAuth', (ev) => {
  loginWindow.hide()
  mainWindow.webContents.send('main-saveAuth')
})

app.on('ready', createLoginWindow)