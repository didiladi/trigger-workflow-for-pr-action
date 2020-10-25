import * as core from '@actions/core'
import * as github from '@actions/github'

import {getPullRequests, PullRequestResult} from './pull-request'
import {getInputs} from './input-helper'
import {dispatch} from './dispatch'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    core.info(
      `Will dispatch event ${inputs.dispatchEvent} for every PR which contains a non-processed ${inputs.label} label...`
    )

    const octokit = github.getOctokit(inputs.token)
    const pullRequests: PullRequestResult[] = await getPullRequests(
      octokit,
      inputs
    )

    for (const pullRequest of pullRequests) {
      const success = dispatch(octokit, pullRequest, inputs)

      if (success) {
        core.info(
          `Successfully dispatched event ${inputs.dispatchEvent} for PR ${pullRequest.issueNumber} on ${pullRequest.user}/${pullRequest.repository}`
        )
      } else {
        core.error(
          `Dispatching event ${inputs.dispatchEvent} for PR ${pullRequest.issueNumber} on ${pullRequest.user}/${pullRequest.repository} failed`
        )
      }
    }
  } catch (error) {
    core.error(error.message)
    core.setFailed(error.message)
  }
}

run()
