# Publishing

This repository is configured for npm Trusted Publishing from GitHub Actions.
It uses short-lived OIDC credentials rather than a long-lived npm write token.

## First-time setup

1. Create the public GitHub repository and npm package/scope.
2. Confirm that `repository.url` in `package.json` exactly matches the GitHub
   repository.
3. On npmjs.com, configure this package's Trusted Publisher:
   - provider: GitHub Actions;
   - organization/user: `igal-abachi-dev`;
   - repository: `react-ai-chat-ui`;
   - workflow filename: `publish.yml`;
   - environment: `npm`;
   - allowed action: `npm publish`.
4. In GitHub, create the `npm` deployment environment. Add required reviewer
   protection when you want a human approval gate before publication.
5. Update the package name and repository URLs first if your npm scope differs
   from `@igal-abachi-dev`.

The publish workflow uses Node 24 and a current npm CLI because npm Trusted
Publishing requires npm 11.5.1 or later and Node 22.14 or later.

## Release

```bash
npm version patch # or minor / major
git push --follow-tags
```

Create a GitHub Release whose tag is exactly `v<package-version>`. The workflow
rejects mismatched tags, runs the complete check suite, verifies the npm
tarball, and publishes with provenance.

## Security after the first successful OIDC publish

In the npm package settings, restrict traditional publishing access and revoke
unused automation tokens. Keep the repository public when you want npm's
provenance attestation to be generated for the public package.
