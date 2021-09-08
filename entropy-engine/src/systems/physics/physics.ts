import {Systems} from "../../ECS/system.js";
import {Scene} from "../../ECS/scene.js";
import type {Body} from "../../components/body.js";
import {CircleCollider, Collider, RectCollider} from "../../components/colliders.js";
import {Entity} from "../../ECS/entity.js";
import {v3} from "../../maths/v3.js";
import {Script} from "../../components/scriptComponent.js";
import {N_any} from "../../scripting/EEScript/nodes.js";

Systems.systems.push({
    name: 'Physics',
    order: 0,
    engine: Matter.Engine.create(),
    runner: Matter.Runner.create(),

    Start: function (scene: Scene) {

        for (let entity of scene.entities) {
            if (!entity.hasComponent('Body')) continue;
            if (!entity.hasComponent('Collider')) continue;

            let collider = entity.getComponent<Collider>('Collider');
            let body = entity.getComponent<Body>('Body');

            this.updateMBodyOptions(collider, entity, body, true);

            Matter.World.addBody(this.engine.world, collider.MatterBody);
        }
    },

    updateMBodyOptions: (collider: Collider, entity: Entity, body: Body, isStart = false): void => {
        const mBody = collider.MatterBody;
        const trans = entity.transform;

        mBody.position =
            Matter.Vector.create(trans.position.x, trans.position.y);
        mBody.angle = trans.rotation.z;

        mBody.isStatic = entity.Static;

        mBody.isSensor = !collider.solid;

        mBody.friction = body.friction;
        mBody.velocity = Matter.Vector.create(body.velocity.x, body.velocity.y);
        mBody.frictionAir = body.airResistance;
        mBody.mass = body.mass;
        mBody.restitution = body.bounciness.clamp(0, 1);


        let newVerts = [];
        if (collider instanceof RectCollider) {
            const w = collider.width * trans.scale.x;
            const h = collider.height * trans.scale.y;
            newVerts = Matter.Bodies.rectangle(
                trans.position.x,
                trans.position.y,
                w,
                h
            ).vertices;

        } else if (collider instanceof CircleCollider) {
            const r = collider.radius * trans.scale.x;
            newVerts = Matter.Bodies.circle(
                trans.position.x,
                trans.position.y,
                r
            ).vertices;

        } else throw Error('Unkown Collider type');

        for (let vert of newVerts)
            vert.body = mBody;

        mBody.vertices = newVerts;
        mBody.bounds = Matter.Bounds.create(mBody.vertices);


        if (entity.Static) {
            mBody.velocity = Matter.Vector.create(0, 0);
            mBody.force = Matter.Vector.create(0, 0);
            mBody.positionPrev = mBody.position;
        }

        if (isStart) {
            mBody.positionPrev = mBody.position;
        }
    },

    callCollides: function (entity: Entity, collidesWith: Entity) {
        for (let component of entity.components)
            if (component.type === 'Script')
                (component as Script)
                    .runMethod('onCollision',
                        [new N_any(collidesWith)]
                    );
    },

    updateScripts: function (pairs: [Matter.Body, Entity][]) {
        const justMBodies = [];
        for (let [mBody] of pairs) justMBodies.push(mBody);

        for (let [mBody, entity] of pairs) {

            // remove this body from the array
            const bodies = [...justMBodies];
            let index = bodies.indexOf(mBody);
            if (index === -1) throw Error();
            bodies.splice(index, 1);

            let collideRes = Matter.Query.collides(mBody, bodies);
            if (collideRes.length > 0) {
                for (let res of collideRes) {
                    let collidedWithMBody = res.bodyB;
                    if (Object.is(collidedWithMBody, mBody))
                        collidedWithMBody = res.bodyA;

                    const pair = pairs.find(([mBody]) => Object.is(mBody, collidedWithMBody))
                    if (pair === undefined) throw Error();

                    this.callCollides(entity, pair[1]);
                }
            }
        }
    },

    Update: function (scene: Scene) {

        const bodies: [Matter.Body, Entity][] = [];

        this.time ||= performance.now();

        // UPDATE
        for (let entity of scene.entities) {
            if (!entity.hasComponent('Collider'))
                continue;

            let collider = entity.getComponent<Collider>('Collider');

            if (entity.hasComponent('Body')) {
                let body = entity.getComponent<Body>('Body');
                this.updateMBodyOptions(collider, entity, body);
            }

            bodies.push([collider.MatterBody, entity]);
        }

        this.engine.gravity.x = scene.settings.globalGravity.x;
        this.engine.gravity.y = scene.settings.globalGravity.y;

        // TICK
        Matter.Runner.tick(this.runner, this.engine, performance.now());

        // UNBUILD
        for (let entity of scene.entities) {
            if (!entity.hasComponent('Body') ||
                !entity.hasComponent('Collider')
            ) continue;

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

        this.updateScripts(bodies);
    },
});