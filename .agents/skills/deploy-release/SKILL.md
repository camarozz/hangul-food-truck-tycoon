---
name: deploy-release
description: Automates committing code and pushing a new GitHub release.
---
## How to deploy
1. Review all uncommitted changes and draft a semantic commit message.
2. Push the changes to the origin repository.
3. Run `gh release create <tag> --generate-notes` to deploy the new version.
