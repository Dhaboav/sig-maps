<?php
include 'database.php';

// Create database connection
$conn = getDbConnection();

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if all required fields are set
if (!isset($_POST['name-of-location'], $_POST['latitude'], $_POST['longitude'], $_POST['description']) || !isset($_FILES['image'])) {
    die("One or more required fields are missing.");
}

// Prepare data for insertion
$name = $_POST['name-of-location'];
$latitude = $_POST['latitude'];
$longitude = $_POST['longitude'];
$desc = $_POST['description'];

// Handle file upload
$uploadDir = '../img/';
$imageName = '';

if (isset($_FILES['image']) && $_FILES['image']['error'] == UPLOAD_ERR_OK) {
    $tmpName = $_FILES['image']['tmp_name'];
    $imageName = basename($_FILES['image']['name']);
    $uploadFile = $uploadDir . $imageName;

    // Optional: Validate file type
    $fileType = mime_content_type($tmpName);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($fileType, $allowedTypes)) {
        die('Invalid file type.');
    }

    // Move the uploaded file
    if (!move_uploaded_file($tmpName, $uploadFile)) {
        die('File upload failed.');
    }
} else {
    die('No file uploaded or there was an upload error.');
}

// Validate latitude and longitude
if (empty($latitude) || empty($longitude) || empty($desc) || empty($imageName)) {
    die("There is empty data");
}

// Prepare SQL query
$tableName = 'poitugas'; 
$sql = $conn->prepare("INSERT INTO `$tableName` (name, latitude, longitude, deskripsi, linkfoto) VALUES (?, ?, ?, ?, ?)");
$sql->bind_param('sssss', $name, $latitude, $longitude, $desc, $imageName);

// Execute SQL query
if ($sql->execute()) {
    // Success: Redirect back with success message
    header("Location: ../index.html?status=success");
    exit();
} else {
    // Error: Redirect back with error message
    header("Location: ../index.html?status=error");
    exit();
}

// Close connection
$conn->close();
?>