import { BasicProcessor } from './BasicProcessor';

export class FilterTag extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    // Filter
    const values = this.oneConfig.values;
    if (values.length == 0) {
      // No filter
      return m;
    }
    const filteredNumbers = this.convertLabelArrayIntoTagArray(values);
    return m.filter((elem: any) => {
      return filteredNumbers.indexOf(elem.tag) >= 0;
    });
  }
}
