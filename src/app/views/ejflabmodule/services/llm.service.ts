import { EventEmitter, Injectable } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { FlowchartProcessRequestData, FlowchartService, IndicatorService, ModalService } from "ejflab-front-lib";
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { KnowledgeService, QADataType, RacConfigData } from "./knowledge.service";
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

    truncateSession(gpt4allSession: Array<ChatGPT4AllSessionData>): Array<ChatGPT4AllSessionData> {
        const MAX_TOKENS = 8192;
        const MAX_TOKENS_FOR_INPUT_PROPORTION = 0.8;
        const MAX_TOKENS_FINAL = MAX_TOKENS * MAX_TOKENS_FOR_INPUT_PROPORTION;
        // 1 token ≈ 4 characters (for English text).
        // 1 token ≈ 3–4 characters (for Spanish).
        const TOKEN_TO_WORD_PROPORTION = 4;
        const MAX_INPUT_CHARACTERS = MAX_TOKENS_FINAL * TOKEN_TO_WORD_PROPORTION;
        const list = [];
        list.push(...gpt4allSession);
        let characterCount = 0;
        let startTruncate = false;
        list.reverse().filter((element) => {
            if (startTruncate) {
                return false;
            }
            const actualLength = element.content.length + element.role.length;
            if (characterCount + actualLength > MAX_INPUT_CHARACTERS) {
                startTruncate = true;
                return false;
            }
            characterCount += actualLength;
            return true;
        });
        return list.reverse();
    }

    async chat(text: string, gpt4allSession: Array<ChatGPT4AllSessionData>, config: RacConfigData) {
        if (text.trim().length == 0) {
            return;
        }
        const activity = this.indicatorSrv.start();
        let modifiedText = text;
        let knowledge: QADataType[] = [];
        if (config.useRAC) {
            // First fetch knowledge
            const knowledgeTemp = await this.knowledgeSrv.search(text, config);
            if (knowledgeTemp && knowledgeTemp.length > 0) {
                knowledge = knowledgeTemp;
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
                session: this.truncateSession(gpt4allSession),
                message: modifiedText,
            },
            data: {
                maxTokens: config.maxTokens,
                systemMessage: config.systemPrompt,
                chatTemplate: "### Human:\n{0}\n\n### Assistant:\n",
                streaming: true,
            },
        };
        const currentAnswer: AnswerData = {
            query: text,
            answer: "",
            knowledge: knowledge
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