import { BasicProcessor } from './BasicProcessor';

export class Show extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    console.log(JSON.stringify(m, null, 4));
    return m;
  }
}
