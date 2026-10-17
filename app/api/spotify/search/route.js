import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

let cachedToken = '';
let tokenExpiresAt = 0;

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      error: NextResponse.json(
        {
          message:
            'Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel, then redeploy.',
        },
        { status: 503 },
      ),
    };
  }

  if (cachedToken && tokenExpiresAt > Date.now() + 60_000) {
    return { token: cachedToken };
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('Spotify token request failed:', response.status);
    return {
      error: NextResponse.json(
        {
          message:
            'Spotify authentication failed. Check the Spotify credentials in Vercel and redeploy.',
        },
        { status: 502 },
      ),
    };
  }

  const tokenData = await response.json();
  if (
    typeof tokenData.access_token !== 'string' ||
    !Number.isFinite(tokenData.expires_in)
  ) {
    console.error('Spotify token response was missing token fields.');
    return {
      error: NextResponse.json(
        { message: 'Spotify returned an invalid authentication response.' },
        { status: 502 },
      ),
    };
  }

  cachedToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;
  return { token: cachedToken };
}

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({ tracks: [] });
  }

  if (query.length > 100) {
    return NextResponse.json(
      { message: 'Search text must be 100 characters or fewer.' },
      { status: 400 },
    );
  }

  try {
    const { token, error } = await getAccessToken();
    if (error) return error;

    const searchUrl = new URL('https://api.spotify.com/v1/search');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'track');
    searchUrl.searchParams.set('limit', '10');

    const makeSearchRequest = (accessToken) =>
      fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });

    let response = await makeSearchRequest(token);

    if (response.status === 401) {
      cachedToken = '';
      tokenExpiresAt = 0;
      const refreshed = await getAccessToken();
      if (refreshed.error) return refreshed.error;
      response = await makeSearchRequest(refreshed.token);
    }

    if (!response.ok) {
      let spotifyMessage = '';
      try {
        const errorBody = await response.json();
        spotifyMessage =
          errorBody?.error?.message || errorBody?.error_description || '';
      } catch {
        spotifyMessage = '';
      }

      console.error('Spotify search request failed:', {
        status: response.status,
        message: spotifyMessage || 'No error details returned',
      });

      const message =
        response.status === 401
          ? 'Spotify rejected its access token. Check that the Client ID and Client Secret belong to the same Spotify app, then redeploy.'
          : response.status === 403
            ? 'Spotify denied this app access to search. Check the app status and API access in the Spotify Developer Dashboard.'
            : response.status === 400
              ? 'Spotify rejected the search request. Try a shorter search, or check the Spotify app API access.'
              : response.status === 429
                ? 'Spotify search is busy. Please wait a moment and try again.'
                : 'Spotify could not complete the search. Check the Vercel function logs for the Spotify response status.';

      return NextResponse.json(
        { message },
        {
          status:
            response.status === 429
              ? 429
              : response.status === 400
                ? 400
                : 502,
          headers:
            response.status === 429 && response.headers.get('retry-after')
              ? { 'Retry-After': response.headers.get('retry-after') }
              : undefined,
        },
      );
    }

    const data = await response.json();
    const tracks = (data.tracks?.items || [])
      .filter((track) => track?.id && track?.name)
      .map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((artist) => artist.name).join(', '),
        album: track.album?.name || 'Single',
        duration_seconds: Math.floor((track.duration_ms || 0) / 1000),
        cover_url: track.album?.images?.[0]?.url || '',
        spotify_url:
          track.external_urls?.spotify ||
          `https://open.spotify.com/track/${track.id}`,
      }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Spotify search failed:', error);
    return NextResponse.json(
      { message: 'Could not reach Spotify. Please try again later.' },
      { status: 502 },
    );
  }
}
