  ![build-test](https://github.com/didiladi/comment-on-pr-action/workflows/build-test/badge.svg)

# Use Case

This action enables you to automate running tests which need access to secrets in a secure manner for forks. Consider this open-source workflow:
* Your repository is forked and a PR is created
* For merging, the maintainers need to check whether the integration tests pass
  * Sadly, the integration tests need to access secrets - we can't run the integration tests in the context of the fork
  * By doing so, we would bleed the secrets into the fork
  * So, what do we do? :thinking-face:
* A maintainer performs a code review - the code looks awesome!
* The maintainer adds a label `run-integration-tests` to the PR
* The cron-triggered workflow using this action runs and picks up the new PR.
* Since the label `run-integration-tests` is present, and there is no comment yet from action [comment-on-pr-action](https://github.com/didiladi/comment-on-pr-action), a event `trigger-integration-tests` is dispatched.
* There is a workflow in the upstream repository which is triggered by the event.
* It runs the integration tests and wites back the results to the PR. Of course, the tests succeed.
* Now, the maintainer can merge the awesome PR
<br/><br/>
This repository contains the code for the action to dispatch the event in the scenario above:
---

## Dispatch an event for pull requests with given label

Use this action to trigger another workflow for every PR which fulfills these criteria:
* The PR is open
* The PR contains a given label (can be configured)
* The PR does not contain a comment coming from the [didiladi/comment-on-pr-action](https://github.com/didiladi/comment-on-pr-action) github action


### Usage

Create a workflow triggered by a cron job:

```
name: Trigger Integration Tests for Forks

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  trigger_workflow:
    runs-on: ubuntu-latest

    steps:
      - name: main
        uses: didiladi/trigger-workflow-for-pr-action@main
        with:
          label: run-integration-tests
          dispatch-event: trigger-integration-tests
          token: ${{ secrets.GITHUB_TOKEN }}
          dispatch-token: ${{ secrets.DISPATCH_TOKEN }}
```

### Input variables

  * label:
    * required: true
    * description: the label which needs to be resent on the pull request
  * dispatch-event:
    * required: true
    * description: the the name of the event dispatched for each matching pull request
  * token:
    * required: true
    * description: the token (in most cases this is `secrets.GITHUB_TOKEN`)
  * dispatch-token:
    * required: true
    * description: the token used for dispatching the event. This is usually a PAT with the necessary permissions to dispatch the event. Sadly, `secrets.GITHUB_TOKEN` does not have the necessary permissions.
  * repository:
    * required: false
    * description: the respository to search for pull requests in the format `{owner}/{repo}`
  * comment-user:
    * required: true
    * description: the respository to search for pull requests in the format `{owner}/{repo}`
    * default: github-actions[bot]