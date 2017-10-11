const ipcMain = require('electron').remote.ipcMain;
const ipcRenderer = require('electron').ipcRenderer;
const store = require('store');
require('./webapi');

const webview = document.querySelector('webview')
const web_api = new WebApi(webview)

const loginHandler = (opt) => {
  web_api.loadLoginURL()
    .then(() => web_api.syncStore())
    .then(() => web_api.login())
    .then(() => {
      if (!web_api.isLogin()) {
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
  console.log('deferr id:' + deferred_id )
  web_api.resolveDeferred(deferred_id, value)
})

ipcRenderer.on(`main-clickDismiss`, (event, value) => {
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

ipcRenderer.on(`main-clickArrive`, (event, value) => {
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

ipcRenderer.on(`main-saveAuth`, (event) => {
  loginHandler()
})

ipcRenderer.on(`main-resume`, (event) => {
  loginHandler({silent: true})
})

// webview.addEventListener('dom-ready', () => {
//     webview.openDevTools();
//     // webview.executeJavaScript('alert(222);')
//     // webview.executeJavaScript('document.getElementById("y_companycd").value = "ttttt"');
//
//     webview.addEventListener('ipc-message', function(event) {
//         console.log(event.channel);
//         // Prints "pong"
//     });
//     webview.send('ping');
//
//     // ipcMain.on('asynchronous-message', function(event, arg) {
//     //     console.log(arg);  // prints "ping"
//     //     event.sender.send('asynchronous-reply', 'pong');
//     // });
//
//     // ipcMain.send('asynchronous-reply', 'pong assss');
//     webview.send('asynchronous-reply', 'pong assss');
//
//     webview.addEventListener('synchronous-message', function(event, arg) {
//         console.log(arg);  // prints "ping"
//         event.returnValue = 'pong';
//     });
//
//     web_api = new WebApi();
//
//     // if(!isLogin) {
//     //     web_api.setWebview(webview);
//     //     web_api.login()
//     //     isLogin = 1;
//     //
//     // }
//
// });