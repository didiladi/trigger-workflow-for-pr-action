import {InputSettings} from './input-settings'
import * as core from '@actions/core'
import * as github from '@actions/github'

export function getInputs(): InputSettings {
  const result = {} as InputSettings

  result.dispatchEvent = core.getInput('dispatch-event')
  result.label = core.getInput('label')
  result.token = core.getInput('token')
  result.commentUser = core.getInput('comment-user')
  result.dispatchToken = core.getInput('dispatch-token')

  const qualifiedRepository =
    core.getInput('repository') ||
    `${github.context.repo.owner}/${github.context.repo.repo}`

  core.debug(`qualified repository = '${qualifiedRepository}'`)
  const splitRepository = qualifiedRepository.split('/')
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${qualifiedRepository}'. Expected format {owner}/{repo}.`
    )
  }
  result.repositoryOwner = splitRepository[0]
  result.repositoryName = splitRepository[1]

  return result
}
