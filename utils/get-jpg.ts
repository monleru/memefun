import fs from "fs";
import path from "path";
import Jimp from 'jimp'

function randomInteger(min = 1, max = 2) {
  let rand = Math.floor(min + Math.random() * (max + 1 - min))
  return rand
}

async function addNoiseToImage(path) {
  try {
    const image = await Jimp.read(path);

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const random = Math.random() * 0.001; 
      this.bitmap.data[idx] += random * 255; 
      this.bitmap.data[idx + 1] += random * 255;
      this.bitmap.data[idx + 2] += random * 255; 
    });

    image.resize(image.getWidth() +  randomInteger(), image.getHeight()  + randomInteger())

    await image.writeAsync(path);
  } catch (error) {
    console.error('Error:', error);
  }
}

addNoiseToImage('./memes/Screenshot 2024-05-17 at 11.02.36 AM.png')

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getJPG = async (): Promise<string> => {
  const jpgs = await fs.promises.readdir(`${process.cwd()}/memes`);
  if(jpgs.length === 0) throw new Error("You don't have memes")
    const path_ = path.join(
      process.cwd(),
      "memes",
      jpgs[getRandomNumber(0, jpgs.length - 1)]
    );
    console.log(path_)
    await addNoiseToImage(path_)
  return path_
};
