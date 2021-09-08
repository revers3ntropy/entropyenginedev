import {v2, v3 } from "../maths/maths.js";
import { Component } from "../ECS/component.js";
import { Entity } from "../ECS/entity.js";
import {Scene} from "../ECS/scene.js";

export class Transform extends Component {
    // @ts-ignore
    position: v3;
    // @ts-ignore
    scale: v3;
    // @ts-ignore
    rotation: v3;

    // @ts-ignore
    parent: Transform | number;

    constructor({
        position = v3.zero,
        scale = new v3(1, 1, 1),
        rotation = v3.zero,

        parent = Scene.active
    }) {
        super('Transform');

        this.addPublic({
            name: 'position',
            value: position,
            type: 'v3',
            overrideGet: () => {
                if (typeof this.parent === 'number') 
                    return this.getPublic('position');
                
                return this.getPublic('position').clone.add(this.parent.position);
            },
            overrideSet: (v: v3) => {
                const p = v || v3.zero;
                p.x ??= 0;
                p.y ??= 0;

                this.setPublic('position', p);
            }
        });

        this.addPublic({
            name: 'rotation',
            value: rotation,
            type: 'v3',
            overrideGet: () => {
                if (typeof this.parent === 'number')
                    return this.getPublic('rotation');
                
                return this.getPublic('rotation').clone.add(this.parent.rotation);
            },
            overrideSet: (v: v3) => {
                const r = v || v3.zero;
                r.x ??= 0;
                r.y ??= 0;
                this.setPublic('rotation', r);
            }
        });

        this.addPublic({
            name: 'scale',
            value: scale,
            type: 'v3',
            overrideGet: () => {
                if (typeof this.parent === 'number')
                    return this.getPublic('scale');
                
                return this.getPublic('scale').clone.mul(this.parent.scale);
            },
            overrideSet: (v: v3) => {
                const s = v || v3.zero;
                s.x ??= 0;
                s.y ??= 0;
                this.setPublic('scale', s);
            }
        });

        this.addPublic({
            name: 'parent',
            value: parent,
            type: 'Transform'
        });
    }

    setParentDirty (val: Transform | number) {
        /*
            For if the parent is not known to be safe, for example from user input.
            Protects against types and circular parenting
         */
        if (!(val instanceof Transform) && typeof val !== 'number') {
            this.parent = Scene.active;
            return;
        }

        if (typeof val === "number") {
            this.parent = val;
            return;
        }

        // check for circular parenting
        if (this.recursiveChildren.includes(val.sprite)) {
            for (const child of this.children)
                // shift children up one level if any of the
                // children are becoming the parent of this entity
                child.transform.parent = this.parent;
        }

        this.parent = val;
    }

    json () {
        let parent = {
            type: '',
            name: ''
        };
        if (this.parent instanceof Transform) {
            parent.type = 'Transform';
            parent.name = this.parent.sprite.name;
        } else {
            parent.type = 'Scene';
            parent.name = this.parent.toString();
        }
        
        return {
            type: 'Transform',
            position: this.position.array,
            scale: this.scale.array,
            rotation: this.rotation.array,
            parent
        }
    }

    Update() {}
    

    get localRotation () {
        return this.getPublic('rotation');
    }

    set localRotation (v: v3) {
        this.setPublic('rotation', v);
    }

    get localPosition () {
        return this.getPublic('position');
    }

    set localPosition (v: v3) {
        this.setPublic('position', v);
    }

    get localScale () {
        return this.getPublic('scale');
    }

    set localScale (v: v3) {
        this.setPublic('position', v);
    }

    detachFromParent (): void {
        this.parent = Scene.active;
    }

    get children (): Entity[] {
        let children = [];

        for (let sprite of Entity.entities)
            if (Object.is(sprite.transform.parent, this))
                children.push(sprite);

        return children;
    }

    get recursiveChildren (): Entity[] {
        const queue: Entity[] = this.children;
        const children: Entity[] = [];

        while (queue.length > 0) {
            for (let child of queue[0].transform.children) {
                queue.push(child);
            }

            // there must be an element so shift can't return undefined, but ts doesn't kow that
            children.push( <Entity> queue.shift());
        }

        return children;
    }

    get childCount (): number {
        let count = 0;

        for (let sprite of Entity.entities)
            if (Object.is(sprite.transform.parent, this))
                count++;

        return count;
    }

    makeChildOf (t: Transform | number): void {
        this.parent = t;
    }

    makeParentOf (transforms: Transform[]): void {
        for (const transform of transforms)
            transform.parent = this;
    }

    isRoot (): boolean {
        return typeof this.parent === 'number';
    }

    isChild (): boolean {
        return this.parent instanceof Transform;
    }

    get sprite (): Entity {
        return Entity.entities.find(sprite => Object.is(sprite.transform, this)) as Entity;
    }

    get root (): Transform {
        function findNextRoot (t: Transform): Transform {
            if (typeof t.parent === 'number')
                return t;

            return findNextRoot(t.parent);
        }

        return findNextRoot(this);
    }

    get scene (): Scene {
        return Scene.sceneByID( <number> this.root.parent);
    }

    get forwards (): v3 {
        return this.rotation;
    }

    get right (): v2 {
        let forwards = this.forwards;
        return new v2(
            forwards.y,
            -forwards.x
        )
    }

    getChild (name: string) {
        return this.children.find(t => t.name === name);
    }
}