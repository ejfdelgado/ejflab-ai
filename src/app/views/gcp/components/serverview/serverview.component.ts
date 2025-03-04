import { Component, Input, OnInit } from '@angular/core';
import { GceService } from 'ejflab-front-lib';

@Component({
  selector: 'app-serverview',
  templateUrl: './serverview.component.html',
  styleUrls: ['./serverview.component.css'],
})
export class ServerviewComponent implements OnInit {
  @Input() serverData: any;
  updateSleepState: boolean = false;
  updateIterateAuto: boolean = false;
  constructor(private gceSrv: GceService) {}

  ngOnInit(): void {
    //
  }

  async sleep(milis: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, milis);
    });
  }

  updateIterate(evento: any) {
    if (evento.checked) {
      this.updateIterateAuto = true;
      this.iterateEveryTime();
    } else {
      this.updateIterateAuto = false;
    }
  }

  updateState(evento: any) {
    if (evento.checked) {
      this.updateSleepState = true;
      this.updateEveryTime();
    } else {
      this.updateSleepState = false;
    }
  }

  async iterateEveryTime() {
    while (true) {
      await this.iterate();
      await this.sleep(5000);
      if (this.updateIterateAuto == false) {
        break;
      }
    }
  }

  async iterate() {
    const response = await this.gceSrv.iterateGce(this.serverData.key);
    if (response.status) {
      if (response.status.health) {
        this.serverData.value.state = response.status.health.state;
        this.serverData.value.log = response.status.health.log;
        const stateDetail = response.status.health.stateDetail;
        this.updateDetail(stateDetail);
      }
    }
  }

  async updateEveryTime() {
    while (true) {
      await this.readState();
      await this.sleep(5000);
      if (this.updateSleepState == false) {
        break;
      }
    }
  }

  updateDetail(stateDetail: any) {
    this.serverData.value.stateDetail = stateDetail;
    // Compute capacity
    if (stateDetail && stateDetail.maxJobs) {
      stateDetail.capacity = Math.ceil(
        (100 * stateDetail.currentJobs) / stateDetail.maxJobs
      );
    }
  }

  async readState() {
    const response = await this.gceSrv.readCurrentState(this.serverData.key);
    if (response.status) {
      this.serverData.value.state = response.status.state;
      this.serverData.value.log = response.status.log;
      const stateDetail = response.status.stateDetail;
      this.updateDetail(stateDetail);
    }
  }
}
