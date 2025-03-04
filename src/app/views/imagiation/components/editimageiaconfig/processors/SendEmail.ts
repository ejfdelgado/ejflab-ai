import { MailSendData } from 'ejflab-front-lib';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { BasicProcessor } from './BasicProcessor';

export class SendEmail extends BasicProcessor {
  async process(elem: any, source: any): Promise<any> {
    // Send email
    const subject = this.oneConfig.subject;
    const to = this.oneConfig.to;
    const temp = {
      veces: elem,
    };
    const body: MailSendData = {
      params: {
        data: temp,
      },
      subject: subject,
      template: '/assets/templates/mails/test.html',
      to: to,
    };
    try {
      await this.mailSrv.send(body);
    } catch (err) {}
    return elem;
  }
}
