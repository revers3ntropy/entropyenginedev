export type colour = {
    red: number,
    blue: number,
    green: number,
    alpha: number,

    isColour?: boolean,

    rgb: string,
    rgba: string,
    hex: string,
    clone: colour,
    json: any,
};

export const rgb = (red: number, green: number, blue: number, alpha = 1) => ({

    red, green, blue, alpha,

    isColour: true,

    get hex () {
        return `#${rgbValToHex(this.red)}${rgbValToHex(this.green)}${rgbValToHex(this.blue)}`;
    },

    get rgb () {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`
    },

    get rgba () {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha.toString()})`;
    },

    get clone () {
        return rgb(this.red, this.green, this.blue, this.alpha);
    },

    get json () {
        return {
            r: this.red,
            g: this.green,
            b: this.blue,
        }
    }
});

export function rgbValToHex (val: number | string) {
    let hex = Number(val).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}

export function parseColour (val: string): colour {
    let m;
    
    m = val.match(/^#([0-9a-f]{3})$/i);
    if (m && m[1]) {
        // in three-character format, each value is multiplied by 0x11 to give an
        // even scale from 0x00 to 0xff
        return rgb(
            parseInt(m[1].charAt(0),16)*0x11,
            parseInt(m[1].charAt(1),16)*0x11,
            parseInt(m[1].charAt(2),16)*0x11
        );
    }

    m = val.match(/^#([0-9a-f]{6})$/i);
    if (m && [1]) {
        return rgb(
            parseInt(m[1].substr(0,2),16),
            parseInt(m[1].substr(2,2),16),
            parseInt(m[1].substr(4,2),16)
        );
    }

    m = val.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (m) {
        return rgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
    }

    return {
        'red': rgb(255, 0, 0),
        'green': rgb(0, 255, 0),
        'blue': rgb(0, 0, 255),
        'white': rgb(255, 255, 255),

        // default to black
    }[val] || rgb(0, 0, 0);
}