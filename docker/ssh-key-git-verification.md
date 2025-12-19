Using "Apply Patch"


```

```
Updated the Docker build to pull the repo via BuildKit SSH forwarding (no key baked into the image) and to install git/ssh client dependencies in Dockerfile.

How to build with your deploy key:
- Ensure the key is loaded in your ssh-agent: `eval "$(ssh-agent -s)" && ssh-add /path/to/your/deploy_key`.
- Build with BuildKit and forward the agent: `DOCKER_BUILDKIT=1 docker build --ssh default -f docker/Dockerfile -t musicdle .`
- If you want a specific key file without an agent, use: `--ssh default=/home/you/.ssh/deploy_key`

This keeps the key out of the final image while allowing the `git clone` to authenticate.

Made changes.