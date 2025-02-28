import { Injectable } from "@angular/core";
import { FlowchartProcessRequestData, FlowchartService, ModalService } from "ejflab-front-lib";


@Injectable({
    providedIn: 'root'
})
export class Text2SpeechService {
    constructor(
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
    ) {

    }

    async convert(text: string) {
        const payload: FlowchartProcessRequestData = {
            loadingIndicator: false,
            channel: 'post',
            processorMethod: 'textToSpeech.convert',
            room: 'processors',
            namedInputs: {
                text,
            },
            data: {
            },
        };
        const response = await this.flowchartSrv.process(payload, false);
    }
}