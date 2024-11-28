const axios = require('axios')

const proxyUrl = 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc'

async function getProxies() {
    const res = await axios.get(proxyUrl)

    const proxies = []
    const resProxies = res.data.data

    resProxies.forEach(proxy => {
        const { ip = null, port = null, protocols = [], } = proxy

        if (ip && port && protocols.length > 0) {
            protocols.forEach(protocol => {
                const proxyUrl = `${protocol}://${ip}:${port}`
                proxies.push(proxyUrl)
            });
        }
    });

    return proxies
}

// getProxies()
//     .then(console.log)

module.exports = getProxies