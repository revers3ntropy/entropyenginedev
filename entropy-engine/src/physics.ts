import {v2} from "./maths.js";
import { Sprite } from "./sprite.js";
import {Component, Transform} from "./component.js";
import {expandV2} from "./util.js";

export class PhysicsMaterial {
    friction: number;
    airResistance: number;
    bounciness: number;

    constructor ({
        friction = 0,
        airResistance = 0.1,
        bounciness = 0.1,
     }) {
        this.friction = friction;
        this.airResistance = airResistance;
        this.bounciness = bounciness;
    }

    json () {
        return {
            'friction': this.friction,
            'airResistance': this.airResistance,
            'bounciness': this.bounciness
        }
    }
}


export class Body extends Component {
    velocity: v2;
    mass: number;
    gravityAttract: v2;
    gravityEffect: number;
    material: PhysicsMaterial

    constructor({
        velocity = new v2(0, 0),
        mass = 1,
        gravityAttract = new v2(0, 0),
        gravityEffect = 0,
        material = new PhysicsMaterial({}),
    }) {
        super("Body");

        this.velocity = velocity;
        this.mass = mass
        this.gravityAttract = gravityAttract;
        this.gravityEffect = gravityEffect;
        this.material = material;
    }

    json () {
        return {
            'type': 'Body',
            'velocity': expandV2(this.velocity),
            'mass': this.mass,
            'gravityAttract': expandV2(this.gravityAttract),
            'gravityEffect': this.gravityEffect,
            'material': this.material.json()
        }
    }

    scaleBy (factor: v2) {
        // mass = volume * density
        // where density is 1
        this.mass *= factor.x * factor.y;
    }

    tick (transform: Transform, timeScale = 1): void {

        // update the position for new velocity
        transform.position.add(this.velocity.clone.scale(timeScale));

        // apply air resistance
        this.velocity.scale(1 - this.material.airResistance);

        // set default values if error
        if (this.velocity == undefined || this.velocity.x == undefined || this.velocity.y == undefined) {
            console.error(`Velocity Error: velocity is ${this.velocity}`);
            this.velocity = new v2(0, 0);
        }
    }

    applyGravity(sprites: Sprite[], G: number): void {
        // apply directional gravity
        this.velocity.add(this.gravityAttract);
    }

    applyForce(force: v2): v2 {
        this.velocity.add(force.clone.scale(1/this.mass));
        return this.velocity;
    }
}