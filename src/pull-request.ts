import {InputSettings} from './input-settings'
import * as core from '@actions/core'
import {
  PullsListResponseData,
  IssuesListEventsResponseData,
  OctokitResponse,
  IssuesListCommentsResponseData
} from '@octokit/types'
import {Octokit} from '@octokit/core'

export interface PullRequestResult {
  prNumber: number
  ref: string
  user: string
  repository: string
  commentPrefix: string
}

interface LabelContaining {
  label: Label
}

interface Label {
  name: string
}

export async function getPullRequests(
  octokit: Octokit,
  input: InputSettings
): Promise<PullRequestResult[]> {
  return new Promise<PullRequestResult[]>(async resolve => {
    const pullRequests: OctokitResponse<PullsListResponseData> = await octokit.pulls.list(
      {
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        state: 'open'
      }
    )

    if (!isSuccessful(pullRequests.status)) {
      throw new Error(`GET pull requests failed: ${pullRequests.status}`)
    }

    core.debug('Pull Requests:')
    core.debug(JSON.stringify(pullRequests.data))

    const result = []

    for (const pr of pullRequests.data) {
      if (containsLabel(octokit, pr.labels, input.label)) {
        core.info(`PR ${pr.number} contained label ${input.label}`)

        const events: OctokitResponse<IssuesListEventsResponseData> = await octokit.issues.listEvents(
          {
            owner: input.repositoryOwner,
            repo: input.repositoryName,
            issue_number: pr.number
          }
        )

        if (!isSuccessful(events.status)) {
          throw new Error(`GET pull request events failed: ${events.status}`)
        }

        core.debug('Events:')
        core.debug(JSON.stringify(events))

        const lastLabelEventTimestamp = getLastLabelEventTimestamp(
          events.data,
          input.label
        )
        if (lastLabelEventTimestamp === 0) {
          core.error(
            `No timestamp found, despite label was present on PR ${pr.number}`
          )
          continue
        }

        core.info(
          `Label was added at ${lastLabelEventTimestamp} on PR ${pr.number}`
        )

        const commentPrefix = `<!-- Do not edit. label:${input.label} time:${lastLabelEventTimestamp} -->`
        const comments: OctokitResponse<IssuesListCommentsResponseData> = await octokit.issues.listComments(
          {
            owner: input.repositoryOwner,
            repo: input.repositoryName,
            issue_number: pr.number
          }
        )

        if (!isSuccessful(comments.status)) {
          throw new Error(
            `GET pull request comments failed: ${comments.status}`
          )
        }

        core.debug('Comments:')
        core.debug(JSON.stringify(comments))

        if (
          !alreadyContainsLabelComment(
            comments.data,
            pr.number,
            input,
            commentPrefix
          )
        ) {
          core.info(
            `PR ${pr.number} selected for dispatch event ${input.dispatchEvent}`
          )
          result.push({
            prNumber: pr.number,
            ref: pr.head.ref,
            user: pr.head.user.login,
            repository: pr.head.repo.name,
            commentPrefix
          })
        }
      }
    }

    resolve(result)
  })
}

function containsLabel(
  oktokit: Octokit,
  labels: Label[],
  label: string
): boolean {
  for (const labelOfPR of labels) {
    if (labelOfPR.name === label) {
      return true
    }
  }
  return false
}

function getLastLabelEventTimestamp(
  events: IssuesListEventsResponseData,
  label: string
): number {
  let lastLabelEventTimestamp = 0

  for (const event of events) {
    if (event.event === 'labeled') {
      const eventAsAny = (event as {}) as LabelContaining
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

function alreadyContainsLabelComment(
  comments: IssuesListCommentsResponseData,
  prId: number,
  input: InputSettings,
  commentPrefix: string
): boolean {
  for (const comment of comments) {
    if (comment.user.login !== input.commentUser) {
      continue
    }

    // TODO change this to debug:
    core.info(`Check body: '${comment.body}' against '${commentPrefix}'`)

    if (comment.body.startsWith(commentPrefix)) {
      core.info(`PR ${prId} already contained comment: skipping PR`)
      return true
    }
  }
  return false
}

function isSuccessful(status: number): boolean {
  return status >= 200 && status <= 300
}
