import { Injectable } from "@angular/core";
import { HttpService } from "ejflab-front-lib";

export interface SchemaDataType {
    name: string;
}

export interface TableDataType {
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class RACDatabaseService {
    constructor(
        private httpSrv: HttpService,
    ) { }

    async getSchemas(): Promise<SchemaDataType[]> {
        let response: SchemaDataType[] = [];
        return response;
    }

    async getTables(schema: string): Promise<TableDataType[]> {
        let response: TableDataType[] = [];
        return response;
    }
}