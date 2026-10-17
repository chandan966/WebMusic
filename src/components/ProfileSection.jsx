import { useState } from 'react';
import { Heart, ListMusic, LogOut, UserRound } from 'lucide-react';
import './ProfileSection.css';

export default function ProfileSection({
  user,
  likedCount,
  playlistCount,
  signOut,
}) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="profile-section">
      <div className="profile-heading">
        <div className="eyebrow muted-eyebrow">YOUR ACCOUNT</div>
        <h1>Profile</h1>
        <p>Manage your WebMusic account and personal library.</p>
      </div>

      <div className="profile-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            {user.name?.trim().slice(0, 1).toUpperCase() || <UserRound size={30} />}
          </div>
          <div className="profile-identity-text">
            <span className="eyebrow muted-eyebrow">WEBMUSIC MEMBER</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <Heart size={18} />
            <div>
              <strong>{likedCount}</strong>
              <span>Liked songs</span>
            </div>
          </div>
          <div className="profile-stat">
            <ListMusic size={18} />
            <div>
              <strong>{playlistCount}</strong>
              <span>Playlists</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <div>
            <h3>Account access</h3>
            <p>Sign out of WebMusic on this device.</p>
          </div>
          <button
            className="profile-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={16} />
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </section>
  );
}
