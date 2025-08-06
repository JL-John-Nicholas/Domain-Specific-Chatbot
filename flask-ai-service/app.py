from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.pdf_utils import extract_text_chunks
from utils.embedding_utils import store_embeddings, query_similar_chunks
from utils.rag_utils import generate_answer_with_context

import os
import requests
import io
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Flask AI microservice is running 🚀"

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    data = request.json
    file_urls = data.get('file_urls')  # Expecting a list now
    chatbot_id = data.get('chatbot_id')

    if not file_urls or not chatbot_id:
        return jsonify({"error": "Missing file_urls or chatbot_id"}), 400

    if not isinstance(file_urls, list):
        return jsonify({"error": "file_urls must be a list of URLs"}), 400

    total_chunks = 0
    processed_docs = []

    for url in file_urls:
        try:
            response = requests.get(url)
            file_content = io.BytesIO(response.content)
            chunks = extract_text_chunks(file_content)
            store_embeddings(chunks, chatbot_id)
            total_chunks += len(chunks)
            processed_docs.append({"url": url, "chunks": len(chunks)})
        except Exception as e:
            processed_docs.append({"url": url, "error": str(e)})

    return jsonify({
        "message": "Documents processed",
        "total_chunks": total_chunks,
        "details": processed_docs
    })


@app.route('/query', methods=['POST'])
def query_chatbot():
    data = request.json
    question = data.get('question')
    chatbot_id = data.get('chatbot_id')

    # Fetch relevant context chunks
    top_chunks = query_similar_chunks(question, chatbot_id)

    # Generate final answer with Gemini
    answer = generate_answer_with_context(question, top_chunks)

    return jsonify({"answer": answer, "sources": top_chunks})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
