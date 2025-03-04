import { BasicProcessor } from './BasicProcessor';

export class IgnorePeriod extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    if (!this.commonMemory.lastTime) {
      return m;
    }
    const actual = new Date().getTime();
    if (actual - this.commonMemory.lastTime > 1000 * this.oneConfig.seconds) {
      return m;
    }
    return null;
  }
}
