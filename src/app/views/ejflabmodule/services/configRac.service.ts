import { Injectable } from "@angular/core";
import { KnowledgeService, RacConfigData } from "./knowledge.service";
import { MatDialog } from "@angular/material/dialog";
import { PopupRacConfigComponent } from "../components/popup-rac-config/popup-rac-config.component";
import { PopupCloudAdminComponent } from "../components/popup-cloud-admin/popup-cloud-admin.component";
import { PopupDatabaseEditComponent } from "../components/popup-database-edit/popup-database-edit.component";

@Injectable({
    providedIn: 'root'
})
export class ConfigRacService {
    config: RacConfigData;
    constructor(
        private dialog: MatDialog,
        private knowledgeSrv: KnowledgeService,
    ) {
        this.config = this.knowledgeSrv.loadLocalConfig();
    }

    getConfig(): RacConfigData {
        return this.config;
    }

    async openConfiguration() {
        const dialogRef = this.dialog.open(PopupRacConfigComponent, {
            data: {
                data: this.config
            },
            //disableClose: true,
            panelClass: ['popup_1', 'nogalespopup'],
        });
        if (dialogRef) {
            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    this.config = result;
                    //this.cdr.detectChanges();
                }
            });
        }
    }

    async manageCloud() {
        const dialogRef = this.dialog.open(PopupCloudAdminComponent, {
            data: {
            },
            //disableClose: true,
            panelClass: ['popup_1', 'nogalespopup'],
        });
    }

    async manageDatabase() {
        const dialogRef = this.dialog.open(PopupDatabaseEditComponent, {
            data: {
                data: this.config
            },
            //disableClose: true,
            panelClass: ['popup_1', 'nogalespopup'],
        });
        if (dialogRef) {
            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    this.config = result;
                    //this.cdr.detectChanges();
                }
            });
        }
    }
}