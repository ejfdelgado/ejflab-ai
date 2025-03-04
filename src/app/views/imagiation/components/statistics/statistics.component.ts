import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ImageiationService,
  ImagiationDataQuery,
  StatisticData,
} from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import {
  Firestore,
  collectionData,
  collection,
  query,
  where,
  orderBy,
  DocumentData,
  limit,
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { Loader } from '@googlemaps/js-api-loader';
import { ModalService } from 'ejflab-front-lib';
import { MatDialog } from '@angular/material/dialog';
import { QrcaptureComponent } from '../qrcapture/qrcapture.component';
import { PageData } from 'ejflab-front-lib';

const loader = new Loader({
  apiKey: 'AIzaSyCApCHEeXtyMp-Ud3j4qkUaup1kwfH_wJE',
  version: 'weekly',
});

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent implements OnInit, OnDestroy {
  SHOW_MILLIS = 10000;
  PAGE_SIZE = 50;
  @Input() page: PageData | null = null;
  statistics: Array<StatisticData> = [];
  current: StatisticData | null = null;
  query: ImagiationDataQuery = {
    max: 20,
    offset: 0,
    max_count: 0,
    max_date: 0,
    min_date: 0,
    min_offset: 0,
  };
  firestoreSubscription: Subscription | null;
  currentInterval: NodeJS.Timeout | null = null;
  map: any = null;
  markers: Array<any> = [];
  mapLib: any;
  constructor(
    private imagiationSrv: ImageiationService,
    private firestore: Firestore,
    private modalSrv: ModalService,
    public dialog: MatDialog
  ) {}

  async importMapLibraries() {
    const { Map } = await loader.importLibrary('maps');
    const { AdvancedMarkerElement } = await loader.importLibrary('marker');
    this.mapLib = {
      Map,
      AdvancedMarkerElement,
    };
  }

  ngOnDestroy(): void {
    if (this.firestoreSubscription) {
      this.firestoreSubscription.unsubscribe();
    }
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
    }
  }

  getTitleFounds(current: StatisticData) {
    const keys = Object.keys(current.founds);
    return `${current.confName}: ${keys.join(', ')}`;
  }

  deserializeStatistic(stat: any) {
    const founds = stat.founds;
    const mapa: any = {};
    for (let i = 0; i < founds.length; i++) {
      const name = founds[i];
      if (!(name in mapa)) {
        mapa[name] = { count: 0 };
      }
      const conteoActual = stat[`count_${name}`];
      mapa[name].count += conteoActual;
    }
    stat.founds = mapa;
  }

  completeImagePath(path: string) {
    return MyConstants.SRV_ROOT + path + '?authcookie=1&max_age=604800';
  }

  async ngOnInit() {
    if (this.page && this.page.id) {
      try {
        await this.importMapLibraries();
        this.loadMap();
      } catch (err) {}
      this.createSubscripion();
    }
  }

  setCurrentImage(current: StatisticData) {
    this.current = current;
    if (this.currentInterval != null) {
      this.reactivateSlideShow();
    }
    this.repositionMapWithCurrent();
  }

  repositionMapWithCurrent() {
    if (this.current && this.map) {
      const center = { lat: this.current.lat, lng: this.current.lon };
      this.map.setCenter(center);
    } else {
      //console.log(`${this.current} ${this.map}`);
    }
  }

  addMarker(elem: StatisticData) {
    const marker = new this.mapLib.AdvancedMarkerElement({
      map: this.map,
      position: { lat: elem.lat, lng: elem.lon },
      title: elem.confName,
    });
    this.markers.push(marker);
  }

  recomputeMarkers() {
    // Borro los marcadores anteriores
    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i];
      marker.setMap(null);
    }
    this.markers = [];
    for (let i = 0; i < this.statistics.length; i++) {
      const stat = this.statistics[i];
      this.addMarker(stat);
    }
  }

  reactivateSlideShow() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
    }
    this.currentInterval = setInterval(() => {
      if (this.current == null) {
        if (this.statistics.length > 0) {
          this.current = this.statistics[0];
        }
      } else {
        // Se busca el índice
        const indice = this.statistics.indexOf(this.current);
        if (indice < this.statistics.length - 1) {
          this.current = this.statistics[indice + 1];
        } else {
          if (this.statistics.length > 0) {
            this.current = this.statistics[0];
          }
        }
      }
      this.repositionMapWithCurrent();
    }, this.SHOW_MILLIS);
  }

  loadMap() {
    const mapOptions = {
      center: {
        lat: 0,
        lng: 0,
      },
      zoom: 16,
      mapId: 'DEMO_MAP_ID',
    };

    const elem = document.getElementById('map');
    if (elem) {
      this.map = new this.mapLib.Map(elem, mapOptions);
    }
  }

  createSubscripion() {
    const myCollection = collection(this.firestore, 'pro-imagiationstat');
    const consulta = query(
      myCollection,
      where('pg', '==', this.page?.id),
      orderBy('t', 'desc'),
      limit(this.PAGE_SIZE)
    );

    let changes: Observable<DocumentData[]> = collectionData(consulta, {
      idField: 'id',
    });

    this.firestoreSubscription = changes.subscribe(async (data: Array<any>) => {
      this.statistics = [];
      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const image = data[i];
          //console.log(image);
          this.deserializeStatistic(image);
          this.statistics.push(image);
        }
      }
      if (this.statistics.length > 0) {
        await ModuloSonido.play('/assets/sounds/mail.mp3');
        this.current = this.statistics[0];
      } else {
        this.current = null;
      }
      this.recomputeMarkers();
      this.reactivateSlideShow();
      this.repositionMapWithCurrent();
    });
  }

  async eraseStatistic(elem: StatisticData | null) {
    if (this.page && this.page.id) {
      if (!elem) {
        return;
      }
      const decision = await this.modalSrv.confirm({
        title: `¿Borrar imagen actual?`,
        txt: `No se puede deshacer`,
      });
      if (!decision) {
        return;
      }
      //console.log(JSON.stringify(elem));
      await this.imagiationSrv.deleteStatistic(this.page.id, elem.id);
    }
  }

  pauseGallery() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  resumeGallery() {
    this.reactivateSlideShow();
  }

  async openShareThis() {
    if (!this.page?.id) {
      return;
    }
    const dialogRef = this.dialog.open(QrcaptureComponent, {
      data: {
        pageId: this.page.id,
        pageType: 'imagiation',
        pageMode: 'statistics',
        title: 'Compartir reporte',
        description: 'QR para compartir este reporte',
      },
      panelClass: 'edit-user-dialog-container',
    });
  }
}
