from chromadb import PersistentClient

# Create (or load) local Chroma database
client = PersistentClient(path="./vectordb")

def store_embeddings(chunks, chatbot_id):
    collection = client.get_or_create_collection(name=chatbot_id)
    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            ids=[f"{chatbot_id}_{i}"],
            metadatas=[{"chunk_index": i}]
        )

def query_similar_chunks(query, chatbot_id, n_results=5):
    collection = client.get_or_create_collection(name=chatbot_id)
    results = collection.query(query_texts=[query], n_results=n_results)
    return results["documents"][0]  # list of strings
