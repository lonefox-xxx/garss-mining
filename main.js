require('dotenv').config({ path: './.env' })

const DirectconnectAndPing = require('./bot/directConnection')
const ProxyConnectAndPing = require('./bot/proxyConnection')



DirectconnectAndPing()
ProxyConnectAndPing()