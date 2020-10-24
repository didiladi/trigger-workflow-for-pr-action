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
  issueNumber: number
  ref: string
  user: string
  repository: string
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

    core.debug('Pull Requests:')
    core.debug(JSON.stringify(pullRequests.data))

    const result = []

    for (const pr of pullRequests.data) {
      /*
      const prResponse: OctokitResponse<PullsGetResponseData> = await octokit.pulls.get({
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        pull_number: pr.id
      })
      */

      if (containsLabel(octokit, pr.labels, input.label)) {
        core.info('PR ${pr.id} contained label ${input.label}')

        const events: OctokitResponse<IssuesListEventsResponseData> = await octokit.issues.listEvents(
          {
            owner: input.repositoryOwner,
            repo: input.repositoryName,
            issue_number: pr.id
          }
        )

        core.debug('Events:')
        core.debug(JSON.stringify(events))

        const lastLabelEventTimestamp = getLastLabelEventTimestamp(
          events.data,
          input.label
        )
        if (lastLabelEventTimestamp === 0) {
          core.error(
            'No timestamp found, despite label was present on PR ${pr.id}'
          )
          continue
        }

        core.info(
          'Label was added at ${lastLabelEventTimestamp} on PR ${pr.id}'
        )

        if (
          !alreadyContainsLabelComment(
            octokit,
            pr.id,
            lastLabelEventTimestamp,
            input
          )
        ) {
          core.info(
            'PR ${pr.id} selected for dispatch event ${input.dispatchEvent}'
          )
          result.push({
            issueNumber: pr.id,
            ref: pr.head.ref,
            user: pr.head.user.login,
            repository: pr.head.repo.name
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

async function alreadyContainsLabelComment(
  octokit: Octokit,
  prId: number,
  lastLabelEventTimestamp: number,
  input: InputSettings
): Promise<boolean> {
  const comments: OctokitResponse<IssuesListCommentsResponseData> = await octokit.issues.listComments(
    {
      owner: input.repositoryOwner,
      repo: input.repositoryName,
      issue_number: prId
    }
  )

  core.debug('Comments:')
  core.debug(JSON.stringify(comments))

  for (const comment of comments.data) {
    if (comment.user.login !== input.commentUser) {
      continue
    }

    if (
      comment.body.startsWith(
        '<!-- Do not edit. label:${input.label} time:${lastLabelEventTimestamp} -->'
      )
    ) {
      core.info('PR ${prId} already contained comment: skipping PR')
      return false
    }
  }
  return true
}
