import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ImageiationService,
  TheTagData,
} from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import sortify from '@ejfdelgado/ejflab-common/src/sortify';
import { TagContainer } from '../imagegallery/imagegallery.component';

@Component({
  selector: 'app-classgallery',
  templateUrl: './classgallery.component.html',
  styleUrls: ['./classgallery.component.css'],
})
export class ClassgalleryComponent implements OnInit {
  @ViewChild('container_scroll') containerScroll: ElementRef;
  form: FormGroup;
  tag: TagContainer | null = null;
  tags: TheTagData = {};
  savedTags: TheTagData | null = null;
  pageId: string;
  tagsProcessed: Array<{
    num: string;
    val: { txt: string; ref?: string | null };
  }> = [];
  constructor(
    private dialogRef: MatDialogRef<ClassgalleryComponent>,
    private fb: FormBuilder,
    private modalSrv: ModalService,
    private imagiationSrv: ImageiationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.tags = data.tags;
    this.tag = data.tag;
    this.pageId = data.pageId;
    const llaves = Object.keys(this.tags);
    llaves.sort((a: string, b: string) => {
      return parseInt(a) - parseInt(b);
    });
    for (let i = 0; i < llaves.length; i++) {
      const llave = llaves[i];
      this.tagsProcessed.push({
        num: llave,
        val: this.tags[llave],
      });
    }
    this.form = new FormGroup({
      formArrayName: this.fb.array([]),
    });
    this.buildForm();
  }

  buildForm() {
    const controlArray = this.form.get('formArrayName') as FormArray;
    controlArray.clear();

    let i = 0;
    this.tagsProcessed.forEach((mytag) => {
      const control = this.fb.group({
        classname: new FormControl({
          value: mytag.val.txt,
          disabled: false,
        }),
        classref: new FormControl({
          value: mytag.val.ref,
          disabled: false,
        }),
      });
      controlArray.push(control);
      let index = i;
      control.valueChanges.subscribe((value: any) => {
        //console.log(`${index} = ${JSON.stringify(value)}`);
        const { classname, classref } = value;
        this.tagsProcessed[index].val = { txt: classname, ref: classref };
      });
      i++;
    });
  }

  ngOnInit(): void {}

  getTagColor(tag: any) {
    if (this.tag?.bbox.label == tag.num) {
      return 'primary';
    } else {
      return 'secondary';
    }
  }

  agregarClase() {
    const tam = this.tagsProcessed.length;
    this.tagsProcessed.push({
      num: `${tam}`,
      val: { txt: '', ref: '' },
    });
    this.buildForm();
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  scrollToBottom(): void {
    try {
      this.containerScroll.nativeElement.scrollTop =
        this.containerScroll.nativeElement.scrollHeight;
    } catch (err) {}
  }

  async wantsToDelete() {
    const decision = await this.modalSrv.confirm({
      title: `¿Seguro?`,
      txt: `Esta acción no se puede deshacer`,
    });
    if (!decision) {
      return;
    }
    this.dialogRef.close({
      wantsToDelete: true,
    });
  }

  async borrarClase(i: number, tuple: any) {
    const decision = await this.modalSrv.confirm({
      title: `Borrar clase ${tuple.num}/${tuple.val}`,
      txt: `¿Seguro de lo que estás haciendo?`,
    });
    if (!decision) {
      return;
    }
    const indice = this.tagsProcessed.indexOf(tuple);
    if (indice >= 0) {
      this.tagsProcessed.splice(indice, 1);
      // Se recalculan los num
      const tam = this.tagsProcessed.length;
      for (let i = 0; i < tam; i++) {
        this.tagsProcessed[i].num = `${i}`;
      }
      this.buildForm();
    }
  }

  cancelar() {
    if (this.savedTags) {
      this.dialogRef.close({
        theclasses: this.savedTags,
        current: null,
      });
    } else {
      this.dialogRef.close();
    }
  }

  async guardarCerrar() {
    const { changed, respuesta } = await this.guardar();
    this.dialogRef.close({
      theclasses: respuesta,
      current: null,
    });
  }

  async guardar() {
    const { changed, respuesta } = this.convertToTagData();
    //console.log(JSON.stringify(respuesta));
    if (changed) {
      await this.imagiationSrv.tagsWrite(this.pageId, respuesta);
      this.savedTags = respuesta;
    }
    return {
      changed,
      respuesta,
    };
  }

  convertToTagData() {
    const lista = this.tagsProcessed;
    const respuesta: TheTagData = {};
    for (let i = 0; i < lista.length; i++) {
      const elem = lista[i];
      const num = elem.num;
      const classname = elem.val;
      respuesta[num] = classname;
    }
    const anterior = sortify(this.tags);
    const actual = sortify(respuesta);
    const changed = actual != anterior;
    return {
      changed,
      respuesta,
    };
  }

  async usarTag(tag: any) {
    const { changed, respuesta } = await this.guardar();
    if (changed) {
      this.dialogRef.close({
        theclasses: respuesta,
        current: tag.num,
      });
    } else {
      this.dialogRef.close({
        theclasses: null,
        current: tag.num,
      });
    }
  }
}
