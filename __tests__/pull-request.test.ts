import {IssuesListCommentsResponseData} from '@octokit/types'

import * as pr from '../src/pull-request'
import {InputSettings} from '../src/input-settings'

test('test duplicate comment', () => {
  const commentsFromApi: IssuesListCommentsResponseData = [
    {
      id: 726725400,
      node_id: 'MDEyOklzc3VlQ29tbWVudDcyNjcyNTQwMA==',
      url:
        'https://api.github.com/repos/dynatrace-oss/dynatrace-monitoring-as-code/issues/comments/726725400',
      html_url:
        'https://github.com/dynatrace-oss/dynatrace-monitoring-as-code/pull/31#issuecomment-726725400',
      body:
        '<!-- Do not edit. label:run-integration-tests time:1605258980000 -->\\n### 🎉 Integration tests ran successfully on ubuntu-latest 🥳',
      user: {
        login: 'github-actions[bot]',
        id: 41898282,
        node_id: 'MDM6Qm90NDE4OTgyODI=',
        avatar_url: 'https://avatars2.githubusercontent.com/in/15368?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/github-actions%5Bbot%5D',
        html_url: 'https://github.com/apps/github-actions',
        followers_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/followers',
        following_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}',
        gists_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/subscriptions',
        organizations_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/orgs',
        repos_url: 'https://api.github.com/users/github-actions%5Bbot%5D/repos',
        events_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/github-actions%5Bbot%5D/received_events',
        type: 'Bot',
        site_admin: false
      },
      created_at: '2020-11-13T11:58:13Z',
      updated_at: '2020-11-13T11:58:13Z'
    }
  ]

  const label = 'run-integration-tests'
  const lastLabelEventTimestamp = 1605258980000
  const commentPrefix = `<!-- Do not edit. label:${label} time:${lastLabelEventTimestamp} -->`
  const input: InputSettings = {
    commentUser: 'github-actions[bot]',
    dispatchEvent: 'trigger-integration-tests',
    label: 'run-integration-tests',
    repositoryName: 'dynatrace-monitoring-as-code',
    repositoryOwner: 'dynatrace-oss',
    dispatchToken: '1234',
    token: '4321'
  }

  let contains = pr.alreadyContainsLabelComment(
    commentsFromApi,
    1,
    input,
    commentPrefix
  )

  expect(contains).toBeTruthy()
})
