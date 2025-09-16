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

# Init Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

INDEX_NAME = "chatbot-index"
EMBEDDING_DIM = 768  # Gemini embedding size

# Create index if it doesn't exist
try:
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
except Exception as e:
    raise RuntimeError(f"Failed to check/create Pinecone index: {e}")

# Connect to index
index = pc.Index(INDEX_NAME)

# Init Gemini
genai.configure(api_key=GEMINI_API_KEY)

def get_embedding(text: str):
    """Generate embedding vector from Gemini."""
    try:
        emb = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768
        )
        return emb["embedding"]
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {e}")

def store_embeddings(chunks, chatbot_id):
    """Store text chunks in Pinecone with embeddings."""
    vectors = []
    for i, chunk in enumerate(chunks):
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
        index.upsert(vectors=vectors)
    except Exception as e:
        raise RuntimeError(f"Failed to upsert vectors: {e}")

def query_similar_chunks(query, chatbot_id, n_results=5):
    """Search for similar chunks in Pinecone."""
    query_embedding = get_embedding(query)
    try:
        results = index.query(
            vector=query_embedding,
            top_k=n_results,
            filter={"chatbot_id": {"$eq": chatbot_id}},
            include_metadata=True
        )
        return [match.metadata["text"] for match in results.matches]
    except Exception as e:
        raise RuntimeError(f"Query to Pinecone failed: {e}")
    
def delete_embeddings_by_chatbot(chatbot_id: str):
    """Delete all vectors for a given chatbot_id."""
    try:
        index.delete(filter={"chatbot_id": chatbot_id})  # no $eq needed
        return True
    except Exception as e:
        print(f"Error deleting embeddings: {e}")
        return False

