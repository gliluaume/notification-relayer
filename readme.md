# Callback Gateway

A gateway to let long running tasks call back web browsers through a push server mechanism.


## Overview

Motivation: we do not want to implement server push and session management on APIs that are intended to be stateless (REST API). The callback gateway is here to maintain deported state to manage server push.

Containers

![Alt text](docs/images/c4-containers.svg "containers")

Sequence

![Alt text](docs/images/sequence.svg "sequence")

Notes:

* API which do the actual work must accept a callback URL
* Callback URL is formed as `{ws host domain}/callback/{websocket UUID}`

We can imagine some alternative regarding security and authentication:

1. WebSocket server does not handle any authentication and
   1. Remove connection if not push has been proceed from backend API for the registration id
   2. Does not follow data but only send notifications
2. WebSocket rely on token and
   1. Must validate authentication from backend API
   2. Follow data or send notifications

## Implementation

```bash
deno run -A --watch src\index.ts
```

* WebSockets https://masteringjs.io/tutorials/express/websockets

* From MDN doc
[Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
* [Web-Push package](https://www.npmjs.com/package/web-push) relates Google Cloud Messaging
* [websockets-with-deno](https://blog.logrocket.com/using-websockets-with-deno/)
* needs a script included in client

From google push service
* [Tutorial WebPush in ExpressJS](https://web.dev/articles/push-notifications-server-codelab?hl=fr)

```bash
 09:01:46 $ npx web-push generate-vapid-keys >
=======================================

Public Key:
BAJ9b3tdUbIs_9BkL1FOdCE5qOUlammrT2dnmxqS2uqW1fMAZmXYO3ixalU6wphlkFFlCj2jp4xT0XDSDHZx2Bw

Private Key:
Unluijiiwny42esrFM51sdQKdH7iX2s5V-RE83zuSPQ

=======================================
```

