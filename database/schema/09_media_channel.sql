-- ============================================
-- 9. MEDIA CHANNEL MANAGEMENT
-- ============================================

-- Media Channel Registration Table
CREATE TABLE media_channel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  app_id INT NOT NULL,
  category_id INT NOT NULL,
  parent_category_id INT NULL,
  media_type VARCHAR(50) NOT NULL COMMENT 'Selected category name (TV, Radio, Magazine, etc.)',
  select_type ENUM('International', 'National', 'Regional', 'Local') NOT NULL,
  country_id INT NULL,
  state_id INT NULL,
  district_id INT NULL,
  language_id INT NULL,
  media_name_english VARCHAR(255) NOT NULL,
  media_name_regional VARCHAR(255) NULL,
  media_logo VARCHAR(500) NULL COMMENT 'Path to uploaded and compressed logo',
  
  -- Magazine specific fields
  periodical_type ENUM('Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly') NULL,
  periodical_schedule JSON NULL COMMENT 'Stores selected days/dates/months based on periodical type',
  
  status ENUM('pending', 'active', 'inactive', 'rejected') DEFAULT 'pending',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES group_create(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES app_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_category_id) REFERENCES app_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (country_id) REFERENCES country_tbl(id) ON DELETE SET NULL,
  FOREIGN KEY (state_id) REFERENCES state_tbl(id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES district_tbl(id) ON DELETE SET NULL,
  FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_app_id (app_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_is_active (is_active),
  INDEX idx_select_type (select_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add registration_count column to app_categories if not exists
ALTER TABLE app_categories 
ADD COLUMN IF NOT EXISTS registration_count INT DEFAULT 1 
COMMENT 'Maximum number of registrations allowed for this category';

