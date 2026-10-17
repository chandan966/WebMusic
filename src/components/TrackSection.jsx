import { ChevronDown, Disc3, Heart, Play } from 'lucide-react';
import './TrackSection.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

const formatDuration = (seconds) =>
  `${Math.floor((Number(seconds) || 0) / 60)}:${String(
    Math.floor((Number(seconds) || 0) % 60),
  ).padStart(2, '0')}`;

export default function TrackSection({
  visible,
  active,
  isLiked,
  like,
  play,
  setModal,
  query,
  view,
  setQuery,
  setView,
  sectionTitle,
}) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <div className="eyebrow muted-eyebrow">
            {sectionTitle
              ? sectionTitle.toUpperCase()
              : query
              ? 'SEARCH RESULTS'
              : view === 'Liked Songs'
                ? 'YOUR COLLECTION'
                : view.startsWith('Playlist:')
                  ? 'YOUR MIX'
                  : 'MADE FOR YOUR MOOD'}
          </div>
          <h2>
            {sectionTitle ? (
              sectionTitle
            ) : query ? (
              `Results for “${query}”`
            ) : view === 'Liked Songs' ? (
              'Liked Songs'
            ) : view.startsWith('Playlist:') ? (
              view.slice(9)
            ) : view === 'Discover' ? (
              'Discover your next favorite'
            ) : (
              <>
                Trending <em>right now</em>
              </>
            )}
          </h2>
        </div>
        <div className="section-controls">
          <span>{visible.length} TRACKS</span>
          {!sectionTitle && (
            <button className="view-all" onClick={() => setView('Discover')}>
              View all <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      {visible.length ? (
        <div className="track-grid">
          {visible.map((track, index) => (
            <article
              className={`track-card ${
                active.id === track.id ? 'is-active' : ''
              }`}
              key={track.id}
              style={{ '--delay': `${index * 45}ms` }}
            >
              <div className="cover-wrap" onClick={() => play(track)}>
                <img
                  src={track.cover_url || fallback}
                  alt={`${track.title} cover`}
                  onError={(event) => (event.currentTarget.src = fallback)}
                />
                <div className="cover-overlay">
                  <button className="cover-play">
                    <Play size={21} fill="currentColor" />
                  </button>
                </div>
                <span className="track-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  className={`heart-btn ${isLiked(track) ? 'liked' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    like(track);
                  }}
                  aria-label="Like track"
                >
                  <Heart
                    size={16}
                    fill={isLiked(track) ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
              <div className="track-meta">
                <div className="track-title-line">
                  <h3>{track.title}</h3>
                  <span className="track-duration">
                    {formatDuration(track.duration_seconds)}
                  </span>
                </div>
                <p>{track.artist}</p>
                <div className="track-bottom">
                  <span className="genre-tag">{track.genre || 'Pop'}</span>
                  <button
                    className="more-btn"
                    onClick={() => setModal(`add:${track.id}`)}
                  >
                    •••
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Disc3 size={34} />
          {sectionTitle ? (
            <>
              <h3>No {sectionTitle.toLowerCase()} yet</h3>
              <p>Songs in this category will appear here.</p>
            </>
          ) : (
            <>
              <h3>No tracks found</h3>
              <p>Try a different search or explore the full catalogue.</p>
              <button
                className="secondary-btn"
                onClick={() => {
                  setQuery('');
                  setView('Home');
                }}
              >
                Back to home
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
