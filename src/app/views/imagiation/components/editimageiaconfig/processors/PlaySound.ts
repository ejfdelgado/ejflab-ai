import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { BasicProcessor } from './BasicProcessor';

export class PlaySound extends BasicProcessor {
  async process(m: any, source: any): Promise<any> {
    await ModuloSonido.play(this.oneConfig.url);
    return m;
  }
}
