-- ============================================
-- 7. MEDIA & GALLERY MODULE
-- ============================================

-- Gallery Albums
CREATE TABLE gallery_list (
  gallery_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_name VARCHAR(255) NOT NULL,
  gallery_description TEXT,
  group_id INT,
  user_id INT,
  cover_image VARCHAR(255),
  is_public TINYINT DEFAULT 1,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  images_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gallery Images
CREATE TABLE gallery_images_master (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_id INT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_description TEXT,
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  file_size INT,
  width INT,
  height INT,
  mime_type VARCHAR(50),
  group_id INT,
  user_id INT,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gallery_id) REFERENCES gallery_list(gallery_id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_gallery_id (gallery_id),
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- God/Temple Gallery
CREATE TABLE god_gallery_list (
  gallery_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_name VARCHAR(255) NOT NULL,
  gallery_description TEXT,
  temple_name VARCHAR(255),
  deity_name VARCHAR(100),
  location VARCHAR(255),
  user_id INT,
  cover_image VARCHAR(255),
  is_public TINYINT DEFAULT 1,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  images_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_deity_name (deity_name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- God Gallery Images
CREATE TABLE god_gallery_images_master (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_id INT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_description TEXT,
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  file_size INT,
  user_id INT,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gallery_id) REFERENCES god_gallery_list(gallery_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_gallery_id (gallery_id),
  INDEX idx_user_id (user_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Myads Gallery
CREATE TABLE myads_gallery_list (
  gallery_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_name VARCHAR(255) NOT NULL,
  gallery_description TEXT,
  ad_campaign_name VARCHAR(255),
  group_id INT,
  user_id INT,
  cover_image VARCHAR(255),
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Myads Gallery Images
CREATE TABLE myads_gallery_images_master (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_id INT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_description TEXT,
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  group_id INT,
  user_id INT,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gallery_id) REFERENCES myads_gallery_list(gallery_id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_gallery_id (gallery_id),
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Content (Videos, Audio, etc.)
CREATE TABLE media_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  group_id INT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  media_type ENUM('video', 'audio', 'document', 'image') NOT NULL,
  file_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  file_size INT,
  duration INT,
  mime_type VARCHAR(50),
  category VARCHAR(100),
  tags JSON,
  is_public TINYINT DEFAULT 1,
  is_featured TINYINT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  downloads_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_group_id (group_id),
  INDEX idx_slug (slug),
  INDEX idx_media_type (media_type),
  INDEX idx_is_featured (is_featured),
  FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

