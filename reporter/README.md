# Reporter

This is a simple report transformer that takes xml files from JUnit and pushes them to a Elasticsearch instance. The report is then visualized in Grafana.

# Posting JUnit XML Files to Elasticsearch

./junit -file junit.xml -esURL https://elastic.apps-crc.testing -esIndex testsuite -esUser elastic -esPass changeme

# Posting JUnit XML Files as JSON to StdOut

./junit -file junit.xml