# Building the Project with OpenShift

This project can be built and deployed using OpenShift. Here's how you can build and deploy the project:

# Apply the OpenShift Templates

The project includes OpenShift templates for building and deploying the project. You can apply the templates using the following commands:

```bash
oc process -f . -p IMAGE_NAME=build-dashboard -p GIT_REPO=<git-repo-url> -p GIT_SECRET=<git-secret> | oc apply -f -
```


