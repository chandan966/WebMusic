import { ChevronDown, Mic2 } from 'lucide-react';
import './MoodStrip.css';

export default function MoodStrip({ setView, setQuery, view }) {
  function exploreMoods() {
    setQuery('');
    setView('Discover');
  }

  return (
    <section className="mood-strip">
      <div className="mood-icon">
        <Mic2 size={22} />
      </div>
      <div>
        <span className="eyebrow muted-eyebrow">CURATED FOR YOU</span>
        <h3>Find your song.</h3>
        <p>Discover a new favorite for every moment.</p>
      </div>
      <button
        className={view === 'Discover' ? 'is-active' : ''}
        onClick={exploreMoods}
        aria-label="Explore moods in Discover"
        aria-pressed={view === 'Discover'}
      >
        Explore moods <ChevronDown size={15} />
      </button>
      <div className="mood-lines">
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </section>
  );
}
