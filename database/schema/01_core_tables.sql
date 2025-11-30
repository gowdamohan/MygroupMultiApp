-- ============================================
-- MULTI-TENANT PLATFORM - CORE SCHEMA DESIGN
-- ============================================
-- Database: my_group
-- Version: 1.0
-- Design Pattern: Multi-tenant with shared database, separate schemas
-- ============================================

-- ============================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================

-- Users Table (Ion Auth Compatible)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  company VARCHAR(100),
  phone VARCHAR(20),
  profile_img VARCHAR(255),
  display_name VARCHAR(100),
  alter_number VARCHAR(20),
  created_on INT NOT NULL,
  last_login INT,
  active TINYINT DEFAULT 1,
  group_id INT,
  is_verified TINYINT DEFAULT 0,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry INT,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_group_id (group_id),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groups/Roles Table
CREATE TABLE groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100),
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Roles
INSERT INTO groups (id, name, description, permissions) VALUES
(1, 'admin', 'Super Administrator', '{"all": true}'),
(2, 'groups', 'Group Manager', '{"manage_groups": true, "manage_users": true}'),
(3, 'labor', 'Labor User', '{"view_labor": true, "manage_profile": true}'),
(4, 'client', 'Regular Client', '{"view_content": true, "manage_profile": true}'),
(5, 'corporate', 'Corporate/Franchise Head', '{"manage_franchise": true, "view_reports": true}'),
(6, 'head_office', 'Head Office Staff', '{"manage_branches": true, "view_reports": true}'),
(7, 'regional', 'Regional Office Staff', '{"manage_region": true, "view_reports": true}'),
(8, 'branch', 'Branch Office Staff', '{"manage_branch": true}'),
(9, 'client_god', 'Special Client (God Mode)', '{"all_client_features": true, "manage_temples": true}'),
(10, 'partner', 'Partner User', '{"manage_partnership": true}'),
(11, 'reporter', 'Reporter User', '{"create_reports": true, "view_analytics": true}');

-- Users-Groups Junction Table (Many-to-Many)
CREATE TABLE users_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  group_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_group (user_id, group_id),
  INDEX idx_user_id (user_id),
  INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Extended Profile
CREATE TABLE user_registration_form (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  country_flag VARCHAR(255),
  country_code VARCHAR(10),
  gender ENUM('Male', 'Female', 'Other'),
  dob DATE,
  country INT,
  state INT,
  district INT,
  education INT,
  profession INT,
  education_others VARCHAR(255),
  work_others VARCHAR(255),
  dob_date INT,
  dob_month VARCHAR(20),
  dob_year INT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  pincode VARCHAR(10),
  bio TEXT,
  social_links JSON,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_country (country),
  INDEX idx_state (state),
  INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session Management (for JWT refresh tokens)
CREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_refresh_token (refresh_token(255)),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login Attempts (Security)
CREATE TABLE login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(254),
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success TINYINT DEFAULT 0,
  user_agent TEXT,
  INDEX idx_ip_address (ip_address),
  INDEX idx_email (email),
  INDEX idx_attempt_time (attempt_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

