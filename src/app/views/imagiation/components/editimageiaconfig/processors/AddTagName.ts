import { BasicProcessor } from './BasicProcessor';

export class AddTagName extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    m.forEach((elem: any) => {
      elem.name = this.tagMap[elem.tag];
    });
    return m;
  }
}
