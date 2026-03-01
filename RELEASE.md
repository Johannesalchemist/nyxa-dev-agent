# NYXA Release Protocol

## Preconditions
- Working tree clean
- node agent/dist/cli.js validate returns "state valid"

## Release Steps

1. Validate
   node agent/dist/cli.js validate

2. Create tag
   git tag v<version>

3. Push
   git push
   git push --tags

## Rule

No release without successful validation.
No manual tagging without validation.