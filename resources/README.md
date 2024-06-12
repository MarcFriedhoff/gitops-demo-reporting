To upload a sample build to the server, run the following command:




```bash
curl -X POST -F "file=@build-1.0.1.zip" \
-F "buildInfo={\"project\":\"AcmeProject\",\"build\":\"1.0.1\",\"repository\":\"https://github.com/MarcFriedhoff/AcmeProject\",\"tags\":[\"1.0.1\"],\"revision\":\"182829cd22828abc\",\"date\":\"2022-01-01\",\"time\":\"12:00:00\"}" \
"http://localhost:3001/api/projects/AcmeProject/build"
```