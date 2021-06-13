import { v3 } from "../util/maths/maths.js";
import { Component } from "../ECS/component.js";
import { JSONifyComponent } from "../util/util.js";
export class Body extends Component {
    constructor({ velocity = v3.zero, mass = 1, friction = 0.1, airResistance = 0.1, bounciness = 0.2, }) {
        super("Body");
        this.addPublic({
            name: 'velocity',
            value: velocity,
            description: 'The speed and direction of the object at the first frame',
            type: 'v3'
        });
        this.addPublic({
            name: 'mass',
            value: mass,
            description: 'The mass of the object affects collisions, forces and more.'
        });
        this.addPublic({
            name: 'friction',
            value: friction,
            description: 'When colliding, this is applied to the velocity. Higher values slow it down more.'
        });
        this.addPublic({
            name: 'airResistance',
            value: airResistance,
            description: 'Velocity is scaled by this every tick. Larger values give higher resistance and more slowing'
        });
        this.addPublic({
            name: 'bounciness',
            value: bounciness,
            description: 'When dynamically colliding, the velocity is reversed and mutliplied by this. Higher values give a higher bounce.'
        });
    }
    json() {
        return JSONifyComponent(this, 'Body');
    }
    tick(transform, timeScale = 1) {
        // update the position for new velocity
        transform.position.add(this.velocity.clone.scale(timeScale));
        // apply air resistance
        this.velocity.scale(1 - this.airResistance);
        // set default values if error
        if (this.velocity == undefined || this.velocity.x == undefined || this.velocity.y == undefined) {
            console.error(`Velocity Error: velocity is ${this.velocity}`);
            this.velocity = v3.zero;
        }
    }
    applyForce(force) {
        this.velocity.add(force.clone.scale(1 / this.mass));
        return this.velocity;
    }
}
