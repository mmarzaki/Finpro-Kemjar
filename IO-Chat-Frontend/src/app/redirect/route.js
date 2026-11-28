export async function GET(request) {
  const targetUrl = request.nextUrl.searchParams.get("url");
  const defaultFallback = "/";

  if (!targetUrl) {
    return new Response("Parameter url tidak ditemukan.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const isSafeUrl = (urlStr) => {
    if (urlStr.startsWith("/") && !urlStr.startsWith("//") && !urlStr.startsWith("/\\")) {
      return true;
    }

    try {
      const parsedUrl = new URL(urlStr, request.nextUrl.origin);
      const allowedDomains = ["finpro-kemjar-fe.vercel.app", "localhost:3000"];

      if (allowedDomains.includes(parsedUrl.host) && (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  const safeDestination = isSafeUrl(targetUrl) ? targetUrl : defaultFallback;

  return new Response(null, {
    status: 302,
    headers: {
      Location: safeDestination,
    },
  });
}