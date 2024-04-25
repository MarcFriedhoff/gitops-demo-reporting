package main

import (
	"fmt"
)

type RESTStdOut struct {
	EndpointURL string
	Index       string
	Username    string
	Password    string
}

func (rp *RESTStdOut) HandleJSON(data []byte) error {

	// simply write to stdout
	fmt.Println(string(data))

	return nil
}
