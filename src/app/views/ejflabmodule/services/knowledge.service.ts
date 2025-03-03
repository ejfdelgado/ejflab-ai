import { EventEmitter, Injectable } from '@angular/core';
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
    language: string;
    assistantName: string;
}

export interface ProgressIndexData {
    total: number;
    processed: number;
    response: any;
    error: any;
}

@Injectable({
    providedIn: 'root'
})
export class KnowledgeService {
    ITEMS_PER_INVOCATION = 5;

    constructor(
        private httpSrv: HttpService,
        public flowchartSrv: FlowchartService,
    ) { }

    index(text: string, documentId: string, config: RacConfigData): EventEmitter<ProgressIndexData> | null {
        const emitter: EventEmitter<ProgressIndexData> = new EventEmitter<ProgressIndexData>();
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
        this.processAllChunks(chunks, config, emitter);
        return emitter;
    }

    async processAllChunks(chunks: string[], config: RacConfigData, emitter: EventEmitter<ProgressIndexData>) {

        const total = chunks.length;
        let processed = 0;
        do {
            const subChunks = chunks.splice(0, this.ITEMS_PER_INVOCATION);
            try {
                const response = await this.processChunks(subChunks, config);
                processed += subChunks.length;
                emitter.emit({
                    total,
                    processed,
                    response,
                    error: null,
                });
            } catch (err: any) {
                processed += subChunks.length;
                emitter.emit({
                    total,
                    processed,
                    response: null,
                    error: err,
                });
            }
        } while (chunks.length > 0);
    }

    async processChunks(chunks: string[], config: RacConfigData) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.index',
            room: 'processors',
            namedInputs: {
                knowledge: chunks,
                schema: config.schema,
                table: config.table,
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

    async search(query: string, config: RacConfigData): Promise<QADataType[] | null> {
        // Call the processor
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.search',
            room: 'processors',
            namedInputs: {
                query: query,
                kReRank: config.k,
                max_distance: config.maxDistance,
                schema: config.schema,
                table: config.table,
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

    async update(currentMatch: QADataType, config: RacConfigData) {
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
                schema: config.schema,
                table: config.table,
            },
            data: {

            },
        };
        const response = await this.flowchartSrv.process(payload, false);
        return response;
    }

    async delete(currentMatch: QADataType, config: RacConfigData) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'baai.delete',
            room: 'processors',
            namedInputs: {
                item: {
                    id: `${currentMatch.id}`,
                },
                schema: config.schema,
                table: config.table,
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
            systemPrompt: 'Eres un asistente que solo habla español sin traducir a otro idioma.',
            queryPrompt: 'Responde la pregunta: "${text}" enfocandose en que: "${knowledge}"',
            maxTokens: 1024,
            k: 2,//top
            maxDistance: 0.6,
            useRAC: false,
            showKnowledge: false,
            outputAudio: false,
            language: "es",
            assistantName: "pimpon"
        };
    }
}