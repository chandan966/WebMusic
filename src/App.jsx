'use client';

import { useEffect, useMemo, useState } from 'react';
import { request } from './api';
import { demoTracks } from './data';
import './components/App.css';
import Hero from './components/Hero';
import ModalManager from './components/ModalManager';
import MoodStrip from './components/MoodStrip';
import MusicPlayer from './components/MusicPlayer';
import NoticeToast from './components/NoticeToast';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TrackSection from './components/TrackSection';

const homeCategories = [
  { title: 'Marathi Songs', matches: (genre) => genre.includes('marathi') },
  {
    title: 'Hindi Songs',
    matches: (genre) => genre.includes('hindi') || genre.includes('bollywood'),
  },
  { title: 'Item Songs', matches: (genre) => genre.includes('item') },
];

export default function App() {
  const [tracks, setTracks] = useState(demoTracks);
  const [active, setActive] = useState(demoTracks[0]);
  const [playing, setPlaying] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('Home');
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [liked, setLiked] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('webmusic_user') || 'null'));
      setLiked(JSON.parse(localStorage.getItem('webmusic_liked') || '[]'));
      setPlaylists(
        JSON.parse(localStorage.getItem('webmusic_playlists') || '[]').map(
          (playlist, index) => ({
            ...playlist,
            id: String(playlist.id || `local-${index}`),
            trackIds: Array.isArray(playlist.trackIds) ? playlist.trackIds : [],
          }),
        ),
      );
    } catch {
      setNotice('Could not restore saved library data from this browser.');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    request('/tracks')
      .then((data) => {
        if (data.length) {
          setTracks(data);
          setActive(
            (current) =>
              data.find((track) => track.id === current.id) || data[0],
          );
        }
      })
      .catch((error) => setNotice(`Using demo tracks: ${error.message}`));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('webmusic_liked', JSON.stringify(liked));
    localStorage.setItem('webmusic_playlists', JSON.stringify(playlists));
    if (user) localStorage.setItem('webmusic_user', JSON.stringify(user));
    else localStorage.removeItem('webmusic_user');
  }, [hydrated, liked, playlists, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    Promise.all([request('/tracks/liked'), request('/playlists')])
      .then(async ([likedTracks, savedPlaylists]) => {
        const playlistsWithTracks = await Promise.all(
          savedPlaylists.map(async (playlist) => {
            const playlistTracks = await request(
              `/playlists/${playlist.id}/tracks`,
            );
            return {
              ...playlist,
              id: String(playlist.id),
              trackIds: playlistTracks.map((track) => String(track.id)),
            };
          }),
        );
        setLiked(likedTracks.map((track) => String(track.id)));
        setPlaylists(playlistsWithTracks);
      })
      .catch((error) =>
        setNotice(`Could not load your library: ${error.message}`),
      );
  }, [hydrated, user]);

  const visible = useMemo(() => {
    let filteredTracks = tracks;

    if (view === 'Liked Songs') {
      filteredTracks = filteredTracks.filter((track) =>
        liked.includes(String(track.id)),
      );
    }

    if (view.startsWith('Playlist:')) {
      const playlist = playlists.find(
        (item) => item.name === view.slice(9),
      );
      filteredTracks = playlist
        ? tracks.filter((track) =>
            playlist.trackIds.includes(String(track.id)),
          )
        : [];
    }

    if (query.trim()) {
      filteredTracks = filteredTracks.filter((track) =>
        `${track.title} ${track.artist} ${track.album} ${track.genre}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      );
    }

    return filteredTracks;
  }, [tracks, view, liked, playlists, query]);

  function play(track) {
    if (!track) return;
    setActive(track);
    setPlaying(true);
    setProgress(0);
    setPlayRequest((requestId) => requestId + 1);
  }

  function like(track) {
    const id = String(track.id);
    const wasLiked = liked.includes(id);
    setLiked((current) =>
      wasLiked ? current.filter((item) => item !== id) : [...current, id],
    );

    if (user && !id.startsWith('demo-')) {
      request(`/tracks/${track.id}/like`, { method: 'POST' })
        .then(({ liked: isNowLiked }) =>
          setLiked((current) =>
            isNowLiked
              ? current.includes(id)
                ? current
                : [...current, id]
              : current.filter((item) => item !== id),
          ),
        )
        .catch((error) => {
          setLiked((current) =>
            wasLiked
              ? current.includes(id)
                ? current
                : [...current, id]
              : current.filter((item) => item !== id),
          );
          setNotice(error.message);
        });
    }
  }

  async function createPlaylist(name) {
    if (user) {
      const playlist = await request('/playlists', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const savedPlaylist = {
        ...playlist,
        id: String(playlist.id),
        trackIds: [],
      };
      setPlaylists((current) => [savedPlaylist, ...current]);
      return savedPlaylist;
    }

    const playlist = { id: `local-${Date.now()}`, name, trackIds: [] };
    setPlaylists((current) => [playlist, ...current]);
    return playlist;
  }

  async function addTrackToPlaylist(playlist, trackId) {
    if (user) {
      await request(`/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ trackId }),
      });
    }
    setPlaylists((current) =>
      current.map((item) =>
        item.id === playlist.id && !item.trackIds.includes(trackId)
          ? { ...item, trackIds: [...item.trackIds, trackId] }
          : item,
      ),
    );
  }

  async function auth(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const data = await request(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      localStorage.setItem('webmusic_token', data.token);
      setUser(data.user);
      setModal('');
      setNotice(`Welcome ${data.user.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  const isLiked = (track) => liked.includes(String(track.id));

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        liked={liked}
        playlists={playlists}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        setModal={setModal}
        setNotice={setNotice}
      />

      <main className="main-panel">
        <TopBar
          view={view}
          user={user}
          setUser={setUser}
          setNotice={setNotice}
          setAuthMode={setAuthMode}
          setModal={setModal}
          query={query}
          setQuery={setQuery}
          setMobileNav={setMobileNav}
        />
        <div className="content-scroll">
          {['Home', 'Discover'].includes(view) && !query && (
            <Hero tracks={tracks} play={play} setView={setView} />
          )}
          {view === 'Home' && !query ? (
            homeCategories.map((category) => (
              <TrackSection
                key={category.title}
                sectionTitle={category.title}
                visible={tracks.filter((track) =>
                  category.matches(String(track.genre || '').toLowerCase()),
                )}
                active={active}
                isLiked={isLiked}
                like={like}
                play={play}
                setModal={setModal}
                query={query}
                view={view}
                setQuery={setQuery}
                setView={setView}
              />
            ))
          ) : (
            <TrackSection
              visible={visible}
              active={active}
              isLiked={isLiked}
              like={like}
              play={play}
              setModal={setModal}
              query={query}
              view={view}
              setQuery={setQuery}
              setView={setView}
            />
          )}
          <MoodStrip setView={setView} />
          <Footer />
        </div>
      </main>

      <MusicPlayer
        active={active}
        tracks={tracks}
        playing={playing}
        setPlaying={setPlaying}
        playRequest={playRequest}
        progress={progress}
        setProgress={setProgress}
        volume={volume}
        setVolume={setVolume}
        isLiked={isLiked}
        like={like}
        play={play}
      />
      <ModalManager
        modal={modal}
        setModal={setModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        auth={auth}
        playlists={playlists}
        tracks={tracks}
        setNotice={setNotice}
        createPlaylist={createPlaylist}
        addTrackToPlaylist={addTrackToPlaylist}
      />
      <NoticeToast notice={notice} setNotice={setNotice} />
    </div>
  );
}
