-- =============================================
-- Media Channel Document Schema
-- For storing PDF uploads (magazine, epaper, etc.)
-- =============================================

-- Media Channel Documents (PDF uploads for magazine, epaper, etc.)
CREATE TABLE IF NOT EXISTS media_channel_document (
  id INT PRIMARY KEY AUTO_INCREMENT,
  media_channel_id INT NOT NULL COMMENT 'Reference to media_channel table',
  category_id INT NOT NULL COMMENT 'Reference to app_categories (upload_data type)',
  document_year INT NOT NULL COMMENT 'Year of publication',
  document_month INT NOT NULL COMMENT 'Month of publication (1-12)',
  document_date INT NOT NULL COMMENT 'Date of publication (1-31)',
  document_path VARCHAR(500) NOT NULL COMMENT 'File path in Wasabi S3',
  document_url VARCHAR(500) NOT NULL COMMENT 'Public URL of the document',
  file_name VARCHAR(255) NULL COMMENT 'Original file name',
  file_size BIGINT NULL COMMENT 'File size in bytes',
  uploaded_by INT NULL COMMENT 'User ID who uploaded',
  status TINYINT DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (media_channel_id) REFERENCES media_channel(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES app_categories(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_media_channel_id (media_channel_id),
  INDEX idx_category_id (category_id),
  INDEX idx_year_month_date (document_year, document_month, document_date),
  INDEX idx_status (status),
  
  -- Unique constraint: one document per channel per category per date
  UNIQUE KEY unique_document (media_channel_id, category_id, document_year, document_month, document_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

