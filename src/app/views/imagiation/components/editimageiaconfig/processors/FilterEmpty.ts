import { BasicProcessor } from './BasicProcessor';

export class FilterEmpty extends BasicProcessor {
  async process(elem: any, source: any): Promise<any> {
    if (elem.length == 0) {
      return null;
    }
    return elem;
  }
}
