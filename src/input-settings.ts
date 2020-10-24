export interface InputSettings {
  /**
   * The token
   */
  token: string

  /**
   * The repository owner
   */
  repositoryOwner: string

  /**
   * The repository name
   */
  repositoryName: string

  /**
   * The label to fetch
   */
  label: string

  /**
   * The event name to dispatch
   */
  dispatchEvent: string

  /**
   * The user who comments on the PR
   */
  commentUser: string
}
