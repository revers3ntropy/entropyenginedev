<?php

$projectID = $_POST['projectID'];
$assetName = $_POST['assetName'];

$redirect = "https://entropyengine.dev/editor/?p=".$projectID."&from=import";
echo "<a href=\"".$redirect."\">Back</a>";

$target_dir = $projectID . "/assets/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

// Check if image file is a actual image or fake image
if( isset( $_POST["submit"] ) ) {
    $check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
    if($check !== false) {
        $uploadOk = 1;
    } else {
        echo "File is not an image.";
        $uploadOk = 0;
    }
}

// Allow certain file formats
if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg") {
    echo "
<br>
<p>
    Sorry, only JPG, JPEG & PNG files are allowed.
</p>
          ";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo "<p>Sorry, your file was not uploaded. Please go back and try again.</p>";
    return;
}
$newDir = $projectID . "/assets/".$assetName.".png";

if (file_exists($newDir)) {
    // delete old file
    unlink($newDir);
}

// Check file size
if ($_FILES["fileToUpload"]["size"] > 5000000) {
    echo "<p> Sorry, your file is too large. </p>";
    return;
}
// create new .png file from the data in the uploaded image
imagepng(
    imagescale(
        imagecreatefromstring(
            file_get_contents(
                $_FILES["fileToUpload"]["tmp_name"]
            )
        ), 140, 140, IMG_NEAREST_NEIGHBOUR),
    $newDir, 4
);

echo "Upload Successful! Redirecting...";
echo "<script>window.location.href = '".$redirect."'</script>";