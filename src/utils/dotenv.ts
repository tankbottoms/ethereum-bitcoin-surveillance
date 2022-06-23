import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as find from 'find-up';

import { VERBOSE } from '../config';

export class Dotenv {
  private static template = 'env.template';
  private static instance: Dotenv;
  public envPath: string | undefined;
  appPath: string | undefined;
  public env: any | undefined;

  private constructor() {
    this.envPath = find.sync(['.env.dev', '.env']);
    this.appPath = this.envPath?.toString().substr(0, this.envPath?.toString().indexOf('.env'));
    dotenv.config({ path: this.envPath });
    this.env = process.env;
  }

  public static getInstance(): Dotenv {
    if (!Dotenv.instance) {
      Dotenv.instance = new Dotenv();
    }
    return Dotenv.instance;
  }

  public static generateTemplateAndSave(): void {
    const uniquevarnames = new Set();
    fs.readFile(`${Dotenv.instance.envPath}`, 'utf8', (error, data) => {
      if (error) {
        console.error(`${error}`);
        return;
      }
      const regEx = /(\w+)=/gi;
      // @ts-ignore
      const variables = [...data.toString().matchAll(regEx)];
      variables.forEach(variable => {
        uniquevarnames.add(variable.toString().substr(0, variable.toString().indexOf('=')));
      });

      // removed .sort() so groupings are preserved
      const formattedVariables = Array.from(uniquevarnames).join('\n');

      fs.writeFileSync(`${Dotenv.instance.appPath}${Dotenv.template}`, formattedVariables, 'utf8');
      console.info(`saved:${Dotenv.instance.appPath}${Dotenv.template}`);
      process.stdout.write(`\n`);
      VERBOSE && console.log(`${formattedVariables}`);
    });
  }

  public static print(): void {
    console.info(`dot env:` + JSON.stringify(Dotenv.getInstance().envPath));
    console.info(`env template: ${Dotenv.instance.appPath}${Dotenv.template}`);
  }
}

async () => {
  Dotenv.getInstance();
  Dotenv.generateTemplateAndSave();
  Dotenv.print();
};
