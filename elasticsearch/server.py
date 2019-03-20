import os
from urllib.parse import urlparse
import json

from flask import Flask
from flask import render_template
from flask import request

from elasticsearch import Elasticsearch

app = Flask(__name__)
port = int(os.getenv('PORT', 8080))

if 'BINDING' in os.environ:
    credentials = json.loads(os.environ['BINDING'])
    es_conn = credentials['connection']['https']
    connection_string = es_conn['composed'][0]

parsed = urlparse(connection_string)

es = Elasticsearch(
    [parsed.hostname],
    http_auth=(parsed.username, parsed.password),
    port=parsed.port,
    use_ssl=True,
    verify_certs=True,
    ca_certs="/etc/ssl/certs/ca-certificates.crt"
)

# index access/creation
if not es.indices.exists(index="words"):
    es.indices.create(index="words")

@app.route('/')
# top-level page display, creates table if it doesn't exist
def serve_page():
    return render_template('index.html')


@app.route('/words', methods=['PUT'])
# triggers on hitting the 'Add' button; inserts word/definition into table
def handle_words():
    new_word = {"word":request.form['word'], "definition":request.form['definition']}
    # Insert the new word into the index
    es.index(index="words", doc_type="word", body=new_word)
    # Refresh index.
    es.indices.refresh(index="words")
    return ('', 204)


@app.route('/words', methods=['GET'])
# queries and formats results for display on page
def display_select():
        # Run a search for all existing words
    res = es.search(index="words", doc_type="word", body={})
    #Pull the word object from each hit in the search results
    hit_list = (res['hits']['hits'])
    # List word objects, appending the contents from the search hit's _source field.
    words_list = []
    for hit in hit_list:
        words_list.append(hit['_source'])
    # JSON-ify the list of words.
    return json.dumps(words_list)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)