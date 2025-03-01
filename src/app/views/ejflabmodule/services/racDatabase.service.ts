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
        const data: any = await this.httpSrv.get("srv/rac/db/schemas");
        if (data.schemas) {
            response = data.schemas;
        }
        return response;
    }

    async getTables(schema: string): Promise<TableDataType[]> {
        let response: TableDataType[] = [];
        const data: any = await this.httpSrv.get(`srv/rac/db/schemas/${schema}/tables`);
        if (data.tables) {
            response = data.tables;
        }
        return response;
    }
}