+++
title = "Kubernetes Renovate"
date = 2026-06-08
updated= 2026-07-10
+++

I have come to like using Renovate for updating the image tags. In fact, Renovate has built-in support for `kustomization.yml` image tag dependency updates (there is also support for Helm as well). Provided that they use docker versioning. Of course you can override that. Anyways see the following [link](https://docs.renovatebot.com/modules/manager/kustomize/) for proof. You can use [this](https://gitlab.com/renovate-bot/renovate-runner) for GitLab, just copy the templates folder. There are similar examples for other environments. For GitLab, a sample pipeline config for the manifests repository could be

```yaml
include:
  - '/templates/renovate.gitlab-ci.yml'
  - '/templates/renovate-config-validator.gitlab-ci.yml'

variables:
  RENOVATE_GIT_AUTHOR: Renovate Bot <bot@example.net>
  # I store the renovate config at .gitlab/renovate.json
  RENOVATE_CONFIG_VALIDATOR_EXTRA_FILES: .gitlab/renovate.json
  # This allows Renovate to find all repositories (code) that it can manage
  RENOVATE_AUTODISCOVER: 'true'
  # Optional
  RENOVATE_LOG_LEVEL: debug
  # On GitLab, this allows you to set
  #   DOCKER_REGISTRY_GITLAB_COM_USERNAME
  #   DOCKER_REGISTRY_GITLAB_COM_PASSWORD
  # Instead of using
  # RENOVATE_HOST_RULES=[{"matchHost": "${CI_REGISTRY}","username":
  # "${GITLAB_USER_NAME}","password": "${RENOVATE_TOKEN}", "hostType": "docker"}]
  # Which is rather annoying and not easy to do securely via GitLab.
  # In this case, the matchhost will be `registry.gitlab.com`. If you have something
  # like DOCKER_EXAMPLE_COM, then your your match host will be `example.com` instead
  RENOVATE_DETECT_HOST_RULES_FROM_ENV: true

stages:
  - test
  - deploy

renovate:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
    - if: '$CI_PIPELINE_SOURCE == "push"'

renovate-config-validator:
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: never
    - when: always

renovate:dry-run:
  extends: .renovate
  variables:
    RENOVATE_DRY_RUN: full
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: never
    - when: always
```

I like to use a Project Access Token instead of a Personal Access Token. This works really well with a manifests monorepo since it limits the scope of the token. Setting autodiscovery than just picks up on that singular repository. And for `DOCKER_REGISTRY_GITLAB_COM_PASSWORD` you can use a deploy token as well.

I prefer Renovate over something like ArgoCD Image Updater or Kargo because **git writeback** is more straightforward. You can keep the access token on GitLab, instead of having to send it over to the cluster.

Anyways, with Renovate configured, you can set a schedule, and every time Renovate finds a new image version, it creates a merge request to update the image tags. You can configure auto-merging for Renovate and everything just becomes automatic.

In this method, you only have two credentials you need to manage

1.  access token, used by Renovate (`RENOVATE_TOKEN` in CI)
2.  deploy token, used by Renovate (see hostRules) and Openshift (see [Kubernetes Pulling From Registry](@/notes/20260710202030-kubernetes_pulling_from_registry.md))

I do believe that this is better than making commits against the manifest repository because 1) it is self-contained, and 2) write-allowed tokens in many places are dangerous and unwieldy.

Example Renovate config file

```jsonc
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "github>renovatebot/.github",
    "gitlab>renovate-bot/renovate-runner",
    "config:recommended"
  ],
  "ignorePresets": ["github>renovatebot/.github:weekly-docs-references"],
  // Use the platform's automerge feature (makes merges faster)
  "platformAutomerge": true,
  // Allow auto merging PRs
  "automerge": true,
  // Use PRs instead of branches
  "automergeType": "pr",
  "prCreation": "immediate",
  "dependencyDashboardApproval": true,
  // Optional: restrict to kustomize and helmfiles only
  "enabledManagers": ["kustomize", "helm"],
  "gitlabci": {
    "managerFilePatterns": [".gitlab-ci.yml"],
    "pinDigests": true
  },
  "packageRules": [
    {
      "matchManagers": ["kustomize"],
      "matchCurrentValue": "/-build$/",
      // Automatically merge -build images without dashboard approval
      "dependencyDashboardApproval": false,
      // Group all changes into a singular PR
      "groupName": "update dev builds",
      "groupSlug": "all-dev-builds"
    }
  ]
}
```
