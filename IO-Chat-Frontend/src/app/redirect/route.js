export async function GET(request) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (targetUrl) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: targetUrl,
      },
    });
  }

  return new Response("Parameter url tidak ditemukan.", {
    status: 400,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
