const ipcRenderer = require('electron').ipcRenderer;
const store = require('store');

const signInBtn = document.querySelector('#sign_in_btn')
const employeeIdField = document.querySelector('#employee_id')
const passwordField = document.querySelector('#password')

const clickSignInHandler = () => {
  const employeeId = employeeIdField.value
  const password = passwordField.value

  store.set('auth', {
    employeeId,
    password
  })

  ipcRenderer.send('main-saveAuth')
}

signInBtn.addEventListener('click', clickSignInHandler)

const auth = store.get('auth')

if (auth) {
  employeeIdField.value = auth.employeeId ? auth.employeeId: ''
  passwordField.value = auth.password ? auth.password: ''
}