import { BasicProcessor } from './BasicProcessor';

export class BufferTimes extends BasicProcessor {
  buffer: Array<any> = [];
  async process(elem: any, source: any): Promise<any> {
    if (!elem) {
      return null;
    }
    const times = this.oneConfig.times;
    this.buffer.push(elem);
    if (this.buffer.length >= times) {
      return this.buffer.splice(0, this.buffer.length);
    } else {
      return null;
    }
  }
}
