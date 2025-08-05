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
    file_url = data.get('file_url')
    chatbot_id = data.get('chatbot_id')

    if not file_url or not chatbot_id:
        return jsonify({"error": "Missing file_url or chatbot_id"}), 400

    # Download file from S3 temporarily 
    response = requests.get(file_url)
    file_content = io.BytesIO(response.content)

    # Extract and store chunks
    chunks = extract_text_chunks(file_content)
    store_embeddings(chunks, chatbot_id)

    return jsonify({"message": "Document processed", "chunks": len(chunks)})

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
