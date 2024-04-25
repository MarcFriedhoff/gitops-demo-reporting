package main

type JSONHandler interface {
	HandleJSON(data []byte) error
}
