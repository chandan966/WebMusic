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
import ProfileSection from './components/ProfileSection';
import SpotifySearch from './components/SpotifySearch';
import TopBar from './components/TopBar';
import TrackSection from './components/TrackSection';

const homeCategories = [
  { title: 'Marathi Songs', matches: (genre) => genre.includes('marathi') },
  {
    title: 'Hindi Songs',
    matches: (genre) => genre.includes('hindi') || genre.includes('bollywood'),
  },
];

function shuffledTracks(tracks, excludedId) {
  const shuffled = tracks.filter(
    (track) => String(track.id) !== String(excludedId),
  );

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export default function App() {
  const [tracks, setTracks] = useState(demoTracks);
  const [active, setActive] = useState(demoTracks[0]);
  const [playing, setPlaying] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playContext, setPlayContext] = useState(demoTracks);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [repeatMode, setRepeatMode] = useState('off');
  const [queueOpen, setQueueOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [spotifySearch, setSpotifySearch] = useState(false);
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState('');
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);
  const [view, setView] = useState('Home');
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [liked, setLiked] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const authRequired = hydrated && !user;

  useEffect(() => {
    if (!spotifySearch) return undefined;

    const searchQuery = query.trim();
    if (!searchQuery) {
      setSpotifyTracks([]);
      setSpotifyError('');
      setSpotifyLoading(false);
      setSelectedSpotifyTrack(null);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSpotifyLoading(true);
      setSpotifyError('');

      try {
        const response = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || 'Spotify search failed.');
        }
        if (!Array.isArray(data?.tracks)) {
          throw new Error('Spotify returned an invalid search response.');
        }

        setSpotifyTracks(data.tracks);
        setSelectedSpotifyTrack(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSpotifyError(error.message);
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
  }, [query, spotifySearch]);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('webmusic_user') || 'null'));
      setLiked(JSON.parse(localStorage.getItem('webmusic_liked') || '[]'));
      setRecentlyPlayed(
        JSON.parse(localStorage.getItem('webmusic_recently_played') || '[]'),
      );
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
          setPlayContext(data);
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
    localStorage.setItem(
      'webmusic_recently_played',
      JSON.stringify(recentlyPlayed),
    );
    localStorage.setItem('webmusic_playlists', JSON.stringify(playlists));
    if (user) localStorage.setItem('webmusic_user', JSON.stringify(user));
    else localStorage.removeItem('webmusic_user');
  }, [hydrated, liked, playlists, recentlyPlayed, user]);

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

    if (view === 'Recently Played') {
      filteredTracks = recentlyPlayed
        .map((id) =>
          tracks.find((track) => String(track.id) === String(id)),
        )
        .filter(Boolean);
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
  }, [tracks, view, liked, playlists, recentlyPlayed, query]);

  const upcomingTracks = useMemo(() => {
    if (shuffle) {
      if (shuffleOrder.length) return shuffleOrder;
      return repeatMode === 'all'
        ? shuffledTracks(playContext, active.id)
        : [];
    }

    const currentIndex = playContext.findIndex(
      (track) => String(track.id) === String(active.id),
    );
    const nextTracks =
      currentIndex < 0
        ? [...playContext]
        : playContext.slice(currentIndex + 1);

    if (repeatMode === 'all' && currentIndex >= 0) {
      nextTracks.push(...playContext.slice(0, currentIndex));
    }

    return nextTracks;
  }, [active.id, playContext, repeatMode, shuffle, shuffleOrder]);

  function play(track) {
    if (!track) return;
    setPlayContext(tracks);
    setShuffleOrder(shuffle ? shuffledTracks(tracks, track.id) : []);
    setQueue([]);
    setHistory([]);
    startTrack(track);
  }

  function startTrack(track) {
    setActive(track);
    setRecentlyPlayed((current) => [
      String(track.id),
      ...current.filter((id) => String(id) !== String(track.id)),
    ].slice(0, 20));
    setPlaying(true);
    setProgress(0);
    setPlayRequest((requestId) => requestId + 1);
  }

  function playFromContext(track, context) {
    if (!track) return;
    setPlayContext(context);
    setShuffleOrder(shuffle ? shuffledTracks(context, track.id) : []);
    setQueue([]);
    setHistory([]);
    startTrack(track);
  }

  function addToQueue(track) {
    if (!track || String(track.id) === String(active.id)) return;
    setQueue((current) =>
      current.some((item) => String(item.id) === String(track.id))
        ? current
        : [...current, track],
    );
    setShuffleOrder((current) =>
      current.filter((item) => String(item.id) !== String(track.id)),
    );
    setNotice(`Added “${track.title}” to your queue`);
  }

  function toggleShuffle() {
    if (shuffle) {
      setShuffle(false);
      setShuffleOrder([]);
      return;
    }

    setShuffleOrder(shuffledTracks(playContext, active.id));
    setShuffle(true);
  }

  function playNext(automatic = false) {
    if (automatic && repeatMode === 'one') {
      startTrack(active);
      return;
    }

    if (queue.length) {
      setHistory((current) => [...current, active]);
      const [next, ...remaining] = queue;
      setQueue(remaining);
      startTrack(next);
      return;
    }

    const nextTrack = upcomingTracks[0];

    if (nextTrack) {
      setHistory((current) => [...current, active]);
      if (shuffle) {
        setShuffleOrder((current) =>
          current.length ? current.slice(1) : upcomingTracks.slice(1),
        );
      }
      startTrack(nextTrack);
    } else {
      setPlaying(false);
    }
  }

  function playPrevious() {
    if (progress > 3) {
      startTrack(active);
      return;
    }

    const previous = history[history.length - 1];
    if (previous) {
      setHistory((current) => current.slice(0, -1));
      setQueue((current) => [active, ...current]);
      startTrack(previous);
      return;
    }

    const currentIndex = playContext.findIndex(
      (track) => String(track.id) === String(active.id),
    );
    if (currentIndex > 0) startTrack(playContext[currentIndex - 1]);
    else startTrack(active);
  }

  function playQueued(track) {
    setQueue((current) =>
      current.filter((item) => String(item.id) !== String(track.id)),
    );
    setShuffleOrder((current) =>
      current.filter((item) => String(item.id) !== String(track.id)),
    );
    setHistory((current) => [...current, active]);
    startTrack(track);
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
      setPlaying(false);
      setProgress(0);
      setModal('');
      setNotice(`Welcome ${data.user.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  function signOut() {
    localStorage.removeItem('webmusic_token');
    setView('Home');
    setUser(null);
    setNotice('Signed out');
  }

  const isLiked = (track) => liked.includes(String(track.id));

  return (
    <>
      <div className="app-shell" inert={!hydrated || authRequired}>
        <Sidebar
          view={view}
          setView={setView}
          liked={liked}
          recentlyPlayedCount={recentlyPlayed.length}
          playlists={playlists}
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
          setModal={setModal}
        />

        <main className="main-panel">
          <TopBar
            view={view}
            user={user}
            setAuthMode={setAuthMode}
            setModal={setModal}
            setView={setView}
            query={query}
            setQuery={setQuery}
            setMobileNav={setMobileNav}
            spotifySearch={spotifySearch}
            setSpotifySearch={setSpotifySearch}
          />
          <div className="content-scroll">
            {view === 'Profile' && user ? (
              <ProfileSection
                user={user}
                likedCount={liked.length}
                playlistCount={playlists.length}
                signOut={signOut}
              />
            ) : (
              <>
                {spotifySearch ? (
                  <SpotifySearch
                    query={query.trim()}
                    tracks={spotifyTracks}
                    loading={spotifyLoading}
                    error={spotifyError}
                    selectedTrack={selectedSpotifyTrack}
                    setSelectedTrack={setSelectedSpotifyTrack}
                  />
                ) : (
                  <>
                    {['Home', 'Discover'].includes(view) && !query && (
                      <Hero
                        tracks={tracks}
                        play={play}
                        setView={setView}
                        user={user}
                        recentlyPlayed={recentlyPlayed}
                      />
                    )}
                    {view === 'Home' && !query ? (
                      homeCategories.map((category) => (
                        <TrackSection
                          key={category.title}
                          sectionTitle={category.title}
                          visible={tracks.filter((track) =>
                            category.matches(
                              String(track.genre || '').toLowerCase(),
                            ),
                          )}
                          active={active}
                          isLiked={isLiked}
                          like={like}
                          play={(track) =>
                            playFromContext(
                              track,
                              tracks.filter((item) =>
                                category.matches(
                                  String(item.genre || '').toLowerCase(),
                                ),
                              ),
                            )
                          }
                          addToQueue={addToQueue}
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
                        play={(track) => playFromContext(track, visible)}
                        addToQueue={addToQueue}
                        setModal={setModal}
                        query={query}
                        view={view}
                        setQuery={setQuery}
                        setView={setView}
                      />
                    )}
                    <MoodStrip
                      setView={setView}
                      setQuery={setQuery}
                      view={view}
                    />
                    <Footer />
                  </>
                )}
              </>
            )}
          </div>
        </main>

        <MusicPlayer
          active={active}
          playing={playing}
          setPlaying={setPlaying}
          playRequest={playRequest}
          progress={progress}
          setProgress={setProgress}
          volume={volume}
          setVolume={setVolume}
          isLiked={isLiked}
          like={like}
          play={playQueued}
          playNext={playNext}
          playPrevious={playPrevious}
          shuffle={shuffle}
          toggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          queue={queue}
          upcomingTracks={upcomingTracks}
          removeFromQueue={(track) =>
            setQueue((current) =>
              current.filter((item) => String(item.id) !== String(track.id)),
            )
          }
          queueOpen={queueOpen}
          setQueueOpen={setQueueOpen}
        />
      </div>
      <ModalManager
        modal={authRequired ? 'auth' : modal}
        requiredAuth={authRequired}
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
    </>
  );
}
