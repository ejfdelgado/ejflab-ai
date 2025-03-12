import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ModalService } from 'ejflab-front-lib';

export interface MyTensorflowLayerData {
  units: number;
  activation: string;
}

export interface MyTensorflowInData {
  column: string;
  min: number;
  max: number;
}

export interface MyTensorflowOutData extends MyTensorflowInData {
  ngroups: number;
}

export interface MyTensorflowCompileData {
  loss: string;
  metrics: Array<string>;
}

export interface MyTensorflowFitData {
  shuffle: boolean;
  epochs: number;
  validationSplit: number;
}

export interface MyTensorflowDataData {
  in: Array<MyTensorflowInData>;
  out: MyTensorflowOutData;
}

export interface MyTensorflowData {
  layers: Array<MyTensorflowLayerData>;
  compile: MyTensorflowCompileData;
  fit: MyTensorflowFitData;
}

export interface ComboBoxData {
  txt: string;
  val: string | number;
}

@Component({
  selector: 'app-tensorflow',
  templateUrl: './tensorflow.component.html',
  styleUrls: ['./tensorflow.component.css'],
})
export class TensorflowComponent implements OnInit, OnChanges {
  @Input('model')
  model: MyTensorflowData;
  @Input('data')
  data: MyTensorflowDataData | null | undefined;
  @Input('view')
  view: 'data' | 'neural_network' | 'training' | 'all';

  activationOptions: Array<ComboBoxData> = [
    { val: 'relu', txt: 'relu' },
    { val: 'softmax', txt: 'softmax' },
    { val: 'elu', txt: 'elu' },
    { val: 'exponential', txt: 'exponential' },
    { val: 'gelu', txt: 'gelu' },
    { val: 'hard_sigmoid', txt: 'hard_sigmoid' },
    { val: 'linear', txt: 'linear' },
    { val: 'selu', txt: 'selu' },
    { val: 'sigmoid', txt: 'sigmoid' },
    { val: 'softplus', txt: 'softplus' },
    { val: 'softsign', txt: 'softsign' },
    { val: 'swish', txt: 'swish' },
    { val: 'tanh', txt: 'tanh' },
  ];

  lossOptions = [
    { val: 'binaryCrossentropy', txt: 'binaryCrossentropy' },
    { val: 'categoricalCrossentropy', txt: 'categoricalCrossentropy' },
    { val: 'meanAbsolutePercentageError', txt: 'meanAbsolutePercentageError' },
    { val: 'categoricalAccuracy', txt: 'categoricalAccuracy' },
    { val: 'meanAbsoluteError', txt: 'meanAbsoluteError' },
    { val: 'cosineProximity', txt: 'cosineProximity' },
    { val: 'recall', txt: 'recall' },
    { val: 'meanSquaredError', txt: 'meanSquaredError' },
    { val: 'sparseCategoricalAccuracy', txt: 'sparseCategoricalAccuracy' },
    { val: 'precision', txt: 'precision' },
  ];

  constructor(private modalSrv: ModalService) {}

  async removeColumnDataIn(el: MyTensorflowInData) {
    if (!this.data) {
      return;
    }
    const response = await this.modalSrv.confirm({
      title: '¿Está seguro?',
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    const indice = this.data.in.indexOf(el);
    if (indice >= 0) {
      this.data.in.splice(indice, 1);
    }
  }

  ngOnChanges(changes: any) {
    //console.log(JSON.stringify(changes));
  }

  addDataIn() {
    if (!this.data) {
      return;
    }
    this.data.in.push({
      column: '',
      min: 0,
      max: 1,
    });
  }

  async removeLayer(layer: MyTensorflowLayerData) {
    const response = await this.modalSrv.confirm({
      title: '¿Está seguro?',
      txt: 'Esta acción no se puede deshacer.',
    });
    if (!response) {
      return;
    }
    const indice = this.model.layers.indexOf(layer);
    if (indice >= 0) {
      this.model.layers.splice(indice, 1);
    }
  }

  addLayer() {
    this.model.layers.push({
      units: 2,
      activation: 'relu',
    });
  }

  ngOnInit(): void {}

  doAction() {}
}
