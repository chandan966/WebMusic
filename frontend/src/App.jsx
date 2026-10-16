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

export default function App() {
  const [tracks, setTracks] = useState(demoTracks);
  const [active, setActive] = useState(demoTracks[0]);
  const [playing, setPlaying] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('Home');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('webmusic_user'));
    } catch {
      return null;
    }
  });
  const [modal, setModal] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [liked, setLiked] = useState(() =>
    JSON.parse(localStorage.getItem('webmusic_liked') || '[]'),
  );
  const [playlists, setPlaylists] = useState(() =>
    JSON.parse(localStorage.getItem('webmusic_playlists') || '[]'),
  );
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    request('/tracks')
      .then((data) => {
        if (data.length) setTracks(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('webmusic_liked', JSON.stringify(liked));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem('webmusic_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('webmusic_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('webmusic_user');
    }
  }, [user]);

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
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

    if (user && !id.startsWith('demo-')) {
      request(`/tracks/${track.id}/like`, { method: 'POST' }).catch((error) =>
        setNotice(error.message),
      );
    }
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
        setPlaylists={setPlaylists}
        tracks={tracks}
        setNotice={setNotice}
      />
      <NoticeToast notice={notice} setNotice={setNotice} />
    </div>
  );
}
