import { InputSettings } from "./input-settings";
import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullsListResponseData, PullsGetResponseData, IssuesListEventsResponseData, OctokitResponse, IssuesListCommentsResponseData } from "@octokit/types";
import { Octokit } from "@octokit/core";

export interface PullRequestResult {
  issueNumber: number
  ref: string
  user: string
  repository: string
}

export async function getPullRequests(octokit: Octokit, input: InputSettings): Promise<PullRequestResult[]> {

  return new Promise<PullRequestResult[]>(async resolve => {

    const pullRequests: OctokitResponse<PullsListResponseData> = await octokit.pulls.list({
      owner: input.repositoryOwner,
      repo: input.repositoryName,
      state: 'open'
    });

    core.debug("Pull Requests:")
    core.debug(JSON.stringify(pullRequests.data))

    let result = []

    for (var pr of pullRequests.data) {

      /*
      const prResponse: OctokitResponse<PullsGetResponseData> = await octokit.pulls.get({
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        pull_number: pr.id
      })
      */

      if (containsLabel(octokit, pr.labels, input.label)) {
        core.info("PR ${pr.id} contained label ${input.label}")

        const events: OctokitResponse<IssuesListEventsResponseData> = await octokit.issues.listEvents({
          owner: input.repositoryOwner,
          repo: input.repositoryName,
          issue_number: pr.id
        })

        core.debug("Events:")
        core.debug(JSON.stringify(events))

        const lastLabelEventTimestamp = getLastLabelEventTimestamp(events.data, input.label)
        if (lastLabelEventTimestamp === 0) {
          core.error("No timestamp found, despite label was present on PR ${pr.id}")
          continue
        }

        core.info("Label was added at ${lastLabelEventTimestamp} on PR ${pr.id}")

        if (!alreadyContainsLabelComment(octokit, pr.id, lastLabelEventTimestamp, input)) {
          core.info("PR ${pr.id} selected for dispatch event ${input.dispatchEvent}")
          result.push(mapToResult(pr))
        }
      }
    }

    resolve(result)
  })
}

function containsLabel(oktokit: Octokit, labels: any[], label: string): boolean {

  for (var labelOfPR of labels) {
    if (labelOfPR.name === label) {
      return true
    }
  }
  return false
}

function getLastLabelEventTimestamp(events: IssuesListEventsResponseData, label: string): number {

  let lastLabelEventTimestamp = 0

  for (var event of events) {
    if (event.event === 'labeled') {
      const eventAsAny = event as any
      if (eventAsAny.label.name === label) {
        const timestamp = Date.parse(event.created_at)
        if (timestamp > lastLabelEventTimestamp) {
          lastLabelEventTimestamp = timestamp
        }
      }
    }
  }
  return lastLabelEventTimestamp
}

async function alreadyContainsLabelComment(
  octokit: Octokit,
  prId: number,
  lastLabelEventTimestamp: number,
  input: InputSettings): Promise<boolean> {

  const comments: OctokitResponse<IssuesListCommentsResponseData> = await octokit.issues.listComments({
    owner: input.repositoryOwner,
    repo: input.repositoryName,
    issue_number: prId
  })

  core.debug("Comments:")
  core.debug(JSON.stringify(comments))

  for (var comment of comments.data) {

    if (comment.user.login !== input.commentUser) {
      continue
    }

    if (comment.body.startsWith('<!-- Do not edit. label:${input.label} time:${lastLabelEventTimestamp} -->')) {
      core.info("PR ${prId} already contained comment: skipping PR")
      return false
    }
  }
  return true
}

function mapToResult(pullRequest: any): PullRequestResult {
  return {
    issueNumber: pullRequest.id,
    ref: pullRequest.head.ref,
    user: pullRequest.head.user.login,
    repository: pullRequest.head.repo.name,
  }
}
