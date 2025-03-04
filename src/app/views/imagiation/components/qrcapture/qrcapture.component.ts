import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { toCanvas } from 'qrcode';

@Component({
  selector: 'app-qrcapture',
  templateUrl: './qrcapture.component.html',
  styleUrls: ['./qrcapture.component.css'],
})
export class QrcaptureComponent implements OnInit {
  currentUrl: string = '';
  pageId: string;
  pageType: string;
  pageMode: string;
  title: string;
  description: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.pageId = data.pageId;
    this.pageType = data.pageType;
    this.pageMode = data.pageMode;
    this.title = data.title;
    this.description = data.description;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.generateUrl();
    }, 0);
  }

  generateUrl(changed?: { key: string; val: any }) {
    const queryParams: any = {
      mode: this.pageMode,
    };
    const params = new URLSearchParams(queryParams);
    let canvas = document.getElementById('qrcanvas');
    this.currentUrl = `${location.origin}/${this.pageType}/${
      this.pageId
    }?${params.toString()}`;
    toCanvas(canvas, this.currentUrl, {
      width: 256,
    });
  }
}
