import { Component, OnInit } from '@angular/core';
import { BaseComponent, OptionData } from 'ejflab-front-lib';

@Component({
  selector: 'app-ejflabmodule',
  templateUrl: './ejflabmodule.component.html',
  styleUrl: './ejflabmodule.component.css'
})
export class EjflabmoduleComponent extends BaseComponent implements OnInit {

  public extraOptions: Array<OptionData> = [];

  override async ngOnInit() {
    await super.ngOnInit();
    //this.socketIoConnect(this.builderConfig);
  }

  override bindEvents() {

  }
}
