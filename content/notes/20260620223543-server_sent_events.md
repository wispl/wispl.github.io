+++
title = "Server Sent Events"
date = 2026-06-20
updated= 2026-06-20
+++

Server Sent Events (SSE) are a convenient alternative to websockets when you only need uni-directional communication from the server to the client. Of course- the client cannot communicate back, but SSE seems like a great fit for notifications from the server. The SSE is just an endpoint which the client listens on. When the server wants to send a message, it uses this endpoint.

The endpoint broadcasts the message to all clients, which might be non-ideal for some notifications. Some notifications pertain only to a specific client, and should not be broadcasted to anyone else. Implementing this is a little difficult but the idea is to use a separate stream per client. So

```sh
# A channel for each user
GET /stream/{user_id}
# A channel for all users
GET /stream
```

However, this means another user might be able to connect to and use a stream intended for another user. You might be able to use sessions (stored via cookies) to defend against this. Over all, I do think that this is a good alternative when you just want to send notifications from the server to the user. Performance is about the same, but of course you have less complexity.
