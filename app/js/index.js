const ipcMain = require('electron').remote.ipcMain
const ipcRenderer = require('electron').ipcRenderer
const store = require('store')
const moment = require('moment');
require('./webapi')

const webview = document.querySelector('webview')
const web_api = new WebApi(webview)

const loginHandler = (opt) => {
  web_api.loadLoginURL()
    .then(() => web_api.syncStore())
    .then(() => web_api.login())
    .then(() => {
      if (!web_api.isLogin()) {
        ipcRenderer.send('main-showLogin')

        return Promise.reject('Login failed\nPlease check the login data')
      }
    })
    .then(() => {
      web_api.getArrivalTime()
      web_api.getDismissTime()
      web_api.getOwner()
        .then((name) => {

          if (opt &&'silent' in opt && opt.silent) {
            return
          }

          const notification = {
            title: 'RGames',
            body: `Hi! Welcome back \n${name}`
          }

          new window.Notification(notification.title, notification)
        })
    })
    .catch((msg) => {
      if (opt &&'silent' in opt && opt.silent) {
        return
      }

      if (msg) {
        const notification = {
          title: 'RGames',
          body: msg
        }
        new window.Notification(notification.title, notification)
      }
    })
}

const initialDomReadyHandler = () => {
  webview.removeEventListener('dom-ready', initialDomReadyHandler)
  webview.openDevTools()
  loginHandler();
}

webview.addEventListener('dom-ready', initialDomReadyHandler);

ipcMain.on(`webview-getArrivalTime`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getArrivalTime', value)
  web_api.resolveDeferred(deferred_id, value)
})

ipcMain.on(`webview-getDismissTime`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getDismissTime', value)
  web_api.resolveDeferred(deferred_id, value)
})

ipcMain.on(`webview-getOwner`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getOwner', value)
  web_api.resolveDeferred(deferred_id, value)
})

ipcRenderer.on(`webview-clickDismiss`, (event, value) => {
  console.log('click dismiss')
  web_api.loadLoginURL()
    .then(() => web_api.login())
    .then(() => web_api.dismiss())
    .then(() => {
      web_api.getDismissTime()
        .then((time) => {
          const notification = {
            title: 'RGames',
            body: `You dismissed at ${time}`
          }

          new window.Notification(notification.title, notification)
        })
    })
});

ipcRenderer.on(`webview-clickArrive`, (event, value) => {
  console.log('click arrive')
  web_api.loadLoginURL()
    .then(() => web_api.login())
    .then(() => web_api.arrival())
    .then(() => {
      console.log('arrival')
      web_api.getArrivalTime()
        .then((time) => {
          const notification = {
            title: 'RGames',
            body: `You dismissed at ${time}`
          }

          new window.Notification(notification.title, notification)
        })
    })
});

ipcRenderer.on(`webview-saveAuth`, (event) => {
  loginHandler()
})

ipcRenderer.on(`webview-resume`, (event) => {

  const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 5000)
  })

  promise.then(() => {
    loginHandler({silent: true})
  })
  
})
