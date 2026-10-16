import { useEffect, useRef } from 'react';
import {
  AudioLines,
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import './MusicPlayer.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

const formatDuration = (seconds) =>
  `${Math.floor((Number(seconds) || 0) / 60)}:${String(
    Math.floor((Number(seconds) || 0) % 60),
  ).padStart(2, '0')}`;

export default function MusicPlayer({
  active,
  tracks,
  playing,
  setPlaying,
  playRequest,
  progress,
  setProgress,
  volume,
  setVolume,
  isLiked,
  like,
  play,
}) {
  const audio = useRef(null);
  const lastPlayRequest = useRef(0);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audio.current) return;
    if (playing) {
      if (playRequest !== lastPlayRequest.current) {
        lastPlayRequest.current = playRequest;
        audio.current.currentTime = 0;
        audio.current.load();
      }
      audio.current.play().catch(() => setPlaying(false));
    } else {
      audio.current.pause();
    }
  }, [playing, active, playRequest, setPlaying]);

  return (
    <footer className="player">
      <div className="player-track">
        <img
          src={active.cover_url || fallback}
          alt="Now playing"
          onError={(event) => (event.currentTarget.src = fallback)}
        />
        <div className="player-track-text">
          <b>{active.title}</b>
          <span>{active.artist}</span>
        </div>
        <button
          className={`player-heart ${isLiked(active) ? 'liked' : ''}`}
          onClick={() => like(active)}
        >
          <Heart
            size={17}
            fill={isLiked(active) ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            className="control-btn"
            onClick={() =>
              play(
                tracks[
                  Math.max(
                    0,
                    tracks.findIndex((track) => track.id === active.id) - 1,
                  )
                ],
              )
            }
          >
            <SkipBack size={17} fill="currentColor" />
          </button>
          <button
            className="play-main"
            onClick={() => setPlaying((current) => !current)}
          >
            {playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <button
            className="control-btn"
            onClick={() =>
              play(
                tracks[
                  (tracks.findIndex((track) => track.id === active.id) + 1) %
                    tracks.length
                ],
              )
            }
          >
            <SkipForward size={17} fill="currentColor" />
          </button>
        </div>
        <div className="timeline">
          <span>{formatDuration(progress)}</span>
          <input
            type="range"
            min="0"
            max={active.duration_seconds || 240}
            value={Math.min(progress, active.duration_seconds || 240)}
            onChange={(event) => {
              setProgress(+event.target.value);
              if (audio.current) {
                audio.current.currentTime = +event.target.value;
              }
            }}
          />
          <span>{formatDuration(active.duration_seconds)}</span>
        </div>
      </div>

      <div className="player-right">
        <AudioLines size={18} />
        <Volume2 size={17} />
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="1"
          step=".01"
          value={volume}
          onChange={(event) => setVolume(+event.target.value)}
        />
      </div>

      <audio
        ref={audio}
        src={active.audio_url}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          const index = tracks.findIndex((track) => track.id === active.id);
          play(tracks[(index + 1) % tracks.length]);
        }}
      />
    </footer>
  );
}
