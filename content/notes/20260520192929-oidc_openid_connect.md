+++
title = "OIDC (Openid Connect)"
date = 2026-05-20
updated= 2026-05-20
+++

OpenID Connect expands upon OAuth 2.0 and makes it more convenient to request user information. The focus of this protocol is to actually login and not authorize some usage. Rather than getting an access token, you often want information about the user, which is requested through scopes like

-   openid
-   profile
-   email

Or really any scope you defined. Applications supporting OIDC usually have something like a metadata url, something like <https://example/oidc/.well-known> (don't click on this) or something along those lines. The URL broadcasts supported claims, scopes, and relevant endpoints for the client to connect to and use. In short, the flow is something like this

1.  user clicks login
2.  login redirects to provider (under the hood state and nonce is generated for the client provided redirect link)
3.  user logins to provider
4.  provider redirects user back to the client provided redirect link
5.  the redirect link has state and nonce, which is checked with the session state to see if it matches (CSRF checks)
6.  the client then makes a call to request for a token

Depending on how the OIDC provider is configured, you might have to exchange either a code or a token for to get user info.
There are four links at play here, an authorize url, an user info url, an access token url, and an jwks url. The last one is kind of a security thingy, I think. Sometimes if the response type is requested to be `id_token`, then the userinfo is embedded in the `id_token` which you can parse out for the user data. Otherwise, you would have to make a call to the userinfo endpoint to grab it.

Tools and References

-   <https://www.jwt.io/> for checking values of tokens
