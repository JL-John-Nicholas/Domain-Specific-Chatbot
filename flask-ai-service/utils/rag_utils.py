import os
import google.generativeai as genai

# Configure the API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_answer_with_context(question: str, context_chunks: list[str]) -> str:
    """
    Generate an answer to a question using provided context chunks.
    
    Args:
        question: The question to answer
        context_chunks: List of context strings
        
    Returns:
        Generated answer as string
    """
    if not question or not context_chunks:
        raise ValueError("Question and context chunks must not be empty")
    
    context_str = "\n\n".join(context_chunks)
    prompt = f"""Answer the following question based on the provided context.

Context:
{context_str}

Question:
{question}
"""
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')  # or 'gemini-1.5-pro' if available
        
        # Generate content with the new API format
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
            )
        )
        
        return response.text
        
    except Exception as e:
        raise RuntimeError(f"Failed to generate answer: {str(e)}")