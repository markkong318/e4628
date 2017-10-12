const store = require('store')

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

  this.deferredMap = new Map();

  this.webview.addEventListener('dom-ready', () => {
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
    if (this.getModule() !== 'top') {
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

  this.arrive = () => {
    const deferred = new LoadingPromiseDeferred();
    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      this.executeJavaScript(`web_api_broker.arrive()`);

    });

    return deferred.promise
  }

  this.dismiss = () => {
    const deferred = new LoadingPromiseDeferred();
    this.domReadyPromiseDeferred.promise.then(() => {
      this.domReadyPromiseDeferred = deferred

      this.executeJavaScript(`web_api_broker.dismiss()`);

    });

    return deferred.promise;
  }

  this.getArriveTime = () => {
    const deferred = this.addDeferred()

    this.executeJavaScript(`web_api_broker.getArriveTime('${deferred.id}')`);

    return deferred.promise;
  }

  this.getDismissTime = () => {
    const deferred = this.addDeferred()

    this.executeJavaScript(`web_api_broker.getDismissTime('${deferred.id}')`);

    return deferred.promise;
  }

  this.getOwner = () => {
    const deferred = this.addDeferred()

    this.executeJavaScript(`web_api_broker.getOwner('${deferred.id}')`);

    return deferred.promise;
  }

  this.syncStore = () => {
    const auth = store.get('auth')

    if (!auth) {
      return Promise.reject()
    }

    if (!'employeeId' in auth || !'password' in auth) {
      return Promise.reject()
    }

    if (!auth.employeeId || !auth.password) {
      return Promise.reject()
    }

    this.login_id = auth.employeeId
    this.password = auth.password
  }

  function Deferred() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      this.id = id
    });
  }

  this.addDeferred = () => {
    const deferred = new Deferred()

    this.deferredMap.set(deferred.id, deferred)

    return deferred
  }

  this.resolveDeferred = (id, value) => {

    if (!this.deferredMap.has((id))) {
      return
    }

    const deferred = this.deferredMap.get(id)

    deferred.resolve(value);

    this.deferredMap.delete(id)
  }

  function LoadingPromiseDeferred() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

