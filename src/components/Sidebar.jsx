import {
  AudioLines,
  ChevronDown,
  Heart,
  Home,
  ListMusic,
  Menu,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
  view,
  setView,
  liked,
  playlists,
  mobileNav,
  setMobileNav,
  setModal,
  setNotice,
}) {
  return (
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">
          <AudioLines size={22} />
        </span>
        <span>
          web<span>music</span>
        </span>
        <button
          className="icon-btn close-mobile"
          onClick={() => setMobileNav(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="nav-label">MENU</div>
      <nav>
        <button
          className={`nav-item ${view === 'Home' ? 'active' : ''}`}
          onClick={() => {
            setView('Home');
            setMobileNav(false);
          }}
        >
          <Home size={18} />
          Home
        </button>
        <button
          className={`nav-item ${view === 'Discover' ? 'active' : ''}`}
          onClick={() => {
            setView('Discover');
            setMobileNav(false);
          }}
        >
          <Sparkles size={18} />
          Discover <span className="nav-new">NEW</span>
        </button>
        <button
          className="nav-item"
          onClick={() => document.querySelector('.search-input')?.focus()}
        >
          <Search size={18} />
          Search
        </button>
      </nav>

      <div className="nav-label library-label">
        YOUR LIBRARY
        <button className="tiny-plus" onClick={() => setModal('playlist')}>
          <Plus size={15} />
        </button>
      </div>
      <nav>
        <button
          className={`nav-item ${view === 'Liked Songs' ? 'active' : ''}`}
          onClick={() => setView('Liked Songs')}
        >
          <Heart size={18} />
          Liked Songs
          <span className="count">{liked.length}</span>
        </button>
        {playlists.map((playlist) => (
          <button
            key={playlist.name}
            className={`nav-item ${
              view === `Playlist:${playlist.name}` ? 'active' : ''
            }`}
            onClick={() => setView(`Playlist:${playlist.name}`)}
          >
            <ListMusic size={18} />
            <span className="nav-playlist">{playlist.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <span className="upgrade-tag">WEBMUSIC PLUS</span>
          <h3>Music without limits.</h3>
          <p>Your next favorite song is waiting.</p>
          <button
            onClick={() => setNotice('Plus membership is a future feature.')}
          >
            Explore Plus <ChevronDown size={15} />
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" />
          All systems sounding good
        </div>
      </div>
    </aside>
  );
}
