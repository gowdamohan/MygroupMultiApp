-- ============================================
-- 3. GEOGRAPHIC & REFERENCE DATA
-- ============================================

-- Countries Table
CREATE TABLE country_tbl (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE,
  phone_code VARCHAR(10),
  currency VARCHAR(10),
  flag_icon VARCHAR(255),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- States/Provinces Table
CREATE TABLE state_tbl (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES country_tbl(id) ON DELETE CASCADE,
  INDEX idx_country_id (country_id),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Districts/Cities Table
CREATE TABLE district_tbl (
  id INT PRIMARY KEY AUTO_INCREMENT,
  state_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (state_id) REFERENCES state_tbl(id) ON DELETE CASCADE,
  INDEX idx_state_id (state_id),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Education Levels
CREATE TABLE education (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  level INT,
  description TEXT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Education Levels
INSERT INTO education (name, level) VALUES
('No Formal Education', 1),
('Primary School', 2),
('High School', 3),
('Secondary School', 4),
('Diploma', 5),
('Bachelor\'s Degree', 6),
('Master\'s Degree', 7),
('Doctorate/PhD', 8),
('Professional Certification', 9),
('Other', 10);

-- Professions/Occupations
CREATE TABLE profession (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Professions
INSERT INTO profession (name, category) VALUES
('Student', 'Education'),
('Teacher/Professor', 'Education'),
('Software Engineer', 'Technology'),
('Doctor', 'Healthcare'),
('Nurse', 'Healthcare'),
('Lawyer', 'Legal'),
('Accountant', 'Finance'),
('Business Owner', 'Business'),
('Manager', 'Business'),
('Sales Professional', 'Sales'),
('Marketing Professional', 'Marketing'),
('Engineer', 'Engineering'),
('Architect', 'Architecture'),
('Designer', 'Creative'),
('Artist', 'Creative'),
('Writer', 'Creative'),
('Farmer', 'Agriculture'),
('Driver', 'Transportation'),
('Chef/Cook', 'Hospitality'),
('Retail Worker', 'Retail'),
('Construction Worker', 'Construction'),
('Electrician', 'Skilled Trade'),
('Plumber', 'Skilled Trade'),
('Mechanic', 'Skilled Trade'),
('Government Employee', 'Government'),
('Military/Police', 'Security'),
('Homemaker', 'Domestic'),
('Retired', 'Retired'),
('Unemployed', 'Unemployed'),
('Other', 'Other');

-- Languages
CREATE TABLE languages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(5) UNIQUE,
  native_name VARCHAR(50),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Languages
INSERT INTO languages (name, code, native_name) VALUES
('English', 'en', 'English'),
('Hindi', 'hi', 'हिन्दी'),
('Tamil', 'ta', 'தமிழ்'),
('Telugu', 'te', 'తెలుగు'),
('Malayalam', 'ml', 'മലയാളം'),
('Kannada', 'kn', 'ಕನ್ನಡ'),
('Bengali', 'bn', 'বাংলা'),
('Marathi', 'mr', 'मराठी'),
('Gujarati', 'gu', 'ગુજરાતી'),
('Punjabi', 'pa', 'ਪੰਜਾਬੀ'),
('Urdu', 'ur', 'اردو'),
('Spanish', 'es', 'Español'),
('French', 'fr', 'Français'),
('German', 'de', 'Deutsch'),
('Chinese', 'zh', '中文'),
('Japanese', 'ja', '日本語'),
('Arabic', 'ar', 'العربية');

-- User Languages (Many-to-Many)
CREATE TABLE user_languages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  language_id INT NOT NULL,
  proficiency ENUM('basic', 'intermediate', 'advanced', 'native') DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_language (user_id, language_id),
  INDEX idx_user_id (user_id),
  INDEX idx_language_id (language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

