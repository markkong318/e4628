const ipcMain = require('electron').remote.ipcMain
const ipcRenderer = require('electron').ipcRenderer
const store = require('store')
const moment = require('moment')
const AsyncLock = require('async-lock')
const notifier = require('node-notifier')
const path = require('path')
const logger = require('../debug').logger
require('../webapi')

const webview = document.querySelector('webview')
const web_api = new WebApi(webview)

window.webview = webview
window.web_api = web_api

const lock = new AsyncLock()
const LOCK_KEY = 'WEBVIEW_LOCK'

const INFINITY_LOOP_TIMER = 60000
const RESUME_DELAY_TIMER = 5000

const errorHandler = (err) => {
  const defult = {
    action: '',
    silent: false,
    message: '',
    redirect_to_login: false,
    retry: 5000,
    src_handler: () => {},
    scr_args: {}
  }

  err = Object.assign({}, defult, err)

  logger.error(`call error handler with action ${err.action}`)

  if (err) {

    if (err.message) {
      if (!err.silent) {
        const notification = {
          title: 'RGames',
          body: err.message
        }
        new window.Notification(notification.title, notification)
      }
    }

    if (err.redirect_to_login) {
      ipcRenderer.send('main-showLogin')
    }

    if (err.retry) {
      logger.info(`retry in ${err.retry}ms`)

      setTimeout(() => err.src_handler(err), err.retry)
    }
  }
}

const loginHandler = (opt) => {

  lock.acquire(LOCK_KEY, (done) => {
    logger.info(`Start the login handler`)

    store.set('last_login', getToday())

    web_api.loadLoginURL()
      .then(() => web_api.syncStore())
      .then(() => web_api.login())
      .then(() => {
        return web_api.isValidPage()
          .then((value) => {
            if (!value) {
              return Promise.reject({
                retry: 5000,
                action: 'check page valid'
              })
            }
          })
      })
      .then(() => {
        if (!web_api.isLogin()) {
          return Promise.reject({
              message: 'Login failed\nPlease check the login data',
              redirect_to_login: true
          })
        }
      })
      .then(() => {
        web_api.getArriveTime()
        web_api.getDismissTime()
        web_api.getOwner()
          .then((name) => {
            done()

            if (opt && 'silent' in opt && opt.silent) {
              // do nothing
            } else {
              const notification = {
                title: 'RGames',
                body: `Hi! Welcome back \n${name}`
              }

              new window.Notification(notification.title, notification)
            }
          })
      })
      .catch((err) => {
        done()

        err = Object.assign({}, err, {
          src_handler: loginHandler,
          src_args: opt,
          silent: opt && opt.silent ? opt.silent : null
        })

        errorHandler(err)
      })
  })

}

const arriveHandler = () => {
  lock.acquire(LOCK_KEY, (done) => {
    logger.info(`Start the arrive handler`)

    web_api.loadLoginURL()
      .then(() => web_api.login())
      .then(() => web_api.arrive())
      .then(() => (
        web_api.getArriveTime()
          .then((time) => {
            done()

            const notification = {
              title: 'RGames',
              body: `You arrive at ${time}`
            }

            new window.Notification(notification.title, notification)
          })
      ))
      .catch((err) => {
        done()

        err = Object.assign({}, err, {
          src_handler: arriveHandler
        })

        errorHandler(err)
      })
  })
}

const dismissHandler = () => {
  lock.acquire(LOCK_KEY, (done) => {
    logger.info(`Start the dismiss handler`)

    web_api.loadLoginURL()
      .then(() => web_api.login())
      .then(() => web_api.dismiss())
      .then(() => (
        web_api.getDismissTime()
          .then((time) => {
            done()

            const notification = {
              title: 'RGames',
              body: `You dismissed at ${time}`
            }

            new window.Notification(notification.title, notification)
          })
      ))
      .catch((err) => {
        done()

        err = Object.assign({}, err, {
          src_handler: dismissHandler
        })

        errorHandler(err)
      })
  })
}

