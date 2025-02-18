export async function onRequest(context) {
  const url = new URL(context.request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Response(blob, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      },
    });
  } catch (error) {
    return new Response(`Failed to fetch image: ${error.message}`, { status: 500 });
  }
} 