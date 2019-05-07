import os
from urllib.parse import urlparse
import json
import sys

from flask import Flask
from flask import render_template
from flask import request

import pymongo
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

from bson import json_util

app = Flask(__name__)
port = int(os.getenv('PORT', 8080))

if 'BINDING' in os.environ:
    credentials = json.loads(os.environ['BINDING'])
    mongodb_conn = credentials['connection']['mongodb']
    connection_string = mongodb_conn['composed'][0]

parsed = urlparse(connection_string)
    
client = MongoClient(
    connection_string,
    ssl=True,
    ssl_ca_certs='/etc/ssl/certs/ca-certificates.crt'
)

# test db connection, if db is not available, do not start flask server
try:
    # The ismaster command is cheap and does not require auth, recommended by pymongo 
    client.admin.command('ismaster')
except ConnectionFailure as err:
    print("Failed connection: %s" % str(err))
    sys.exit()

# database/collection names
db = client.ibmcloud_databases
collection = db.words

@app.route('/')
# top-level page display
def serve_page():
    return render_template('index.html')


@app.route('/words', methods=['PUT'])
# triggers on hitting the 'Add' button; inserts word/definition into collection
def handle_words():
    new_word = {"word":request.form['word'], "definition":request.form['definition']}
    collection.insert_one(new_word).inserted_id
    return ('', 204)


@app.route('/words', methods=['GET'])
# query for all the words in the collection, returns as json for display on the page.
def display_find():
    cursor_obj = collection.find({}, {"_id":0})
    return json_util.dumps(cursor_obj)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)