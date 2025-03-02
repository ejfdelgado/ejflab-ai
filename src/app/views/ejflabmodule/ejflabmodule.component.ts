import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, BackendPageService, BaseComponent, CallService, FileService, FlowchartService, ModalService, OptionData, TupleService, WebcamService } from 'ejflab-front-lib';
import { ConfigRacService } from './services/configRac.service';

@Component({
  selector: 'app-ejflabmodule',
  templateUrl: './ejflabmodule.component.html',
  styleUrl: './ejflabmodule.component.css'
})
export class EjflabmoduleComponent extends BaseComponent implements OnInit {

  public extraOptions: Array<OptionData> = [];

  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public override route: ActivatedRoute,
    public override pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public override authService: AuthService,
    public override dialog: MatDialog,
    public override tupleService: TupleService,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override webcamService: WebcamService,
    public override auth: Auth,
    private router: Router,
    private configSrv: ConfigRacService,
  ) {
    super(
      flowchartSrv,
      callService,
      route,
      pageService,
      cdr,
      authService,
      dialog,
      tupleService,
      fileService,
      modalService,
      webcamService,
      auth
    );

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

  override async ngOnInit() {
    await super.ngOnInit();
    //this.socketIoConnect(this.builderConfig);
  }

  override bindEvents() {

  }
}
