#!/usr/bin/env node
"use strict";
/*
TODO:
* scan  folders with names,"in" "out" for existing images,(checking out before running the code, with an option that forces reruns)
*impliment checking for when the paths don't exist
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const path = require("path");
const program = require("commander");
const jimp_1 = __importDefault(require("jimp"));
const color_1 = __importDefault(require("color"));
clear();
console.log(chalk.red(figlet.textSync("SMASH OUTLINE", { horizontalLayout: "full" })));
program
    .version("0.0.1")
    .description("Cli for making smash chactor outlines")
    .option("-C, --colors", "select your own gradient colours")
    .option("-O,--outline", "select outline width")
    .option("-S, --saturation", "sets a maximum saturation for the light side of the gradient")
    .parse(process.argv);
let maximumSaturation = program.saturation;
//TODO: impliment a way to turn of random  saturation
let alphaCutoff = 254;
let outlinesize = 1.1;
console.log("started");
let outlineSize = program.outline;
if (maximumSaturation == null) {
    maximumSaturation = 0;
}
if (outlineSize) {
    Main(outlineSize);
}
else {
    console.log("you didn't set an outline. defaulting to 5");
    Main(5);
}
Math.random;
function Main(outlineWidth) {
    let randomHue = Math.random() * 360;
    let firstColour = color_1.default.hsv(randomHue, Math.random() * maximumSaturation, 100);
    let secondColour = color_1.default.hsv(randomHue, 100, 100);
    let image = jimp_1.default.read("images/gsa.png")
        .then(image => {
        if (image.hasAlpha) {
            console.log("Image loaded and has alpha channel");
            let imageHeight = image.bitmap.height;
            let imageWidth = image.bitmap.width;
            let alphaImage = new jimp_1.default(imageWidth, imageHeight, (err, newimage) => { });
            var hrstart = process.hrtime();
            image.scan(0, 0, imageWidth, imageHeight, function (x, y, idx) {
                /*         var red = this.bitmap.data[idx + 0];
              var green = this.bitmap.data[idx + 1];
              var blue = this.bitmap.data[idx + 2]; */
                var alpha = this.bitmap.data[idx + 3];
                if (alpha >= alphaCutoff) {
                    let newColor = makeGradient(firstColour, secondColour, y / imageHeight);
                    let r = lerp(255, 0, y / imageHeight);
                    let g = lerp(0, 0, y / imageHeight);
                    let b = lerp(0, 0, y / imageHeight);
                    this.bitmap.data[idx + 0] = r; //newColor.red();
                    this.bitmap.data[idx + 1] = g; //newColor.green();
                    this.bitmap.data[idx + 2] = b; //newColor.blue();
                }
                else {
                    this.bitmap.data[idx + 0] = 0;
                    this.bitmap.data[idx + 1] = 0;
                    this.bitmap.data[idx + 2] = 0;
                    this.bitmap.data[idx + 3] = 0;
                }
                alphaImage.bitmap.data[idx + 0] = alpha;
                alphaImage.bitmap.data[idx + 1] = alpha;
                alphaImage.bitmap.data[idx + 2] = alpha;
                alphaImage.bitmap.data[idx + 3] = 255;
            });
            let hrend = process.hrtime(hrstart);
            console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);
            console.log("Got alpha channel and gradient. making outline");
            //    image.write("justinnner.png");
            //   alphaImage.write("1ustoutline.png");
            alphaImage.blur(outlineWidth);
            //  alphaImage.write("2ustoutline.png");
            alphaImage.scan(0, 0, imageWidth, imageHeight, function (x, y, idx) {
                var blue = this.bitmap.data[idx + 2];
                if (blue > 1) {
                    this.bitmap.data[idx + 0] = 255;
                    this.bitmap.data[idx + 1] = 255;
                    this.bitmap.data[idx + 2] = 255;
                    this.bitmap.data[idx + 3] = 255;
                }
                else
                    this.bitmap.data[idx + 3] = 0;
            });
            //   alphaImage.write("3ustoutline.png");
            //let outlineImage = alphaImage.scale(1);
            let xPos = (alphaImage.getWidth() - imageWidth) / 2;
            let yPos = (alphaImage.getHeight() - imageHeight) / 2;
            alphaImage.composite(image, xPos, yPos, {
                mode: jimp_1.default.BLEND_MULTIPLY,
                opacitySource: 1,
                opacityDest: 1
            }); // i will need to set my x and y point to something to offset teh scale so it ends up centered.
            console.log(alphaImage);
            console.log("starting write");
            alphaImage.write("gsaoutline.png", writeFinishedCallback);
        }
        else {
            console.log("image has no alpha channel");
        }
    })
        .catch(err => {
        console.log("couldn't load image");
    });
}
function writeFinishedCallback(err) {
    if (err)
        console.error("write error: ", err);
    console.log("finsihed");
}
/**
 * @param colour1
 * @param colour2
 * @param colorRatio the ratio of the second color to the first, you can think of this as traversing along the gradient;
 */
function makeGradient(colour1, colour2, colorRatio) {
    return colour1.mix(colour2, colorRatio); //TODO, this mix function is very slow, maybe make a faster one, perhapse using lerp and hsl colour. jsut lerping the values
    //return FastColourMix(colour1, colour2, colorRatio);
}
function FastColourMix(colour1, colour2, colorRatio) {
    return color_1.default.hsv(lerp(colour1.hue(), colour2.hue(), colorRatio), lerp(colour1.saturationv(), colour2.saturationv(), colorRatio), lerp(colour1.value(), colour2.value(), colorRatio));
}
function lerp(a, b, n) {
    return (1 - n) * a + n * b;
}
//# sourceMappingURL=index.js.map