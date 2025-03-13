import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OptionData } from 'ejflab-front-lib';
import { ConfigRacService } from './services/configRac.service';

@Component({
  selector: 'app-ejflabmodule',
  templateUrl: './ejflabmodule.component.html',
  styleUrl: './ejflabmodule.component.css'
})
export class EjflabmoduleComponent implements OnInit {

  public extraOptions: Array<OptionData> = [];

  constructor(
    private router: Router,
    private configSrv: ConfigRacService,
  ) {


    this.extraOptions.push({
      action: () => {
        this.configSrv.manageCloud();
      },
      icon: 'cloud',
      label: "Manage Cloud",
    });

    this.extraOptions.push({
      action: () => {
        this.configSrv.manageDatabase();
      },
      icon: 'menu_book',
      label: "Manage Database",
    });

    this.extraOptions.push({
      action: () => {
        this.configSrv.openConfiguration();
      },
      icon: 'settings',
      label: "Manage Configuration",
    });

    const VIEW_OPTIONS = [
      { pathname: 'ocr', label: 'OCR', icon: 'spellcheck' },
      { pathname: 'llm', label: 'LLM', icon: 'psychology' },
      { pathname: 'speech_to_text', label: 'Speech to Text', icon: 'mic' },
      { pathname: 'text_to_speech', label: 'Text to Speech', icon: 'volume_up' },
      { pathname: 'ingest', label: 'Add information', icon: 'add' },
      { pathname: 'llm_knowledge', label: 'Chat', icon: 'chat' },
    ];
    for (let i = 0; i < VIEW_OPTIONS.length; i++) {
      const viewOption = VIEW_OPTIONS[i];
      this.extraOptions.push({
        action: () => {
          this.router.navigate([viewOption.pathname]);
        },
        icon: viewOption.icon,
        label: viewOption.label,
      });
    }
  }

  async ngOnInit() {
    //this.socketIoConnect(this.builderConfig);
  }

  bindEvents() {

  }
}
