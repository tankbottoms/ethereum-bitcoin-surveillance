export const getTime = () => {
  return Date.now();
};
export const getElapsed = (now: number) => {
  return Date.now() - now;
};

export class Chrono {
  static now: number;

  private static update = () => {
    Chrono.now = new Date().getTime();
  };
  public static start = () => {
    Chrono.update();
    return Chrono.now;
  };

  public static delta = () => {
    return new Date().getTime() - Chrono.now;
  };
}