const queryStateHandler = (opt) => {
  logger.info(`Start the query handler`)
  logger.info(`Arrive time: ${store.get('arrive_time')}`)
  logger.info(`Dismiss time: ${store.get('dismiss_time')}`)

  const owner = store.get('owner')
  if (!owner) {
    return
  }

  const today = moment();

  const checkArriveStart = moment('07:00', "hh:mm")
  const checkArriveEnd = moment('10:00', "hh:mm")

  if (today.isAfter(checkArriveStart) && today.isBefore(checkArriveEnd)) {
    const arrive_time = store.get('arrive_time')

    if (!arrive_time) {
      if (opt && 'silent' in opt && opt.silent) {
        // do nothing
      } else {
        const nc = new notifier.NotificationCenter()
        const trueAnswer = 'Let\' GO'

        nc.notify({
            title: 'Forget to check in?',
            message: 'Do you want to check in?',
            closeLabel: 'No',
            actions: trueAnswer,
            timeout: 5,
          }, function (err, response, metadata) {
            if (err) throw err;

            if (metadata.activationValue !== trueAnswer) {
              return
            }

            arriveHandler()
          }
        )
      }
    }
  }

  const checkDismissStart = moment('17:31', "hh:mm")
  const checkDismissEnd = moment('20:00', "hh:mm")

  if (today.isAfter(checkDismissStart) && today.isBefore(checkDismissEnd)) {
    const arrive_time = store.get('dismiss_time')

    if (!arrive_time) {
      if (opt && 'silent' in opt && opt.silent) {
        // do nothing
      } else {
        const nc = new notifier.NotificationCenter()
        const trueAnswer = 'Let\' GO'

        nc.notify({
            title: 'Forget to check out?',
            message: 'Do you want to check out?',
            closeLabel: 'No',
            actions: trueAnswer,
            timeout: 5,
          }, function (err, response, metadata) {
            if (err) throw err

            if (metadata.activationValue !== trueAnswer) {
              return
            }

            dismissHandler()
          }
        )
      }
    }
  }

}

const getToday = () => {
  const now = moment()
  const today = moment().format('YYYY-MM-DD 05:00:00')
  const yesterday = moment().add(-1, 'days').format('YYYY-MM-DD 05:00:00')
  logger.info(`today: ${today}`)
  logger.info(`yesterday: ${yesterday}`)

  if (now >= moment(today)) {
    return today
  }

  return yesterday
}

const setLastLogin = (today) => {
  store.set('last_login', today)
}

const isNewDay = () => {
  const today = getToday()
  const last_login = store.get('last_login')

  setLastLogin(today)

  if (last_login === today) {
    return false
  }

  return true
}

const infinityLoopHandler = () => {
  logger.info(`Start the infinity loop handler`)
  logger.info(`last login is: ${store.get('last_login')}`)

  let promise = Promise.resolve()

  if (isNewDay()) {
      promise = promise.then(() => loginHandler({silent: true}))
  }

  promise.then(() => queryStateHandler())
}

let infinityLoopTimer = setInterval(() => {
  infinityLoopHandler()
}, INFINITY_LOOP_TIMER);

const initialDomReadyHandler = () => {
  webview.removeEventListener('dom-ready', initialDomReadyHandler)
  webview.openDevTools()
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

  store.set('owner', value)
})

ipcMain.on(`webview-getHtmlBody`, (event, value, deferred_id) => {
  web_api.resolveDeferred(deferred_id, value)
})

ipcMain.on(`webview-isValidPage`, (event, value, deferred_id) => {
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

ipcRenderer.on(`webview-clickSyncState`, (event, value) => {
  Promise.resolve()
    .then(() => loginHandler({silent: true}))
    .then(() => queryStateHandler({silent: true}))
})

ipcRenderer.on(`webview-resume`, (event) => {
  logger.info(`Resume`)

  const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve(), RESUME_DELAY_TIMER)
  })

  promise.then(() => {
    infinityLoopHandler()

    clearInterval(infinityLoopTimer)

    infinityLoopTimer = setInterval(() => {
      infinityLoopHandler()
    }, INFINITY_LOOP_TIMER)

  })

})
