import {Scene} from "./scene.js";

export interface System {
    Start: (scene: Scene) => void;
    Update: (scene: Scene) => void;
    name: string;
    order: number;
}


export const Systems: {
    systems: (any & System)[],
    sortByOrder: () => void,
    getByName:  (name: string) => System | void,
    Start: (scene: Scene) => void,
    Update: (scene: Scene) => void

} = {
    systems: [],

    sortByOrder () {
        Systems.systems = Systems.systems.sort((a: System, b: System) => a.order - b.order);
    },

    getByName (name: string): System | void {
        for (let system of Systems.systems) {
            if (system.name === name) {
                return system;
            }
        }
    },

    Start (scene: Scene) {
        Systems.sortByOrder();

        for (let system of Systems.systems) {
            system.Start(scene);
        }
    },

    Update (scene: Scene) {
        for (let system of Systems.systems) {
            system.Update(scene);
        }
    }
}