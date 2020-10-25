import {InputSettings} from './input-settings'
import {PullRequestResult} from './pull-request'
import {Octokit} from '@octokit/core'
import {OctokitResponse} from '@octokit/types'

interface ClientPayload {
  ref: string
  pr_number: number
  user: string
  repo: string
  comment_prefix: string
}

export async function dispatch(
  octokit: Octokit,
  pullRequest: PullRequestResult,
  input: InputSettings
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const payload: ClientPayload = {
      ref: pullRequest.ref,
      pr_number: pullRequest.prNumber,
      user: pullRequest.user,
      repo: pullRequest.repository,
      comment_prefix: pullRequest.commentPrefix
    }

    const response: OctokitResponse<void> = await octokit.repos.createDispatchEvent(
      {
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        event_type: input.dispatchEvent,
        client_payload: JSON.stringify(payload)
      }
    )

    if (response.status === 204) {
      return resolve()
    }
    return reject(new TypeError(`Unexpected status code: ${response.status}`))
  })
}
