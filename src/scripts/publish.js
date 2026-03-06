// mercurePublish.js
const jwt = require("jsonwebtoken");
const tls = require("tls");
const https = require("https");

async function publishJson(payload, opts = {}) {
    const {
        hubUrl = "https://mercure.eniamza.com/.well-known/mercure",
        topic = "swap",
        connectLocal = false,
        publisherKey = process.env.MERCURE_PUBLISHER_JWT_KEY,
    } = opts;

    if (!publisherKey) throw new Error("Missing publisherKey (or MERCURE_PUBLISHER_JWT_KEY env var)");

    const url = new URL(hubUrl);

    const token = jwt.sign(
        { mercure: { publish: ["*"] } },
        publisherKey,
        { algorithm: "HS256", expiresIn: "5m" }
    );

    const body = new URLSearchParams({
        topic,
        data: JSON.stringify(payload),
    }).toString();

    const agent = connectLocal
        ? new https.Agent({
            createConnection: (opts, cb) => {
                // Force TCP to localhost
                const socket = tls.connect(
                    {
                        host: "127.0.0.1",
                        port: 443,
                        servername: opts.servername || url.hostname, // SNI matches cert
                        ALPNProtocols: ["h2", "http/1.1"],
                    },
                    () => cb(null, socket)
                );
                socket.on("error", cb);
            },
        })
        : undefined;

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: "POST",
                agent,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(body),
                },
            },
            (res) => {
                let out = "";
                res.setEncoding("utf8");
                res.on("data", (c) => (out += c));
                res.on("end", () => resolve({ status: res.statusCode || 0, body: out }));
            }
        );

        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

module.exports = { publishJson };

/*
Usage example:

// const { publishJson } = require("./mercurePublish");
// process.env.MERCURE_PUBLISHER_JWT_KEY = "yourkey";
// publishJson({ hello: "world" }, { topic: "test", connectLocal: true })
//   .then(console.log)
//   .catch(console.error);
*/