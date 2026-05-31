+++
title = "Shibboleth Attribute Access"
date = 2026-04-12
updated= 2026-04-17
+++

Passing the attributes to the backend is kind of hard. Before, request headers were commonly used, but that has now been phased out. Instead Server Environment Variables seems to be the most appropriate choice now. In Apache2/HTTPD, you would have something like the following

```cfg
ServerName https://server.com:443
UseCanonicalName On

<Location /shibboleth>
      Satisfy Any
      Allow from all
</Location>

<Location /login>
    AuthType shibboleth
    ShibRequestSetting requireSession 1
    ShibUseHeaders On
    require shib-session
</Location>

ProxyPass /shibboleth !
ProxyPass /shibboleth-sp !
<Location "/status/">
    ProxyPass !
</Location>
```

The endpoint `\login` is protected. Note that `ShibUseHeaders` On means using the headers, and is off by default as it is no recommended. On the other hand, `ShibUseEnv` is on by default. Now depending on what backend language you are using, you might have different ways to pass attributes.

-   python: uWSGI protocol (or wsgi) is easiest
-   java: ajd see <https://shibboleth.atlassian.net/wiki/spaces/SP3/pages/2067400159/JavaHowTo>

Reference: <https://shibboleth.atlassian.net/wiki/spaces/SP3/pages/2065335257/AttributeAccess>
