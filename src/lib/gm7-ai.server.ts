const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

/** Calls the Lovable AI Gateway (Responses API, streamed) and returns the final text. */
export async function askGm7Ai(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("المساعد الذكي غير مُهيّأ حالياً.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });

  if (!response.ok || !response.body) {
    if (response.status === 429) throw new Error("ضغط كبير على المساعد الذكي، أعد المحاولة بعد قليل.");
    if (response.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ.");
    if (response.status === 403) throw new Error("لا يتوفر وصول للمساعد الذكي حالياً.");
    throw new Error("تعذر تشغيل المساعد الذكي.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string; text?: string };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
        else if (event.type === "response.output_text.done" && !text && typeof event.text === "string") text = event.text;
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }

  return text.trim();
}
