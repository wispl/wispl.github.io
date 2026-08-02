+++
title = "MongoDB Replica Sets"
date = 2026-06-07
updated= 2026-07-10
+++

## Introduction {#introduction}

You need three nodes minimum. If you have more nodes, you need to make sure to have an odd number for **elections** to work properly. For the best effect, deploy each node to its own machine (it wouldn't really make sense to have all nodes on the same machine). In each node, run the following command

```sh
mongod --replSet "rs0" -- bind_ip ...
```

Where "rs0" is the name of the replica set, or you can choose another name. The hostnames or IP addresses passed to `bind_ip` are the machines allowed to connect to the instance. This should be the same across all nodes. Alternatively, as a config file this is

```yaml
replication:
  replSetName:  "rs0"
net:
  bindIp: ...
```

You should use something like a systemd service or whatever init system you have to run mongo. Then on one of the nodes (this will become your primary node) run
the following within mongosh

```sh
rs.initiate({
              _id: "rs0",
              members: [
                   { _id: 0, host: "mongo0.example.com:27017" },
                   { _id: 1, host: "mongo1.example.com:27017" },
                   { _id: 2, host: "mongo2.example.com:27017" }
               ]
           })
```

You can then run the following in mongosh anytime to get the status of the replica set.

```sh
rs.conf()
```


## Replica Set Members {#replica-set-members}

One of the replica set members will be the Primary Node. This node handles all writes and will then propogate the writes to the other two Secondary Nodes. All nodes can handle reads. One of the Secondary Nodes will be the Arbiter.

The Arbiter will also be the Arbiter while the Primary may become a Secondary and vice versa. While all three nodes are alive

1.  the two secondaries send heartbeats between each other
2.  primary receive writes and reads (secondary can received reads as well when configured to do so)
3.  primary replicates writes to the two nodes

In the event the primary dies, the non-Arbiter secondary calls for a vote (election) to promote itself to the Primary. The Arbiter will then vote on the new Primary. This is the reason for an odd number of nodes, an even number will result in a deadlock.


## Other Information {#other-information}

Primary nodes can be identified from a tag of `{ w: "majority" }`. You can have client read from secondaries by setting a **read preference** of `secondary` or `secondaryPreferred`. Of course you can also just set it to `primary` or `primaryPreferred`.

Note that due to asynchronous replication (to secondaries), reading data from the secondaries might result in consistent data because the current data on the primary has not been replicated yet.


## Migration {#migration}

Migrating with a replica set is much easier, and also has less of a downtime. The checklist for migration is something like this

1.  Install and boot up the new server
2.  Add the new server to the replica set using `rs.add({ host: ... })` on the primary server
3.  Wait for the old servers to propagate all data to the new server
4.  Once the new server transitions from `STARTUP2` to `RECOVERING` to `SECONDARY`, make the new server the primary by using `rs.reconfig(...)` to modify the votes and priority, see [here](https://www.mongodb.com/docs/manual/tutorial/expand-replica-set/), and then calling `rs.stepDown()` on the current primary

You can now remove the old members if you want. Note that the downtime is associated with the elections to make the new member the primary. During elections, no writes can occur. You can eliminate downtime effects through several techniques

1.  reads: configure applications to read from secondaries if the primary is unavailable
2.  writes: you can retry them or queue up failed writes

There are definitely other more sophisticated and complicated methods as well.
