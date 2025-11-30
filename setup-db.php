<?php
/**
 * Database Setup Script
 * Run this file by accessing: http://localhost/Multi-Tenant/setup-db.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'my_group';

echo "<h1>Multi-Tenant Platform - Database Setup</h1>";
echo "<hr>";

// Connect to MySQL
echo "<p>Connecting to MySQL...</p>";
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
}
echo "<p style='color:green'>✓ Connected successfully</p>";

// Create database
echo "<p>Creating database '$dbname'...</p>";
$sql = "CREATE DATABASE IF NOT EXISTS $dbname CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql) === TRUE) {
    echo "<p style='color:green'>✓ Database created successfully</p>";
} else {
    echo "<p style='color:red'>Error creating database: " . $conn->error . "</p>";
}

// Select database
$conn->select_db($dbname);

// Import schema files
$schemaFiles = [
    'database/schema/01_core_tables.sql',
    'database/schema/02_group_management.sql',
    'database/schema/03_geographic_reference.sql',
    'database/schema/04_needy_services.sql',
    'database/schema/05_labor_management.sql',
    'database/schema/06_shop_ecommerce.sql',
    'database/schema/07_media_gallery.sql',
    'database/schema/08_unions_chat.sql'
];

echo "<h2>Importing Schema Files</h2>";

foreach ($schemaFiles as $index => $file) {
    $num = $index + 1;
    echo "<p>[$num/8] Importing $file...</p>";
    
    if (!file_exists($file)) {
        echo "<p style='color:red'>✗ File not found: $file</p>";
        continue;
    }
    
    $sql = file_get_contents($file);
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $success = 0;
    $errors = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        if ($conn->query($statement) === TRUE) {
            $success++;
        } else {
            $errors++;
            // Only show first few errors to avoid clutter
            if ($errors <= 3) {
                echo "<p style='color:orange; font-size:12px'>Warning: " . $conn->error . "</p>";
            }
        }
    }
    
    if ($errors == 0) {
        echo "<p style='color:green'>✓ Imported successfully ($success statements)</p>";
    } else {
        echo "<p style='color:orange'>⚠ Imported with warnings ($success success, $errors errors)</p>";
    }
}

// Verify tables
echo "<h2>Verification</h2>";
$result = $conn->query("SHOW TABLES");
$tableCount = $result->num_rows;

echo "<p>Total tables created: <strong>$tableCount</strong></p>";

if ($tableCount > 40) {
    echo "<p style='color:green; font-size:18px'>✓ Database setup complete!</p>";
    echo "<hr>";
    echo "<h3>Next Steps:</h3>";
    echo "<ol>";
    echo "<li>Backend API is running at: <a href='http://localhost:5000/health' target='_blank'>http://localhost:5000/health</a></li>";
    echo "<li>Frontend is running at: <a href='http://localhost:3000' target='_blank'>http://localhost:3000</a></li>";
    echo "<li>Register a new user at: <a href='http://localhost:3000/register' target='_blank'>http://localhost:3000/register</a></li>";
    echo "</ol>";
    echo "<p><strong>You can now delete this file (setup-db.php) for security.</strong></p>";
} else {
    echo "<p style='color:red'>⚠ Expected 50+ tables but only found $tableCount. Please check for errors above.</p>";
}

$conn->close();
?>

