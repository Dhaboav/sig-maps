<?php
header('Content-Type: application/json');

// Get the filename from the request
$filename = isset($_GET['filename']) ? basename($_GET['filename']) : '';

if ($filename) {
    // Construct the relative path to the image file
    $relativePath = 'img/' . $filename;

    // Construct the absolute path from the relative path
    $absolutePath = __DIR__ . '/../' . $relativePath;

    // Check if the file exists and set the response status
    if (file_exists($absolutePath)) {
        echo json_encode(['status' => 'ok', 'path' => $relativePath]);
    } else {
        echo json_encode(['status' => 'not']);
    }
} else {
    echo json_encode(['status' => 'not']);
}
?>