from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.pdf_utils import extract_text_chunks
from utils.embedding_utils import store_embeddings, query_similar_chunks, delete_embeddings_by_chatbot
from utils.rag_utils import generate_answer_with_context

import os
import requests
import io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ✅ Allow frontend calls (adjust CORS as per your frontend domain)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "*"}})  # <-- change "*" to your frontend URL when deploying

# --- Health Check ---
@app.route('/')
def home():
    return "✅ Flask AI microservice is running 🚀"

# --- PDF Processing ---
@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    print("[DEBUG] /process-pdf endpoint hit")

    data = request.get_json(force=True)
    file_urls = data.get('file_urls')
    chatbot_id = data.get('chatbot_id')

    print(f"[DEBUG] Received chatbot_id: {chatbot_id}")
    print(f"[DEBUG] Received {len(file_urls) if file_urls else 0} file URLs")

    if not file_urls or not chatbot_id:
        print("[ERROR] Missing file_urls or chatbot_id")
        return jsonify({"error": "Missing file_urls or chatbot_id"}), 400

    if not isinstance(file_urls, list):
        print("[ERROR] file_urls is not a list")
        return jsonify({"error": "file_urls must be a list of URLs"}), 400

    total_chunks = 0
    processed_docs = []

    for url in file_urls:
        print(f"[DEBUG] Processing file URL: {url}")
        try:
            response = requests.get(url)
            if response.status_code != 200:
                raise ValueError(f"Failed to fetch file: HTTP {response.status_code}")

            file_content = io.BytesIO(response.content)
            chunks = extract_text_chunks(file_content)
            print(f"[DEBUG] Extracted {len(chunks)} chunks from file")

            store_embeddings(chunks, chatbot_id)
            print("[DEBUG] Stored embeddings successfully")

            total_chunks += len(chunks)
            processed_docs.append({"url": url, "chunks": len(chunks)})

        except Exception as e:
            print(f"[ERROR] Failed processing {url}: {e}")
            processed_docs.append({"url": url, "error": str(e)})

    print(f"[DEBUG] Total chunks processed: {total_chunks}")

    return jsonify({
        "message": "Documents processed successfully",
        "total_chunks": total_chunks,
        "details": processed_docs
    })


# --- Query Endpoint ---
@app.route('/query', methods=['POST'])
def query_chatbot():
    print("[DEBUG] /query endpoint hit")

    data = request.get_json(force=True)
    question = data.get('question')
    chatbot_id = data.get('chatbot_id')

    print(f"[DEBUG] chatbot_id={chatbot_id}, question='{question[:50]}...'")

    if not question or not chatbot_id:
        print("[ERROR] Missing question or chatbot_id")
        return jsonify({"error": "Missing question or chatbot_id"}), 400

    try:
        # Fetch relevant context chunks
        print("[DEBUG] Fetching similar chunks from Pinecone...")
        top_chunks = query_similar_chunks(question, chatbot_id)
        print(f"[DEBUG] Retrieved {len(top_chunks)} chunks for context")

        # Generate final answer with Gemini
        print("[DEBUG] Generating answer with context...")
        answer = generate_answer_with_context(question, top_chunks)

        print("[DEBUG] Answer generation complete")
        return jsonify({"answer": answer, "sources": top_chunks})

    except Exception as e:
        print(f"[ERROR] Query processing failed: {e}")
        return jsonify({"error": str(e)}), 500


# --- Delete Embeddings ---
@app.route('/delete-embeddings', methods=['POST'])
def delete_embeddings():
    print("[DEBUG] /delete-embeddings endpoint hit")

    data = request.get_json(force=True)
    chatbot_id = data.get("chatbot_id")

    print(f"[DEBUG] chatbot_id={chatbot_id}")

    if not chatbot_id:
        print("[ERROR] chatbot_id missing in request")
        return jsonify({"error": "chatbot_id is required"}), 400

    try:
        success = delete_embeddings_by_chatbot(chatbot_id)
        if success:
            print("[DEBUG] Embeddings deleted successfully")
            return jsonify({"message": "Embeddings deleted successfully"})
        else:
            print("[ERROR] Failed to delete embeddings")
            return jsonify({"error": "Failed to delete embeddings"}), 500
    except Exception as e:
        print(f"[ERROR] Exception while deleting embeddings: {e}")
        return jsonify({"error": str(e)}), 500


# --- Run App ---
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"[DEBUG] Starting Flask app on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
