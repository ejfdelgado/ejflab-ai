import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Img2meshRoutingModule } from './img2mesh-routing.module';
import { Img2meshComponent } from './img2mesh.component';
import { ImagegalleryComponent } from './components/imagegallery/imagegallery.component';
import { AutophotoComponent } from './components/autophoto/autophoto.component';
import { JobgalleryComponent } from './components/jobgallery/jobgallery.component';
import { JobdetailComponent } from './components/jobdetail/jobdetail.component';
import { MycommonModule } from 'ejflab-front-lib';

@NgModule({
  declarations: [
    Img2meshComponent,
    ImagegalleryComponent,
    AutophotoComponent,
    JobgalleryComponent,
    JobdetailComponent,
  ],
  imports: [
    CommonModule,
    Img2meshRoutingModule,
    MatIconModule,
    MycommonModule,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
})
export class Img2meshModule { }
