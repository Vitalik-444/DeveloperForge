const ALLOWED = new Set(["en", "ru", "uk"]);

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await readBody(req);
  const q = typeof body.q === "string" ? body.q.slice(0, 4000) : "";
  const sl = ALLOWED.has(body.sl) ? body.sl : "en";
  const tl = ALLOWED.has(body.tl) ? body.tl : "ru";
  if (!q.trim()) {
    res.status(400).json({ error: "Empty text" });
    return;
  }

  try {
    const params = new URLSearchParams({ client: "gtx", sl, tl, dt: "t" });
    const upstream = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "Mozilla/5.0" },
      body: new URLSearchParams({ q }).toString(),
    });
    if (!upstream.ok) {
      res.status(upstream.status === 429 ? 429 : 502).json({ error: "Upstream error" });
      return;
    }
    const data = await upstream.json();
    const text = (Array.isArray(data?.[0]) ? data[0] : []).map((part) => part?.[0] ?? "").join("");
    res.status(200).json({ text });
  } catch {
    res.status(502).json({ error: "Translation failed" });
  }
}
