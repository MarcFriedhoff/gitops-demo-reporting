# Elasticsearch setup and configuration

## Installation

Use the following commands to install Elasticsearch using Helm:

```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -f values.yaml --namespace=elastic
```

This will install Elasticsearch in the `elastic` namespace.

Receive the password for the `elastic` user with the following command:

```bash
kubectl get secret elasticsearch-master-credentials -n elastic -o=jsonpath='{.data.password}' | base64 --decode; echo
```

## Create route for elasticsearch
    
```bash
oc expose svc/elasticsearch-master --port=9200
```

## Test Elasticsearch

Post a test message to Elasticsearch:

```bash
curl -X POST "http://localhost:9200/test/_doc" -H 'Content-Type: application/json' -d' {"message": "testing" }'
```

curl -X POST "http://elastic.apps-crc.testing/test/_doc" -H 'Content-Type: application/json' -d' {"message": "testing" }'

```bash
curl -X POST "http://elasticsearch-elastic.apps-crc.testing/test/_doc" -H 'Content-Type: application/json' -d' {"message": "testing" }'
```