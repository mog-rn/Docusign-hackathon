import { NextResponse } from "next/server";

// In-memory cache for storing the template
let cachedTemplate: string | null = null;

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY; // Set your OpenAI API key in the .env file
  if (!apiKey) {
    return NextResponse.json({ message: "Missing OpenAI API key" }, { status: 500 });
  }

  try {
    // Check if the template is already cached
    if (cachedTemplate) {
      console.log("Template found in in-memory cache.");
      console.log("Cached Template:", cachedTemplate); // Log cached template
      return NextResponse.json({ template: cachedTemplate });
    }

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
          {
            role: "system",
            content:
              "You are a helpful assistant that generates professional contract templates.",
          },
          {
            role: "user",
            content: "Generate a contract template for an agreement between two parties.",
          },
        ],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to generate template");
    }

    // Log the template received from OpenAI
    const template = data.choices[0].message.content;
    console.log("Generated Template from OpenAI:", template);

    // Cache the template in memory
    cachedTemplate = template;

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template from OpenAI:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Unknown error occurred" }, { status: 500 });
  }
}