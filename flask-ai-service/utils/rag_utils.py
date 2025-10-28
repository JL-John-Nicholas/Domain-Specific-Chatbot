import os
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_answer_with_context(question: str, context_chunks: list[str]) -> str:
    """
    Generate an answer to a question using provided context chunks.
    """
    if not question or not context_chunks:
        raise ValueError("Question and context chunks must not be empty")
    
    # Combine all chunks into one context block
    context_str = "\n\n".join(context_chunks)
    
    # Create the full prompt
    prompt = f"""
You are an AI assistant. Answer the question based only on the provided context.
If the answer is not in the context, say you don't know.

Context:
{context_str}

Question:
{question}
"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,  # lower = more factual
                top_p=0.95,
                top_k=40,
                max_output_tokens=1024,
            )
        )

        # Return the answer text (handling if no text is present)
        return getattr(response, "text", "").strip() or "I couldn't generate an answer."

    except Exception as e:
        raise RuntimeError(f"Failed to generate answer: {e}")
