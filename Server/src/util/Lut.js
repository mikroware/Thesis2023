/**
 * @author daron1337 / http://daron1337.github.io/
 */

// TODO: get rid of this dependency
const { Color } = require('three');


/**
 *
 * @param colormap {string} rainbow|cooltowarm|blackbody|grayscale|blue|redyellowcyan
 * @param numberofcolors {number}
 * @param hardMap {number} - if set, hard map split on given lerp value (between 0.0 and 1.0)
 * @returns {Lut}
 * @constructor
 */
const Lut = function ( colormap, numberofcolors, hardMap ) {
    this.lut = [];
    this.setColorMap(colormap, numberofcolors, hardMap);
    return this;
};

Lut.prototype = {
    constructor: Lut,

    lut: [], map: [], n: 256, minV: 0, maxV: 1,

    set: function(value) {
        if(value instanceof Lut) {
            this.copy(value);
        }

        return this;
    },

    setMin: function(min) {
        this.minV = min;
        return this;
    },

    setMax: function(max) {
        this.maxV = max;
        return this;
    },

    setColorMap: function(colormap, numberofcolors, hardMap) {
        this.map = ColorMapKeywords[colormap] || ColorMapKeywords.rainbow;
        this.n = numberofcolors || 32;

        const hardMapSplit = hardMap || 0.5;

        const step = 1.0 / this.n;

        this.lut.length = 0;
        for(let i = 0; i <= 1; i += step) {
            for(let j = 0; j < this.map.length - 1; j++) {
                if(i >= this.map[j][0] && i < this.map[j + 1][0]) {
                    const min = this.map[j][0];
                    const max = this.map[j + 1][0];

                    const minColor = new Color(this.map[j][1]);
                    const maxColor = new Color(this.map[j + 1][1]);

                    const color = hardMap !== undefined
                        ? (( i - min ) / ( max - min ) < hardMapSplit ? minColor : maxColor)
                        : minColor.lerp(maxColor, ( i - min ) / ( max - min ));

                    this.lut.push(color);
                }
            }
        }

        if(hardMap !== undefined){
            console.log('LUT: ', this.lut.map(color => color.getHexString()).join(', '));
        }

        return this;
    },

    invertColorMap: function(){
        this.lut.reverse();
    },

    copy: function(lut) {
        this.lut = lut.lut;
        this.map = lut.map;
        this.n = lut.n;
        this.minV = lut.minV;
        this.maxV = lut.maxV;

        return this;
    },

    getColor: function(alpha) {
        if(alpha <= this.minV) {
            alpha = this.minV;
        } else if(alpha >= this.maxV) {
            alpha = this.maxV;
        }

        alpha = ( alpha - this.minV ) / ( this.maxV - this.minV );

        let colorPosition = Math.round(alpha * this.n);
        colorPosition === this.n ? colorPosition -= 1 : colorPosition;

        return this.lut[colorPosition];
    },

    addColorMap: function (colormapName, arrayOfColors) {
        ColorMapKeywords[colormapName] = arrayOfColors;
    },
};

const ColorMapKeywords = {
    "rainbow": [[ 0.0, 0x0000FF ], [ 0.2, 0x00FFFF ], [ 0.5, 0x00FF00 ], [ 0.8, 0xFFFF00 ], [ 1.0, 0xFF0000 ]],
    "cooltowarm": [[ 0.0, 0x3C4EC2 ], [ 0.2, 0x9BBCFF ], [ 0.5, 0xDCDCDC ], [ 0.8, 0xF6A385 ], [ 1.0, 0xB40426 ]],
    "blackbody": [[ 0.0, 0x000000 ], [ 0.2, 0x780000 ], [ 0.5, 0xE63200 ], [ 0.8, 0xFFFF00 ], [ 1.0, 0xFFFFFF ]],
    "grayscale": [[ 0.0, 0x000000 ], [ 0.2, 0x404040 ], [ 0.5, 0x7F7F80 ], [ 0.8, 0xBFBFBF ], [ 1.0, 0xFFFFFF ]],
    "blue": [[ 0.0, 0xFFFFFF ], [ 1.0, 0x0000FF ]],
    "redyellowcyan": [[ 0.0, 0xFF0000 ], [ 0.4, 0xFFDD22 ], [ 1.0, 0x00FFFF ]],
};

module.exports = Lut
