import { ConfigInterpretter } from './ConfigInterpretter';
import { FileService } from 'ejflab-front-lib';
import { MailService } from 'ejflab-front-lib';
import {
  ImageiationService,
  TheTagData,
  PlayDetectionData,
} from 'ejflab-front-lib';
import { ImageSimpleDetData } from 'ejflab-front-lib';

export class InterpretDetections {
  interpreters: Array<ConfigInterpretter> = [];
  constructor(
    private mailSrv: MailService,
    private fileService: FileService,
    private imagiationSrv: ImageiationService
  ) {
    this.mailSrv = mailSrv;
    this.fileService = fileService;
  }

  transform(config: Array<any>) {
    const transformed: Array<Array<any>> = [];
    for (let i = 0; i < config.length; i++) {
      const currentConfig = config[i];
      const nuevo = [];
      if (currentConfig.type == 'notifyByMail') {
        //nuevo.push({ type: 'show' });
        nuevo.push({
          type: 'ignorePeriod',
          seconds: currentConfig.minSecondsBetweenMails,
        });
        nuevo.push({ type: 'filterScore', value: currentConfig.minScore });
        nuevo.push({
          type: 'filterTag',
          values: currentConfig.detectedTags
            .split(/[,;]/)
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0),
        });
        nuevo.push({ type: 'addTagName' });
        nuevo.push({ type: 'filterEmpty' });
        if (currentConfig.useSounds == 'si') {
          nuevo.push({
            type: 'playSound',
            url: '/assets/sounds/detection.mp3',
          });
        }
        nuevo.push({ type: 'addMap' });
        nuevo.push({ type: 'addLatLon' });
        nuevo.push({ type: 'addTime' });
        if (currentConfig.useBBox == 'si') {
          nuevo.push({ type: 'paintTagsOnCanvas' });
        }
        nuevo.push({ type: 'savePublicImage' });
        nuevo.push({ type: 'bufferTimes', times: currentConfig.snapshotTimes });
        //nuevo.push({ type: 'show' });
        nuevo.push({
          type: 'sendEmail',
          subject: currentConfig.subject,
          to: currentConfig.recipients
            .split(/[,;]/)
            .map((id: string) => id.trim()),
        });
        if (currentConfig.useSounds == 'si') {
          nuevo.push({ type: 'playSound', url: '/assets/sounds/mail.mp3' });
        }
        nuevo.push({ type: 'saveTime' });
      } else if (currentConfig.type == 'playSound') {
        nuevo.push({ type: 'filterScore', value: currentConfig.minScore });
        nuevo.push({
          type: 'filterTag',
          values: currentConfig.detectedTags
            .split(/[,;]/)
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0),
        });
        nuevo.push({ type: 'addTagName' });
        nuevo.push({ type: 'filterEmpty' });
        nuevo.push({ type: 'playSound', url: '/assets/sounds/detection.mp3' });
      } else if (currentConfig.type == 'statistic') {
        nuevo.push({
          type: 'ignorePeriod',
          seconds: currentConfig.minSecondsBetweenMails,
        });
        nuevo.push({ type: 'filterScore', value: currentConfig.minScore });
        nuevo.push({
          type: 'filterTag',
          values: currentConfig.detectedTags
            .split(/[,;]/)
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0),
        });
        nuevo.push({ type: 'addTagName' });
        nuevo.push({ type: 'filterEmpty' });
        if (currentConfig.useSounds == 'si') {
          nuevo.push({
            type: 'playSound',
            url: '/assets/sounds/detection.mp3',
          });
        }
        nuevo.push({ type: 'addMap' });
        nuevo.push({ type: 'addLatLon' });
        if (currentConfig.useBBox == 'si') {
          nuevo.push({ type: 'paintTagsOnCanvas' });
        }
        nuevo.push({ type: 'savePublicImage' });
        nuevo.push({ type: 'storeStatistic' });
        nuevo.push({ type: 'saveTime' });
        //nuevo.push({ type: 'show' });
      }
      transformed.push(nuevo);
    }
    return transformed;
  }

  build(
    configId: string,
    configs1: Array<any>,
    tags: TheTagData,
    configAll: PlayDetectionData
  ) {
    // This must be in a loop
    const configs = this.transform(configs1);
    for (let i = 0; i < configs.length; i++) {
      const singleConfig = configs[i];
      const interpreter = new ConfigInterpretter(
        this.mailSrv,
        this.fileService,
        this.imagiationSrv,
        configAll
      );
      interpreter.build(configId, singleConfig, tags);
      this.interpreters.push(interpreter);
    }
  }
  async test(
    detections: Array<ImageSimpleDetData>,
    source: any,
    tags: TheTagData
  ) {
    const promesas = [];
    for (let i = 0; i < this.interpreters.length; i++) {
      promesas.push(this.interpreters[i].test(detections, source, tags));
    }
    await Promise.all(promesas);
  }
}
