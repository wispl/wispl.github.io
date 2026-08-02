+++
title = "CI/CD Image Tagging"
date = 2026-06-08
updated= 2026-06-09
+++

This is what I do in particular, not that it is a good idea. The image tagging relies on a couple of prerequisites or assumptions

1.  same image is used for production, dev, staging, whatever (you want this to be the case for all your containers regardless)
2.  the same image is built and then pass and promoted through the pipelines
3.  ArgoCD is used for deployment of apps (see [GitOps](@/notes/20260523033331-gitops.md))

With that out of the way, I need two requirements. One, I want the dev deployment of ArgoCD to always track the HEAD of `main`; I don't care what version is being ran there, just that it is the latest and greatest. And two, I want semver for prod deployment, because I should be able to answer what version of our app is currently deployed on prod. Soooo, the tagging method ends up looking like something like this

```yaml
stages:
  - lint
  - build
  - test
  - deploy

# ... linting stuff ...

# build your container
build:
  image: quay.io/buildah/stable
  stage: build
  variables:
    STORAGE_DRIVER: vfs
    BUILDAH_ISOLATION: chroot
  script:
    - buildah login -u "$CI_REGISTRY_USER" --password $CI_REGISTRY_PASSWORD $CI_REGISTRY
    # Tag it using the commit sha for now
    - buildah build -t "$CI_REGISTRY_IMAGE/my-image:${CI_COMMIT_SHA}" .
    - buildah push "$CI_REGISTRY_IMAGE/my-image:${CI_COMMIT_SHA}"

 # ... run tests (on containers if needed) ...

 # All tests passed! Promote images accordingly
.skopeo:
  image:
    name: quay.io/skopeo/stable
    entrypoint: [""]
  stage: deploy
  before_script:
    - skopeo login -u "$CI_REGISTRY_USER" --password "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

promote-dev:
  extends: .skopeo
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    # $CI_PIPELINE_IID is an incrementing number of the number of pipeline
    # runs for a given project
    - skopeo copy "docker://$CI_REGISTRY_IMAGE/my-image:${CI_COMMIT_SHA}"
                  "docker://$CI_REGISTRY_IMAGE/my-image:${CI_PIPELINE_IID}-build"

# This is dependent on how releases or tagging is done for your project
promote-prod:
  extends: .skopeo
  rules:
    - if: $CI_COMMIT_TAG
  script:
    # Tag it using the TAG this time
    - skopeo copy "docker://$CI_REGISTRY_IMAGE/${IMAGE}:${CI_COMMIT_SHA}"
                  "docker://$CI_REGISTRY_IMAGE/${IMAGE}:${CI_COMMIT_TAG}"
```

Using an incrementing number makes it easier for Openshift or ArgoCD Image Updater or Renovate ([Kubernetes Renovate](@/notes/20260608233300-kubernetes_renovate.md)) to know which image is the latest one. This is important since I want the dev deployment to track the latest. Of course using the `:latest` tag is bad practice because ArgoCD cannot pick up on it.

In practice, at least where I worked, the tags are immutable in the sense that we make sure to not upload another image with the same tag, which overrides the first upload. This makes digests not as useful, but ymmv. See [GitLab Pipelines Basics](@/notes/20260602020259-gitlab_pipelines_basics.md) for how to manage multiple builds.

Anyways, in `kustomization.yaml` I can now just do this

```yaml
images:
  - name: my-image
    newName: my.registry.com
    # for dev
    newTag: "3-build"
    # for prod
    newTag: "v3.2.1"
```

And something like Renovate will easily pick up on these tags and update to the most recent version.
