/* eslint-disable @typescript-eslint/prefer-for-of */
import { logger } from '.';

export const stringOccuranceCount = (array_elements: string[]) => {
  if (!array_elements.length) return;
  array_elements.sort();
  let current;
  let cnt = 0;
  for (let i = 0; i < array_elements.length; i++) {
    if (array_elements[i] !== current) {
      if (cnt > 0) logger.info(current + ' found ' + cnt + ' times.');
      current = array_elements[i];
      cnt = 1;
    } else cnt++;
  }
  if (cnt > 0) logger.info(current + ' found ' + cnt + ' times.');
};

export const titleCase = (name: string) => {
  return name.slice(0, 1).toUpperCase() + name.slice(1, name.length).toLowerCase();
};

export const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');

export const numberWithCommas = (x: number | string) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
