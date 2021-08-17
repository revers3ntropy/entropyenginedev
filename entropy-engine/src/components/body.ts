import {v3} from "../maths/maths.js";
import {Component} from "../ECS/component.js";
import {JSONifyComponent} from "../util/general.js";

export class Body extends Component {

    // @ts-ignore
    velocity: v3;
    // @ts-ignore
    mass: number;
    // @ts-ignore
    friction: number;
    // @ts-ignore
    airResistance: number;
    // @ts-ignore
    bounciness: number;

    constructor({
        velocity = v3.zero,
        mass = 1,
        friction = 0.1,
        airResistance = 0.1,
        bounciness = 0.2,
    }) {
        super("Body");

        this.addPublic<v3>({
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
            description: 'Velocity is scaled by this every Update. Larger values give higher resistance and more slowing'
        });

        this.addPublic({
            name: 'bounciness',
            value: bounciness,
            description: 'When dynamically colliding, the velocity is reversed and multiplied by this. Higher values give a higher bounce.'
        });
    }
    
    json () {
        return JSONifyComponent(this, 'Body');
    }

    applyForce(force: v3): v3 {
        this.velocity.add(force.clone.scale(1/this.mass));
        return this.velocity;
    }
}