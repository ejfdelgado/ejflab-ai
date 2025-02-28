import { Injectable } from "@angular/core";
import { FlowchartService, HttpService } from "ejflab-front-lib";

@Injectable({
    providedIn: 'root'
})
export class Speech2TextService {
    constructor(
        private httpSrv: HttpService,
        public flowchartSrv: FlowchartService,
    ) { }
}