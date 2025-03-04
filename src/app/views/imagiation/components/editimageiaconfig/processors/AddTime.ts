import { BasicProcessor } from './BasicProcessor';

export class AddTime extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    const ahora = new Date().getTime();
    m.t = ahora;
    return m;
  }
}
