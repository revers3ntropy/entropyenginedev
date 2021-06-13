import { Component } from "../ECS/component.js"
import {Sprite} from "../ECS/sprite.js"
import {v2} from "../util/maths/maths.js"
import {Body} from "../physics/body.js"
import {expandV2, JSONifyComponent} from "../util/util.js";
import {Transform } from "../index.js";
import {Collider, RectCollider, CircleCollider} from '../ECS/components/colliders.js';

function getNewVelocityFromCollision (V1: v2, V2: v2, m1: number, m2: number, p1: v2, p2: v2, contactAngle: number) {

    let theta1 = Math.atan2 (V1.y, V1.x);
    let theta2 = Math.atan2 (V2.y, V2.x);

    let s1 = V1.magnitude;
    let s2 = V2.magnitude;

    let phi = contactAngle

    // deconstructed equation for debug
    let v1x_prime = (
        (
            s1 * Math.cos(theta1 - phi) * (m1 - m2) +
            2 * m2 * s2 * Math.cos(theta2 - phi)
        ) /
        (m1 + m2)
    ) * Math.cos(phi) + (
        s1 * Math.sin(theta1 - phi) * Math.cos( phi + (Math.PI / 2))
    );
    let v1y_prime = ( (s1 * Math.cos(theta1 - phi) * (m1 - m2) + 2 * m2 * s2 * Math.cos(theta2 - phi)) / (m1 + m2) ) * Math.sin(phi) + s1 * Math.sin(theta1 - phi) * Math.sin( phi + (Math.PI / 2));

    let v2x_prime = ( (s2 * Math.cos(theta2 - phi) * (m2 - m1) + 2 * m1 * s1 * Math.cos(theta1 - phi)) / (m2 + m1) ) * Math.cos(phi) + s2 * Math.sin(theta2 - phi) * Math.cos( phi + (Math.PI / 2));
    let v2y_prime = ( (s2 * Math.cos(theta2 - phi) * (m2 - m1) + 2 * m1 * s1 * Math.cos(theta1 - phi)) / (m2 + m1) ) * Math.sin(phi) + s2 * Math.sin(theta2 - phi) * Math.sin( phi + (Math.PI / 2));

    return [
        new v2(
            v1x_prime, v1y_prime
        ).v3,
        new v2(
            v2x_prime, v2y_prime
        ).v3
    ];
}

// collisions types
function circleCircleCollision (sprite1: Sprite, sprite2: Sprite, onCollision: () => void) {
    const transform1 = sprite1.transform;
    const transform2 = sprite2.transform;

    const collider1 = sprite1.getComponent<CircleCollider>('Collider');
    const collider2 = sprite2.getComponent<CircleCollider>('Collider');

    let dist = transform1.position
        .v2
        .add (collider1.offset)
        .distTo (
            transform2.position
                .v2
                .add(collider2.offset)
        );

    const r1 = collider1.radius * sprite1.transform.scale.x;
    const r2 = collider2.radius * sprite2.transform.scale.x;

    let overlap = r1 + r2 - dist || 0;

    if (dist <= 0) return;
    if (overlap <= 0)  return;

    // resolve collision
    if (!sprite1.Static)
        transform1.position
            .add(
                transform1.position.clone
                    .sub(transform2.position)
                    .scale(overlap / (dist * (sprite2.Static ? 1 : 2)) )
            );
    if (!sprite2.Static)
        transform2.position
            .sub(
                transform1.position.clone
                    .sub(transform2.position)
                    .scale(overlap / (dist * (sprite1.Static ? 1 : 2)) )
            );

    if (!sprite1.hasComponent('Body') || !sprite2.hasComponent('Body')) {
        // finish early without doing the dynamic collision
        onCollision();
        return;
    }

    const body1 = sprite1.getComponent<Body>('Body');
    const body2 = sprite2.getComponent<Body>('Body');

    // resolve dynamic collision
    let diff = transform2.position.clone.sub(transform1.position);
    let phi = Math.atan2 (diff.y, diff.x);
    [body1.velocity, body2.velocity] = getNewVelocityFromCollision(body1.velocity.v2, body2.velocity.v2, body1.mass, body2.mass, transform1.position.v2, transform2.position.v2, phi);

    // finish the collision
    onCollision();
}

