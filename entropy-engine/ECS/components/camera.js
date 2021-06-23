import { Component } from "../component.js";
import { v3 } from "../../util/maths/maths.js";
import { Scene } from "../scene.js";
import { JSONifyComponent } from "../../util/util.js";
export class Camera extends Component {
    constructor({ zoom = 1, far = 1000, near = 0.1, fov = 90 }) {
        super('Camera');
        this.addPublic({
            name: 'zoom',
            value: zoom,
            description: '2D only camera zoom - does not affect 3D rendering'
        });
        this.addPublic({
            name: 'far',
            value: far,
            description: 'The far clipping plane. Does not affect 2D rendering.'
        });
        this.addPublic({
            name: 'near',
            value: near,
            description: 'The near clipping plane. Does not affect 2D rendering.'
        });
        this.addPublic({
            name: 'fov',
            value: fov,
            description: 'Field of view - like zoom for 3D'
        });
    }
    json() {
        return JSONifyComponent(this, 'Camera');
    }
    tick() { }
    shake(magnitude = 1, durationMS = 200) {
        // not super useful, just thought it'd be fun to have
        const start = performance.now();
        const camera = this.sprite;
        const pos = camera.transform.position;
        const cameraComponent = camera.getComponent('Camera');
        // to allow it to reset fully
        const startZoom = cameraComponent.zoom;
        const startPos = pos.clone;
        const doShakeFrame = (time) => {
            cameraComponent.zoom *= 1 + (Math.random() - 0.5) * magnitude / 100;
            const rand = () => (1 / cameraComponent.zoom) * (Math.random() - 0.5) * magnitude * 2;
            pos.add(new v3(rand(), rand(), rand()));
            if (time - start < durationMS)
                window.requestAnimationFrame(doShakeFrame);
            else {
                // TODO make this better by finding the total moved and subtracting that
                // the camera could have moved during the shake, and then jerks back to acutal position
                cameraComponent.zoom = startZoom;
                pos.set(startPos);
            }
        };
        window.requestAnimationFrame(doShakeFrame);
    }
    static findMain() {
        for (const sprite of Scene.activeScene.sprites) {
            if (!sprite.hasComponent('Camera'))
                continue;
            Camera.main = sprite;
            return;
        }
        console.error(`
            No sprites with component of type 'camera' can be found. 
            Make sure that there is at least one sprite in the scene '${Scene.activeScene.name}' with a 'Camera' component attached
        `);
    }
}
