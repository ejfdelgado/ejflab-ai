import { EventEmitter, Injectable } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { FlowchartProcessRequestData, FlowchartService, IndicatorService, ModalService } from "ejflab-front-lib";
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { KnowledgeService, QADataType } from "./knowledge.service";
import { RacConfigData } from "../components/popup-rac-config/popup-rac-config.component";
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';

export interface ChatGPT4AllSessionData {
    role: string;
    content: string;
}

export interface AnswerData {
    query: SafeHtml;
    answer: any;
    knowledge: QADataType[]
}

export interface LLMEventData {
    name: "chatSetup" | "chatStart" | "chatChunk" | "chatEnds";
    chat: AnswerData;
}

@Injectable({
    providedIn: 'root'
})
export class LLMService {
    public LLMEvents: EventEmitter<LLMEventData> = new EventEmitter();
    renderer = new MyTemplate();

    constructor(
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
        private indicatorSrv: IndicatorService,
        private knowledgeSrv: KnowledgeService,
    ) {

    }

    getRoot(): string {
        return MyConstants.SRV_ROOT;
    }

    async chat(text: string, gpt4allSession: Array<ChatGPT4AllSessionData>, maxTokens: number, systemPrompt: string, config: RacConfigData | null = null) {
        if (text.trim().length == 0) {
            return;
        }
        const activity = this.indicatorSrv.start();
        let modifiedText = text;
        if (config) {
            // First fetch knowledge
            const knowledge = await this.knowledgeSrv.search(text, config.k, config.maxDistance);
            if (knowledge && knowledge.length > 0) {
                // Then build prompt
                const allKnowledge = knowledge.map((data) => {
                    if (data.text_answer) {
                        return data.text_answer;
                    } else {
                        return data.text_indexed
                    }
                }).join('" y "');
                modifiedText = this.renderer.render(config.queryPrompt, {
                    text: text,
                    knowledge: allKnowledge,
                });
            }
        }
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'llm.chat',
            room: 'processors',
            namedInputs: {
                session: gpt4allSession,
                message: modifiedText,
            },
            data: {
                maxTokens: maxTokens,
                systemMessage: systemPrompt,
                chatTemplate: "### Human:\n{0}\n\n### Assistant:\n",
                streaming: true,
            },
        };
        const currentAnswer: AnswerData = {
            query: text,
            answer: "",
            knowledge: []
        };

        this.LLMEvents.emit({
            name: "chatSetup",
            chat: currentAnswer,
        });

        const urlServer = this.getRoot() + "srv/flowchart/processor_process_json";
        fetch(urlServer, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set headers if necessary
            },
            body: JSON.stringify(payload), // Send data in the request body
        })
            .then((response: any) => {
                activity.done();
                this.LLMEvents.emit({
                    name: "chatStart",
                    chat: currentAnswer,
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                const readChunk = () => {
                    return reader.read().then((temporal: any) => {
                        const { done, value } = temporal;
                        if (done) {
                            gpt4allSession.push({
                                role: "user",
                                content: text,
                            });
                            gpt4allSession.push({
                                role: "assistant",
                                content: currentAnswer.answer,
                            });
                            this.LLMEvents.emit({
                                name: "chatEnds",
                                chat: currentAnswer,
                            });
                            return;
                        } else {
                            const chunk = decoder.decode(value, { stream: true });
                            currentAnswer.answer += chunk;
                            this.LLMEvents.emit({
                                name: "chatChunk",
                                chat: currentAnswer,
                            });
                            return readChunk();
                        }
                    });
                }
                return readChunk();
            })
            .catch(error => {
                this.modalSrv.error(error);
                activity.done();
            });
    }
}