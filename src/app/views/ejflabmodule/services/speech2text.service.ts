import { EventEmitter, Injectable } from "@angular/core";
import { FlowchartProcessRequestData, FlowchartService, HttpService, ModalService } from "ejflab-front-lib";
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MicVAD } from "@ricky0123/vad-web";

export interface WordData {
    word: string;
    start: number;
    end: number;
    probability: number;
}

export interface SegmentData {
    text: string;
    start: number;
    end: number;
    words: Array<WordData>;
}

export interface AudioData {
    id: number;
    buffer: ArrayBuffer;
    base64: string;
    duration: number;
    start: number;
    end: number;
    extension: string;
    transcript: {
        transcription: string;
        segments: Array<SegmentData>;
    },
    transcriptProgress: {
        ratio: number;
        processTime: number;
    },
}

export interface DiarizationData {
    "document_id": string;
    "start_time": number;
    "end_time": number;
    "speaker": string;
    "text": string;
    "distance": number;
    "distance_from": string;
}

@Injectable({
    providedIn: 'root'
})
export class Speech2TextService {
    myvad: MicVAD | null = null;
    listening: boolean = false;
    startTime: number = 0;
    states: {
        listening: number,
        speech2text: number,
    } = {
            listening: 0,
            speech2text: 0,
        };
    language: string = 'es';
    onSpeechStart: EventEmitter<void> = new EventEmitter();
    onSpeechEnd: EventEmitter<AudioData> = new EventEmitter();
    speechToTextEvents: EventEmitter<string> = new EventEmitter();

    constructor(
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
    ) {

    }

    isListening() {
        return this.listening;
    }

    getListeningState() {
        return this.states.listening;
    }

    async turnOff() {
        if (this.myvad) {
            this.myvad.destroy();
        }
    }

    async turnOn() {
        this.myvad = await MicVAD.new({
            baseAssetPath: this.getRoot() + "assets/processors/",
            onnxWASMBasePath: this.getRoot() + "assets/processors/onnxruntime-web/",
            onSpeechStart: () => {
                this.states.listening = 1;
                //console.log("Speech start...");
                this.startTime = new Date().getTime();
                this.onSpeechStart.emit();
            },
            onSpeechEnd: (samples) => {
                this.states.listening = 0;
                const sampleRate = 16000;
                const time = samples.length / sampleRate;
                const wavBuffer = this.encodeWAV(samples);
                const base64 = this.arrayBufferToBase64(wavBuffer);
                const url = `data:audio/wav;base64,${base64}`;
                const audio: AudioData = {
                    id: new Date().getTime(),
                    buffer: wavBuffer,
                    base64: url,
                    duration: time,
                    transcriptProgress: {
                        ratio: 0,
                        processTime: 0,
                    },
                    start: this.startTime,
                    end: new Date().getTime(),
                    extension: 'wav',
                    transcript: {
                        transcription: '',
                        segments: [],
                    },
                };
                this.onSpeechEnd.emit(audio);
                this.speechToText(audio);
            },
        });
    }

