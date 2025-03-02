import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpService, ModalService } from 'ejflab-front-lib';

export interface ServiceMetaData {
  label: string;
  status: "sentiment_very_dissatisfied" | "mood" | "pending";
  serviceName?: string;
}

@Component({
  selector: 'app-popup-cloud-admin',
  templateUrl: './popup-cloud-admin.component.html',
  styleUrls: [
    '../../../../buttons.css',
    '../../../../popup.css',
    '../../../../containers.css',
    '../../../../forms.css',
    './popup-cloud-admin.component.css'
  ]
})
export class PopupCloudAdminComponent implements OnInit, OnDestroy {
  services: { [key: string]: ServiceMetaData } = {
    "database": {
      label: "Database",
      status: "pending"
    },
    "llm": {
      label: "LLM",
      status: "pending",
      serviceName: "llm",
    },
    "speech2text": {
      label: "Speech to Text",
      status: "pending",
      serviceName: "speech2text",
    },
    "text2speech": {
      label: "Text to Speech",
      status: "pending",
      serviceName: "text2speech",
    },
    "baai": {
      label: "Text Indexer",
      status: "pending",
      serviceName: "baai",
    },
    "chunker": {
      label: "Text Chunker",
      status: "pending",
      serviceName: "chunker",
    }
  };

  constructor(
    private dialogRef: MatDialogRef<PopupCloudAdminComponent>,
    private modalSrv: ModalService,
    private cdr: ChangeDetectorRef,
    private httpSrv: HttpService,
  ) {
    //
  }

  ngOnDestroy(): void {

  }

  async ngOnInit(): Promise<void> {

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
      this.cdr.detectChanges();
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
      this.cdr.detectChanges();
    } catch (err) {

    }
  }

  async refresh(id: string, service: ServiceMetaData) {
    if (id == "database") {
      // Use database
      await this.readDBState(service);
    } else {
      // Use cloud function
      await this.readCloudRunState(service);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
