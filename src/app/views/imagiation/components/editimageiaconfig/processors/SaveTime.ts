import { BasicProcessor } from './BasicProcessor';

export class SaveTime extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    this.commonMemory.lastTime = new Date().getTime();
    return m;
  }
}
