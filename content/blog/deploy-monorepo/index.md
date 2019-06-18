---
title: Deploy Lerna monorepo using Jenkins and Docker
date: '2018-11-25T10:21:10.115Z'
tags: ['jenkins', 'lerna', 'monorepo']
---

The problem is how to deploy a monorepo that is managed by [Lerna](https://github.com/lerna/lerna). In monorepo, we have many repositories, which some of them are services to be deployed standalone, and some are dependencies. On each commit or pull-request, it is possible to touch one or more repositories.

Here is one possible way using Gitlab web hooks, Jenkins, and Docker. The sample code can be found here [yassermzh/deploy-monorepo](https://github.com/yassermzh/deploy-monorepo).

As you push to Gitlab, it triggers a Jenkins job. For this, just need to use Gitlab web hooks and basic Jenkins settings.

This job, which is a pipleline one, checkouts the repository, and loads the `tasks` package Jenkinsfile at: `packages/tasks/Jenkinsfile`.

```Groovy
node {
  def ctx = [:]

  stage('checkout') {
    def scmVars = checkout(scm)
    ctx.GIT_COMMIT = scmVars.GIT_COMMIT
    ctx.GIT_PREV_COMMIT = scmVars.GIT_PREVIOUS_COMMIT
    ctx.COMMIT_MSG = lastCommitMessage()
  }

  def packages = [
    'notify',
  ]

  checkPackages(packages, ctx)
}
```

There we list all packages that should be deployed as services. Mostly the packages are not services and used as dependencies. It adds the last commit along with the previous commit that was deployed successfully. Then it's possible to check whether there are any changes in each of packages within these those commits.

```Groovy
def checkPackage(pkg, ctx) {
  return (
    isChanged("packages/${pkg}/", ctx.GIT_COMMIT, ctx.GIT_PREV_COMMIT) ||
    ctx.COMMIT_MSG.endsWith("deploy ${pkg}") ||
    ctx.COMMIT_MSG.contains("deploy all")
  )
}
```

To check whether to deploy a package, it also considers commit message to enable deploying a package or all packages without having any changes. This way we make sure it's possible to override the detect change rule. So to forcefully deploy PACKAGE1, we just need an empty commit with message `deploy PACKAGE1` like this:

```Bash
git commit -m "deploy PACKAGE1" --allow-empty
```

Each deployable package has one Jenkinsfile at `packages/PACKAGE/scripts/Jenkinsfile` that knows how to deploy itself. So we only load Jenkisnfile of those packages, and deploy one by one sequentially.

The structure of the monorepo is as follows:

```
  |
  |-- packages/
  |           /tasks/Jenkinsfile
  |           /notify/
  |                  /scripts/Jenkinsfile
  |           /email/
```
in which the `notify` package is a service, and `email` package is a dependency for `notify`.


## Development flow

To run locally, since it's managed by Lerna, we just go with basic Lerna usage:

- To install dependencies
  ```bash
  lerna bootstrap --hoist
  ```
- To add dependencies
  Here adding `@company/email` to `@company/notify`. As you notice, we use `@company` to scope npm packages.
  ```bash
  lerna add @company/email --scope @company/notify
  ```
- To run only one package
  ```bash
  cd packages/notify
  npm start
  ```

- To run all packages
  ```bash
  lerna run start
  ```

And to deploy on the staging server, we just publish it to the local NPM registry. During the publishing process, it would ask to bump the changed packages' version, publishes them to the registry, and push the changes to Gitlab that would trigger the Jenkins jobs and deploy the changed services.

```bash
lerna publish --registry http://registry.company.com
```

I managed to deploy each branch to it's own space by extending this setup and playing with Nginx as router, which I might consider it as another post.