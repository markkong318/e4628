const ipcMain = require('electron').remote.ipcMain;

WebApi = function (webview) {

  this.url = 'https://www.e4628.jp/'
  this.loginUri = '?module=login'
  this.topUri = '?module=top&rd=1'

  this.company_id = 'rgames'
  this.login_id = ''
  this.password = ''

  this.webview = webview

  this.domReadyPromiseDeferred = new LoadingPromiseDeferred()
  this.domReadyPromiseDeferred.resolve()

  this.webview.addEventListener('dom-ready', () => {
    console.log('dom-ready')

    if (this.domReadyPromiseDeferred) {
      this.domReadyPromiseDeferred.resolve();
    }
  });

  this.loadURL = (url) => {
    const deferred = new LoadingPromiseDeferred();

    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      this.webview.loadURL(`${this.url}${this.loginUri}`)
    })

    return deferred.promise;
  }

  this.loadLoginURL = () => {
    return this.loadURL(`${this.loginUri}${this.topUri}`)
  }

  this.login = () => {
    const deferred = new LoadingPromiseDeferred();

    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      this.executeJavaScript(`document.getElementById("y_companycd").value = "${this.company_id}"`)
        .then(() => this.executeJavaScript(`document.getElementById("y_logincd").value = "${this.login_id}"`))
        .then(() => this.executeJavaScript(`document.getElementById("password").value = "${this.password}"`))
        .then(() => this.executeJavaScript(`document.getElementById("id_passlogin").click()`))
    })

    return deferred.promise;
  }

  this.executeJavaScript = (script) => {
    let execResolve;
    const execPromise = new Promise((resolve, reject) => {
      execResolve = resolve;
    });

    this.webview.executeJavaScript(script, false, () => execResolve())

    return execPromise;
  }

  this.isLogin = () => {
    if (this.getModule() != 'top') {
      return false;
    }
    return true
  }

  this.getModule = () => {
    const match = this.webview.getURL().match(/module\=(\w+)/)

    if (!match || match.length < 2) {
      return ''
    }

    return match[1]
  }

  this.arrival = () => {
    const deferred = new LoadingPromiseDeferred();
    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      if (this.getModule() != 'top') {
        deferred.reject()
        return deferred.promis
      }

      // this.executeJavaScript(`$('#sub_header_border_top > form > table > tbody > tr > td:nth-child(2) > button').click()`);

      // mock action
      deferred.resolve();
    });

    return deferred.promise
  }

  this.dismiss = () => {
    const deferred = new LoadingPromiseDeferred();
    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      if (this.getModule() != 'top') {
        deferred.reject()
        return deferred.promise
      }

      // this.executeJavaScript(`$('#sub_header_border_top > form > table > tbody > tr > td:nth-child(3) > button').click()`);

      // mock action
      deferred.resolve();
    });

    return deferred.promise;
  }

  this.getArrivalTime = () => {
    if (this.getModule() != 'top') {
      return;
    }

    this.executeJavaScript(`web_api_broker.getArrivalTime()`);
  }

  this.getDismissTime = () => {
    if (this.getModule() != 'top') {
      return getPromise;
    }

    this.executeJavaScript(`web_api_broker.getDismissTime()`);
  }

  this.notifyDismissTime = (time) => {

  }

  this.getOwner = () => {
    if (this.getModule() != 'top') {
      return;
    }

    this.executeJavaScript(`web_api_broker.getOwner()`);
  }

  function LoadingPromiseDeferred() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}


