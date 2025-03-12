import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { ImageShoot } from '../../img2mesh.component';

@Component({
  selector: 'app-imagegallery',
  templateUrl: './imagegallery.component.html',
  styleUrls: ['./imagegallery.component.css'],
})
export class ImagegalleryComponent implements OnInit {
  @Input() photoData: any;
  @Output() askEdit: EventEmitter<ImageShoot> = new EventEmitter();
  @Output() askErase: EventEmitter<ImageShoot> = new EventEmitter();
  constructor() {}

  completeImagePath(path: string) {
    return MyConstants.SRV_ROOT + path + '?authcookie=1&max_age=604800';
  }

  ngOnInit(): void {}

  async editPerson() {
    this.askEdit.emit(this.photoData.value);
  }

  async erasePerson() {
    this.askErase.emit(this.photoData.value);
  }
}
