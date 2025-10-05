import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate speech using OpenAI TTS with streaming
    const mp3Stream = await openai.audio.speech.create({
      model: "tts-1", // Use tts-1 for faster streaming (tts-1-hd for higher quality)
      voice: "nova", // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      response_format: "mp3",
    });

    // Create a ReadableStream from the response
    const stream = mp3Stream.body;

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return new Response(JSON.stringify({ error: "Failed to generate audio" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
