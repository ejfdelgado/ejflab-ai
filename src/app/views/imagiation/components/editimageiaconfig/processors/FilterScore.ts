import { BasicProcessor } from './BasicProcessor';

export class FilterScore extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    // Filter
    const scoreValue = this.oneConfig.value;
    return m.filter((elem: any) => {
      return elem.score >= scoreValue;
    });
  }
}
