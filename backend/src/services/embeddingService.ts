export async function generateEmbedding(text: string): Promise<number[]> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error("HF_TOKEN is missing from your environment variables");

  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text.slice(0, 5000),
        options: { wait_for_model: true },
      }),
    }
  );

  const resultText = await response.text();
  if (!response.ok) throw new Error(`Hugging Face API Error: ${resultText}`);

  const result = JSON.parse(resultText);
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
  return result;
}