function circleRectCollision (circle: Sprite, rect: Sprite, onCollision: () => void) {
    const transformRect = rect.transform;
    const transformCircle = circle.transform;

    const colliderRect = rect.getComponent<RectCollider>('Collider');
    const colliderCircle = circle.getComponent<CircleCollider>('Collider');

    const circleR = colliderCircle.radius * circle.transform.scale.x;
    const rectD = new v2(colliderRect.width, colliderRect.height).mul(rect.transform.scale.v2);

    const circlePos =
        transformCircle.position
            .v2
            .add(colliderCircle.offset);

    const rectPos =
        transformRect.position
            .v2
            .add(colliderRect.offset);

    const nearestPoint = new v2(
        Math.max(rectPos.x, Math.min(rectPos.x + rectD.x, circlePos.x)),
        Math.max(rectPos.y, Math.min(rectPos.y + rectD.y, circlePos.y)),
    );

    let isOnInside = false;

    // if the circle is in the rectangle, clamp its position to the edge of the rectangle first
    if (circlePos.isInRect(rectPos, rectD)) {
        // send out four rays in each direction until an edge is hit, and then set the circles position to one step beyond that
        let rays = [
            circlePos.y,
            circlePos.x,
            circlePos.y,
            circlePos.x,
        ];
        while (true) {
            // step forward
            rays[0] -= 2;
            rays[1] += 2;
            rays[2] += 2;
            rays[3] -= 2;

            // check each ray
            if (rays[0] < rectPos.y) {
                transformCircle.position.y = rays[0];
                break;
            }
            else if (rays[1] > rectPos.x + rectD.x) {
                transformCircle.position.x = rays[1];
                break;
            }
            else if (rays[2] > rectPos.y + rectD.y) {
                transformCircle.position.y = rays[2];
                break;
            }
            else if (rays[3] < rectPos.x) {
                transformCircle.position.x = rays[3];
                break;
            }
        }
    }

    const overlap = -nearestPoint.distTo(circlePos) + circleR * (isOnInside ? -1 : 1);

    if (overlap < 0) return;

    // find which side the collision was on
    const moveDirection = new v2(0, 0);

    if (circlePos.x < rectPos.x)
        moveDirection.x = -1;

    else if (circlePos.x > rectPos.x + rectD.x)
        moveDirection.x = 1;

    if (circlePos.y < rectPos.y)
        moveDirection.y = -1;

    else if (circlePos.y > rectPos.y + rectD.y)
        moveDirection.y = 1;

    // normalise for corner collisions which are [1, 1] or similar, which don't have a magnitude of 1
    if (moveDirection.equals(v2.zero)) return;

    // resolve static collision
    if (!circle.Static)
        transformCircle.position.add(
            moveDirection.v3
                .normalise()
                .scale(overlap / (rect.Static ? 1 : 2))
        );

    if (!rect.Static)
        transformRect.position.sub(
            moveDirection.v3
                .normalise()
                .scale(overlap / (circle.Static ? 1 : 2))
        );

    // resolve dynamic collision
    /*

    const body1 = sprite1.getComponent<Body>('Body');
    const body2 = sprite2.getComponent<Body>('Body');

    if (!sprite1.hasComponent('Body') || !sprite2.hasComponent('Body')) {
        // finish early without doing the dynamic collision
        onCollision();
        return;
    }

    let diff = circleBody.position.clone().sub(rectBody.position);
    let phi = Math.atan2(diff.y, diff.x);
    const newVs = getNewVelocityFromCollision(
        circleBody.velocity,
        rectBody.velocity,
        circleBody.mass,
        rectBody.mass,
        circleBody.position,
        rectBody.position.clone().add(new v2(rectCollider.width, rectCollider.height).scaleBy(0.5)),
        phi
    );

    [circleBody.velocity, rectBody.velocity] = newVs;
     */

    onCollision();
}

