+++
title = "GitLab Pipelines Basics"
date = 2026-06-02
updated= 2026-06-03
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
