export const rgb = (red, green, blue) => ({
    red, green, blue,
    get hex() {
        return `#${rgbValToHex(this.red)}${rgbValToHex(this.green)}${rgbValToHex(this.blue)}`;
    },
    get rgb() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    },
});
export function rgbValToHex(val) {
    var hex = Number(val).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}
export function parseColour(val) {
    let m;
    console.log(val);
    m = val.match(/^#([0-9a-f]{3})$/i);
    console.log(m);
    if (m && m[1]) {
        // in three-character format, each value is multiplied by 0x11 to give an
        // even scale from 0x00 to 0xff
        return rgb(parseInt(m[1].charAt(0), 16) * 0x11, parseInt(m[1].charAt(1), 16) * 0x11, parseInt(m[1].charAt(2), 16) * 0x11);
    }
    m = val.match(/^#([0-9a-f]{6})$/i);
    console.log(m);
    if (m && [1]) {
        return rgb(parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16));
    }
    m = val.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    console.log(m);
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
