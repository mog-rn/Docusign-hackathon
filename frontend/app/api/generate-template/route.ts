export const config = {
  runtime: "edge",
};

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ message: "Missing OpenAI API key" }), { status: 500 });
  }

  try {
    console.log("Fetching template from OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates professional contract templates." },
          { role: "user", content: "Generate a contract template for an agreement between two parties." },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate template");
    }

    const data = await response.json();
    const template = data.choices[0].message.content;

    return new Response(JSON.stringify({ template }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching template from OpenAI:", error);
    return new Response(JSON.stringify({ message: "Error fetching template" }), { status: 500 });
  }
}
