import { Injectable } from '@angular/core';
import { FlowchartProcessRequestData, FlowchartService, HttpService, PagingData } from 'ejflab-front-lib';
import { MyCookies } from '@ejfdelgado/ejflab-common/src/MyCookies';
import { Buffer } from 'buffer';

export interface QADataType {
    id: number;
    document_id: string;
    distance?: number;
    score_reranked?: number;
    text_answer: string;
    text_indexed: string;
    created?: number;
    updated?: number;
}

export interface RacConfigData {
    systemPrompt: string;
    queryPrompt: string;
    maxTokens: number;
    maxDistance: number;
    k: number;
    useRAC: boolean;
    showKnowledge: boolean;
    outputAudio: boolean;
    schema?: string;
    table?: string;
}

@Injectable({
    providedIn: 'root'
})
export class KnowledgeService {
    constructor(
        private httpSrv: HttpService,
        public flowchartSrv: FlowchartService,
    ) { }

    async index(text: string, documentId: string) {

        // Split text into... ==, then with => if it exists
        const chunksTokens = text.trim().split(/[\n\r]/g);
        const chunks = chunksTokens
            .map((line: string) => { return line.trim(); })
            .filter((line: string) => {
                // Remove any empty line
                return line.length > 0;
            })
            .map((line: string) => {
                // Check if should be Query Answer or only Knowledge
                const tokens = line.split(/=>/g);
                const response: any = {
                    document_id: documentId,
                    text_answer: '',
                };
                response.text_indexed = tokens[0];
                if (tokens.length > 1) {
                    response.text_answer = tokens[1];
                }
                return response;
            });
        if (chunks.length == 0) {
            return null;
        }
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.index',
            room: 'processors',
            namedInputs: {
                knowledge: chunks,
            },
            data: {

            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        return response;
    }

    async page(paging: PagingData, config: RacConfigData): Promise<QADataType[]> {
        const { schema, table } = config;
        const model: any = Object.assign({
            schema,
            table,
        }, paging);
        const queryString = new URLSearchParams(model).toString();
        return (await this.httpSrv.get(`srv/rac/page?${queryString}`)) as QADataType[];
    }

    async search(query: string, k: number, maxDistance: number): Promise<QADataType[] | null> {
        // Call the processor
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.search',
            room: 'processors',
            namedInputs: {
                query: query,
                kReRank: k,
                max_distance: maxDistance,
            },
            data: {

            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        if (response?.response?.data?.rows instanceof Array) {
            return response?.response?.data?.rows;
        }
        return null;
    }

    async update(currentMatch: QADataType) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.update',
            room: 'processors',
            namedInputs: {
                item: {
                    id: `${currentMatch.id}`,
                    text_answer: currentMatch.text_answer,
                    text_indexed: currentMatch.text_indexed,
                    document_id: currentMatch.document_id,
                },
            },
            data: {

            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        return response;
    }

    async delete(currentMatch: QADataType) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.delete',
            room: 'processors',
            namedInputs: {
                item: {
                    id: `${currentMatch.id}`,
                },
            },
            data: {

            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        if (response?.response?.data?.deleted === true) {
            return true;
        }
        return false;
    }

    async chunk(text: string, chunkSize: number) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'chunker.split',
            room: 'processors',
            namedInputs: {
                text: text
            },
            data: {
                chunkSize
            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        return response;
    }

    loadLocalConfig(): RacConfigData {
        const old = MyCookies.getCookie("RAC_CONFIG");
        if (old) {
            try {
                const unparsed = Buffer.from(old, "base64").toString('utf8');
                const parsed = JSON.parse(unparsed);
                return parsed as RacConfigData;
            } catch (err) {

            }
        }
        return {
            systemPrompt: 'Eres un asistente que solo habla español',
            queryPrompt: 'Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"',
            maxTokens: 1024,
            k: 2,//top
            maxDistance: 0.6,
            useRAC: false,
            showKnowledge: false,
            outputAudio: false,
        };
    }
}