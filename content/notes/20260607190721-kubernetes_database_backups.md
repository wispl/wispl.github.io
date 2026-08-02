+++
title = "Kubernetes Database Backups"
date = 2026-06-07
updated= 2026-06-07
+++

You can either do a backup via a **VolumeSnapshot** or using a **CronJob**. The big issue with a **VolumeSnapshot** is that the database can still be writing to it while you are performing the snapshot. This can lead to inconsistent snapshots. Buuuut, a volume snapshot is really fast and low overhead.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: mariadb
driver: "isilon" # or whatever you have on hand
deletionPolicy: Retain
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: db-backup
spec:
  volumeSnapshotClassName: mariadb
  source:
    persistentVolumeClaimName: mariadb-backup
```

Of course you need a valid CSI driver for this. As stated before, you can also use a CronJob and use an Application-Level snapshot, which will result in more consistent snapshots because the database knows that a snapshot is being performed

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: mariadb-backup
spec:
  template:
    spec:
      containers:
      - name: mariadb-backup
        image: mariadb:lts-ubi
        command:
        - /bin/sh
        - -c
        - |
          mysqldump -h mysql-service -u root -p$MYSQL_ROOT_PASSWORD --all-databases > /backup/db-$(date +%Y%m%d).sql
          gzip /backup/db-$(date +%Y%m%d).sql
        env: #...
        volumeMounts:
        - name: backup-storage
          mountPath: /backup
      volumes:
      - name: backup-storage
        persistentVolumeClaim:
          claimName: backup-storage
      restartPolicy: OnFailure
```

Note that you will also need to setup cleaning up of old backups yourself.
