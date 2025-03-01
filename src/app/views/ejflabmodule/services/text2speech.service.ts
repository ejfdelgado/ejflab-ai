import { EventEmitter, Injectable } from "@angular/core";
import { FlowchartProcessRequestData, FlowchartService, ModalService } from "ejflab-front-lib";

export interface Text2SpeechEventData {
    name: "starts" | "ends";
}

@Injectable({
    providedIn: 'root'
})
export class Text2SpeechService {
    playingList: any[] = [];
    public audioEvents: EventEmitter<Text2SpeechEventData> = new EventEmitter();

    constructor(
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
    ) {

    }

    isPlaying() {
        return this.playingList.length > 0;
    }

    async convert(text: string) {
        const ident = {};
        this.playingList.push(ident);
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
        const base64Audio = response?.response?.data?.audio;
        if (base64Audio) {
            const audio = new Audio(base64Audio);
            audio.addEventListener('ended', () => {
                const index = this.playingList.indexOf(ident);
                if (index >= 0) {
                    this.playingList.splice(index, 1);
                }
                this.audioEvents.emit({ name: "ends" });
            });
            this.audioEvents.emit({ name: "starts" });
            audio.play();
        }
    }
}