function rectRectCollision (sprite1: Sprite, sprite2: Sprite, onCollision: () => void) {
    const transform1 = sprite1.transform;
    const transform2 = sprite2.transform;

    const collider1 = sprite1.getComponent<RectCollider>('Collider');
    const collider2 = sprite2.getComponent<RectCollider>('Collider');

    const pos1 =
        transform1.position
            .v2
            .add(collider1.offset);

    const pos2 =
        transform2.position
            .v2
            .add(collider2.offset);

    const dimensions1 = new v2(collider1.width, collider1.height).mul(sprite1.transform.scale.v2);
    const dimensions2 = new v2(collider2.width, collider2.height).mul(sprite2.transform.scale.v2);

    if (
        pos2.x + dimensions2.x <= pos1.x ||
        pos2.x >= pos1.x + dimensions1.x ||
        pos2.y + dimensions2.y <= pos1.y ||
        pos2.y >= pos1.y + dimensions1.y
    ) return;

    // find which side the collision was on
    const overlap = new v2(0, 0);

    if (pos1.x < pos2.x)
        overlap.x = pos1.x + dimensions1.x - pos2.x;

    else if (pos1.x > pos2.x)
        overlap.x = -pos2.x - dimensions2.x + pos1.x;

    if (pos1.y < pos2.y)
        overlap.y = pos1.y + dimensions1.y - pos2.y;

    else if (pos1.y > pos2.y)
        overlap.y = -pos2.y - dimensions2.y + pos1.y;

    const collisionLeftRight = (Math.abs(overlap.x) < Math.abs(overlap.y) || overlap.y === 0) && overlap.x !== 0;

    if (collisionLeftRight)
        overlap.y = 0;
    else
        overlap.x = 0;

    // resolve collision
    if (!sprite1.Static)
        transform1.position.add(
            overlap.v3.scale(-1 / (sprite2.Static ? 1 : 2))
        );
    if (!sprite2.Static)
        transform2.position.add(
            overlap.v3.scale(1 / (sprite1.Static ? 1 : 2))
        );

    if (!sprite1.hasComponent('Body') || !sprite2.hasComponent('Body')) {
        // finish early without doing the dynamic collision
        onCollision();
        return;
    }

    const body1 = sprite1.getComponent<Body>('Body');
    const body2 = sprite2.getComponent<Body>('Body');

    // make it so that they are only pushed one direction
    // abs so that -40 is seen as 'bigger' than 5
    // also bounce the objects off each other - not very good bouncing at the moment but better than nothing
    const bounce1 = body1.bounciness;
    const bounce2 = body2.bounciness;
    if (collisionLeftRight) {
        body1.velocity.x *= -bounce1;
        body2.velocity.x *= -bounce2;
    } else {
        body1.velocity.y *= -bounce1;
        body2.velocity.y *= -bounce2;
    }

    onCollision();
}

const collisionTypes: {[name: string]: any} = {
    'CircleCollider CircleCollider': circleCircleCollision,
    // have to have two different functions for the case of one of each, as one needs to be swapped around
    'RectCollider CircleCollider': (rect: Sprite, circle: Sprite, onCollision: () => void) => {
        circleRectCollision(circle, rect, onCollision);
    },
    'CircleCollider RectCollider': circleRectCollision,
    'RectCollider RectCollider': rectRectCollision
}

function collide (sprite1: Sprite, sprite2: Sprite, scriptCollide: (sprite1: Sprite, sprite2: Sprite) => void): void {
    if (!sprite1.hasComponent("Collider") || !sprite2.hasComponent("Collider"))
        return;

    const collider1 = sprite1.getComponent<Collider>("Collider");
    const collider2 = sprite2.getComponent<Collider>("Collider");

    if (!collider1.solid || !collider2.solid) return;

    let type1 = collider1.subtype;
    let type2 = collider2.subtype;

    try {
        collisionTypes[`${type1} ${type2}`](sprite1, sprite2, () => {
            // it has collided

            // apply friction
            /* this slows down stuff even if both are floating...
            body1.velocity.scaleBy(1 - body1.material.friction);
            body2.velocity.scaleBy(1 - body2.material.friction);
             */

            // run onCollision functions in scripts
            scriptCollide(sprite1, sprite2);
        });
    } catch (e) {
        console.log(`Cannot collide '${type1} ${type2}': \n${e}`);
    }
}

export function collideAll (sprites: Sprite[], scriptCollide: (sprite1: Sprite, sprite2: Sprite) => void) {
    for (let i = 0; i < sprites.length; i++)
        for (let j = i+1; j < sprites.length; j++)
            collide(sprites[i], sprites[j], scriptCollide);
}
