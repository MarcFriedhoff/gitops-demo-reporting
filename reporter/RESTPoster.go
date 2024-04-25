package main

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/http"
)

type RESTPoster struct {
	EndpointURL string
	Index       string
	Username    string
	Password    string
}

func (rp *RESTPoster) HandleJSON(data []byte) error {
	// Create client with basic auth
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	// Create request
	req, err := http.NewRequest("POST", rp.EndpointURL+"/"+rp.Index+"/_doc", bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	// use basic auth if username and password are provided
	if rp.Username != "" && rp.Password != "" {
		req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(rp.Username+":"+rp.Password)))
	}

	// Perform request
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("received non-OK HTTP status %s", resp.Status)
	}

	// Optional: Read response body
	// responseBody, _ := ioutil.ReadAll(resp.Body)
	// fmt.Println(string(responseBody))

	return nil
}
