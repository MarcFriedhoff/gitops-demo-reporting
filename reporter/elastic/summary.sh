#!/bin/bash

curl -k -v -X PUT "https://elastic.apps-crc.testing/_transform/latest_testsuite_transform" -H "Content-Type: application/json" -d'
{
  "description": "Latest test suite results by name",
  "source": {
    "index": "testsuite"
  },
  "dest": {
    "index": "latest_testsuite_results"
  },
  "pivot": {
    "group_by": {
      "name": {
        "terms": {
          "field": "name.keyword"
        }
      }
    },
    "aggregations": {
      "latest_timestamp": {
        "max": {
          "field": "timestamp"
        }
      },
      "latest_tests": {
        "top_metrics": {
          "metrics": { "field": "tests" },
          "sort": { "timestamp": "desc" },
          "size": 1
        }
      },
      "latest_failures": {
        "top_metrics": {
          "metrics": { "field": "failures" },
          "sort": { "timestamp": "desc" },
          "size": 1
        }
      },
      "latest_errors": {
        "top_metrics": {
          "metrics": { "field": "errors" },
          "sort": { "timestamp": "desc" },
          "size": 1
        }
      }
    }
  },
  "sync": {
    "time": {
      "field": "timestamp",
      "delay": "60s"
    }
  }
}'

curl -X POST "https://elastic.apps-crc.testing/_transform/latest_testsuite_transform/_start" -H "Content-Type: application/json"
