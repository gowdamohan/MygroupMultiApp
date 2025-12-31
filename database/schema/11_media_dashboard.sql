-- ============================================
-- 11. MEDIA DASHBOARD TABLES
-- ============================================

-- Social Media Links
CREATE TABLE IF NOT EXISTS media_social_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  platform ENUM('website', 'youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'blog') NOT NULL,
  url VARCHAR(500) NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  UNIQUE KEY unique_channel_platform (media_channel_id, platform),
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Interactions (likes, dislikes, followers, etc.)
CREATE TABLE IF NOT EXISTS media_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  likes_count INT DEFAULT 0,
  dislikes_count INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  shortlist_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  UNIQUE KEY unique_channel_interactions (media_channel_id),
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Links (Live URL, MyMedia URL)
CREATE TABLE IF NOT EXISTS media_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  link_type ENUM('live', 'mymedia') NOT NULL,
  url VARCHAR(500) NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  UNIQUE KEY unique_channel_link_type (media_channel_id, link_type),
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Switcher (Live, MyMedia, Offline)
CREATE TABLE IF NOT EXISTS media_switcher (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  active_source ENUM('live', 'mymedia', 'offline') DEFAULT 'offline',
  live_url VARCHAR(500) NULL,
  mymedia_url VARCHAR(500) NULL,
  offline_media_id INT NULL COMMENT 'Reference to media_offline_media',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  UNIQUE KEY unique_channel_switcher (media_channel_id),
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Offline Media (Videos, Audio with optional image)
CREATE TABLE IF NOT EXISTS media_offline_media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  media_type ENUM('video', 'audio') NOT NULL,
  title VARCHAR(255) NULL,
  media_file_path VARCHAR(500) NOT NULL COMMENT 'Path in Wasabi S3',
  media_file_url VARCHAR(500) NOT NULL COMMENT 'Public URL',
  thumbnail_path VARCHAR(500) NULL COMMENT 'Image for audio type',
  thumbnail_url VARCHAR(500) NULL,
  is_default TINYINT DEFAULT 0 COMMENT 'Default media for offline mode',
  is_active TINYINT DEFAULT 1,
  file_size BIGINT NULL,
  duration INT NULL COMMENT 'Duration in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Documents (Title, Image/PDF)
CREATE TABLE IF NOT EXISTS media_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  document_type ENUM('image', 'pdf') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size BIGINT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Awards (Title, Image)
CREATE TABLE IF NOT EXISTS media_awards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Newsletters (Title, Image/PDF)
CREATE TABLE IF NOT EXISTS media_newsletters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  document_type ENUM('image', 'pdf') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size BIGINT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Gallery Albums
CREATE TABLE IF NOT EXISTS media_gallery_albums (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  album_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  cover_image_path VARCHAR(500) NULL,
  cover_image_url VARCHAR(500) NULL,
  images_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Gallery Images
CREATE TABLE IF NOT EXISTS media_gallery_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  album_id INT NOT NULL,
  image_name VARCHAR(255) NULL,
  image_path VARCHAR(500) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500) NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_size BIGINT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES media_gallery_albums(id) ON DELETE CASCADE,
  INDEX idx_album_id (album_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Team
CREATE TABLE IF NOT EXISTS media_team (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NULL,
  id_number VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  photo_path VARCHAR(500) NULL,
  photo_url VARCHAR(500) NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  INDEX idx_media_channel_id (media_channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key to media_switcher for offline_media_id
ALTER TABLE media_switcher
ADD CONSTRAINT fk_switcher_offline_media
FOREIGN KEY (offline_media_id) REFERENCES media_offline_media(id) ON DELETE SET NULL;

