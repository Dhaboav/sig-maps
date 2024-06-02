<?php
header('Content-Type: application/json');

// Get the filename from the request
$filename = isset($_POST['filename']) ? basename($_POST['filename']) : '';

if ($filename) {
    // Define the directory path
    $directory = '../img/';
    // Full file path
    $filepath = $directory . $filename;

    // Check if the file exists
    if (file_exists($filepath)) {
        echo json_encode(['status' => 'ok', 'path' => $filepath]);
    } else {
        echo json_encode(['status' => 'no']);
    }
} else {
    echo json_encode(['status' => 'no', 'message' => 'No filename provided']);
}
?>