+++
title = "GitOps Pipelines Example"
date = 2026-05-29
updated= 2026-05-29
+++

This is an example in GitLab, though I think it can be trivially ported elsewhere (me thinks)

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

```
