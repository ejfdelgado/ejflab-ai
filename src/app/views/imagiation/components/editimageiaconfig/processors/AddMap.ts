import { BasicProcessor } from './BasicProcessor';

export class AddMap extends BasicProcessor {
  async process(elem: any, source: any): Promise<any> {
    return { list: elem };
  }
}
