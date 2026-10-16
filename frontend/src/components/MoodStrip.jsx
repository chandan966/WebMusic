import { ChevronDown, Mic2 } from 'lucide-react';
import './MoodStrip.css';

export default function MoodStrip({ setView }) {
  return (
    <section className="mood-strip">
      <div className="mood-icon">
        <Mic2 size={22} />
      </div>
      <div>
        <span className="eyebrow muted-eyebrow">CURATED FOR YOU</span>
        <h3>Find your frequency.</h3>
        <p>From late-night focus to main-character energy.</p>
      </div>
      <button onClick={() => setView('Discover')}>
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
