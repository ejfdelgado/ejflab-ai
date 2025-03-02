import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpService, ModalService } from 'ejflab-front-lib';

export interface ServiceMetaData {
  label: string;
  status: "sentiment_very_dissatisfied" | "mood" | "help" | "pending";
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
export class PopupCloudAdminComponent {
  services: {[key: string]: ServiceMetaData} = {
    "database": {
      label: "Database",
      status: "help"
    },
    "llm": {
      label: "LLM",
      status: "help"
    },
    "speech2text": {
      label: "Speech to Text",
      status: "help"
    },
    "text2speech": {
      label: "Text to Speech",
      status: "help"
    },
    "baai": {
      label: "Text Indexer",
      status: "help"
    },
    "chunker": {
      label: "Text Chunker",
      status: "help"
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

  async refresh(service?: string) {

  }

  cancel() {
    this.dialogRef.close();
  }
}
