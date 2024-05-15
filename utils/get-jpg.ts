import fs from "fs";
import path from "path";
import Jimp from 'jimp'

async function addNoiseToImage(path) {
  try {
    const image = await Jimp.read(path);

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const random = Math.random() * 0.003; 
      this.bitmap.data[idx] += random * 255; 
      this.bitmap.data[idx + 1] += random * 255;
      this.bitmap.data[idx + 2] += random * 255; 
    });

    if (image.getWidth() < 250) {
      image.resize(250, image.getHeight())
    }
    if (image.getHeight() < 250) {
      image.resize(image.getWidth(), 250)
    }
    await image.writeAsync(path);
  } catch (error) {
    console.error('Error:', error);
  }
}

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
