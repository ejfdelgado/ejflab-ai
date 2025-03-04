import { BasicProcessor } from './BasicProcessor';
import { MyColor } from '@ejfdelgado/ejflab-common/src/MyColor';

export class PaintTagsOnCanvas extends BasicProcessor {
  getColorFromClass(tabClass: number): string {
    return MyColor.int2colorhex(tabClass);
  }
  async process(m: any, source: any): Promise<any> {
    const tags = m.list;
    const canvasW = source.width;
    const canvasH = source.height;
    const ctx = source.getContext('2d');
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const color = this.getColorFromClass(tag.tag);
      const { minX, minY, width, height } = tag;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = '1';
      ctx.rect(
        minX * canvasW,
        minY * canvasH,
        width * canvasW,
        height * canvasH
      );
      ctx.stroke();
    }
    return m;
  }
}
