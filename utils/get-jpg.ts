import fs from "fs";
import path from "path";

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getJPG = async (): Promise<string> => {
  const jpgs = await fs.promises.readdir(`${process.cwd()}/memes`);
  if(jpgs.length === 0) throw new Error("You don't have memes")
  return path.join(
    process.cwd(),
    "memes",
    jpgs[getRandomNumber(0, jpgs.length - 1)]
  );
};
