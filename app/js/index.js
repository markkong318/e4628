const ipcMain = require('electron').remote.ipcMain
const ipcRenderer = require('electron').ipcRenderer
const store = require('store')
const moment = require('moment')
const AsyncLock = require('async-lock')
const notifier = require('node-notifier');
require('./webapi')

const webview = document.querySelector('webview')
const web_api = new WebApi(webview)

const lock = new AsyncLock()
const LOCK_KEY = 'WEBVIEW_LOCK'

const loginHandler = (opt) => {
  lock.acquire(LOCK_KEY, (done) => {
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
        web_api.getArriveTime()
        web_api.getDismissTime()
        web_api.getOwner()
          .then((name) => {
            done()

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
        done()

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
  })

}

const arriveHandler = () => {
  lock.acquire(LOCK_KEY, (done) => {
    web_api.loadLoginURL()
      .then(() => web_api.login())
      .then(() => web_api.arrive())
      .then(() => {
        web_api.getArriveTime()
          .then((time) => {
            done()

            const notification = {
              title: 'RGames',
              body: `You arrive at ${time}`
            }

            new window.Notification(notification.title, notification)
          })
      })
  })
}

const dismissHandler = () => {
  lock.acquire(LOCK_KEY, (done) => {
    web_api.loadLoginURL()
      .then(() => web_api.login())
      .then(() => web_api.dismiss())
      .then(() => {
        web_api.getDismissTime()
          .then((time) => {
            done()

            const notification = {
              title: 'RGames',
              body: `You dismissed at ${time}`
            }

            new window.Notification(notification.title, notification)
          })
      })
  })
}

const queryStateHandler = () => {
  const today = moment();

  const checkArriveStart = moment('07:00', "hh:mm")
  const checkArriveEnd = moment('10:00', "hh:mm")

  if (today.isAfter(checkArriveStart) && today.isBefore(checkArriveEnd)) {
    const arrive_time = store.get('arrive_time')

    if (!arrive_time) {
      const nc = new notifier.NotificationCenter();
      const trueAnswer = 'Let\' GO';

      nc.notify({
          title: 'Forget to check in?',
          message: 'Do you want to check in?',
          closeLabel: 'No',
          actions: trueAnswer
        }, function (err, response, metadata) {
          if (err) throw err;

          if (metadata.activationValue !== trueAnswer) {
            return
          }

          arriveHandler()
        }
      );

    }
  }

  const checkDismissStart = moment('17:35', "hh:mm")
  const checkDismissEnd = moment('20:00', "hh:mm")

  if (today.isAfter(checkDismissStart) && today.isBefore(checkDismissEnd)) {
    const arrive_time = store.get('dismiss_time')

    if (!arrive_time) {
      const nc = new notifier.NotificationCenter();
      const trueAnswer = 'Let\' GO';

      nc.notify({
          title: 'Forget to check out?',
          message: 'Do you want to check out?',
          closeLabel: 'No',
          actions: trueAnswer
        }, function (err, response, metadata) {
          if (err) throw err;

          if (metadata.activationValue !== trueAnswer) {
            return
          }

          dismissHandler()
        }
      );

    }
  }
}

const infinityLoopHandler = () => {
  queryStateHandler()
}

let infinityLoopTimer = setInterval(() => {
  infinityLoopHandler()
}, 600000);
console.log(`infi: ${infinityLoopTimer}`)

const initialDomReadyHandler = () => {
  webview.removeEventListener('dom-ready', initialDomReadyHandler)

  loginHandler();
}

webview.addEventListener('dom-ready', initialDomReadyHandler);

ipcMain.on(`webview-getArriveTime`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getArriveTime', value)
  web_api.resolveDeferred(deferred_id, value)

  store.set('arrive_time', value)
})

ipcMain.on(`webview-getDismissTime`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getDismissTime', value)
  web_api.resolveDeferred(deferred_id, value)

  store.set('dismiss_time', value)
})

ipcMain.on(`webview-getOwner`, (event, value, deferred_id) => {
  ipcRenderer.send('main-getOwner', value)
  web_api.resolveDeferred(deferred_id, value)
})

ipcRenderer.on(`webview-clickDismiss`, (event, value) => {
  dismissHandler()
});

ipcRenderer.on(`webview-clickArrive`, (event, value) => {
  arriveHandler()
})

ipcRenderer.on(`webview-saveAuth`, (event) => {
  loginHandler()
})

ipcRenderer.on(`webview-resume`, (event) => {

  const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 5000)
  })

  promise.then(() => {
    loginHandler({silent: true})
  }).then(() => {
    queryStateHandler()

    clearInterval(infinityLoopTimer)
    
    infinityLoopTimer = setInterval(() => {
      infinityLoopHandler()
    }, 600000);

    console.log(`infi: ${infinityLoopTimer}`)
  })

})
