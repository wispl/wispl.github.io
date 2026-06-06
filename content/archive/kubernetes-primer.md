---
title: Kubernetes Primer
date: 2026-06-05
updated: 2025-06-05
description: |
  Everything was so nice and simple, until Kubernetes came along. Now everything is so yaml and kubular.
---

# Introduction

This is kind of like a kubernetes cheatsheet and primer for me to look at occasionally. Of course the official [documentation](https://kubernetes.io/docs/home/) is going to be much better for in-depth information. This document is going to contain some Openshift-specific information in addition to standard kubernetes stuff.

This is less about kubernetes itself and more about how to use it and interact it. But for completeness sake, kubernetes is composed of several components: the control plane and the actual nodes themselves

1. Control Plane: handles the state of the cluster, including your API requests to it. This is composed of 
- apiserver: handles API requests
- etcd: key-value store for the cluster (stores states of the cluster)
- scheduler: assigns pods to a node, a node can be a physical or virtual machine capable of running containers
- controller-manager: runs controllers which is just a loop that tracks changes to the cluster and tries to moved the current state to the desired state
2. Node Components: these are ran inside the nodes
- kublet: just makes the containers are running inside the nodes, basically just communicates with the control plane
- container-runtime: you need this regardless to run the containers, this can be docker engine, containerd, or something else 

Nodes can optionally have a kube-proxy which creates network rules automatically (think nftables or iptables) to implement services. Services basically exposes the running container to other containers in the cluster.

# Kubernetes Objects

When you use a command through `kubectl` or `oc`, you are actually communicating with the apiserver using the Kubernetes API. The files are in `yaml` format and basically is a description of the state you want for the given object. The cluster receives this and runs controllers to move the current state of the cluster (stored in etcd) to your desired state.

The cluster refers to `status` as the current state of an object and the `spec` as the desired state. Here is an example of a manifest (composed of four parts)

``` yaml
# 1. The API version of Kubernetes API
apiVersion: apps/v1
# 2. The type of object to create or modify
kind: Deployment
# 3. Data to identify the object
metadata:
  name: database
  labels:
    app: app-name
# 4. Desired state of the object, this is different for each kind of object
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app-name
  template:
    metadata:
      labels:
        app: app-name
    spec:
      containers:
        - name: mariadb
          image: mariadb:latest
          ports:
          - containerPort: 3306
            protocol: TCP
```

## Identifying Objects

Using **selectors** on **metadata.labels** is how you match objects you want. Generally, you would want to match several pods, which is where labels and selectors come in handy. Some common labels are

``` yaml
matchLabels:
  app: app-name
  tier: backend
  component: database
```

Then to use a selector to apply something (say like a Service) to these pods, you would do

``` yaml
selector:
  app: app-name
  tier: backend
  component: database
```

Notice that they are the same. There are many ways to go about using labels. For example, you can give every object the same `app` name and user `tier` and `component` to distinguish them. Or you can use `app` to describe the actual thing being deployed, so `app` would be `mariadb` instead of your `app-name` and then it could use `part-of: app-name` to indicate it is part of your app.

Aside from `metadata.labels`, your also need to give the object a `metadata.name`. This can be anything, I like to just call it the app-name, but if there are multiple objects of the same kind (like two deployments), you might need to give a more distinguishing name.

## Namespace

Objects are isolated between namespaces. Openshift has projects which are just the same thing but with some shiny features. But, namespaces isolate resources which reduces scope. You can use a namespace for each new app, or really whatever you desire.

## Annotations

These are attached to `metadata.annotations`. These are generally queried by the object manager to apply extra configuration. You can usually use these to configure the object outside of what the spec defines. For example, an annotation can dictate what algorithm a load balancer uses for routing.

# Communicating with the Cluster

To send a manifest file to the cluster, you do

``` sh
kubectl apply -f file.yaml
```

Or if you are OpenShift, use `oc` instead. Just run `help` to get a list of all the amazing powers you can employ. Subcommands of note are `describe` to get information on the desired state of an object and `get` to get information on current objects.

# Deployments

Time to meet the kubernetes objects. This one is very important so listen closely, or read closely. A **Deployment** configures how pods are deployed

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: database
  labels:
    app: app-name
spec:
  # How many pods of the same image to run, defaults to 1
  replicas: 3
  # Tells how to identify pods belonging to this deployment 
  # Must be the same as template.metadata.labels
  selector:
    matchLabels:
      app: app-name
  template:
    # Labels to apply to every pod created by this deployment
    metadata:
      labels:
        app: app-name
    spec:
      # Containers to run, you can specify multiple ones
      containers:
        - name: mariadb
          image: mariadb:latest
          ports:
          - containerPort: 3306
            protocol: TCP
        - name: server
          image: flask
          # ....
```

This will create three pods of mariadb and three pods of a flask server. Run

- `kubectl apply -f file.yaml` to create the deployment
- `kubectl get deployments` to view all deployments
- `kubectl rollout status deployment/<deploymentname>` to see rollout status (how many pods are deployed and how many need to be deployed)
- `kubectl rollout pause deployment/<deploymentname>` to pause a deployment
- `kubectl rollout resume deployment/<deploymentname>` to resume a deployment

When you run `kubectl apply -f file.yaml` and the deployment is changed, the cluster will automatically restart the deployment, so you don't actually need to manually restart it.

## ReplicaSet

You are already using ReplicaSets by using Deployments. These basically just tell the cluster to run a set number of pods at anytime. A Deployment is a higher level abstraction of a ReplicaSet.

## StatefulSet

This is the same as a deployment, but each is unique and ordered. This means the pods are not interchangeable. While there are other benefits to this, the main one I see is the automatic PersistentVolumeClaim (PVC) management. That is, it automatically creates storage for each of your pods instead of having you do a Deployment and a PVC.

``` yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: app-name
spec:
  selector:
    matchLabels:
      app: app-name
  # This is another feature of StatefulSets: stable, unique network
  # identifiers when paired with a service (use it if you need it)
  # This example doesn't so it is commented out
  # serviceName: 
  replicas: 3
  template:
    metadata:
      labels:
        app: app-name
    spec:
      containers:
      - name: database
        image: mariadb:latest
        ports:
        - containerPort: 3306
          protocol: TCP
        volumeMounts:
        - name: sql
          mountPath: /var/lib/sql
  # Automatic PVC management Part
  volumeClaimTemplates:
  - metadata:
      name: sql
    spec:
      accessModes: [ "ReadWriteMany" ]
      storageClassName: "isilon" # or whatever
      resources:
        requests:
          storage: 4Gi

```

Note that a new PVC is created for each pod, so the database must be able to replicate itself across the pods. If not, you can set `replicas: 1`. Regardless, the automatic PVC is still useful even if you have one replica.

## Replication Controller

This handles running the replicaset. I don't have a good use for configuring this beyond the default but it is here so I remember it exists.

# DaemonSets, Jobs, CronJobs

A **DaemonSet** makes sure that a pod is ran on every or some nodes. This is generally more helpful for the cluster administrator, for example, to run like a logs collection and exporting daemon.

A **Job** just runs pods until some number of them succeeds at whatever they were told to do. A **CronJob** is similar but runs on a schedule, which is good for backups.

# Networking

There is two types of exposure for networks. Exposure between pods, and exposure between pods and the outside world (as in outside of the cluster). For demonstration purposes, consider a backend and a frontend for this following section.

## Service

Imagine your frontend talks to your backend, well maybe you don't have to imagine that. Now suppose your backend has three replicas. For everything to work smoothly, there should be a way for your frontend to not care about which backend pod it is talking to. The **Service** acts as almost a kind of load balancer

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  # Maps port 80 to port 5000 of the pods
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 5000
  # Selects the pods you want
  selector:
    app: app-name
    tier: backend
  sessionAffinity: None
  type: ClusterIP
```

Now from your frontend, you can call to your backend via `backend:80` and the Service will automatically pick between the pods. You can implement stick sessions using `sessionAffinity: ClientIP`, which means all requests from the same ClientIP will be routed to the same pod. You also need some configuration on for the Ingress or Route object introudced later.

> [!NOTE] 
> The default routing algorithm is round-robin.

## Ingress or Route

A **Route** is Openshift's equivalent of the standard **Ingress** object, but with more features. If Services are doors within your home, than an Ingress is the front door. This is how services or user outside of your cluster will interact with it.

``` yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-name
  # You need these to implement sticky sessions, otherwise you don't
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/session-cookie-expires: "3600"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "3600"
    nginx.ingress.kubernetes.io/session-cookie-path: "/"
spec:
  rules:
    - host: my.site.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

Or for Openshift's Route,

``` yaml
kind: Route
apiVersion: route.openshift.io/v1
metadata:
  name: app-name
spec:
  host: your.site.com
  to:
    kind: Service
    name: frontend
    weight: 100
  port:
    targetPort: 80
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
  wildcardPolicy: None
```

See the documentary for more information. There really are a lot of configuration options for these, which make sense, since who doesn't want a pretty front door complete with a welcome (or go-away) mat?

## Others

There is a couple of other objects, but they are more interior facing than exterior. So unless you are a cluster admin, you probably won't touch these as much. 

- Ingress Controller: needed for Ingress to work, often provided by a third party
- Gateway API: more advanced networking stuff
- EndpointSlices: internally created by Service
- Network Policies: allows to configure fine-grained network policies for a pod, think (iptables or nftables)

# Storage

There are a quite a few different types of storage. We refer to these storage as volumes, which are used to share data with the pod. This is also the only way for pods to have persistent storage. The main types of volumes are

1. configMap: used for configuration data
2. emptyDir: empty directory, usually useful for sharing sockets or allowing the filesystem to create a socket in the first place
3. persistentVolumeClaim: mounts a PersistentVolume, which just gives the pod storage backed by something without having the pod known about specifics, for example, isilon storage can be used for PersistentVolumes without the pod specifically handling how to use the storage
4. secrets: similar to configMap, but the fields are base64 encoded (used for passwords and credentials) and is read-only and never stored in non-volative memory.

> [!WARNING] 
> When mounting volumes, kubernetes destroys everything currently in the directory of the mount. To avoid this and mount specific files you have to use subpath, but that seems to break live-reloading containers

There are other cool features, like VolumeSnapshots and more about VolumeClasses, check the documentary for more. Some examples are shown below

``` yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage
  labels:
    app: app-name
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 4Gi
  storageClassName: isilon
  volumeMode: Filesystem
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-name
  labels:
    app: app-name
spec:
  selector:
    matchLabels:
      app: app-name
      tier: backend
  replicas: 3
  template:
    metadata:
      labels:
        app: app-name
        tier: backend
    spec:
      containers:
        - name: flask
          image: flask:latest
          envFrom:
          # Example of using a secret
          - secretRef:
              secretName: env
          # Example of using a volume mount
          volumeMounts:
            - name: storage
              mountPath: /my/volume/mount
          ports:
          - containerPort: 3050
            protocol: TCP
      # Notice that this is used in volumeMounts
      # It might be better to use a StatefulSet instead of a
      # Deployment and PVC combo
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: app-storage
```

See the documentation to know how to make and use Secrets and ConfigMaps. Both are used in a similar manner. Note that you can make `.env` file or any other file or files for Secrets and ConfigMaps, and then mount them as a volume. You can also extract `.env` variables from them as well.

``` yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  val1: "hello"
  val2: "bye"
  # This is fine too
  app.properties: |
    val1=hellow,owlrds
    val2=5
immutable: true
```

> [!TIP] 
> Use `immutable: true` for secrets configmaps to improve performance. Note that to mutate them, you must now delete the configmap, remake it, and then recreate pods which were using the old configmap.

You can edit a configmap or secret by using 

``` sh
kubectl edit secrets secret-name
kubectl edit configmaps configmap-name
```

In most cases, the objects should update instanteously, but depending on your pod, you might have to restart them. 

# Service Accounts and Roles

Kubernetes uses **RBAC** (Rule-Based Access Control), which is a way to describe what users are and are not allowed to do within a cluster. The main objects are a **ClusterRole** and **Role**. These objects are a set of permissions, which is composed of three parts

ApiGroup
: basically where the resoruces belong to (like "argoproj.io" for ArgoCD resources or "" for kubernetes builtins).

Resources
: the resources to allow actions on, for example ["services", "configmaps", "secrets"]

Verbs 
: actions allowed on those resources: ["create", "get", "list", "watch", "update", "patch", "delete"].

The difference between a Role and a ClusterRole is its scope. A Role is limited to its namespace while a ClusterRole is cluster-wide. For most cases, as a user you are likely only going to use a Role, since unless you are a cluster admin, you likely won't have permission to create a ClusterRole.

> [!NOTE]
> ClusterRoles can be combined via a feature known as aggregation

Now to actually grant the permissions, you use either a **RoleBinding** or **ClusterRoleBinding** (for cluster roles) to bind the role to either a user, set of users, or a service account. In particular

- use binding on User for actual users
- use binding on ServiceAccount for non-users, sometimes an object might need to make additional calls to the kubernetes api, and it will use the service account given

You can of course apply multiple bindings on a User or ServiceAccount, just as how a person can have multiple roles. See the following example.

``` yaml
# Make a Role capable of modifying and listing several resources
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: argocd-deployer
  namespace: "your-namespace"
  rules:
    # Broad access to deployments and statefulsets
    - apiGroups: ["apps"]
      resources: ["deployments", "statefulsets"]
      verbs: ["create", "get", "list", "watch", "update", "patch", "delete"]
    # Broad access to services, PVCs, configmaps, and secrets
    - apiGroups: [""]
      resources: ["services", "persistentvolumeclaims", "configmaps", "secrets"]
      verbs: ["create", "get", "list", "watch", "update", "patch", "delete"]
---
# Bind the role to a ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: argocd-deployer
  namespace: "your-namespace"
# The target to bind the role to
subjects:
  - kind: ServiceAccount
    name: argocd-application-controller
    namespace: "your-namespace"
# The role we are binding
roleRef:
  kind: Role
  name: argocd-deployer
  apiGroup: rbac.authorization.k8s.io
```

# Kustomize

Kustomize provides a way to declaratively create or edit objects. For example, rather imperatively creating secrets or configmaps via something like 

``` sh
kubectl create secret generic secret-file --from-literal=bleh
```

You can create secrets or configmaps from a directory. You can also apply patches to objects. An alternative to Kustomize will be Helm, which has more powerful templating abilities. I find Helm to be generally too complicated for your own setups, but great for installing third-party charts. Here is an example of using Kustomize to make objects and apply patches

``` yaml
# Specifies a prefix to add to everything thing created by this 
# kustomization.yaml file. Use this to distinguish between prod and dev
namePrefix: dev-
# All Manifest files you want to send as well
resources:
  - deployment.yaml 
  - service.yaml
  - route.yaml
# This one in particular replaces the host name of a Route object
patches:
  - target:
      version: v1
      group: route.openshift.io
      kind: Route
      name: app-name
    patch: |-
      - op: replace
        path: /spec/host
        value: my.site.com
# Creates a ConfigMap from a file. You can use this inside any file 
# that you placed in resources[] above. You must place any file which
# uses a ConfigMap generated by this in resources[].
#
# This is because a hashed suffix is generated, and kustomize will 
# automatically resolve to the correct hashed ConfigMap if you specify
# a file in resources[] 
configMapGenerator:
  - name: my-settings
    options:
      labels:
        app: app-name
    files:
      - config/my-file.json
# You can also configure images, just use `image: image-name` anywhere
# and specify this here to replace the image with the given repository
# and tag
images:
  - name: image-name
    newName: my.repository.com
    newTag: "5db6624c401750f2a53e2a6b27f70672b47bebb2"
```

I like to use Kustomize for in-house projects and then Helm to install third-party ones, like ArgoCD or any other charts. But that is just a preference, you can also generate files using Helm and then feed them to Kustomize.

# BuildConfig and ImageStream

This is Openshift specific, but essentially these two objects allows kubernetes to natively build and tag images. You can do something like

```sh
oc start-build image-name --from-dir=.
```

To upload your current directory and start building. You can also set the source strategy to git so that it automatically builds latest tag from Git. Anyways, this automatically creates a **BuildConfig**, which as its name implies, tells the cluster how to build an image.

As images are built, they are added to an **ImageStream**, which is just a way to store and tag the images. You can take a look at the Openshift documentation for more. But.... if you don't mind me interjecting my opinion, I don't think they are too useful.

## Personal Opinion

Generally, pipelines are used to build the images, the images might also be used for tests, so the usual flow is something like this

1. pipeline starts
2. code linted and checked
3. containers are built
4. containers are tested
5. containers are uploaded to registry

And the pipline then finishes. If we were to use Openshift's builds, we would have to do one of the following 

1. pull images from the Openshift registry and then run tests on it (as well as query it for built status)
2. run duplicate builds on Openshift and the pipelines
3. run pipeline builds and upload to Openshift registry

I don't think any of the solutions are ideal. Option 2 is wasteful while the other two requires you using Openshift credentials in your pipelines. And if you decide to use GitOps, you would need a way to tell ArgoCD or Flux that the pipeline is successful.

## A Humble Recommendation?

Instead, I think pipelines and Openshift should not interact with each other at all. This means pipelines should build and upload images to its own registry. Then you would give Openshift a deploy token to allow it to **only read** images from the registry. 

> [!NOTE] 
> Openshift and kubernetes can create pipelines via Tekton, but I have not checked them out yet

This way, Openshift can just pull from the image registry when needed. I also think this works quite well with GitOps. You have Renovate watch the registry and then update image tags, and then ArgoCD will pull from the manifests repo. And then Openshift will just use the token to pull the images.

The only credential you are sharing will just be the deploy token, which is read only, and is therefore not too dangerous.
