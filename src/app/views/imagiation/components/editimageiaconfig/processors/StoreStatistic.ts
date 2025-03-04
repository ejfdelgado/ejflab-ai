import { BasicProcessor } from './BasicProcessor';

export class StoreStatistic extends BasicProcessor {
  async process(m: any): Promise<any> {
    // Call service
    //console.log(JSON.stringify(this.configAll, null, 4));
    //console.log(JSON.stringify(m, null, 4));
    const payload = {
      confId: this.configAll.id,
      data: m,
    };
    if (this.configAll.pg) {
      const statResponse = await this.imagiationSrv.storeStatistic(
        this.configAll.pg,
        payload
      );
      //console.log(JSON.stringify(statResponse, null, 4));
    }
    return m;
  }
}
