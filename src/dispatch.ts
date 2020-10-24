import { InputSettings } from "./input-settings";
import { PullRequestResult } from "./pull-request";
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from "@octokit/core";

interface ClientPayload {
    ref: string
    pr_number: number
    user: string
    repo: string
}

export async function dispatch(octokit: Octokit, pullRequest: PullRequestResult, input: InputSettings): Promise<boolean> {

    return new Promise<boolean>(async resolve => {

        const payload: ClientPayload = {
            ref: pullRequest.ref,
            pr_number: pullRequest.issueNumber,
            user: pullRequest.user,
            repo: pullRequest.repository
        }

        octokit.repos.createDispatchEvent({
            owner: input.repositoryOwner,
            repo: input.repositoryName,
            event_type: input.dispatchEvent,
            client_payload: JSON.stringify(payload)
        })

        return true
    })
}