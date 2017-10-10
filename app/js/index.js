const ipcMain = require('electron').remote.ipcMain;
const ipcRenderer = require('electron').ipcRenderer;
require('./webapi');

const webview = document.querySelector('webview')
const web_api = new WebApi(webview)

const initialDomReadyHandler = () => {
  webview.removeEventListener('dom-ready', initialDomReadyHandler)

  web_api.loadLoginURL()
    .then(() => web_api.login())
    .then(() => {
      web_api.getArrivalTime()
      web_api.getDismissTime()
      web_api.getOwner()

      const notification = {
        title: 'RGames',
        body: 'Login successful'
      }
      const myNotification = new window.Notification(notification.title, notification)
    })
}

webview.addEventListener('dom-ready', initialDomReadyHandler);

ipcMain.on(`webview-getArrivalTime`, (event, value) => {
  ipcRenderer.send('main-getArrivalTime', value);
})

ipcMain.on(`webview-getDismissTime`, (event, value) => {
  ipcRenderer.send('main-getDismissTime', value);
})

ipcMain.on(`webview-getOwner`, (event, value) => {
  ipcRenderer.send('main-getOwner', value);
})

ipcRenderer.on(`main-clickDismiss`, (event, vale) => {
  console.log('click dismiss')
  web_api.loadLoginURL()
    .then(() => web_api.login())
    .then(() => web_api.arrival())
    .then(() => {
      web_api.getDismissTime()

      // TODO: send notification on dismiss at 00:00
    })
});

ipcRenderer.on(`main-clickArrive`, (event, vale) => {
  console.log('click arrive')
});

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