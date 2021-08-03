import {System} from "../../ECS/system.js";
import {Scene} from "../../ECS/scene.js";
import {collide} from "./collisions.js";
import {Script} from "../../components/scriptComponent.js";
import {Entity} from "../../ECS/entity.js";
import {v3} from "../../maths/v3.js";
import {Body} from "../../components/body.js";
import {N_any} from "../../scripting/EEScript/nodes.js";

// function called when two sprites collide to trigger the onCollision event in all scripts
function collideSprites (sprite1: Entity, sprite2: Entity) {
    for (let component of sprite1.components)
        if (component.type === 'Script')
            (component as Script).runMethod('onCollision', [new N_any(sprite2)]);


    for (let component of sprite2.components)
        if (component.type === 'Script')
            (component as Script).runMethod('onCollision', [new N_any(sprite1)]);
}

System.systems.push(new System ({
    name: 'Physics',
    Start: (scene: Scene) => {},

    Update: (scene: Scene) => {
        const entities = scene.entities;
        const settings = scene.settings;

        // update bodies
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (!entity.hasComponent('Body')) continue;

            const body = entity.getComponent<Body>('Body');

            // update gravity
            body.velocity.add(settings.globalGravity);

            // update the position for new velocity
            entity.transform.position.add(body.velocity.clone.scale(settings.timeScale));

            // apply air resistance
            body.velocity.scale(1 - body.airResistance);

            // set default values if error
            if (body.velocity == undefined || body.velocity.x == undefined || body.velocity.y == undefined) {
                console.error(`Velocity Error: velocity is ${body.velocity}`);
                body.velocity = v3.zero;
            }
        }

        // update collisions
        for (let n = 0; n < settings.collisionIterations; n++)
            for (let i = 0; i < entities.length; i++)
                for (let j = i+1; j < entities.length; j++)
                    collide(entities[i], entities[j], collideSprites);
    }

}));