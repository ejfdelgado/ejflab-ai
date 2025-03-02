import { EventEmitter, Injectable } from "@angular/core";
import { FlowchartProcessRequestData, FlowchartService, ModalService } from "ejflab-front-lib";
import { RacConfigData } from "./knowledge.service";

export interface HeartBeatData {
    text: string;
    audio?: any;
};

export interface Text2SpeechEventData {
    name: "starts" | "ends" | "endsAll";
}

@Injectable({
    providedIn: 'root'
})
export class Text2SpeechService {
    public audioEvents: EventEmitter<Text2SpeechEventData> = new EventEmitter();
    private heartBeat: EventEmitter<any> = new EventEmitter();
    step1Buffer: HeartBeatData[] = [];
    step2Buffer: HeartBeatData[] = [];
    step1: HeartBeatData | null = null;
    step2: HeartBeatData | null = null;
    config: RacConfigData | null = null;

    constructor(
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
    ) {
        this.heartBeat.subscribe(() => {
            if (this.step1Buffer.length > 0 && this.step1 == null) {
                this.step1 = this.step1Buffer.splice(0, 1)[0];
                this.callService(this.step1);
            }
            if (this.step2Buffer.length > 0) {
                if (this.step2 == null) {
                    this.step2 = this.step2Buffer.splice(0, 1)[0];
                    this.playSound(this.step2);
                }
            }

            if (this.step1Buffer.length == 0 && this.step2Buffer.length == 0 && this.step1 == null && this.step2 == null) {
                this.audioEvents.emit({ name: "endsAll" });
            }
        });
    }

    async playSound(data: HeartBeatData) {
        const audio = data.audio;
        audio.addEventListener('ended', () => {
            this.step2 = null;
            this.heartBeat.emit();
            this.audioEvents.emit({ name: "ends" });
        });
        this.audioEvents.emit({ name: "starts" });
        audio.play();
    }

    async callService(data: HeartBeatData) {
        const payload: FlowchartProcessRequestData = {
            loadingIndicator: false,
            channel: 'post',
            processorMethod: 'textToSpeech.convert',
            room: 'processors',
            namedInputs: {
                text: data.text,
            },
            data: {
                language: this.config ? this.config.language : 'es',
            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        const base64Audio = response?.response?.data?.audio;
        if (base64Audio) {
            const audio = new Audio(base64Audio);
            data.audio = audio;
            this.step2Buffer.push(data);
            this.step1 = null;
            this.heartBeat.emit();
        }
    }

    async convert(text: string, config: RacConfigData) {
        this.config = config;
        const ident: HeartBeatData = {
            // Remove all non characters or numbers
            text: text.replace(/[^a-záéíóúÁÉÍÓÚüÜñÑA-Z0-9,.:\?\!\s]/g, " "),
        };
        this.step1Buffer.push(ident);
        this.heartBeat.emit();
    }
}