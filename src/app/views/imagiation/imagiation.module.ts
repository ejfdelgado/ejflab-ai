import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImagiationRoutingModule } from './imagiation-routing.module';
import { ImagiationComponent } from './imagiation.component';

import { MatIconModule } from '@angular/material/icon';
import { MycommonModule } from 'ejflab-front-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LicenseComponent } from './components/license/license.component';
import { ImagegalleryComponent } from './components/imagegallery/imagegallery.component';
import { JobgalleryComponent } from './components/jobgallery/jobgallery.component';
import { TestcomponentComponent } from './components/testcomponent/testcomponent.component';
import { MatMenuModule } from '@angular/material/menu';
import { ClassgalleryComponent } from './components/classgallery/classgallery.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FilterimageComponent } from './components/filterimage/filterimage.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { QrcaptureComponent } from './components/qrcapture/qrcapture.component';
import { AutophotoComponent } from './components/autophoto/autophoto.component';
import { JobdetailComponent } from './components/jobdetail/jobdetail.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VideodetectionComponent } from './components/videodetection/videodetection.component';
import { DefinehelpermodelComponent } from './components/definehelpermodel/definehelpermodel.component';
import { EditimageiaconfigComponent } from './components/editimageiaconfig/editimageiaconfig.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

@NgModule({
  declarations: [
    ImagiationComponent,
    LicenseComponent,
    ImagegalleryComponent,
    JobgalleryComponent,
    TestcomponentComponent,
    ClassgalleryComponent,
    FilterimageComponent,
    QrcaptureComponent,
    AutophotoComponent,
    JobdetailComponent,
    VideodetectionComponent,
    DefinehelpermodelComponent,
    EditimageiaconfigComponent,
    StatisticsComponent,
  ],
  imports: [
    MatIconModule,
    CommonModule,
    MycommonModule,
    FormsModule,
    ImagiationRoutingModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ],
  providers: [MatDatepickerModule, MatNativeDateModule],
})
export class ImagiationModule {}
