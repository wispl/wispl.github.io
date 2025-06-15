---
title: Databases
date: 2025-01-13
---

# Database

## Fundamentals

https://tontinton.com/posts/database-fundementals/
https://www.thenile.dev/blog/transaction-isolation-postgres

The simplest database can be just writing to a file and then reading the file
to get the results back. Databases, however, are more advanced, in order to provide

*   Durability
*   Atomicity
*   Isolation
*   Performance

The safety aspects of databases are refer to being ACID.

### ACID

ACID is an acronymn and refers to the database's property of maintaining safe and
consistent behavior during transactions. Transactions are a series of
statements for interacting with databases, whether it be a series of writes,
reads, or both.

*Atomicity*: transactions must either fail or succeed, no in-between.
*Consistency*: transactions must bring a database from one consistent state to another.
*Isolation*: transactions can be safely executed concurrently, that is the same
result could be obtained if the transactions were executed sequentially.
*Durability*: completed transactions should never disappear, for example in the
event of a crash, and should store in non-volatile storage.

### Storage Engine

Databases have to fast, and the fastest way is to rely on caches and memory, of
which the L1 cache is the fastest.





