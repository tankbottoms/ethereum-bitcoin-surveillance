/**
 * @see https://github.com/Microsoft/TypeScript/issues/3841#issuecomment-337560146
 **/

export class SetEx extends Set {
  ['constructor']: typeof SetEx;

  constructor(...iterables: any[]) {
    super();
    this.merge(...iterables);
  }

  public merge(...iterables: any[]) {
    for (const iterable of iterables) {
      for (const item of iterable) this.add(item);
    }
    return this;
  }

  public union(...sets: any[]) {
    const newSet = new this.constructor(...sets);
    newSet.merge(this);
    return newSet;
  }

  public intersect(target: any): any {
    const newSet = new this.constructor();
    for (const item of this) {
      if (target.has(item)) newSet.add(item);
    }
    return newSet;
  }

  public diff(target: any): any {
    const newSet = new this.constructor();
    for (const item of this) {
      if (!target.has(item)) newSet.add(item);
    }
    return newSet;
  }

  public sameItems(target: any): boolean {
    let tsize;
    if ('size' in target) {
      tsize = target.size;
    } else if ('length' in target) {
      tsize = target.length;
    } else {
      throw new TypeError('target must be an iterable like a Set with .size or .length');
    }
    if (tsize !== this.size) return false;
    for (const item of target) {
      if (!this.has(item)) return false;
    }
    return true;
  }
}
