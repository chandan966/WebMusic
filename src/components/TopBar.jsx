import { CircleUserRound, Menu, Search } from 'lucide-react';
import './TopBar.css';

export default function TopBar({
  view,
  user,
  setAuthMode,
  setModal,
  setView,
  query,
  setQuery,
  setMobileNav,
}) {
  return (
    <header className="topbar">
      <button
        className="icon-btn mobile-menu"
        onClick={() => setMobileNav(true)}
      >
        <Menu size={21} />
      </button>
      <div className="breadcrumbs">
        <span>WebMusic</span>
        <span className="slash">/</span>
        <b>{view.startsWith('Playlist:') ? view.slice(9) : view}</b>
      </div>
      <div className="top-actions">
        <label className="searchbox">
          <Search size={17} />
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs, artists, albums..."
          />
          <kbd>⌘ K</kbd>
        </label>
        {user ? (
          <button
            className="profile-pill"
            onClick={() => setView('Profile')}
            aria-label="Open your profile"
          >
            <span className="avatar">
              {user.name?.slice(0, 1).toUpperCase()}
            </span>
            {user.name?.split(' ')[0]}
            <CircleUserRound size={15} />
          </button>
        ) : (
          <button
            className="login-btn"
            onClick={() => {
              setAuthMode('login');
              setModal('auth');
            }}
          >
            <CircleUserRound size={17} />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
