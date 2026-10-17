import { Activity, Play, Sparkles } from 'lucide-react';
import './Hero.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

export default function Hero({ tracks, play, setView }) {
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
          <button className="primary-btn" onClick={() => play(tracks[0])}>
            <Play size={17} fill="currentColor" />
            Start listening
          </button>
          <button
            className="secondary-btn"
            onClick={() => setView('Discover')}
          >
            <Sparkles size={16} />
            Explore music
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
            src={tracks[2]?.cover_url || fallback}
            alt="Album cover"
          />
          <div>
            <b>{tracks[2]?.title || 'Golden Hour'}</b>
            <small>{tracks[2]?.artist || 'JVKE'}</small>
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
