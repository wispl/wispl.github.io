---
title: Containers
date: 2025-01-13
---

# Containers

Containers are used to isolate processes from a host system. The isolation can
include the filesystem, network, processes, and resources. While containers can
also be used for security reasons, a VM is more secure but at the cost of
performance and overhead. Containers on the other hand, avoids the performance
issues by relying on the host for resources, but using native OS features to
restrict access.

## Chroot

Chroot, short for change root, restricts the filesystem, only allowing a
certain view of the filesystem. Injection of files and directories can be done
through read-only mounts.

See: `chroot`

## Namespaces

However, processes inside the chroot can still access and manipulate processes
outside. Namespaces provides isolation for the process tree, network, and
mounts. Multiple namespaces can be created and join, to allow for example,
sharing some resources from the host.

For example, there are `PID` and `network` namespaces to isolate the process
tree and network stack respectively.

See: `unshare`, `nsenter`

## Cgroups

Cgroups, short for control groups, allow restricting resources, such as memory
or cpu, used by the container, and kills the processes as needed.

Cgroups and their configuration can be found under `/sys/fs/cgroup/`. The PIDs
of which the cgroup is applied to is in the the
`/sys/fs/cgroup/cgroup_name/cgroup_config_name/task` file.

## Capabilities

Capabilities are like split-off powers of root and provides fine-grained
controls of what a process can do when using root. It goes without saying
that for containers, the less dangerous capabilities are granted, the better.

See: `capsh`

## Seccomp

Seccomp, short for secure computing, restricts what system calls a process can
make. This is even more restrictive then capabilities.

## Linux Security Modules

Abbreiviated as LSMs, are as their name implies, a series of modules for Linux
to support security policies and modules.

### Mandatory Access Controls

MAC, for short, restrict what could be accessed by a process, program, or
threads. The restriction can be applied to files, directories, networks,
memory, or devices. Attributes can be assigned to the restriction, such as
read-only or write-only.

Under Linux, `tomoyo`, `apparmor`, `selinux` are the prominent MACs. Apparmor
operates on path while Selinux operates on inodes. Tomoyo is similar to
Apparmor, but includes a self-learning profile stage where it attempts to
creates restriction itself.

### More

`landlock`, `lockdown`, `yama`, `integrity`, `bpf`

## References

[Containers from scratch](https://ericchiang.github.io/post/containers-from-scratch/)
[barco: Linux Containers From Scratch in C](https://www.lucavall.in/blog/barco-linux-containers-from-scratch-in-c)
[7 Ways to Escape a Container](https://www.panoptica.app/research/7-ways-to-escape-a-container)
