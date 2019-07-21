#!/usr/bin/env node
/*
TODO:
* scan  folders with names,"in" "out" for existing images,(checking out before running the code, with an option that forces reruns)
*impliment checking for when the paths don't exist
*/

const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const path = require("path");
const program = require("commander");
import Jimp from "jimp";
import Color from "color";
import { maxHeaderSize } from "http";
import fs from "fs";
import readLine from "readline";
import config from "./config.json";

//--------------------------------------------
clear();
console.log(
  chalk.red(figlet.textSync("SMASH OUTLINE", { horizontalLayout: "full" }))
);
program
  .version("0.0.1")
  .description("Cli for making smash chactor outlines")
  .option("-C, --colors", "select your own gradient colours")
  .option("-O,--outline", "select outline width")
  .option(
    "-S, --saturation",
    "sets a maximum saturation for the light side of the gradient"
  )
  .parse(process.argv);

//-----------------------------------------------------------------
/* let json = JSON.parse(
  $.getJSON({
    url: "http://spoonertuner.com/projects/test/test.json",
    async: false
  }).responseText
); */
//----------------------

let maximumSaturation: number = program.saturation;
//TODO: impliment a way to turn of random  saturation

let alphaCutoff: number = 254;
let outlineSize: number;
if (program.outline != null) outlineSize = program.outline;
else outlineSize = config.visual.outlineSize;

if (maximumSaturation == null) {
  maximumSaturation = config.visual.maximumSaturation;
}

const inputPath = config.IO.inputPath;
const outputPath = config.IO.outputPath;
//---------------------------------------------------
Main();
function Main() {
  console.log("started");
  console.log("looking for images in path: " + inputPath);
  let filePaths = fromDir(inputPath, ".png");
  if (filePaths.length < 1)
    console.log("could not find any images in the path: " + inputPath);

  filePaths.forEach(filePath => {
    if (outlineSize != null) {
      ProcessImage(outlineSize, filePath, outputPath);
    } else {
      console.log("you didn't set an outline. defaulting to 5");
      ProcessImage(5, filePath, outputPath);
    }
  });

  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "rerun? 'y:n'"
  });

  rl.prompt();

  rl.on("line", line => {
    switch (line.trim()) {
      case "y":
        console.log("okay");
        rl.close();
        Main();
        break;
      case "n":
        console.log("okay");
        process.exit(0);
        break;
      default:
        console.log(`Say what? I might have heard '${line.trim()}'`);
        break;
    }
    rl.prompt();
  });
}
//-------------------------------------------
function fromDir(startPath: string, filter: string): Array<string> {
  //console.log('Starting from dir '+startPath+'/');

  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return Array<string>();
  }
  let output: Array<string> = Array<string>();
  let files: string[] = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    let filename = path.join(startPath, files[i]);
    let stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      console.log("-- found dir: ", filename);
      output.concat(fromDir(filename, filter)); //recurse
    } else if (filename.indexOf(filter) >= 0) {
      console.log("-- found: ", filename);
      output.push(filename);
    }
  }
  return output;
}

function ProcessImage(
  outlineWidth: number,
  imagePath: string,
  outputPath: string
) {
  console.log("began processing image, please wait");
  let randomHue: number = Math.random() * 360;
  let firstColour: Color = Color.hsv(
    randomHue,
    Math.random() * maximumSaturation,
    100
  );

  let secondColour: Color = Color.hsv(randomHue, 100, 100);
  let image = Jimp.read(imagePath)
    .then(image => {
      if (image.hasAlpha) {
        let imageHeight = image.bitmap.height;
        let imageWidth = image.bitmap.width;

        let alphaImage = new Jimp(
          imageWidth,
          imageHeight,
          (err, newimage) => {}
        );
        var hrstart = process.hrtime();
        //TODO only generate the gradient for each unique y position

        image.scan(0, 0, imageWidth, imageHeight, function(x, y, idx) {
          /*         var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2]; */
          var alpha = this.bitmap.data[idx + 3];

          if (alpha >= alphaCutoff) {
            let newColor: Color = makeGradient(
              firstColour,
              secondColour,
              y / imageHeight
            );

            this.bitmap.data[idx + 0] = newColor.red();
            this.bitmap.data[idx + 1] = newColor.green();
            this.bitmap.data[idx + 2] = newColor.blue();
          } else {
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
        //console.info("Execution time: %ds %dms", hrend[0], hrend[1] / 1000000);
        console.log("Got alpha channel and gradient. making outline");
        //    image.write("justinnner.png");
        //   alphaImage.write("1ustoutline.png");
        alphaImage.blur(outlineWidth);
        //  alphaImage.write("2ustoutline.png");
        alphaImage.scan(0, 0, imageWidth, imageHeight, function(x, y, idx) {
          var blue = this.bitmap.data[idx + 2];
          if (blue > 1) {
            this.bitmap.data[idx + 0] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            this.bitmap.data[idx + 3] = 255;
          } else this.bitmap.data[idx + 3] = 0;
        });

        //   alphaImage.write("3ustoutline.png");
        //let outlineImage = alphaImage.scale(1);

        let xPos = (alphaImage.getWidth() - imageWidth) / 2;
        let yPos = (alphaImage.getHeight() - imageHeight) / 2;

        alphaImage.composite(image, xPos, yPos, {
          mode: Jimp.BLEND_MULTIPLY,
          opacitySource: 1,
          opacityDest: 1
        }); // i will need to set my x and y point to something to offset teh scale so it ends up centered.
        // console.log(alphaImage);
        console.log("starting write");
        let name = alphaImage.write(
          outputPath + imagePath.split("\\")[1].split(".")[0] + "-gradient.png",
          writeFinishedCallback
        );
      } else {
        console.log("image has no alpha channel");
      }
    })
    .catch(err => {
      console.log("couldn't load image");
    });
}

function writeFinishedCallback(err: Error | null) {
  if (err) console.error("write error: ", err);
  console.log("finsihed");
}

/**
 * @param colour1
 * @param colour2
 * @param colorRatio the ratio of the second color to the first, you can think of this as traversing along the gradient;
 */
function makeGradient(colour1: Color, colour2: Color, colorRatio: number) {
  return colour1.mix(colour2, colorRatio); //TODO, this mix function is very slow, maybe make a faster one, perhapse using lerp and hsl colour. jsut lerping the values
  //return FastColourMix(colour1, colour2, colorRatio);
}
function FastColourMix(colour1: Color, colour2: Color, colorRatio: number) {
  return Color.hsv(
    lerp(colour1.hue(), colour2.hue(), colorRatio),
    lerp(colour1.saturationv(), colour2.saturationv(), colorRatio),
    lerp(colour1.value(), colour2.value(), colorRatio)
  );
}
function lerp(a: number, b: number, n: number) {
  return (1 - n) * a + n * b;
}
