import { useEffect, useRef } from 'react';
import {
  AudioLines,
  Heart,
  Pause,
  Play,
  ListMusic,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
} from 'lucide-react';
import './MusicPlayer.css';

const fallback =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700';

const formatDuration = (seconds) =>
  `${Math.floor((Number(seconds) || 0) / 60)}:${String(
    Math.floor((Number(seconds) || 0) % 60),
  ).padStart(2, '0')}`;

function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(
        parsed.hostname,
      )
    ) {
      return parsed.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }
  return '';
}

function getSpotifyTrackId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'open.spotify.com') return '';
    const parts = parsed.pathname.split('/').filter(Boolean);
    const trackIndex = parts.indexOf('track');
    return trackIndex >= 0 ? parts[trackIndex + 1] || '' : '';
  } catch {
    return '';
  }
}

export default function MusicPlayer({
  active,
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
  playNext,
  playPrevious,
  shuffle,
  toggleShuffle,
  repeatMode,
  setRepeatMode,
  queue,
  upcomingTracks,
  removeFromQueue,
  queueOpen,
  setQueueOpen,
}) {
  const audio = useRef(null);
  const lastPlayRequest = useRef(0);
  const youtubeVideoId = getYouTubeVideoId(active.audio_url || '');
  const spotifyTrackId = getSpotifyTrackId(active.audio_url || '');
  const embeddedTrack = youtubeVideoId || spotifyTrackId;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  useEffect(() => {
    if (embeddedTrack) return;
    if (audio.current) audio.current.volume = volume;
  }, [volume, embeddedTrack]);

  useEffect(() => {
    if (embeddedTrack) return;
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
  }, [playing, active, playRequest, setPlaying, embeddedTrack]);

  return (
    <footer className="player">
      {queueOpen && (
        <section className="queue-panel" aria-label="Playback queue">
          <div className="queue-heading">
            <div>
              <span className="eyebrow muted-eyebrow">UP NEXT</span>
              <h2>Queue</h2>
            </div>
            <button
              className="queue-close"
              onClick={() => setQueueOpen(false)}
              aria-label="Close queue"
            >
              ×
            </button>
          </div>
          <div className="queue-now-playing">
            <img
              src={active.cover_url || fallback}
              alt=""
              onError={(event) => (event.currentTarget.src = fallback)}
            />
            <div>
              <span>NOW PLAYING</span>
              <b>{active.title}</b>
              <small>{active.artist}</small>
            </div>
          </div>
          {queue.length || upcomingTracks.length ? (
            <div className="queue-list">
              {queue.map((track, index) => (
                <div className="queue-item" key={`queue-${track.id}-${index}`}>
                  <button
                    className="queue-item-play"
                    onClick={() => play(track)}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                  <img
                    src={track.cover_url || fallback}
                    alt=""
                    onError={(event) => (event.currentTarget.src = fallback)}
                  />
                  <div className="queue-item-text">
                    <b>{track.title}</b>
                    <span>{track.artist}</span>
                  </div>
                  <button
                    className="queue-remove"
                    onClick={() => removeFromQueue(track)}
                    aria-label={`Remove ${track.title} from queue`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {upcomingTracks.length > 0 && queue.length > 0 && (
                <div className="queue-divider">NEXT IN THIS MIX</div>
              )}
              {upcomingTracks.map((track, index) => (
                <div
                  className="queue-item"
                  key={`context-${track.id}-${index}`}
                >
                  <button
                    className="queue-item-play"
                    onClick={() => play(track)}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                  <img
                    src={track.cover_url || fallback}
                    alt=""
                    onError={(event) => (event.currentTarget.src = fallback)}
                  />
                  <div className="queue-item-text">
                    <b>{track.title}</b>
                    <span>{track.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="queue-empty">
              Nothing is up next. Add songs with the queue button on any track.
            </p>
          )}
        </section>
      )}

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

      {youtubeVideoId ? (
        <iframe
          className="youtube-embed"
          src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=${playing ? 1 : 0}&rel=0`}
          title={`${active.title} by ${active.artist}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : spotifyTrackId ? (
        <iframe
          className="spotify-player-embed"
          src={`https://open.spotify.com/embed/track/${encodeURIComponent(spotifyTrackId)}?utm_source=generator&theme=0`}
          title={`Spotify player for ${active.title} by ${active.artist}`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      ) : (
      <div className="player-center">
        <div className="player-controls">
          <button
            className={`control-btn player-mode-btn ${shuffle ? 'selected' : ''}`}
            onClick={toggleShuffle}
            aria-label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
            aria-pressed={shuffle}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button
            className="control-btn"
            onClick={playPrevious}
            aria-label="Previous track"
          >
            <SkipBack size={17} fill="currentColor" />
          </button>
          <button
            className="play-main"
            onClick={() => setPlaying((current) => !current)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <button
            className="control-btn"
            onClick={() => playNext(false)}
            aria-label="Next track"
          >
            <SkipForward size={17} fill="currentColor" />
          </button>
          <button
            className={`control-btn player-mode-btn ${repeatMode !== 'off' ? 'selected' : ''}`}
            onClick={() =>
              setRepeatMode((current) =>
                current === 'off' ? 'all' : current === 'all' ? 'one' : 'off',
              )
            }
            aria-label={`Repeat ${repeatMode}`}
            aria-pressed={repeatMode !== 'off'}
            title={`Repeat ${repeatMode}`}
          >
            <RepeatIcon size={16} />
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
      )}

      <div className="player-right">
        <button
          className={`control-btn queue-toggle ${queueOpen ? 'selected' : ''}`}
          onClick={() => setQueueOpen((current) => !current)}
          aria-label={`Open queue${queue.length + upcomingTracks.length ? `, ${queue.length + upcomingTracks.length} songs` : ''}`}
          aria-pressed={queueOpen}
          title="Queue"
        >
          <ListMusic size={17} />
          {queue.length + upcomingTracks.length > 0 && (
            <span>{queue.length + upcomingTracks.length}</span>
          )}
        </button>
        {!embeddedTrack && (
          <>
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
          </>
        )}
      </div>

      {!embeddedTrack && (
        <audio
          ref={audio}
          src={active.audio_url}
          onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
          onEnded={() => playNext(true)}
        />
      )}
    </footer>
  );
}
