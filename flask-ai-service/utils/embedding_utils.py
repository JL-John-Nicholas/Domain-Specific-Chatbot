import os
import uuid
from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai
from google.genai import types

# Load environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("[DEBUG] Loading environment variables...")
if not PINECONE_API_KEY:
    raise ValueError("[ERROR] Missing PINECONE_API_KEY in .env file.")
if not GEMINI_API_KEY:
    raise ValueError("[ERROR] Missing GEMINI_API_KEY in .env file.")
print("[DEBUG] Environment variables loaded successfully.")

# Init Pinecone
print("[DEBUG] Initializing Pinecone client...")
pc = Pinecone(api_key=PINECONE_API_KEY)
print("[DEBUG] Pinecone client initialized.")

INDEX_NAME = "chatbot-index"
EMBEDDING_DIM = 768  # Gemini embedding size

# Create index if it doesn't exist
try:
    print("[DEBUG] Checking for existing Pinecone indexes...")
    existing_indexes = [idx["name"] for idx in pc.list_indexes()]  # FIX: list_indexes() returns dicts, not objects
    print(f"[DEBUG] Existing indexes: {existing_indexes}")
    
    if INDEX_NAME not in existing_indexes:
        print(f"[DEBUG] Creating new index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        print(f"[DEBUG] Index '{INDEX_NAME}' created successfully.")
    else:
        print(f"[DEBUG] Index '{INDEX_NAME}' already exists.")
except Exception as e:
    raise RuntimeError(f"[ERROR] Failed to check/create Pinecone index: {e}")

# Connect to index
print(f"[DEBUG] Connecting to Pinecone index '{INDEX_NAME}'...")
index = pc.Index(INDEX_NAME)
print("[DEBUG] Connected to Pinecone index successfully.")

# Init Gemini
print("[DEBUG] Initializing Gemini API...")
genai.configure(api_key=GEMINI_API_KEY)
print("[DEBUG] Gemini API initialized successfully.")

def get_embedding(text: str):
    """Generate embedding vector from Gemini."""
    print(f"[DEBUG] Generating embedding for text (len={len(text)} chars)...")
    try:
        emb = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768
        )
        print("[DEBUG] Embedding generated successfully.")
        return emb["embedding"]
    except Exception as e:
        raise RuntimeError(f"[ERROR] Embedding generation failed: {e}")

def store_embeddings(chunks, chatbot_id):
    """Store text chunks in Pinecone with embeddings."""
    print(f"[DEBUG] Storing {len(chunks)} chunks for chatbot_id={chatbot_id}...")
    vectors = []
    for i, chunk in enumerate(chunks):
        print(f"[DEBUG] Processing chunk {i+1}/{len(chunks)}...")
        unique_id = f"{chatbot_id}_{uuid.uuid4().hex[:8]}_{i}"
        embedding = get_embedding(chunk)
        vectors.append({
            "id": unique_id,
            "values": embedding,
            "metadata": {
                "text": chunk,
                "chunk_index": i,
                "chatbot_id": chatbot_id
            }
        })
    try:
        print("[DEBUG] Uploading vectors to Pinecone...")
        index.upsert(vectors=vectors)
        print(f"[DEBUG] Successfully upserted {len(vectors)} vectors.")
    except Exception as e:
        raise RuntimeError(f"[ERROR] Failed to upsert vectors: {e}")

def query_similar_chunks(query, chatbot_id, n_results=5):
    """Search for similar chunks in Pinecone."""
    print(f"[DEBUG] Querying Pinecone for chatbot_id={chatbot_id} (top_k={n_results})...")
    query_embedding = get_embedding(query)
    try:
        results = index.query(
            vector=query_embedding,
            top_k=n_results,
            filter={"chatbot_id": {"$eq": chatbot_id}},
            include_metadata=True
        )
        print(f"[DEBUG] Retrieved {len(results.matches)} matching chunks.")
        return [match.metadata["text"] for match in results.matches]
    except Exception as e:
        raise RuntimeError(f"[ERROR] Query to Pinecone failed: {e}")
    
def delete_embeddings_by_chatbot(chatbot_id: str):
    """Delete all vectors for a given chatbot_id."""
    print(f"[DEBUG] Deleting all embeddings for chatbot_id={chatbot_id}...")
    try:
        index.delete(filter={"chatbot_id": {"$eq": chatbot_id}})
        print("[DEBUG] Deletion completed successfully.")
        return True
    except Exception as e:
        print(f"[ERROR] Error deleting embeddings: {e}")
        return False
