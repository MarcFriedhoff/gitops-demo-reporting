#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

project_name=$1

if [[ $project_name == *.zip ]]; then
  zip_file=$project_name
  project_name=${project_name%.zip}
else 
  cd $project_name
  zip -r $zip_file soapui unit-tests codereview

  unzip -t $zip_file

fi

buildInfo=$(cat <<EOF
{
  "project": "$project_name",
  "build": "$project_name-1.0.0-rc18-7czdd",
  "repository": "https://giturl.com/$project_name.git",
  "tags": "1.0.0-rc18-sc1",
  "revision": "62f2ba4a389426cfb1e246ca8fbe57f05d8e47b3",
  "date": "2024-06-27",
  "time": "09:08:20+0000",
  "pipeline": "https://tekton.dev~v1~PipelineRun/$project_name-rc18-7czdd",
  "buildSuccess": "true"
}
EOF
)

echo "buildInfo: $buildInfo"

echo "curl -k -X POST -H "Content-Type: multipart/form-data" -F "file=@$zip_file" -F "buildInfo=$buildInfo" "http://localhost:3000/api/projects/$project_name/build""

curl -k -X POST -H "Content-Type: multipart/form-data" -F "file=@$zip_file" -F "buildInfo=$buildInfo" "http://localhost:3000/api/projects/$project_name/build"