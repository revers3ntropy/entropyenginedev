<?php

$section = $_GET['s'];
$page = $_GET['p'];

if (!$section) $section = 'General';
if (!$page) $page = 'home';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Docs - <?php echo $section.' - '.$page ?></title>

    <meta name="viewport" content="width=device-width">
    <script src="https://code.jquery.com/jquery-1.10.2.js"></script>
    <link rel='stylesheet' href="../global.css">
    <link rel='stylesheet' href="./index.css">
</head>
<body>
<?php

if ($section != 'General')
echo <<<END
        <p class="section-title">{$section} </p>
    END;
if ($page != 'home')
echo <<<END
        <p class="page-title">{$page}</p> 
    END;

function EntropyEngine ($page) { switch ($page) {
    case'home':
        echo 'Entropy Engine is a game engine created primarily with TypeScript, with a Javascript API. 
        It can be used with the online editor at https://entropyengine.dev or by importing it from https://entropyengine.dev/entropy-engine/1.0/index.js';
        break;
    case 'ECS':
        echo <<<END
            The Entity Component System architecture is used in this game engine.
        END;
        break;

}}

function EntropyScript ($page) { switch ($page) {
    case'home':
        echo 'Entropy Script is a scripting language which is used by the Entropy Engine. It can be run with Node.js or in the browser.
                You can use a terminal <a href="https://entropyengine.dev/entropy-script/terminal.html"> here </a> to use th language, or write code and run it <a href="https://entropyengine.dev/entropy-script"> here </a>';
        break;
}}

function Editor ($page) { switch ($page) {
    case'home':
        echo 'Entropy Engine is a game engine created primarily with TypeScript, with a Javascript API. 
        It can be used with the online editor at https://entropyengine.dev or by importing it from https://entropyengine.dev/entropy-engine/1.0/index.js';
        break;
}}

function General ($page) { switch ($page) {
    case'home':
        echo 'Welcome to the Docs for Entropy Engine, Entropy Script and entropyengine.dev!';
        break;
}}

switch ($section) {
    case 'EntropyEngine':
        EntropyEngine($page);
        break;
    case 'EntropyScript':
        EntropyScript($page);
        break;
    case 'Editor':
        Editor($page);
        break;
    case 'General':
        General($page);
        break;
}
?>
</body>
</html>
