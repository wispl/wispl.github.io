+++
title = "GitOps Pipelines Example"
date = 2026-05-29
updated= 2026-06-08
+++

## Pipeline Config {#pipeline-config}

This is an example using GitLab, though I think it can be trivially ported elsewhere (me thinks)

```yaml
stages:
  # Put the fast jobs first, so they fail fast
  - lint
  - format
  # Build and push your containers, test them to before deploying
  - build
  - test
  # Make a git commit against the manifest repository updating the image tags
  - deploy

# Example of building containers
.buildah:
  image: quay.io/buildah/stable
  variables:
    STORAGE_DRIVER: vfs
    BUILDAH_ISOLATION: chroot
  before_script:
    - buildah login -u "$CI_REGISTRY_USER" --password $CI_REGISTRY_PASSWORD $CI_REGISTRY

container:
  extends: .buildah
  stage: build
  script:
    - buildah build -t "$CI_REGISTRY_IMAGE/container:${CI_COMMIT_SHA}" ./container
    - buildah push "$CI_REGISTRY_IMAGE/container:${CI_COMMIT_SHA}"

# Note: I no longer use this method, see below
make_commit:
  image: alpine/git # Might be better to just an alpine container and add git manually
  stage: deploy
  script:
    - git config --global user.name "Worker Bot"
    - git config --global user.email "WorkerBot@evilplace.com"
    - git clone "https://your.repo.com"
    # Edit your manifests using whatever: yq, sed, awk
    # This one changes the image version, but you can do whatever your heart desires
    - yq -i '.images[].newTag = strenv(CI_COMMIT_SHA)' kustomization.yml

    # Commit and push!
    - git add kustomization.yaml
    - git commit -m "Deploy ${CI_COMMIT_SHA} to dev!!!"
    - git push origin main
```

As an aside, when using `sed`, things get a bit trickly in regards to quoting, since you need quotes to expand the ENV variables, so you quote the whole thing and then use backslashes to escape the double quotes you want.

EDIT: I don't think making commits against the manifests repository is a good idea. If you store code in the same repository as your manifests, than it is probably fine. But as is the case with GitOps, the manifest repository is stored elsewhere from the code.

Having access tokens with write access to another repository is rather dangerous, and if you have multiple projects, then it isn't scalable to do this setup multiple times. Instead, even if you have to use polling, something like Renovate (running in manifests repository) or ArgoCD ImageUpdater (or Kargo) is better. See [Kubernetes Renovate](@/notes/20260608233300-kubernetes_renovate.md).


## Kustomization.yaml {#kustomization-dot-yaml}

Generally you would have Kustomization.yaml file in `base/` and then one in each of your overlays, for example

```sh
/base/Kustomization.yaml
/overlays/dev/Kustomization.yaml
/overlays/prod/Kustomization.yaml
```

And in the file for `dev`, you might have something like this

```yaml
namePrefix: dev-
resources:
- ../../base
- extra.yaml
- dev-specific-stuff.yaml

# Modify yaml files in base using patches, which are just JSON patch documents. You can pass in a file or just inline it
patches:
- target:
   version: v1
   group: route.openshift.io
   kind: Route
   name: shrunk
  patch: |-
    - op: replace
      path: /spec/host
      value: bleh.com

# k8 has builtin configuration for images without using patches
# Whenever you use frontend for an image, like the following
#   image: frontend
# k8 will replace frontend with the give name and tag
images:
- name: frontend
  newName: your.registry.com
  newTag: "latest"
```


## [GitLab Pipelines Basics](@/notes/20260602020259-gitlab_pipelines_basics.md) {#gitlab-pipelines-basics--20260602020259-gitlab-pipelines-basics-dot-md}
