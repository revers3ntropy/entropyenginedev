import { Component } from "./component.js";
import { v2 } from "./maths.js";
import { Sprite } from "./sprite.js";
export class Camera extends Component {
    constructor({ zoom = 1 }) {
        super('Camera');
        this.zoom = zoom;
    }
    json() {
        return {
            'type': 'Camera',
            'zoom': this.zoom,
        };
    }
    tick() { }
    static shake(magnitude = 1, durationMS = 200) {
        // not super useful, just thought it'd be fun to have
        const start = performance.now();
        const camera = Camera.main;
        const pos = camera.transform.position;
        const cameraComponent = camera.getComponent('Camera');
        // to allow it to reset fully
        const startZoom = cameraComponent.zoom;
        const startPos = pos.clone;
        const doShakeFrame = (time) => {
            cameraComponent.zoom *= 1 + (Math.random() - 0.5) * magnitude / 100;
            pos.add(new v2((1 / cameraComponent.zoom) * (Math.random() - 0.5) * magnitude * 2, (1 / cameraComponent.zoom) * (Math.random() - 0.5) * magnitude * 2));
            if (time - start < durationMS)
                window.requestAnimationFrame(doShakeFrame);
            else {
                // TODO make this better by finding the total moved and subtracting that-
                // the camera could have moved during the shake
                cameraComponent.zoom = startZoom;
                pos.set(startPos);
            }
        };
        window.requestAnimationFrame(doShakeFrame);
    }
    static findMain() {
        for (const sprite of Sprite.sprites) {
            if (!sprite.hasComponent('Camera'))
                continue;
            Camera.main = sprite;
            return;
        }
        console.error(`
            No sprites with component of type 'camera' can be found. 
            Make sure that there is at least one sprite with a 'Camera' component attached
        `);
    }
}
