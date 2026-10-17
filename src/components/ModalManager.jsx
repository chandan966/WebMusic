import { useState } from 'react';
import { AudioLines, ListMusic, Play, Plus, X } from 'lucide-react';
import './ModalManager.css';

export default function ModalManager({
  modal,
  setModal,
  authMode,
  setAuthMode,
  auth,
  playlists,
  tracks,
  setNotice,
  createPlaylist,
  addTrackToPlaylist,
}) {
  const [playlistName, setPlaylistName] = useState('');

  async function submitPlaylist(event) {
    event.preventDefault();
    const name = playlistName.trim();
    if (!name) return;

    try {
      await createPlaylist(name);
      setPlaylistName('');
      setModal('');
      setNotice(`Playlist “${name}” created`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addTrack(playlist) {
    const track = tracks.find(
      (item) => String(item.id) === modal.slice(4),
    );
    if (!track) {
      setNotice('Track not found.');
      setModal('');
      return;
    }

    try {
      await addTrackToPlaylist(playlist, String(track.id));
      setNotice(`Added to ${playlist.name}`);
      setModal('');
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (!['auth', 'playlist'].includes(modal) && !modal.startsWith('add:')) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={() => setModal('')}>
      {modal === 'auth' && (
        <div className="modal" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" onClick={() => setModal('')}>
            <X size={18} />
          </button>
          <div className="modal-logo">
            <AudioLines size={22} />
          </div>
          <div className="eyebrow">YOUR SOUND, YOUR WORLD</div>
          <h2>
            {authMode === 'login' ? 'Welcome back.' : 'Join the frequency.'}
          </h2>
          <p className="modal-sub">
            {authMode === 'login'
              ? 'Pick up where the music left off.'
              : 'Create an account and build your own soundtrack.'}
          </p>
          <form onSubmit={auth} className="auth-form">
            {authMode === 'register' && (
              <label>
                Full name
                <input name="name" placeholder="Your name" required />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="At least 8 characters"
                minLength="8"
                required
              />
            </label>
            <button className="primary-btn full-btn">
              {authMode === 'login' ? 'Sign in' : 'Create account'}{' '}
              <Play size={15} />
            </button>
          </form>
          <p className="switch-auth">
            {authMode === 'login'
              ? 'New to WebMusic?'
              : 'Already have an account?'}{' '}
            <button
              onClick={() =>
                setAuthMode(authMode === 'login' ? 'register' : 'login')
              }
            >
              {authMode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>
      )}

      {modal === 'playlist' && (
        <div
          className="modal small-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button className="modal-close" onClick={() => setModal('')}>
            <X size={18} />
          </button>
          <div className="eyebrow">YOUR LIBRARY</div>
          <h2>Create a playlist</h2>
          <p className="modal-sub">Give your new mix a name.</p>
          <form onSubmit={submitPlaylist} className="auth-form">
            <label>
              Playlist name
              <input
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Late night drives"
                autoFocus
                required
              />
            </label>
            <button className="primary-btn full-btn">
              Create playlist <Plus size={16} />
            </button>
          </form>
        </div>
      )}

      {modal.startsWith('add:') && (
        <div
          className="modal small-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button className="modal-close" onClick={() => setModal('')}>
            <X size={18} />
          </button>
          <div className="eyebrow">SAVE THE MOMENT</div>
          <h2>Add to playlist</h2>
          <p className="modal-sub">Choose where this track belongs.</p>
          {playlists.length ? (
            playlists.map((playlist) => (
              <button
                className="playlist-choice"
                key={playlist.id}
                onClick={() => addTrack(playlist)}
              >
                <ListMusic size={18} />
                {playlist.name}
                <Plus size={15} />
              </button>
            ))
          ) : (
            <p className="empty-note">You haven’t made a playlist yet.</p>
          )}
          <button
            className="secondary-btn full-btn"
            onClick={() => setModal('playlist')}
          >
            Create a playlist <Plus size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
