+++
title = "Kubernetes CPU and Memory Limits"
date = 2026-08-01
updated= 2026-08-01
+++

This one is kind of mixed, there are generally two main opinions

1.  declare both CPU and Memory Limits
2.  declare Memory limits, but not CPU limits

And CPU and memory requests are always used. The main reasoning for not declaring CPU limits is the limits causes CPU throttling. When the limit is not declared, the container is guaranteed to have enough CPU to complete a request. But from an cluster operator's point of view, they might enforce limits to prevent bad behaving pods which use an excessive amount of CPU for no reason.

That seems more relevant in a multi-tenant environment where the operator really has no control over the over users. But for now I am following these general guidelines

1.  CPU request: average consumption
2.  CPU limit: unbounded, don't specify
3.  Memory request: maximum consumption
4.  Memory limit: same as maximum request

Not too sure about memory request and limit being the same, but the rationale seems to be to make sure your application runs even when overwhelmed, and if it gets OOMed then you should look into it. That makes sense, I also don't specify limits as I control the applications to make sure the container isn't using anything egregious.

See some references below

1.  <https://www.datadoghq.com/blog/kubernetes-cpu-requests-limits/#linux-scheduling-in-kubernetes>
2.  <https://home.robusta.dev/blog/stop-using-cpu-limits/?nocache=234>
