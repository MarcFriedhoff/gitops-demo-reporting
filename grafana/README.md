# Grafana setup and configuration


## Installation

Use the following commands to install Grafana using Helm. Change the `route.host` value to the route of your OpenShift cluster:

```bash
cd helm
helm upgrade --install grafana . -f values.yaml --namespace=grafana --set route.host=grafana.apps-crc.testing
```

This will install Grafana in the `grafana` namespace.