+++
title = "GitLab Pipelines Basics"
date = 2026-06-02
updated= 2026-06-09
+++

## Introduction {#introduction}

Quick rundown of basics for GitLab pipelines. Pretty simple, you organize jobs into stages. The stages are ran consecutively, suppose you have the following stages

```yaml
stages:
  - A
  - B
  - C

 job1:
   stage: A

 job2:
   stage: A

 job3:
   stage: B

 job4:
   stage: C
```

All jobs in `stage A` must be successful before any jobs in `stage B` can be ran. And a similar process applies for `stage C`. Now if you want to specify order within a stage you can use either `needs: [job1, job2, ...]` or `dependencies: [job1, job2, ...]`. The major difference between the two is use `needs` if you want to **control the order of execution** but use `dependencies` to control the **order the artifacts of jobs are downloaded**. I seem to use `needs` more often, but ymmv.


## Workflows {#workflows}

**Workflows** control when a pipeline runs while **rules** control when a job runs.

```yaml
workflow:
  rules:
    # Run pipeline for merge requests
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: always
    # Run pipeline for for tags
    - if: '$CI_COMMIT_TAG' # I think you can use branch name t\infty
      when: always
    # If you want, but it is common to have pipelines run for merges to the default branch
    - if: '$CI_COMMIT_BRANCH == main' # can also use regex or $CI_DEFAULT_BRANCH
      when: always
    # This is generally recommended, but note that this denies run for
    # everything other than the stuff you specified above
    - when: never

 # ... Rest of file is ommited for conciseness ...

 # Make this job have stricter requirements
 make-commit:
   stage: last
   scripts: # make commit to manifest repo or whatever
   rules:
     # Only run on pushes to dev branch
     - if: '$CI_COMMIT_BRANCH == "dev" && $CI_PIPLINE_SOURCE == push'
       when: on_success
     - when: never
```


## Matrices {#matrices}

You can use matricies to apply a job multiple times with different parameters. The example below runs builds on different images

```yaml
# ... snip ...
.images:
  parallel:
    matrix:
      - IMAGE: ["frontend", "backend", "database"]

.buildah:
  image: quay.io/buildah/stable
  variables:
    STORAGE_DRIVER: vfs
    BUILDAH_ISOLATION: chroot
  before_script:
    - buildah login -u "$CI_REGISTRY_USER" --password $CI_REGISTRY_PASSWORD $CI_REGISTRY

# This will create three jobs,
#  1. build [frontend]
#  2. build [backend]
#  3. build [database]
build:
  extends:
    - .buildah
    - .images
  stage: build
  script:
    # ${IMAGE} is replaced by the value given in the arrays above,
    #  1. first run, $IMAGE is frontend
    #  2. second run, $IMAGE is backend
    #  1. third run, $IMAGE is database
    - buildah build -t "$CI_REGISTRY_IMAGE/${IMAGE}:${CI_COMMIT_SHA}" ${IMAGE}
    - buildah push "$CI_REGISTRY_IMAGE/${IMAGE}:${CI_COMMIT_SHA}"
```

Be careful how you specify a matrix. The following is a dot product instead and will create four jobs, and not two jobs

```yaml
parallel:
  matrix:
    - TYPE: [premise, aws]
      IMAGE: [frontend, backend]
# Will make jobs
#  1. premise, frontend
#  2. premise, backend
#  3. aws, frontend
#  4. aws, backend
```
