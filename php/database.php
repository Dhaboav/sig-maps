<?php
// Function to load database configuration from a JSON file
function loadDbConfig() {
    $configFile = '../db_config.json'; 

    if (!file_exists($configFile)) {
        die(json_encode(["success" => false, "message" => "Configuration file not found."]));
    }

    $json = file_get_contents($configFile);
    $config = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die(json_encode(["success" => false, "message" => "Error parsing configuration file."]));
    }

    return $config;
}

// Load database configuration
$dbConfig = loadDbConfig();

// Create and return database connection
function getDbConnection() {
    global $dbConfig;
    $conn = new mysqli($dbConfig['host'], $dbConfig['username'], $dbConfig['password'], $dbConfig['database']);
    
    if ($conn->connect_error) {
        die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
    }
    
    return $conn;
}
?>