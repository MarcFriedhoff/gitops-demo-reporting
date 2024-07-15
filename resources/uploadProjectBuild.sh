#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi
cd $1
zip -r $1.zip soapui unit-tests codereview

buildInfo=$(cat <<EOF
{
  "project": "$1",
  "build": "$1-1.0.0-rc18-7czdd",
  "repository": "https://giturl.com/$1.git",
  "tags": "1.0.0-rc18-sc1",
  "revision": "62f2ba4a389426cfb1e246ca8fbe57f05d8e47b3",
  "date": "2024-06-27",
  "time": "09:08:20+0000",
  "pipeline": "https://tekton.dev~v1~PipelineRun/$1-rc18-7czdd",
  "buildSuccess": "true"
}
EOF
)

echo "buildInfo: $buildInfo"
unzip -t $1.zip

curl -k -X POST -H "Content-Type: multipart/form-data" -F "file=@$1.zip" -F "buildInfo=$buildInfo" "http://localhost:3001/api/projects/$1/build"