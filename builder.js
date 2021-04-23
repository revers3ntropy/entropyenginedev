import { download } from "./downloader.js";
import {Sprite} from "./entropy-engine";
import {scripts} from "./index.js";

// needed for it to actually import and run this script
export const myExport = 0;

window.buildAndDownload = async ({
    htmlTitle = 'Entropy Engine',
    pathToEntropyEngine = './entropy-engine',
    canvasID = 'myCanvas',
}) => {
    // TODO: make it only need to download one file
    download('index.html', await buildHTML(htmlTitle, pathToEntropyEngine, canvasID));
    download('script.js', await buildScriptsJS(scripts));
}



const buildHTML = async (htmlTitle, path, canvasID) => (`

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title> ${htmlTitle} </title>
    <meta name="viewport" content="width=device-width">
    <script defer type="module">
        ${await buildJS(canvasID, path)}
    </script>
</head>

<body>
    <canvas id="myCanvas"></canvas>
</body>
</html>

`);


const buildJS = async (canvasID, path) => (`

import entropyEngine from "${path}/";
import * as ee from "${path}/";

ee.spritesFromJSON([${await buildJSON()}]);

const { run } = entropyEngine({
    canvasID: '${canvasID}',
});

run();

`);

const buildJSON = async () => (`
    ${Sprite.sprites.map(sprite => JSON.stringify(sprite.json())).join(',\n')}
`)

// just combines all the scripts into a string string
const buildScriptsJS = async scripts => {
    if (scripts.length === 0)
        return '';

    return scripts.reduce((accumulator, current) => `${accumulator}\n\n${current}`);
}