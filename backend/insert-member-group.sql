-- Insert 'member' group if it doesn't exist
INSERT INTO groups (name, description)
SELECT 'member', 'Member Group'
WHERE NOT EXISTS (
    SELECT 1 FROM groups WHERE name = 'member'
);

-- Verify the groups
SELECT * FROM groups WHERE name IN ('corporate', 'head_office', 'regional', 'branch', 'member');

