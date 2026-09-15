import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "not_authenticated" }, 401);

    const { messages, context } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: "messages_required" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "ai_not_configured" }, 503);

    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
    const system = [
      "You are MK English Pro AI Coach, a concise and encouraging English teacher.",
      "Coach from the learner's real practice data; do not invent mastery data.",
      "Prioritize the current lesson when lessonId is supplied, then naturally recycle weak older patterns.",
      "Give one manageable task at a time. Ask the learner to produce English when appropriate.",
      "When correcting, show the learner's issue briefly, give a natural correction, and explain only what is useful.",
      "Avoid long grammar lectures. Keep most replies under 100 words unless the learner asks for detail.",
      "Do not claim to have listened to audio or assessed pronunciation unless such evidence is explicitly supplied.",
      `Current coach context: ${JSON.stringify(context ?? {})}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [{ role: "system", content: system }, ...messages.slice(-12)],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI request failed", response.status, await response.text());
      return json({ error: "ai_provider_error" }, 502);
    }
    const payload = await response.json();
    const message = payload?.choices?.[0]?.message?.content;
    if (!message) return json({ error: "ai_empty_response" }, 502);
    return json({ message });
  } catch (error) {
    console.error(error);
    return json({ error: "coach_failed" }, 500);
  }
});
