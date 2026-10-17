import { Activity, Play, Sparkles } from 'lucide-react';
import './Hero.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

export default function Hero({
  tracks,
  play,
  setView,
  user,
  recentlyPlayed = [],
}) {
  const featuredTrack =
    tracks.find(
      (track) => String(track.id) === String(recentlyPlayed[0]),
    ) || tracks[0];
  const hasListeningHistory = Boolean(
    user &&
      tracks.some(
        (track) => String(track.id) === String(recentlyPlayed[0]),
      ),
  );

  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="pulse-dot" /> YOUR DAILY SOUNDTRACK
        </div>
        <h1>
          Feel every
          <br />
          <span>beat.</span>
        </h1>
        <p>Discover sounds that move you. Your next obsession starts here.</p>
        <div className="hero-buttons">
          <button
            className="primary-btn"
            onClick={() => play(hasListeningHistory ? featuredTrack : tracks[0])}
            disabled={!tracks.length}
          >
            <Play size={17} fill="currentColor" />
            {hasListeningHistory ? 'Resume listening' : 'Start listening'}
          </button>
          <button
            className="secondary-btn"
            onClick={() => setView('Discover')}
          >
            <Sparkles size={16} />
            {user ? 'Browse music' : 'Explore music'}
          </button>
        </div>
        <div className="hero-stats">
          <div>
            <strong>∞</strong>
            <span>Ways to feel</span>
          </div>
          <i />
          <div>
            <strong>24/7</strong>
            <span>Your soundtrack</span>
          </div>
        </div>
      </div>
      <div className="hero-art">
        <div className="art-ring ring-a" />
        <div className="art-ring ring-b" />
        <div className="art-disc">
          <img src={fallback} alt="Night sky album art" />
          <div className="disc-center" />
        </div>
        <div className="floating-card">
          <img
            src={featuredTrack?.cover_url || fallback}
            alt="Album cover"
          />
          <div>
            <b>{featuredTrack?.title || 'Find your next favorite'}</b>
            <small>{featuredTrack?.artist || 'Explore WebMusic'}</small>
          </div>
          <span className="equalizer">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="hero-badge">
          <Activity size={15} /> NOW VIBING
        </div>
      </div>
    </section>
  );
}
