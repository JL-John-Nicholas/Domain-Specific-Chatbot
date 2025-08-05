from PyPDF2 import PdfReader

def extract_text_chunks(file, chunk_size=500):
    reader = PdfReader(file)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() or ""

    # Simple chunking by characters
    chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
    return chunks
