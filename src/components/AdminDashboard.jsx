import { useEffect, useState } from 'react';
import { request } from '../api';
import SpotifySearch from './SpotifySearch';
import './AdminDashboard.css';

const emptyTrack = {
  title: '',
  artist: '',
  album: 'Single',
  genre: 'Marathi',
  duration_seconds: '',
  cover_url: '',
  audio_url: '',
};

const settingsDefaults = {
  site_name: 'WebMusic',
  catalog_button_label: 'WebMusic',
};

export default function AdminDashboard({
  currentUser,
  setNotice,
  onBranding,
  onTracksChange,
}) {
  const [section, setSection] = useState('songs');
  const [tracks, setTracks] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(settingsDefaults);
  const [trackForm, setTrackForm] = useState(emptyTrack);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState('');

  useEffect(() => {
    const query = spotifyQuery.trim();
    if (!query) {
      setSpotifyTracks([]);
      setSpotifyError('');
      setSpotifyLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSpotifyLoading(true);
      setSpotifyError('');
      try {
        const result = await request(
          `/spotify/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        setSpotifyTracks(result.tracks);
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          setSpotifyError(searchError.message);
          setSpotifyTracks([]);
        }
      } finally {
        if (!controller.signal.aborted) setSpotifyLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [spotifyQuery]);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [savedTracks, savedUsers, savedSettings] = await Promise.all([
        request('/admin/tracks'),
        request('/admin/users'),
        request('/admin/settings'),
      ]);
      setTracks(savedTracks);
      onTracksChange(savedTracks);
      setUsers(savedUsers);
      setSettings({ ...settingsDefaults, ...savedSettings });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function updateTrackField(event) {
    setTrackForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function beginEdit(track) {
    setEditingId(String(track.id));
    setTrackForm({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Single',
      genre: track.genre || 'Pop',
      duration_seconds: String(track.duration_seconds || ''),
      cover_url: track.cover_url || '',
      audio_url: track.audio_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveTrack(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await request(
        editingId ? `/admin/tracks/${editingId}` : '/admin/tracks',
        {
          method: editingId ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...trackForm,
            duration_seconds: Number(trackForm.duration_seconds || 0),
          }),
        },
      );
      setTracks((current) =>
        editingId
          ? current.map((track) =>
              String(track.id) === editingId ? saved : track,
            )
          : [saved, ...current],
      );
      onTracksChange(
        editingId
          ? tracks.map((track) =>
              String(track.id) === editingId ? saved : track,
            )
          : [saved, ...tracks],
      );
      setTrackForm(emptyTrack);
      setEditingId('');
      setNotice(editingId ? 'Song updated.' : 'Song added.');
    } catch (saveError) {
      setNotice(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrack(track) {
    if (!window.confirm(`Delete “${track.title}” from the catalogue? This also removes it from users’ likes and playlists.`)) return;
    try {
      await request(`/admin/tracks/${track.id}`, { method: 'DELETE' });
      setTracks((current) =>
        current.filter((item) => String(item.id) !== String(track.id)),
      );
      onTracksChange(
        tracks.filter((item) => String(item.id) !== String(track.id)),
      );
      setNotice('Song deleted.');
    } catch (deleteError) {
      setNotice(deleteError.message);
    }
  }

  async function addSpotifyTrack(track) {
    if (tracks.some((item) => item.audio_url === track.spotify_url)) {
      setNotice(`“${track.title}” is already in the WebMusic catalogue.`);
      return;
    }
    try {
      const saved = await request('/admin/tracks', {
        method: 'POST',
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration_seconds: track.duration_seconds,
          cover_url: track.cover_url,
          audio_url: track.spotify_url,
          genre: trackForm.genre || 'Marathi',
        }),
      });
      setTracks((current) => [saved, ...current]);
      onTracksChange([saved, ...tracks]);
      setNotice(`Added “${track.title}” to WebMusic.`);
    } catch (addError) {
      setNotice(addError.message);
    }
  }

  async function changeRole(account) {
    const role = account.role === 'admin' ? 'user' : 'admin';
    try {
      const saved = await request(`/admin/users/${account.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers((current) =>
        current.map((item) =>
          String(item.id) === String(saved.id) ? saved : item,
        ),
      );
      setNotice(`${account.name} is now ${role}.`);
    } catch (roleError) {
      setNotice(roleError.message);
    }
  }

  async function deleteUser(account) {
    if (!window.confirm(`Delete the account for ${account.name}? This removes their playlists and likes.`)) return;
    try {
      await request(`/admin/users/${account.id}`, { method: 'DELETE' });
      setUsers((current) =>
        current.filter((item) => String(item.id) !== String(account.id)),
      );
      setNotice('Account deleted.');
    } catch (deleteError) {
      setNotice(deleteError.message);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      onBranding(saved);
      setNotice('WebMusic branding updated.');
    } catch (settingsError) {
      setNotice(settingsError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-dashboard">
      <header className="admin-heading">
        <div>
          <div className="eyebrow muted-eyebrow">WEBMUSIC CONTROL ROOM</div>
          <h1>Admin dashboard</h1>
          <p>Signed in as {currentUser.email}. Changes affect the live catalogue.</p>
        </div>
        <button className="admin-refresh" type="button" onClick={loadDashboard}>
          Refresh data
        </button>
      </header>

      <nav className="admin-tabs" aria-label="Admin dashboard sections">
        {[
          ['songs', `Songs (${tracks.length})`],
          ['users', `Users (${users.length})`],
          ['branding', 'Branding'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={section === key ? 'active' : ''}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error ? (
        <div className="admin-error" role="alert">
          {error}{' '}
          <button type="button" onClick={loadDashboard}>Try again</button>
        </div>
      ) : loading ? (
        <p className="admin-status" role="status">Loading admin data…</p>
      ) : section === 'songs' ? (
        <div className="admin-songs">
          <div className="admin-spotify-search">
            <label>
              Search Spotify to add songs
              <input
                value={spotifyQuery}
                onChange={(event) => setSpotifyQuery(event.target.value)}
                placeholder="Try a Marathi song or artist"
              />
            </label>
            <SpotifySearch
              query={spotifyQuery.trim()}
              tracks={spotifyTracks}
              loading={spotifyLoading}
              error={spotifyError}
              selectedTrack={null}
              setSelectedTrack={() => {}}
              onAddTrack={addSpotifyTrack}
            />
          </div>
          <div className="admin-layout">
            <form className="admin-form" onSubmit={saveTrack}>
              <h2>{editingId ? 'Edit song' : 'Add a song manually'}</h2>
              <p>Use a local /audio/ file, licensed direct audio URL, or Spotify track URL.</p>
              {[
                ['title', 'Song title'],
                ['artist', 'Artist'],
                ['album', 'Album'],
                ['genre', 'Genre'],
                ['duration_seconds', 'Duration (seconds)'],
                ['cover_url', 'Cover image URL'],
                ['audio_url', 'Audio file or Spotify URL'],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    value={trackForm[name]}
                    onChange={updateTrackField}
                    type={name === 'duration_seconds' ? 'number' : 'text'}
                    min={name === 'duration_seconds' ? '0' : undefined}
                    required={['title', 'artist', 'audio_url'].includes(name)}
                  />
                </label>
              ))}
              <div className="admin-form-actions">
                <button className="admin-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save song' : 'Add song'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() => {
                      setEditingId('');
                      setTrackForm(emptyTrack);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div className="admin-list">
              <h2>Catalogue</h2>
              {tracks.map((track) => (
                <article className="admin-row" key={track.id}>
                  <div>
                    <b>{track.title}</b>
                    <span>{track.artist} · {track.genre}</span>
                  </div>
                  <button type="button" onClick={() => beginEdit(track)}>Edit</button>
                  <button type="button" className="danger" onClick={() => deleteTrack(track)}>Delete</button>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : section === 'users' ? (
        <div className="admin-list admin-users">
          <h2>Accounts and roles</h2>
          {users.map((account) => (
            <article className="admin-row" key={account.id}>
              <div>
                <b>{account.name}{String(account.id) === String(currentUser.id) ? ' (you)' : ''}</b>
                <span>{account.email}</span>
              </div>
              <span className={`admin-role ${account.role}`}>{account.role}</span>
              {String(account.id) !== String(currentUser.id) && (
                <>
                  <button type="button" onClick={() => changeRole(account)}>
                    Make {account.role === 'admin' ? 'user' : 'admin'}
                  </button>
                  <button type="button" className="danger" onClick={() => deleteUser(account)}>
                    Delete
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <form className="admin-form admin-branding" onSubmit={saveSettings}>
          <h2>WebMusic branding</h2>
          <p>
            The app name and catalogue search button are configurable. Spotify
            remains identified in search results and its official player.
          </p>
          <label>
            Website name
            <input
              value={settings.site_name}
              maxLength={40}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  site_name: event.target.value,
                }))
              }
              required
            />
          </label>
          <label>
            Spotify search button label
            <input
              value={settings.catalog_button_label}
              maxLength={40}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  catalog_button_label: event.target.value,
                }))
              }
              required
            />
          </label>
          <button className="admin-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </form>
      )}
    </section>
  );
}
