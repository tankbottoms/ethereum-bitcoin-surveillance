import { logger } from '.';
import fs from 'fs';
const { writeFile, readFile } = fs.promises;

export const read_text_file = async (filename: string) => {
  try {
    return (await readFile(filename)).toString();
  } catch (err) {
    logger.warn(`failed to read ${filename}`);
  }
};

export const write_object_to_file = async (filename: string, object: {}) => {
  try {
    const s = JSON.stringify(object, null, 2);
    await writeFile(filename, s);
  } catch (err) {
    logger.error(err);
  }
};
