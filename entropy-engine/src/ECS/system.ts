import {Scene} from "./scene.js";

export class System {
    Start: (scene: Scene) => void;
    Update: (scene: Scene) => void;

    name: string;

    order: number;

    constructor ({Start, Update, order, name}: {
        Start: (scene: Scene) => void,
        Update: (scene: Scene) => void,
        name: string,
        order?: number | undefined
    }) {
        this.Start = Start;
        this.Update = Update;

        this.name = name;

        // higher numbers get executed first
        this.order = order || 0;
    }

    static systems: System[] = [];

    static sortByOrder () {
        System.systems = System.systems.sort((a: System, b: System) => a.order - b.order);
    }

    static getByName (name: string): System | void {
        for (let system of System.systems) {
            if (system.name === name) {
                return system;
            }
        }
    }

    static Start (scene: Scene) {
        System.sortByOrder();

        for (let system of System.systems) {
            system.Start(scene);
        }
    }

    static Update (scene: Scene) {
        for (let system of System.systems) {
            system.Update(scene);
        }
    }
}