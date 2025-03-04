import { BasicProcessor, ProcessorData } from './BasicProcessor';
import { FilterTag } from './FilterTag';
import { AddTagName } from './AddTagName';
import { FilterEmpty } from './FilterEmpty';
import { FilterScore } from './FilterScore';
import { AddTime } from './AddTime';
import { Show } from './Show';
import { PlaySound } from './PlaySound';
import { AddMap } from './AddMap';
import { BufferTimes } from './BufferTimes';
import { SendEmail } from './SendEmail';
import { SavePublicImage } from './SavePublicImage';
import { SaveTime } from './SaveTime';
import { IgnorePeriod } from './IgnorePeriod';
import { Breakit } from './Breakit';
import { PaintTagsOnCanvas } from './PaintTagsOnCanvas';
import {
  ImageiationService,
  TheTagData,
  PlayDetectionData,
} from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { MailService } from 'ejflab-front-lib';
import { ImageSimpleDetData } from 'ejflab-front-lib';
import { StoreStatistic } from './StoreStatistic';
import { AddLatLon } from './AddLatLon';

export class ConfigInterpretter {
  processors: Array<BasicProcessor> = [];
  subscription: any;
  tags: TheTagData;
  source: any;
  constructor(
    private mailSrv: MailService,
    private fileService: FileService,
    private imagiationSrv: ImageiationService,
    private configAll: PlayDetectionData
  ) {
    this.mailSrv = mailSrv;
    this.fileService = fileService;
  }

  build(configId: string, config: Array<any>, tags: TheTagData) {
    this.tags = tags;
    const commonMemory = {};

    config.forEach((oneConfig) => {
      const params: ProcessorData = {
        configId,
        oneConfig,
        tags: this.tags,
        mailSrv: this.mailSrv,
        fileService: this.fileService,
        commonMemory: commonMemory,
        imagiationSrv: this.imagiationSrv,
        configAll: this.configAll,
      };
      if (oneConfig.type == 'filterTag') {
        this.processors.push(new FilterTag(params));
      } else if (oneConfig.type == 'addTagName') {
        this.processors.push(new AddTagName(params));
      } else if (oneConfig.type == 'filterEmpty') {
        this.processors.push(new FilterEmpty(params));
      } else if (oneConfig.type == 'filterScore') {
        this.processors.push(new FilterScore(params));
      } else if (oneConfig.type == 'addTime') {
        this.processors.push(new AddTime(params));
      } else if (oneConfig.type == 'bufferTimes') {
        this.processors.push(new BufferTimes(params));
      } else if (oneConfig.type == 'sendEmail') {
        this.processors.push(new SendEmail(params));
      } else if (oneConfig.type == 'savePublicImage') {
        this.processors.push(new SavePublicImage(params));
      } else if (oneConfig.type == 'show') {
        this.processors.push(new Show(params));
      } else if (oneConfig.type == 'addMap') {
        this.processors.push(new AddMap(params));
      } else if (oneConfig.type == 'playSound') {
        this.processors.push(new PlaySound(params));
      } else if (oneConfig.type == 'saveTime') {
        this.processors.push(new SaveTime(params));
      } else if (oneConfig.type == 'ignorePeriod') {
        this.processors.push(new IgnorePeriod(params));
      } else if (oneConfig.type == 'breakit') {
        this.processors.push(new Breakit(params));
      } else if (oneConfig.type == 'paintTagsOnCanvas') {
        this.processors.push(new PaintTagsOnCanvas(params));
      } else if (oneConfig.type == 'storeStatistic') {
        this.processors.push(new StoreStatistic(params));
      } else if (oneConfig.type == 'addLatLon') {
        this.processors.push(new AddLatLon(params));
      }
    });
  }

  async test(
    detections: Array<ImageSimpleDetData>,
    source: any,
    tags: TheTagData
  ) {
    this.source = source;
    this.tags = tags;
    // Se debe interar todos los processors
    let actualResponse = detections;
    for (let i = 0; i < this.processors.length; i++) {
      const processor: BasicProcessor = this.processors[i];
      actualResponse = await processor.process(actualResponse, source);
      if (actualResponse == null) {
        break;
      }
    }
  }
}
