+++
title = "Time of check time of use (TOCTOU)"
date = 2026-05-30
updated= 2026-05-30
+++

I was wondering if there was a name for something where you check for permissions and then afterwards execute some action

```python
if !user.has_role(role):
    return False

if !user.has_permission(perm):
    return False

return do_something(...)
```

Turns there is and it is call TOCTOU (time of check, time of use). It is technically a vulnerability and you can use database transactions to resolve this. But transactions have a price, and that is speed. Generally, the solution is really open and depends on what you want. Like does it matter if someone can read a specific resource a just as they have lost permissions for for it? So it is a discussion on trade-offs.

References:

-   [[<https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use>][wikipedia

]]- [stackexchange discussion](https://softwareengineering.stackexchange.com/questions/451038/when-should-i-be-worried-of-time-of-check-time-of-use-vulnerabilities-during-dat)
