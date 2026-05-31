+++
title = "Adapting Containers for Openshift"
date = 2026-03-19
updated= 2026-03-19
+++

Openshift runs containers with a random userid, which makes life a little harder. Redhat has a [resource](https://developers.redhat.com/blog/2020/10/26/adapting-docker-and-kubernetes-containers-to-run-on-red-hat-openshift-container-platform#) on this. In short unless you want to tweak service account settings and start giving privileges, you should modify containers.


## Ownership and Permission {#ownership-and-permission}

Openshift runs containers with a random user assigned to root so every file and directory created should be owned by root.

```dockerfile
RUN chown -R 1001:0 /some/directory somefile && \
    chmod -R g=u /some/directory somefile
# Later
USER 1001
```

So when not running on Openshift, you actually run as a unprivileged user while on Openshift the root permission ensures the container can still run as the random user as the same capability as the group (root) for the given files.


## Ports {#ports}

This one is easy, just use higher level ports and not ones below `1024` which are priviledged.


## Executables {#executables}

Make sure to `chmod 755` them.
