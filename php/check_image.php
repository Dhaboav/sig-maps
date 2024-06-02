<?php
header('Content-Type: application/json');

// Get the filename from the request
$filename = isset($_GET['filename']) ? basename($_GET['filename']) : '';

if ($filename) {
    // Construct the relative path to the image file
    $relativePath = 'img/' . $filename;

    // Return the relative path as the URL
    echo json_encode(['status' => 'ok', 'path' => $relativePath]);
} else {
    echo json_encode(['status' => 'no', 'message' => 'No filename provided']);
}
?>