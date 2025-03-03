import { Injectable } from "@angular/core";
import { HttpService } from "ejflab-front-lib";

export interface ServiceMetaData {
    label: string;
    status: "sentiment_very_dissatisfied" | "mood" | "pending";
    serviceName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CloudManagerService {
    constructor(
        public httpSrv: HttpService
    ) {

    }

    async updateDatabase(state: boolean, service: ServiceMetaData) {
        if (state) {
            const response: any = await this.httpSrv.get(`srv/rac/db/on?name=${service.serviceName}`);
        } else {
            const response: any = await this.httpSrv.get(`srv/rac/db/off?name=${service.serviceName}`);
        }
    }

    async updateCloudRun(state: boolean, service: ServiceMetaData) {
        if (state) {
            const response: any = await this.httpSrv.get(`srv/rac/run/on?name=${service.serviceName}`);
        } else {
            const response: any = await this.httpSrv.get(`srv/rac/run/off?name=${service.serviceName}`);
        }
    }

    async readDBState(service: ServiceMetaData) {
        service.status = "pending";
        try {
            const response: any = await this.httpSrv.get("srv/rac/db/state", { showIndicator: false });
            if (response.status == true) {
                service.status = "mood";
            } else {
                service.status = "sentiment_very_dissatisfied";
            }

        } catch (err) {

        }
    }

    async readCloudRunState(service: ServiceMetaData) {
        service.status = "pending";
        try {
            const response: any = await this.httpSrv.get(`srv/rac/run/state?name=${service.serviceName}`, { showIndicator: false });
            if (response.status == "CONDITION_SUCCEEDED" && response.minInstanceCount > 0) {
                service.status = "mood";
            } else {
                service.status = "sentiment_very_dissatisfied";
            }
        } catch (err) {

        }
    }

    async refresh(id: string, service: ServiceMetaData) {
        if (id == "database") {
            await this.readDBState(service);
        } else {
            await this.readCloudRunState(service);
        }
    }

    async startService(id: string, service: ServiceMetaData) {
        if (id == "database") {
            await this.updateDatabase(true, service);
        } else {
            await this.updateCloudRun(true, service);
        }
    }

    async stopService(id: string, service: ServiceMetaData) {
        if (id == "database") {
            await this.updateDatabase(false, service);
        } else {
            await this.updateCloudRun(false, service);
        }
    }
}