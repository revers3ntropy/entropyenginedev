import {Systems} from "../../ECS/system.js";
import {Scene} from "../../ECS/scene.js";
import type {Body} from "../../components/body.js";
import {Collider} from "../../components/colliders.js";
import {Entity} from "../../ECS/entity.js";
import {v3} from "../../maths/v3.js";

// function called when two sprites collide to trigger the onCollision event in all scripts
/*
function collideSprites (sprite1: Entity, sprite2: Entity) {
    for (let component of sprite1.components)
        if (component.type === 'Script')
            (component as Script).runMethod('onCollision', [new N_any(sprite2)]);


    for (let component of sprite2.components)
        if (component.type === 'Script')
            (component as Script).runMethod('onCollision', [new N_any(sprite1)]);
}
 */

Systems.systems.push({
    name: 'Physics',
    order: 0,
    time: performance.now(),
    engine: Matter.Engine.create(),

    Start: function (scene: Scene) {
        this.time = performance.now();

        for (let entity of scene.entities) {
            if (!entity.hasComponent('Body')) continue;
            if (!entity.hasComponent('Collider')) continue;

            let collider = entity.getComponent<Collider>('Collider');
            let body = entity.getComponent<Body>('Body');

            this.updateMBodyOptions(collider, entity, body);

            Matter.World.addBody(this.engine.world, collider.MatterBody);
        }
    },

    updateMBodyOptions: (collider: Collider, entity: Entity, body: Body): void => {
        const mBody = collider.MatterBody;
        mBody.position = Matter.Vector.create(entity.transform.position.x, entity.transform.position.y);
        mBody.angle = entity.transform.rotation.z;
        mBody.friction = body.friction;
        mBody.velocity = Matter.Vector.create(body.velocity.x, body.velocity.y);
        mBody.frictionAir = body.airResistance;
        mBody.isStatic = entity.Static;
        mBody.mass = body.mass;
        mBody.restitution = body.bounciness.clamp(0, 1);
        mBody.collisionFilter.group = collider.solid ? 1 : -1;
        console.log(mBody);
    },

    Update: function (scene: Scene) {
        // UPDATE
        for (let entity of scene.entities) {
            if (!entity.hasComponent('Body')) continue;
            if (!entity.hasComponent('Collider')) continue;

            let collider = entity.getComponent<Collider>('Collider');
            let body = entity.getComponent<Body>('Body');

            this.updateMBodyOptions(collider, entity, body);
        }

        // TICK
        const delta = this.time - performance.now();

        Matter.Engine.update(this.engine, delta);

        this.time = performance.now();

        // UNBUILD
        for (let entity of scene.entities) {
            if (!entity.hasComponent('Body')) continue;
            if (!entity.hasComponent('Collider')) continue;

            let collider = entity.getComponent<Collider>('Collider');
            let mBody = collider.MatterBody;
            let body = entity.getComponent<Body>('Body');

            if (!entity) {
                console.error('EEInstance not attached to Matter.Body instance');
                continue;
            }

            entity.transform.rotation.z = mBody.angle;
            entity.transform.position.set(new v3(mBody.position.x, mBody.position.y, 0));
            body.velocity.set(new v3(mBody.velocity.x, mBody.velocity.y, 0));
        }
    },
});