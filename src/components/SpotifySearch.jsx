import { Disc3, ExternalLink, Search } from 'lucide-react';
import './SpotifySearch.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

const formatDuration = (seconds) =>
  `${Math.floor((Number(seconds) || 0) / 60)}:${String(
    Math.floor((Number(seconds) || 0) % 60),
  ).padStart(2, '0')}`;

export default function SpotifySearch({
  query,
  tracks,
  loading,
  error,
  selectedTrack,
  setSelectedTrack,
}) {
  return (
    <section className="spotify-search section-block">
      <div className="section-heading">
        <div>
          <div className="eyebrow muted-eyebrow">SPOTIFY CATALOGUE</div>
          <h2>{query ? `Spotify results for “${query}”` : 'Search Spotify'}</h2>
        </div>
        <div className="section-controls">
          <span>{loading ? 'SEARCHING' : `${tracks.length} TRACKS`}</span>
        </div>
      </div>

      {error ? (
        <div className="spotify-empty-state" role="alert">
          <Disc3 size={30} />
          <h3>Spotify search is unavailable</h3>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="spotify-empty-state" role="status">
          <Disc3 size={30} />
          <p>Searching Spotify…</p>
        </div>
      ) : !query ? (
        <div className="spotify-empty-state">
          <Search size={30} />
          <h3>Find songs on Spotify</h3>
          <p>Search for Marathi songs, artists, or albums above.</p>
        </div>
      ) : tracks.length ? (
        <>
          {selectedTrack && (
            <div className="spotify-player">
              <div className="spotify-player-heading">
                <div>
                  <span className="eyebrow muted-eyebrow">SPOTIFY PLAYER</span>
                  <h3>{selectedTrack.title}</h3>
                  <p>{selectedTrack.artist}</p>
                </div>
                <button
                  type="button"
                  className="spotify-close"
                  onClick={() => setSelectedTrack(null)}
                  aria-label="Close Spotify player"
                >
                  ×
                </button>
              </div>
              <iframe
                className="spotify-embed"
                src={`https://open.spotify.com/embed/track/${encodeURIComponent(selectedTrack.id)}?utm_source=generator`}
                title={`Spotify player for ${selectedTrack.title} by ${selectedTrack.artist}`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <p className="spotify-player-note">
                Playback is provided by Spotify. Availability and account
                requirements depend on Spotify.
              </p>
            </div>
          )}

          <div className="spotify-result-list">
            {tracks.map((track) => (
              <article className="spotify-result" key={track.id}>
                <img
                  src={track.cover_url || fallback}
                  alt={`${track.title} album cover`}
                  onError={(event) => {
                    event.currentTarget.src = fallback;
                  }}
                />
                <div className="spotify-result-info">
                  <h3>{track.title}</h3>
                  <p>{track.artist}</p>
                  <span>
                    {track.album} · {formatDuration(track.duration_seconds)}
                  </span>
                </div>
                <button
                  type="button"
                  className="spotify-listen-btn"
                  onClick={() => setSelectedTrack(track)}
                >
                  Listen here
                </button>
                <a
                  className="spotify-open-link"
                  href={track.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${track.title} on Spotify`}
                  title="Open on Spotify"
                >
                  <ExternalLink size={16} />
                </a>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="spotify-empty-state">
          <Disc3 size={30} />
          <h3>No Spotify tracks found</h3>
          <p>Try a different song title, artist, or album.</p>
        </div>
      )}
    </section>
  );
}
