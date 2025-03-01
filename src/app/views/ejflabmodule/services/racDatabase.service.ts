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

    getSchemas() {

    }
}