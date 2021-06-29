import {Component} from "../ECS/component";
import {Transform} from "./transform";

export class soundEmitter extends Component {
    // @ts-ignore
    src: string;

    sound: any;

    constructor (config: {
        src: string
    }) {
        super('soundEmitter');

        this.addPublic({
            name: 'src',
            value: config.src,
        });

        this.sound = document.createElement("audio");
        this.sound.src = config.src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
    }

    json(): any {

    }

    Update (transform: Transform): void {

    }

    play () {
        this.sound.play();
    }

    stop () {
        this.sound.pause();
    }

}