import { Component } from "./component.js";
import { v2 } from "./maths.js";
import { circle, image, rect } from "./renderer.js";
import { Camera } from "./camera.js";
import { getZoomScaledPosition, JSONifyComponent } from './util.js';
export default function renderAll(sprites, canvas, ctx, screenDimensions, background) {
    // background
    const canvasSize = new v2(canvas.width, canvas.height);
    const mid = canvasSize.clone.scale(0.5);
    function fillBackground() {
        rect(ctx, v2.zero, canvas.width, canvas.height, background.colour);
    }
    if (background.image === '') {
        fillBackground();
    }
    else {
        // if it can't use the image as a background, then just use the colour
        try {
            image(ctx, v2.zero, canvasSize, background.image);
        }
        catch (_a) {
            fillBackground();
        }
    }
    // camera
    const camera = Camera.main
        .getComponent("Camera");
    const cameraPos = Camera.main.transform
        .position
        .clone
        .sub(screenDimensions
        .clone
        .scale(0.5));
    // sub the screen size to put 0, 0 in the middle of the screen
    // filter out sprites that don't have render components
    sprites = sprites.filter((sprite) => (sprite.hasComponent('Renderer') ||
        sprite.hasComponent('GUIElement')));
    // sort the sprites by their z position
    const zOrderedSprites = sprites.sort((a, b) => {
        const aGUI = a.hasComponent('GUIElement');
        const bGUI = b.hasComponent('GUIElement');
        const aZ = (!aGUI ? a.getComponent('Renderer') : a.getComponent('GUIElement')).zLayer;
        const bZ = (!bGUI ? b.getComponent('Renderer') : b.getComponent('GUIElement')).zLayer;
        return aZ - bZ;
    });
    // GUI elements appear always above normal sprites,
    // so filter them out and put them last, still ordered by their z position
    let justSprites = [];
    let justGUI = [];
    for (let sprite of zOrderedSprites)
        if (sprite.hasComponent('GUIElement'))
            justGUI.push(sprite);
        else
            justSprites.push(sprite);
    const fullyOrderedSprites = [...justSprites, ...justGUI];
    // call the draw function for each
    for (let sprite of fullyOrderedSprites) {
        // deal with GUI and normal render components separately
        if (sprite.hasComponent('GUIElement')) {
            sprite.getComponent('GUIElement').draw(ctx, sprite.transform);
            continue;
        }
        const renderPos = sprite.transform.position.clone.sub(cameraPos);
        sprite.getComponent('Renderer').draw(renderPos, sprite.transform, ctx, camera.zoom, mid);
    }
}
class Renderer extends Component {
    constructor(type, colour, offset, zLayer) {
        super("Renderer", type);
        this.colour = colour;
        this.offset = offset;
        this.zLayer = zLayer;
    }
    tick() { }
    json() {
        return JSONifyComponent(this);
    }
}
export class CircleRenderer extends Renderer {
    constructor({ radius = 1, offset = new v2(0, 0), colour = 'rgb(0, 0, 0)', zLayer = 1 }) {
        super("CircleRenderer", colour, offset, zLayer);
        this.radius = radius;
    }
    draw(position, transform, ctx, cameraZoom, center) {
        const radius = this.radius * cameraZoom * transform.scale.x;
        if (radius <= 0)
            return;
        circle(ctx, getZoomScaledPosition(position.clone.add(this.offset), cameraZoom, center), radius, this.colour);
    }
}
export class RectRenderer extends Renderer {
    constructor({ height = 1, offset = new v2(0, 0), width = 1, colour = 'rgb(0, 0, 0)', zLayer = 1 }) {
        super("RectRenderer", colour, offset, zLayer);
        this.width = width;
        this.height = height;
    }
    draw(position, transform, ctx, cameraZoom, center) {
        const width = this.width * transform.scale.x * cameraZoom;
        const height = this.height * transform.scale.y * cameraZoom;
        if (height <= 0 || width <= 0)
            return;
        let renderPos = this.offset.clone
            .add(position);
        rect(ctx, getZoomScaledPosition(renderPos, cameraZoom, center), width, height, this.colour);
    }
}
export class ImageRenderer extends Renderer {
    constructor({ height = 1, offset = new v2(0, 0), width = 1, url = '', zLayer = 1 }) {
        super("RectRenderer", 'rgb(255, 255, 255)', offset, zLayer);
        this.width = width;
        this.height = height;
        this.url = url;
    }
    draw(position, transform, ctx, cameraZoom, center) {
        if (this.height <= 0 || this.width <= 0)
            return;
        let renderPos = this.offset.clone
            .add(position);
        image(ctx, getZoomScaledPosition(renderPos, cameraZoom, center), new v2(this.width, this.height).scale(cameraZoom), this.url);
    }
}
