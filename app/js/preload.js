var ipcRenderer = require('electron').ipcRenderer;
//
//
// ipcRenderer.on('ping', function() {
//     ipcRenderer.sendToHost('pong');
//     ipcRenderer.sendToHost('pong2');
// });
//
//
// ipcRenderer.on('asynchronous-reply', function(event, arg) {
//     console.log(arg); // prints "pong"
// });
// ipcRenderer.send('asynchronous-message', 'ping-asy');
//
//
// ipcRenderer.send('query', '5566 no 1');


function jqueryPromiseDeferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

const jqueryDeferred = new jqueryPromiseDeferred();

window.onload = () => {
  const script = document.createElement("script");
  script.src = "https://code.jquery.com/jquery-2.1.4.min.js";
  script.onload = script.onreadystatechange = () => {
    $(document).ready(() => {
      jqueryDeferred.resolve();
    });
  };
  document.body.appendChild(script);
};

WebApiBroker = function () {
  this.getArrivalTime = (deferred_id) => {

    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(2) > #timerecorder_txt').text()
      const match = time_txt.match(/\d+:\d+/);

      if (match && match.length == 1) {
        time = match[0];
      }

      ipcRenderer.send(`webview-getArrivalTime`, time, deferred_id)
    })
  }

  this.getDismissTime = (deferred_id) => {

    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(3) > #timerecorder_txt').text()
      const match = time_txt.match(/\d+:\d+/);

      if (match && match.length == 1) {
        time = match[0]
      }

      ipcRenderer.send(`webview-getDismissTime`, time, deferred_id)
    })
  }

  this.getOwner = (deferred_id) => {

    jqueryDeferred.promise.then(() => {
      const user_name = $('.user_name').text()

      ipcRenderer.send(`webview-getOwner`, user_name, deferred_id)
    })
  }
}

web_api_broker = new WebApiBroker();