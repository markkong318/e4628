const ipcRenderer = require('electron').ipcRenderer
const logger = require('./debug').logger

function jqueryPromiseDeferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

const jqueryDeferred = new jqueryPromiseDeferred()

window.onload = () => {
  const script = document.createElement("script")
  script.src = "https://code.jquery.com/jquery-2.1.4.min.js"
  script.onload = script.onreadystatechange = () => {
    $(document).ready(() => {
      jqueryDeferred.resolve();
    });
  };
  document.body.appendChild(script)
};

WebApiBroker = function () {

  this.arrive = () => {
    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(1) > button').click()
    })
  }

  this.dismiss = () => {
    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(3) > button').click()
    })
  }

  this.getArriveTime = (deferred_id) => {
    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(2) > #timerecorder_txt').text()
      const match = time_txt.match(/\d+:\d+/);

      if (match && match.length === 1) {
        time = match[0];
      }

      logger.info(`Get arrive time from webview: ${time}`)

      ipcRenderer.send(`webview-getArriveTime`, time, deferred_id)
    })
  }

  this.getDismissTime = (deferred_id) => {
    jqueryDeferred.promise.then(() => {
      let time = ''

      const time_txt =
        $('#sub_header_border_top > form > table > tbody > tr > td:nth-child(4) > #timerecorder_txt').text()
      const match = time_txt.match(/\d+:\d+/);

      if (match && match.length === 1) {
        time = match[0]
      }

      logger.info(`Get dismiss time from webview: ${time}`)

      ipcRenderer.send(`webview-getDismissTime`, time, deferred_id)
    })
  }

  this.getOwner = (deferred_id) => {
    jqueryDeferred.promise.then(() => {
      const user_name = $('.user_name').text()

      logger.info(`Get user name from webview: ${user_name}`)

      ipcRenderer.send(`webview-getOwner`, user_name, deferred_id)
    })
  }

  this.getHtmlBody = (deferred_id) => {
    jqueryDeferred.promise.then(() => {
      const html = $('body').text()

      logger.info(`Get html body from webview: ${html}`)

      ipcRenderer.send(`webview-getHtmlBody`, html, deferred_id)
    })
  }

  this.isValidPage = (deferred_id) => {
    jqueryDeferred.promise.then(() => {
      const title = $('head > title').text()

      logger.info(`Get page title from webview: ${title}`)

      let isValid = false
      if (title.indexOf('万屋一家') !== -1 || title.indexOf('Yorozuya Ikka Series') !== -1) {
        isValid = true
      }

      ipcRenderer.send(`webview-isValidPage`, isValid, deferred_id)
    })
  }
}

web_api_broker = new WebApiBroker()