Upload files to the pod. And run the task.

Prepare PVC and POD

```bash
oc apply -f report-dir.yaml
```

Copy report files to pod

```bash
oc cp ../resources/ upload-files-pod:/source-dir
```

Run the task

```bash
oc create -f publish-reports-task-run.yaml
```