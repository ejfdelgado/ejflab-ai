import { FileService } from 'ejflab-front-lib';
import {
  ImageiationService,
  TheTagData,
  PlayDetectionData,
} from 'ejflab-front-lib';
import { MailService } from 'ejflab-front-lib';

export interface ProcessorData {
  configId: string;
  oneConfig: any;
  tags: TheTagData;
  mailSrv: MailService;
  fileService: FileService;
  imagiationSrv: ImageiationService;
  commonMemory: any;
  configAll: PlayDetectionData;
}

export abstract class BasicProcessor {
  oneConfig: any;
  tags: TheTagData;
  tagMap: { [key: string]: string } = {};
  configId: string;
  mailSrv: MailService;
  fileService: FileService;
  imagiationSrv: ImageiationService;
  commonMemory: any;
  configAll: PlayDetectionData;
  constructor(args: ProcessorData) {
    this.configId = args.configId;
    this.oneConfig = args.oneConfig;
    this.tags = args.tags;
    this.computeTagMaps();
    this.mailSrv = args.mailSrv;
    this.fileService = args.fileService;
    this.commonMemory = args.commonMemory;
    this.imagiationSrv = args.imagiationSrv;
    this.configAll = args.configAll;
  }
  computeTagMaps() {
    this.tagMap = {};
    const llaves = Object.keys(this.tags);
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      const valor = this.tags[llave];
      if (typeof valor.ref == 'string' && valor.ref.trim().length >= 0) {
        this.tagMap[`${valor.ref}`] = valor.txt;
      } else {
        this.tagMap[llave] = valor.txt;
      }
    }
  }
  convertLabelArrayIntoTagArray(labelArray: Array<string>): Array<number> {
    const llaves = Object.keys(this.tags);
    const response: any = [];
    // Primero valido los ref
    for (let i = 0; i < llaves.length; i++) {
      const tagItem = llaves[i];
      const tagLabel: any = this.tags[tagItem];
      if (typeof tagLabel.ref == 'string' && tagLabel.ref.trim().length > 0) {
        const tagItemNumberRef = parseInt(tagLabel.ref);
        const indice = labelArray.indexOf(tagLabel.txt);
        if (indice >= 0 && response.indexOf(tagItemNumberRef) < 0) {
          response.push(tagItemNumberRef);
          labelArray.splice(indice, 1);
        }
      }
    }
    // Luego valido los normales
    for (let i = 0; i < llaves.length; i++) {
      const tagItem = llaves[i];
      const tagItemNumber = parseInt(tagItem);
      const tagLabel = this.tags[tagItem];
      if (
        labelArray.indexOf(tagLabel.txt) >= 0 &&
        response.indexOf(tagItemNumber) < 0
      ) {
        response.push(tagItemNumber);
      }
    }
    return response;
  }
  abstract process(input: any, source: any): Promise<any>;
}
