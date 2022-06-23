import { binToHex, instantiateSha256, utf8ToBin } from '@bitauth/libauth';

export type Dynamic = { [k: string]: any };
export type dynamic = Dynamic;

export const sha256 = async (message: string) => {
  const temp = await instantiateSha256();
  return binToHex(temp.hash(utf8ToBin(message)));
};

export const noop = async (options: any) => {
  typeof options === 'number' ? await sleep(options) : null;
};

export const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const bytes = (s: string) => {
  return ~-encodeURI(s).split(/%..|./).length;
};

export const jsonSize = (s: string | undefined) => {
  if (!s || s === undefined) return 0;
  return bytes(JSON.stringify(s));
};

export const sizeInBytes = (s: string) => {
  return bytes(s);
};

export const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

export const random = getRandomInt;

export const deepCopy = (obj: any) => {
  let copy: any;
  if (null === obj || 'object' !== typeof obj) return obj;
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }
  if (obj instanceof Array) {
    copy = [];
    for (let i = 0, len = obj.length; i < len; i++) {
      copy[i] = deepCopy(obj[i]);
    }
    return copy;
  }
  if (obj instanceof Object) {
    copy = {};
    for (const attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
    }
    return copy;
  }
  throw new Error('Unable to copy object.');
};

// eslint-disable-next-line no-void
export const order = (default_order: any) => {
  return Object.keys(default_order)
    .sort()
    .reduce((obj, key) => {
      // @ts-ignore
      obj[key] = default_order[key];
      return obj;
    }, {});
};

export const type = (object: Object) => {
  return Object.prototype.toString
    .apply(object)
    .replace(/\[object (.+)\]/i, '$1')
    .toLowerCase();
};

export const currentFunction = () => {
  const e = new Error('dummy');
  if (e.stack !== undefined) {
    const stack = e?.stack
      .split('\n')[2]
      // " at functionName ( ..." => "functionName"
      .replace(/^\s+at\s+(.+?)\s.+/g, '$1');
    return stack;
  }
  return undefined;
};

export const errorFn = (e: any) => {
  if (e.stack !== undefined) {
    const stack = e?.stack
      .split('\n')[2]
      // " at functionName ( ..." => "functionName"
      .replace(/^\s+at\s+(.+?)\s.+/g, '$1');
    console.error(e.message, stack);
  }
};
