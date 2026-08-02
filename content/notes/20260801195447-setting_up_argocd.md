+++
title = "Setting Up ArgoCD"
date = 2026-08-01
updated= 2026-08-01
+++

You set up ArgoCD manually, using Helm, or using the ArgoCD operator. I prefer the last two. Using helm charts have the advantage of allowing you to install other stuff if you want. The helm chart is pretty easy, see [here](https://artifacthub.io/packages/helm/argo/argo-cd). The ArgoCD Operator is interesting as well as it does everything for you. Openshift's equivalent is the Openshift GitOps Operator and allows you to create an Openshift instance in any cluster by pushing a manifest of the form

```yaml
apiVersion: argoproj.io/v1beta1
kind: ArgoCD
metadata:
  name: argocd-instance
  namespace: "{{ .Release.Namespace }}"
spec:
  # High availability for Redis
  ha:
    enabled: true
    redisProxyImage: haproxy
    redisProxyVersion: "3.4.3"
  repo:
    # Increase replicas to reduce downtime
    replicas: 2
  server:
    # Reduces downtime during upgrades
    replicas: 3
    # Expose via a Route
    route:
      enabled: true

  # Configure SSO for the route
  sso:
    provider: dex
    dex:
      openShiftOAuth: true
      groups:
        - my-group
  rbac:
    defaultPolicy: 'role:readonly'
    # Grants admin role to people in my-group
    policy: |
      g, my-group, role:admin
    scopes: '[groups]'
```

You can see options for the spec [here](https://argocd-operator.readthedocs.io/en/latest/reference/argocd). This one is really convenient because it handles all of the role bindings and roles you might have to do otherwise due to the more restricted environment in Openshift. Above I have also setup Dex to use Openshift as a SSO provider. Overall I think this is very clean.
