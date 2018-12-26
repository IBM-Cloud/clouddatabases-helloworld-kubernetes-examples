/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";
/* jshint node:true */

// Add the express web framework
const express = require("express");
const app = express();
const fs = require("fs");

// Use body-parser to handle the PUT data
const bodyParser = require("body-parser");
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

// Util is handy to have around, so thats why that's here.
const util = require('util')

// and so is assert
const assert = require('assert');

// We want to extract the port to publish our app on
let port = process.env.PORT || 8080;

// Then we'll pull in the database client library
const elasticsearch = require("elasticsearch");

// Route for a health check
app.get('/healthz', function(req, res) {
    res.send('OK!');
});

let credentials;

// Retrieve the Kubernetes environment variables from BINDING in the clouddb-deployment.yaml file
// Check to make sure that the BINDING environment variable is present
// If it's not present, then it will throw an error
if (process.env.BINDING) {
    credentials = JSON.parse(process.env.BINDING);
}

assert(!util.isUndefined(credentials), "Must be bound to IBM Kubernetes Cluster");

// We now take the first bound Elasticsearch service and extract it's credentials object
var elasticsearchConn = credentials.connection.https;
let caCert = Buffer.from(elasticsearchConn.certificate.certificate_base64, 'base64').toString();
let connectionHost = elasticsearchConn.composed[0];

let esAuthentication = elasticsearchConn.authentication;
let userAuthentication = `${esAuthentication.username}:${esAuthentication.password}`;

let client = new elasticsearch.Client({
    host: connectionHost,
    httpAuth: userAuthentication,
    ssl: {
        ca: caCert,
    rejectUnauthorized: true
    } 
});

//Create the index if it doesn't already exist
function checkIndices() {
    client.indices
      .exists({
        index: "ibmclouddb"
      })
      .then(exists => {
        if (exists === false) {
          client.indices
            .create({
              index: "ibmclouddb",
              body: {
                mappings: {
                  words: {
                    properties: {
                      word: { type: "text" },
                      definition: { type: "text" },
                      added: { type: "date" }
                    }
                  }
                }
              }
            })
            .catch(err => {
              console.error(err);
            });
        }
      })
      .catch(err => {
        console.error("Problem checking indices exist");
      });
  }
  
  // Check for an existing index
  checkIndices();
  
  // Add a word to the index
  function addWord(word, definition) {
    let now = new Date();
    return client.index({
      index: "ibmclouddb",
      type: "words",
      body: {
        word: word,
        definition: definition,
        added: now
      },
      refresh: "wait_for"
    });
  }
  
  // Get words from the index
  function getWords() {
    return client
      .search({
        index: "ibmclouddb",
        type: "words",
        _source: ["word", "definition"],
        body: {
          sort: {
            added: {
              order: "desc"
            }
          }
        }
      })
      .then(results => {
        return new Promise((resolve, reject) => {
          let words = [];
          results.hits.hits.forEach(function(hit) {
            words.push({
              word: hit._source.word,
              definition: hit._source.definition
            });
            resolve(words);
          });
        });
      })
      .catch(err => {
        console.error(err);
      });
  }

// We can now set up our web server. First up we set it to serve static pages
app.use(express.static(__dirname + "/public"));

// The user has clicked submit to add a word and definition to the database
// Send the data to the addWord function and send a response if successful
app.put("/words", function(request, response) {
    addWord(request.body.word, request.body.definition)
        .then(function(resp) {
            response.send(resp);
        })
        .catch(function(err) {
            console.log(err);
            response.status(500).send(err);
        });
});

// Read from the database when the page is loaded or after a word is successfully added
// Use the getWords function to get a list of words and definitions from the database
app.get("/words", function(request, response) {
    getWords()
        .then(function(words) {
            response.send(words);
        })
        .catch(function(err) {
            console.log(err);
            response.status(500).send(err);
        });
});

// Listen for a connection.
app.listen(port, function() {
    console.log("Server is listening on port " + port);
});
