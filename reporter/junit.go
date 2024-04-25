package main

import (
	"encoding/json"
	"encoding/xml"
	"flag"
	"io/ioutil"
	"log"
	"time"
)

// Define XML structures
type TestSuite struct {
	XMLName    xml.Name   `xml:"testsuite"`
	Name       string     `xml:"name,attr"`
	Tests      int        `xml:"tests,attr"`
	Failures   int        `xml:"failures,attr"`
	Errors     int        `xml:"errors,attr"`
	Assertions int        `xml:"assertions,attr"`
	Time       float64    `xml:"time,attr"`
	Timestamp  string     `xml:"timestamp,attr,omitempty"`
	TestCases  []TestCase `xml:"testcase"`
	SystemOut  *SystemOut `xml:"system-out,omitempty"`
	SystemErr  *SystemErr `xml:"system-err,omitempty"`
	HosteName  string     `xml:"hostname,omitempty"`
}

type TestCase struct {
	Name      string   `xml:"name,attr"`
	ClassName string   `xml:"classname,attr"`
	Time      float64  `xml:"time,attr"`
	Failure   *Failure `xml:"failure,omitempty"`
	Error     *Error   `xml:"error,omitempty"`
	Skipped   *Skipped `xml:"skipped,omitempty"`
}

type Failure struct {
	Message  string `xml:"message,attr"`
	Type     string `xml:"type,attr"`
	Contents string `xml:",chardata"`
}

type Error struct {
	Message  string `xml:"message,attr"`
	Type     string `xml:"type,attr"`
	Contents string `xml:",chardata"`
}

type Skipped struct {
	Message  string `xml:"message,attr"`
	Type     string `xml:"type,attr"`
	Contents string `xml:",chardata"`
}

type SystemOut struct {
	Contents string `xml:",chardata"`
}

type SystemErr struct {
	Contents string `xml:",chardata"`
}

type Properties struct {
	Property []Property `xml:"property"`
}
type Property struct {
	Name  string `xml:"name,attr"`
	Value string `xml:"value,attr"`
}

// Define JSON structures (including TestCase failures)
type TestSuiteJSON struct {
	Name       string  `json:"name"`
	Tests      int     `json:"tests"`
	Failures   int     `json:"failures"`
	Errors     int     `json:"errors"`
	Assertions int     `json:"assertions"`
	Time       float64 `json:"time"`
	Timestamp  string  `json:"timestamp,omitempty"`
	SystemErr  string  `json:"systemErr,omitempty"`
	SystemOut  string  `json:"systemOut,omitempty"`
	HostName   string  `json:"hostName,omitempty"`
}

type TestCaseJSON struct {
	TestSuiteName string   `json:"testSuiteName"`
	Name          string   `json:"name"`
	ClassName     string   `json:"className"`
	Time          float64  `json:"time"`
	Failure       *Failure `json:"failure,omitempty"`
	Error         *Error   `json:"error,omitempty"`
	Skipped       *Skipped `json:"skipped,omitempty"`
}

func main() {
	var bytes []byte
	var err error

	file := flag.String("file", "", "Path to JUnit XML file")
	restHandler := flag.String("restHandler", "stdout", "REST handler (stdout, es)")
	esURL := flag.String("esURL", "", "Elasticsearch URL")
	esIndex := flag.String("esIndex", "", "Elasticsearch index")
	esUsername := flag.String("esUsername", "", "Elasticsearch username")
	esPassword := flag.String("esPassword", "", "Elasticsearch password")

	flag.Parse()

	bytes, err = ioutil.ReadFile(*file)
	if err != nil {
		log.Fatal(err)
	}

	var ts TestSuite
	err = xml.Unmarshal(bytes, &ts)
	if err != nil {
		log.Fatal(err)
	}

	// timestamp now
	var parsedTime time.Time
	parsedTime = time.Now()

	// Parse ISO 8601 timestamp if present
	if ts.Timestamp != "" {
		parsedTime, err = time.Parse(time.RFC3339, ts.Timestamp)
		if err != nil {
			log.Fatalf("Error parsing timestamp: %v", err)
		}
	}

	// Convert TestSuite to JSON (excluding TestCases)
	tsJSON := TestSuiteJSON{
		Name:       ts.Name,
		Tests:      ts.Tests,
		Assertions: ts.Assertions,
		Failures:   ts.Failures,
		Errors:     ts.Errors,
		Time:       ts.Time,
		Timestamp:  parsedTime.UTC().Format(time.RFC3339),
	}

	var handler JSONHandler

	if restHandler == nil || *restHandler == "es" {
		handler = &RESTPoster{EndpointURL: *esURL, Index: *esIndex, Username: *esUsername, Password: *esPassword}
	} else {
		handler = &RESTStdOut{}
	}

	// Process TestSuite JSON
	tsJSONBytes, _ := json.MarshalIndent(tsJSON, "", "  ")
	if err := handler.HandleJSON(tsJSONBytes); err != nil {
		log.Fatalf("Error handling Test Suite JSON: %v", err)
	}

	// Process each TestCase JSON
	for _, tc := range ts.TestCases {
		tcJSONBytes, _ := json.MarshalIndent(tc, "", "  ")
		if err := handler.HandleJSON(tcJSONBytes); err != nil {
			log.Fatalf("Error handling Test Case JSON: %v", err)
		}
	}
}
