CREATE DATABASE IF NOT EXISTS webmusic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE webmusic;
CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('user','admin') NOT NULL DEFAULT 'user',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tracks (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(180) NOT NULL, artist VARCHAR(180) NOT NULL,
 album VARCHAR(180) DEFAULT 'Single', cover_url TEXT, audio_url TEXT NOT NULL,
 duration_seconds INT DEFAULT 0, genre VARCHAR(80) DEFAULT 'Pop',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS playlists (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(120) NOT NULL, description VARCHAR(500) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS playlist_tracks (
 playlist_id BIGINT UNSIGNED NOT NULL, track_id BIGINT UNSIGNED NOT NULL,
 added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (playlist_id,track_id),
 FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
 FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS liked_tracks (
 user_id BIGINT UNSIGNED NOT NULL, track_id BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id,track_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);
INSERT INTO tracks (title,artist,album,cover_url,audio_url,duration_seconds,genre)
SELECT 'Midnight City','M83','Hurry Up, We’re Dreaming','https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',269,'Electronic'
WHERE NOT EXISTS (SELECT 1 FROM tracks WHERE title='Midnight City' AND artist='M83');
INSERT INTO tracks (title,artist,album,cover_url,audio_url,duration_seconds,genre)
SELECT 'Neon Dreams','The Night Drive','After Hours','https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',244,'Synthwave'
WHERE NOT EXISTS (SELECT 1 FROM tracks WHERE title='Neon Dreams' AND artist='The Night Drive');
INSERT INTO tracks (title,artist,album,cover_url,audio_url,duration_seconds,genre)
SELECT 'Golden Hour','JVKE','this is what ____ feels like','https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',210,'Pop'
WHERE NOT EXISTS (SELECT 1 FROM tracks WHERE title='Golden Hour' AND artist='JVKE');
INSERT INTO tracks (title,artist,album,cover_url,audio_url,duration_seconds,genre)
SELECT 'Ocean Eyes','Billie Eilish','dont smile at me','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',200,'Indie Pop'
WHERE NOT EXISTS (SELECT 1 FROM tracks WHERE title='Ocean Eyes' AND artist='Billie Eilish');
