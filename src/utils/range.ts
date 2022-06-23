export const getRange = (start: number, size: number): number[] => {
  return [...Array(size).keys()].map(i => start + i);
};