    writeString(view: DataView, offset: number, string: string) {
        for (var i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    writeFloat32(output: DataView, offset: number, input: Float32Array) {
        for (var i = 0; i < input.length; i++, offset += 4) {
            output.setFloat32(offset, input[i] as number, true)
        }
    }

    floatTo16BitPCM(
        output: DataView,
        offset: number,
        input: Float32Array
    ) {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, input[i] as number))
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        }
    }

    encodeWAV(
        samples: Float32Array,
        format: number = 3,
        sampleRate: number = 16000,
        numChannels: number = 1,
        bitDepth: number = 32
    ) {
        var bytesPerSample = bitDepth / 8
        var blockAlign = numChannels * bytesPerSample
        var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
        var view = new DataView(buffer)
        /* RIFF identifier */
        this.writeString(view, 0, "RIFF")
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * bytesPerSample, true)
        /* RIFF type */
        this.writeString(view, 8, "WAVE")
        /* format chunk identifier */
        this.writeString(view, 12, "fmt ")
        /* format chunk length */
        view.setUint32(16, 16, true)
        /* sample format (raw) */
        view.setUint16(20, format, true)
        /* channel count */
        view.setUint16(22, numChannels, true)
        /* sample rate */
        view.setUint32(24, sampleRate, true)
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true)
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true)
        /* bits per sample */
        view.setUint16(34, bitDepth, true)
        /* data chunk identifier */
        this.writeString(view, 36, "data")
        /* data chunk length */
        view.setUint32(40, samples.length * bytesPerSample, true)
        if (format === 1) {
            // Raw PCM
            this.floatTo16BitPCM(view, 44, samples)
        } else {
            this.writeFloat32(view, 44, samples)
        }
        return buffer
    }

    async audioFileToArray(audioFileData: Blob) {
        const ctx = new OfflineAudioContext(1, 1, 44100)
        const reader = new FileReader()
        let audioBuffer: AudioBuffer | null = null
        await new Promise<void>((res) => {
            reader.addEventListener("loadend", (ev) => {
                const audioData = reader.result as ArrayBuffer
                ctx.decodeAudioData(
                    audioData,
                    (buffer) => {
                        audioBuffer = buffer
                        ctx
                            .startRendering()
                            .then((renderedBuffer) => {
                                console.log("Rendering completed successfully")
                                res()
                            })
                            .catch((err) => {
                                console.error(`Rendering failed: ${err}`)
                            })
                    },
                    (e) => {
                        console.log(`Error with decoding audio data: ${e}`)
                    }
                )
            })
            reader.readAsArrayBuffer(audioFileData)
        })
        if (audioBuffer === null) {
            throw Error("some shit")
        }
        let _audioBuffer = audioBuffer as AudioBuffer
        let out = new Float32Array(_audioBuffer.length)
        for (let i = 0; i < _audioBuffer.length; i++) {
            for (let j = 0; j < _audioBuffer.numberOfChannels; j++) {
                // @ts-ignore
                out[i] += _audioBuffer.getChannelData(j)[i]
            }
        }
        return { audio: out, sampleRate: _audioBuffer.sampleRate }
    }

    arrayBufferToBase64(buffer: ArrayBuffer) {
        const bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        const binary = new Array(len)
        for (var i = 0; i < len; i++) {
            const byte = bytes[i]
            if (byte === undefined) {
                break
            }
            binary[i] = String.fromCharCode(byte)
        }
        return btoa(binary.join(""))
    }

    getRoot(): string {
        return MyConstants.SRV_ROOT;
    }

    start() {
        if (this.myvad) {
            this.myvad.start();
            this.listening = true;
        }
    }

    pause() {
        if (this.myvad) {
            this.myvad.pause();
            this.listening = false;
            this.states.listening = 0;
        }
    }

    async speechToText(audio: AudioData) {
        this.states.speech2text += 1;
        try {
            audio.transcriptProgress.processTime = 0;
            this.speechToTextEvents.emit("start");
            const startTime = new Date().getTime();
            const payload: FlowchartProcessRequestData = {
                loadingIndicator: false,
                channel: 'post',
                processorMethod: 'speechToText1.transcript',
                room: 'processors',
                namedInputs: {
                    bytes: new Uint8Array(audio.buffer),
                    timeline: {
                        t: 0,
                        end: audio.duration,
                        period: audio.duration,
                    }
                },
                data: {
                    language: this.language,
                    extension: audio.extension,
                    min_duration_ms: audio.duration,
                },
            };
            const response = await this.flowchartSrv.process(payload, false);
            if (response.status == 'ok' && response?.response?.data?.transcript) {
                audio.transcript = response?.response?.data?.transcript;
                audio.transcriptProgress.processTime = (new Date().getTime() - startTime) / 1000;
                audio.transcriptProgress.ratio = 100 * (audio.transcriptProgress.processTime / audio.duration);
                this.speechToTextEvents.emit("success");
            } else {
                this.speechToTextEvents.emit("error");
                this.modalSrv.alert({
                    title: 'Error',
                    txt: JSON.stringify(response, null, 4),
                });
            }
        } catch (err) {
            this.states.speech2text -= 1;
            this.speechToTextEvents.emit("error");
        }
    }
}