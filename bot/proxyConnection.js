const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const Config = require('./config');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const getProxies = require('../helpers/getProxies');
const config = new Config()

const wsHost = config.wssHost
const retryInterval = config.retryInterval

const USERID = process.env.USERID2

async function ProxyConnectAndPing() {
    console.log('started for userId: ', USERID)
    const proxies = await getProxies() || []

    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        let formattedProxy;

        if (/socks5:\/\/.*:.*:.*:.*$/.test(proxy) || /http:\/\/.*:.*:.*:.*$/.test(proxy)) {
            formattedProxy = proxy;
        } else if (proxy.startsWith('socks5://') || proxy.startsWith('http://') || proxy.startsWith('https://')) {
            formattedProxy = proxy;
        } else {
            formattedProxy = `socks5://${proxy}`;
        }

        connect(formattedProxy)
    }
}


function connect(proxyUrl) {
    try {

        const wsURL = `wss://${wsHost}`;
        const agent = proxyUrl.startsWith('http')
            ? new HttpsProxyAgent(proxyUrl)
            : new SocksProxyAgent(proxyUrl);

        const ws = new WebSocket(wsURL, {
            agent,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
                Pragma: 'no-cache',
                'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                OS: 'Windows',
                Platform: 'Desktop',
                Browser: 'Mozilla',
            }
        });

        ws.on('open', () => {
            console.log(`Connected directly without proxy`);
            sendPing(ws, 'Direct IP');
        });

        ws.on('message', (message) => {
            const msg = JSON.parse(message);
            console.log(`Received message: ${JSON.stringify(msg)}`);

            if (msg.action === 'AUTH') {
                const authResponse = {
                    id: msg.id,
                    origin_action: 'AUTH',
                    result: {
                        browser_id: uuidv4(),
                        user_id: USERID,
                        user_agent: 'Mozilla/5.0',
                        timestamp: Math.floor(Date.now() / 1000),
                        device_type: 'desktop',
                        version: '4.28.2',
                    },
                };
                ws.send(JSON.stringify(authResponse));
                console.log(
                    `Sent auth response: ${JSON.stringify(authResponse)}`
                );
            } else if (msg.action === 'PONG') {
                console.log(`Received PONG: ${JSON.stringify(msg)}`);
            }
        });

        ws.on('close', (code, reason) => {
            console.log(
                `WebSocket closed with code: ${code}, reason: ${reason}`
            );
            setTimeout(
                () => connect(proxyUrl),
                retryInterval
            );
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error: ${error.message}`);
            ws.terminate();
        });

        function sendPing(ws, proxyIP) {
            setInterval(() => {
                const pingMessage = {
                    id: uuidv4(),
                    version: '1.0.0',
                    action: 'PING',
                    data: {},
                };
                ws.send(JSON.stringify(pingMessage));
                console.log(`Sent ping - IP: ${proxyIP}, Message: ${JSON.stringify(pingMessage)}`);
            }, 26000);
        }

    } catch (error) {
        console.error(`Failed to connect directly: ${error.message}`);
    }
}

module.exports = ProxyConnectAndPing;