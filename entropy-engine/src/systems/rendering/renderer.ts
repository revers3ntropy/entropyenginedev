import {Systems} from "../../ECS/system.js";
import {Scene} from "../../ECS/scene.js";
import {image} from "./basicShapes.js";
import {Camera} from "../../components/camera.js";
import {Entity} from "../../ECS/entity.js";
import {v2} from "../../maths/v2.js";
import {colour, rgb} from "../../util/colour.js";
import {getCanvasSize} from "../../util/general.js";
import {GUIElement} from "../../components/gui/guiElement.js";
import {Renderer} from "../../components/renderComponents.js";

function orderSpritesForRender (sprites: Entity[]): Entity[] {
    // sort the entities by their z position
    const zOrderedSprites = sprites.sort((a: Entity, b: Entity) => {
        return a.transform.position.z - b.transform.position.z;
    })

    // GUI elements appear always above normal entities,
    // so filter them out and put them last, still ordered by their z position
    let justSprites = [];
    let justGUI = [];
    for (let sprite of zOrderedSprites) {
        if (sprite.hasComponent('GUIElement'))
            justGUI.push(sprite);
        else
            justSprites.push(sprite);
    }

    return [...justSprites, ...justGUI];
}

export function renderBackground (ctx: CanvasRenderingContext2D, canvasSize: v2, backgroundTint: colour, backgroundImage: string | undefined) {

    function fillBackground (alpha: number) {
        let bgColour = backgroundTint || rgb.parse('white');
        bgColour = bgColour.clone;
        bgColour.alpha = alpha;

        ctx.beginPath();

        ctx.rect(0, 0, canvasSize.x, canvasSize.y);

        ctx.fillStyle = bgColour.rgba;

        ctx.fill();
        ctx.closePath();
    }

    if (!backgroundImage) {
        fillBackground(1);
        return;
    }
    // if it can't use the image as a background, then just use the colour
    try {
        image(ctx, v2.zero, canvasSize, backgroundImage, 0);
    } catch {
        fillBackground(0.1);
    }
}


export function renderAll (entities: Entity[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, backgroundTint: colour, backgroundImage: string | undefined, cameraEntity: Entity = Camera.main) {

    // background
    const canvasSize = getCanvasSize(canvas);
    const mid = canvasSize.clone.scale(0.5);

    renderBackground(ctx, canvasSize, backgroundTint, backgroundImage);
    if (!entities) return;

    if (!cameraEntity) {
        console.error('Camera was not passed to renderAll function! Main camera: ' + Camera.main.name);
        return;
    }

    // camera
    const camera = cameraEntity
        .getComponent<Camera>("Camera");

    if (!camera) return;

    const cameraPos = cameraEntity.transform.position.clone
        .sub(
            canvasSize
                .clone
                .scale(0.5).v3
        );
    // sub the screen size to put 0, 0 in the middle of the screen

    if (!cameraPos) return;

    // filter out entities that don't have render components
    entities = entities.filter((sprite) => (
        sprite.hasComponent('Renderer') ||
        sprite.hasComponent('GUIElement')
    ));


    // call the draw function for each
    for (let sprite of orderSpritesForRender(entities)) {
        // deal with GUI and normal render components separately
        if (sprite.hasComponent('GUIElement')) {
            sprite.getComponent<GUIElement>('GUIElement').draw(ctx, sprite.transform);
            continue;
        }

        const renderPos = sprite.transform.position.clone.sub(cameraPos);

        // passes through more arguments than any draw function needs, as they require different data
        sprite.getComponent<Renderer>('Renderer').draw({
            position: renderPos,
            transform: sprite.transform,
            ctx,
            zoom: camera.zoom,
            center: mid,
            camera,
            cameraSprite: cameraEntity
        });
    }
}

Systems.systems.push({
    name: 'Renderer',
    Start: () => {},

    Update: (scene: Scene) => {
        const ctx = scene.settings.ctx;
        if (!ctx) return;
        renderAll(scene.entities, ctx.canvas, ctx, scene.settings.backgroundTint, scene.settings.backgroundImage);
    }
});