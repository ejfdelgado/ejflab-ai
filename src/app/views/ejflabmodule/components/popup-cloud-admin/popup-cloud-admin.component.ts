import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpService, ModalService } from 'ejflab-front-lib';
import { CloudManagerService, ServiceMetaData } from '../../services/cloudManager.service';



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
      status: "pending",
      serviceName: "general",
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
  runStatus: boolean = true;
  currentRefresh: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<PopupCloudAdminComponent>,
    private cdr: ChangeDetectorRef,
    public cloudManagerSrv: CloudManagerService,
  ) {
    //
  }

  ngOnDestroy(): void {
    this.runStatus = false;
  }

  async ngOnInit(): Promise<void> {
    this.runForever();
  }

  async runForever() {
    while (this.runStatus) {
      await this.iterateRefresh();
      await this.sleep(1000);
    }
  }

  async sleep(millis: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, millis);
    });
  }

  async iterateRefresh() {
    const servicesKeys = Object.keys(this.services).sort();
    if (this.currentRefresh == null) {
      this.currentRefresh = servicesKeys[0];
    } else {
      // Get the next on
      const index = servicesKeys.indexOf(this.currentRefresh);
      if (index == servicesKeys.length - 1) {
        this.currentRefresh = servicesKeys[0];
      } else {
        this.currentRefresh = servicesKeys[index + 1];
      }
    }
    await this.cloudManagerSrv.refresh(this.currentRefresh, this.services[this.currentRefresh]);
  }

  async readDBState(service: ServiceMetaData) {
    await this.cloudManagerSrv.readDBState(service);
    this.cdr.detectChanges();
  }

  async readCloudRunState(service: ServiceMetaData) {
    await this.cloudManagerSrv.readCloudRunState(service);
    this.cdr.detectChanges();
  }

  cancel() {
    this.dialogRef.close();
  }
}
