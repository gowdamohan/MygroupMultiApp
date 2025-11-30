-- Insert branch group if it doesn't exist
INSERT INTO groups (name, description)
SELECT 'branch', 'Branch Office Group'
WHERE NOT EXISTS (
    SELECT 1 FROM groups WHERE name = 'branch'
);

-- Verify the groups
SELECT * FROM groups WHERE name IN ('head_office', 'regional', 'branch');

