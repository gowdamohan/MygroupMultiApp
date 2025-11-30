-- ============================================
-- 2. GROUP/APPLICATION MANAGEMENT
-- ============================================

-- Main Groups/Applications Table
CREATE TABLE group_create (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  apps_name VARCHAR(100),
  db_name VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  category ENUM('admin', 'company', 'public') DEFAULT 'admin',
  is_active TINYINT DEFAULT 1,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_slug (slug),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Applications
INSERT INTO group_create (id, name, apps_name, db_name, slug, category) VALUES
(1, 'Mygroup', 'My Group', 'mygroup', 'mygroup', 'admin'),
(2, 'Mychat', 'My Chat', 'mychat', 'mychat', 'admin'),
(3, 'Mydiary', 'My Diary', 'mydiary', 'mydiary', 'admin'),
(4, 'Myneedy', 'My Needy', 'myneedy', 'myneedy', 'admin'),
(5, 'Myjoy', 'My Joy', 'myjoy', 'myjoy', 'admin'),
(6, 'Mymedia', 'My Media', 'mymedia', 'mymedia', 'admin'),
(7, 'Myunions', 'My Unions', 'myunions', 'myunions', 'admin'),
(8, 'Mytv', 'My TV', 'mytv', 'mytv', 'admin'),
(9, 'Myfin', 'My Finance', 'myfin', 'myfin', 'admin'),
(10, 'Myshop', 'My Shop', 'myshop', 'myshop', 'admin'),
(11, 'Myfriend', 'My Friend', 'myfriend', 'myfriend', 'admin'),
(12, 'Mybiz', 'My Business', 'mybiz', 'mybiz', 'admin'),
(13, 'Mybank', 'My Bank', 'mybank', 'mybank', 'admin'),
(14, 'Mygo', 'My Go', 'mygo', 'mygo', 'admin'),
(15, 'Mycreations', 'My Creations', 'mycreations', 'mycreations', 'company'),
(16, 'Myads', 'My Ads', 'myads', 'myads', 'company'),
(17, 'Mycharity', 'My Charity', 'mycharity', 'mycharity', 'company'),
(18, 'Myteam', 'My Team', 'myteam', 'myteam', 'company'),
(19, 'Myinstitutions', 'My Institutions', 'myinstitutions', 'myinstitutions', 'company'),
(20, 'Myindustries', 'My Industries', 'myindustries', 'myindustries', 'company'),
(21, 'Myview', 'My View', 'myview', 'myview', 'company'),
(22, 'Mytrack', 'My Track', 'mytrack', 'mytrack', 'company'),
(23, 'Myminiapps', 'My Mini Apps', 'myminiapps', 'myminiapps', 'company');

-- Group Branding & Customization
CREATE TABLE create_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  create_id INT NOT NULL UNIQUE,
  icon VARCHAR(255),
  logo VARCHAR(255),
  name_image VARCHAR(255),
  background_color VARCHAR(50) DEFAULT '#ffffff',
  text_color VARCHAR(50) DEFAULT '#000000',
  banner VARCHAR(255),
  url VARCHAR(255),
  theme_settings JSON,
  seo_meta JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (create_id) REFERENCES group_create(id) ON DELETE CASCADE,
  INDEX idx_create_id (create_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub-Groups/Modules (for apps with sub-sections)
CREATE TABLE group_submodules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  slug VARCHAR(100),
  icon VARCHAR(255),
  description TEXT,
  is_active TINYINT DEFAULT 1,
  sort_order INT DEFAULT 0,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  INDEX idx_group_id (group_id),
  INDEX idx_slug (slug),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Sub-modules
INSERT INTO group_submodules (group_id, name, display_name, slug) VALUES
-- Mydiary sub-modules
(3, 'qknote', 'Qk Note', 'qknote'),
(3, 'dayplan', 'Day Plan', 'dayplan'),
(3, 'mydocs', 'My Docs', 'mydocs'),
(3, 'quotes', 'Quotes', 'quotes'),
(3, 'accounts', 'Accounts', 'accounts'),
(3, 'home', 'Home', 'home'),
-- Myneedy sub-modules
(4, 'doorstep', 'Doorstep', 'doorstep'),
(4, 'centers', 'Centers', 'centers'),
(4, 'manpower', 'Manpower', 'manpower'),
(4, 'online', 'Online', 'online'),
(4, 'myhelp', 'Myhelp', 'myhelp'),
-- Myjoy sub-modules
(5, 'myvideo', 'Myvideo', 'myvideo'),
(5, 'myaudio', 'Myaudio', 'myaudio'),
(5, 'mybooks', 'Mybooks', 'mybooks'),
(5, 'mypage', 'Mypage', 'mypage'),
(5, 'mytok', 'Mytok', 'mytok'),
(5, 'mygames', 'Mygames', 'mygames'),
-- Mymedia sub-modules
(6, 'tv', 'TV', 'tv'),
(6, 'radio', 'Radio', 'radio'),
(6, 'epaper', 'E Paper', 'epaper'),
(6, 'magazine', 'Magazine', 'magazine'),
(6, 'web', 'Web', 'web'),
(6, 'youtube', 'Youtube', 'youtube'),
-- Myunions sub-modules
(7, 'news', 'News', 'news'),
(7, 'unions', 'Unions', 'unions'),
(7, 'federation', 'Federation', 'federation'),
(7, 'ids', 'IDs', 'ids'),
(7, 'notice', 'Notice', 'notice'),
(7, 'me', 'Me', 'me'),
-- Myshop sub-modules
(10, 'shop', 'Shop', 'shop'),
(10, 'local', 'Local', 'local'),
(10, 'resale', 'Resale', 'resale'),
(10, 'brands', 'Brands', 'brands'),
(10, 'wholesale', 'Wholesale', 'wholesale'),
(10, 'ecoshop', 'Ecoshop', 'ecoshop'),
-- Myfriend sub-modules
(11, 'myfriend', 'Myfriend', 'myfriend'),
(11, 'mymarry', 'Mymarry', 'mymarry'),
(11, 'myjobs', 'Myjobs', 'myjobs'),
(11, 'health', 'Health', 'health'),
(11, 'travel', 'Travel', 'travel'),
(11, 'booking', 'Booking', 'booking'),
-- Mybiz sub-modules
(12, 'production', 'Production', 'production'),
(12, 'finance', 'Finance', 'finance'),
(12, 'advertise', 'Advertise', 'advertise'),
(12, 'franchises', 'Franchises', 'franchises'),
(12, 'trading', 'Trading', 'trading'),
(12, 'services', 'Services', 'services');

-- User Group Subscriptions (which apps user has access to)
CREATE TABLE user_group_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  group_id INT NOT NULL,
  subscription_type ENUM('free', 'premium', 'enterprise') DEFAULT 'free',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES group_create(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_group_subscription (user_id, group_id),
  INDEX idx_user_id (user_id),
  INDEX idx_group_id (group_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

