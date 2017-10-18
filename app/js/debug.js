const log4js = require('log4js')

log4js.configure({
  appenders: { main: { type: 'file', filename: 'debug.log' } },
  categories: { default: { appenders: ['main'], level: 'trace' } }
});

const logger = log4js.getLogger()

module.exports = {
  logger
}