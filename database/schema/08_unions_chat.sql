-- ============================================
-- 8. UNIONS & CHAT MODULE
-- ============================================

-- Union Organizations
CREATE TABLE union_organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  union_type ENUM('trade_union', 'federation', 'association', 'other') DEFAULT 'trade_union',
  description TEXT,
  logo VARCHAR(255),
  registration_number VARCHAR(100),
  registration_date DATE,
  address TEXT,
  country INT,
  state INT,
  district INT,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(254),
  website VARCHAR(255),
  total_members INT DEFAULT 0,
  is_verified TINYINT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_union_type (union_type),
  INDEX idx_is_active (is_active),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Union Members
CREATE TABLE union_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  union_id INT NOT NULL,
  user_id INT NOT NULL,
  member_id VARCHAR(50),
  membership_type ENUM('regular', 'associate', 'honorary', 'life') DEFAULT 'regular',
  position VARCHAR(100),
  join_date DATE,
  expiry_date DATE,
  status ENUM('active', 'inactive', 'suspended', 'expired') DEFAULT 'active',
  membership_fee DECIMAL(10, 2),
  payment_status ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (union_id) REFERENCES union_organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_union_member (union_id, user_id),
  INDEX idx_union_id (union_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Union News/Announcements
CREATE TABLE union_news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  union_id INT NOT NULL,
  posted_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  content TEXT,
  news_type ENUM('news', 'announcement', 'event', 'notice') DEFAULT 'news',
  featured_image VARCHAR(255),
  is_featured TINYINT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  views_count INT DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (union_id) REFERENCES union_organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_union_id (union_id),
  INDEX idx_slug (slug),
  INDEX idx_news_type (news_type),
  INDEX idx_is_featured (is_featured),
  FULLTEXT idx_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Union ID Cards
CREATE TABLE union_id_cards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  union_id INT NOT NULL,
  member_id INT NOT NULL,
  card_number VARCHAR(50) UNIQUE,
  issue_date DATE,
  expiry_date DATE,
  card_template VARCHAR(255),
  qr_code VARCHAR(255),
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (union_id) REFERENCES union_organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES union_members(id) ON DELETE CASCADE,
  INDEX idx_union_id (union_id),
  INDEX idx_member_id (member_id),
  INDEX idx_card_number (card_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat/Feedback System
CREATE TABLE feedback_suggetions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  replyed_by INT,
  display_name VARCHAR(100),
  in_out ENUM('in', 'out') DEFAULT 'in',
  message TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'audio') DEFAULT 'text',
  attachment VARCHAR(255),
  status TINYINT DEFAULT 0,
  is_read TINYINT DEFAULT 0,
  parent_id INT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (replyed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES feedback_suggetions(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_replyed_by (replyed_by),
  INDEX idx_status (status),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Feedback
CREATE TABLE feedback_suggetions_user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  feedback_type ENUM('feedback', 'suggestion', 'complaint', 'query') DEFAULT 'feedback',
  subject VARCHAR(255),
  message TEXT NOT NULL,
  rating INT,
  status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
  admin_response TEXT,
  responded_by INT,
  responded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(50),
  reference_id INT,
  reference_type VARCHAR(50),
  icon VARCHAR(255),
  action_url VARCHAR(500),
  is_read TINYINT DEFAULT 0,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_notification_type (notification_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Activity Log
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

