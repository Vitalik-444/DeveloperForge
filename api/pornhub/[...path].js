const ENDPOINTS = new Set(["search", "video_by_id", "categories", "tags", "stars"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path.join("/")
    : typeof req.query?.path === "string"
      ? req.query.path
      : "";
  const endpoint = (rawPath || url.pathname.replace(/^\/api\/pornhub\/?/, "").replace(/\/+$/, "")).toLowerCase();

  if (!ENDPOINTS.has(endpoint)) {
    res.status(404).json({ error: "Unknown endpoint" });
    return;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      for (const v of value) searchParams.append(key, v);
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "path") continue;
    if (!searchParams.has(key)) {
      searchParams.set(key, value);
    }
  }

  const target = `https://www.pornhub.com/webmasters/${endpoint}?${searchParams.toString()}`;

  try {
    const upstream = await fetch(target, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.pornhub.com/",
        Cookie:
          "accessAgeDisclaimerPH=1; accessAgeDisclaimerUK=1; accessAgeDisclaimerUS=1; platform=pc; hasVisited=1; age_verified=1; has_access=1",
      },
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const isHtml = text.trim().startsWith("<") || upstream.headers.get("content-type")?.includes("text/html");
      const message = isHtml
        ? `Pornhub blocked this request from server region (HTML returned, status ${upstream.status})`
        : `Pornhub returned ${upstream.status} (invalid JSON)`;
      res.status(502).json({ code: "bad_response", message });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch {
    res.status(502).json({ code: "unreachable", message: "Pornhub is unreachable from the server" });
  }
}
