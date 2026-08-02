+++
title = "Kubernetes Pulling From Registry"
date = 2026-07-10
updated= 2026-07-10
+++

To pull from a private registry, you have to configure a new secret. You could do it declaratively, but for this I prefer to do it manually since it is a one-time thing

```c
kubectl create secret docker-registry gitlab-private-registry --docker-server=<registry-server> --docker-username=<username> --docker-password=<password>
```

This creates a docker-registry secret called `gitlab-private-registry` with the given credentials. Of course, you can use anything for the name. As an aside, I like using deploy tokens for GitLab registry, so you would use the token name for the username and the token value for the password.

There are several ways to tell kubernetes to use this secret. You can configure it on the service account level, but I think that might break things (have not tested it), so I just configure it on a pod-by-pod basis. In your `deployment.yml`,

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: deployment
spec:
  selector:
    matchLabels:
      app: someapp
  template:
    metadata:
      labels:
        app: someapp
    spec:
      # Use it here!
      imagePullSecrets:
      - name: gitlab-registry-secret
      containers:
        - name: coolcontainer
          image: coolcontainer
```

And it should work. This makes it simple to build outside of kubernetes, for example in your pipelines, and then just pulling the image after you properly tested the images and promoted them.
