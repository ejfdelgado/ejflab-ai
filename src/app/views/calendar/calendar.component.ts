import { Component, OnInit } from '@angular/core';
import { ModalService } from 'ejflab-front-lib';

export interface MiCalendario {
  label: string;
  dates: MiDiaType;
}

export interface MiDiaType {
  [key: number]: { [key: number]: { [key: number]: MiDiaElement } };
}

export interface MiMes {
  txt: string;
  semanas: number;
  fila: number;
}

export interface MiDiaElement {
  txt: string;
}

export interface MiDia {
  legible: number;
  txt: string;
  fds?: boolean;
  fes?: boolean;
  sad?: boolean;
  happy?: boolean;
  happyjoyce?: boolean;
  hoy?: boolean;
  jardin?: boolean;
  explain: Array<MiDiaElement>;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  anio: number = new Date().getFullYear();
  esPar: boolean = true;
  weekEven: boolean = true;
  titulos: Array<MiMes> = [];
  dias: Array<MiDia> = [];
  festivos: { [key: number]: { [key: number]: { [key: number]: boolean } } } = {
    2022: {},
    2024: {
      //Enero
      1: { 1: true, 8: true },
      //Febrero
      2: {},
      //marzo
      3: {
        25: true,
        28: true,
        29: true,
      },
      //abril
      4: {},
      //mayo
      5: { 1: true, 13: true },
      //junio
      6: { 3: true, 10: true },
      //julio
      7: { 1: true, 20: true },
      //agosto
      8: { 7: true, 19: true },
      //septiembre
      9: {},
      //octubre
      10: { 14: true },
      //noviembre
      11: { 4: true, 11: true },
      //diciembre
      12: { 8: true, 25: true },
    },
    2023: {
      //Enero
      1: { 1: true, 9: true },
      //Febrero 2
      2: {},
      //Marzo 3
      3: { 20: true },
      //Abril 4
      4: { 6: true, 7: true },
      //Mayo 5
      5: { 1: true, 22: true },
      //Junio 6
      6: { 12: true, 19: true },
      // Julio 7
      7: { 3: true, 20: true },
      // Agosto 8
      8: { 7: true, 21: true },
      // Septiembre 9
      9: {},
      // Octubre 10
      10: { 16: true },
      11: { 6: true, 13: true },
      12: { 8: true, 25: true },
    },
  };
  calendarios: Array<MiCalendario> = [];
  constructor(public modalService: ModalService) {
    this.calendarios.push({
      label: 'Personal',
      dates: {
        2023: {
          5: {
            9: { txt: 'Cumple Joyce!' },
          },
        },
      },
    });
    this.calendarios.push({
      label: 'Salud Joyce',
      dates: {
        2023: {
          7: {
            // Julio
            14: { txt: '4:40pm Odontología Catalina Botero' },
          },
        },
      },
    });
    this.calendarios.push({
      label: 'Jardín',
      dates: {
        2024: {
          1: {},
          2: {
            9: { txt: '2 Open Day' },
          },
          3: {
            //marzo
          },
          4: {
            //abril
            19: { txt: '3 Open Day' },
          },
          5: {
            //mayo
          },
          6: {
            //junio
            21: { txt: 'Último día de clases' },
            24: { txt: 'Open Day' },
          },
          7: {
            //julio
          },
          8: {
            //agosto
          },
          9: {
            //septiembre
          },
          10: {
            //octubre
          },
          11: {
            //noviembre
          },
          12: {
            //diciembre
          },
        },
        2023: {
          1: {
            // Enero
            27: { txt: 'Entrega de boletines' },
          },
          2: {
            // Febrero
            28: { txt: 'jornada pedagógica' },
          },
          3: {
            // Marzo
            17: { txt: 'Entrega de boletines' },
            27: { txt: 'Semana santa' },
            28: { txt: 'Semana santa' },
            29: { txt: 'Semana santa' },
            30: { txt: 'Semana santa' },
            31: { txt: 'Semana santa' },
          },
          4: {
            // Abril
            3: { txt: 'Semana santa' },
            4: { txt: 'Semana santa' },
            5: { txt: 'Semana santa' },
            6: { txt: 'Semana santa' },
            7: { txt: 'Semana santa' },
            10: { txt: 'Inicio Clases' },
            26: {
              txt: 'Día del niño + Reunión con Miss Ingrid & Maria Andréa',
            },
          },
          5: {
            // Mayo
            9: { txt: 'Jornada pedagógica - No hay clase' },
            19: { txt: 'Día del profesor - No hay clase' },
            25: { txt: 'Escuela de padres (por confirmar)' },
            29: { txt: 'Inicio del 4to periodo' },
          },
          6: {
            // Junio
            5: { txt: 'Exámen visual/auditivo - Toda la semana' },
            9: { txt: '3er informe académico - No hay clase' },
          },
          7: {
            // Julio
            19: { txt: 'Día de la Colombianidad' },
            21: { txt: 'Último día de clases + Medallas' },
            24: { txt: '4to informe académico - No hay clase' },
          },
          8: {
            // Agosto
          },
          9: {
            // Septiembre
            6: { txt: 'Primer día de clases' },
            7: { txt: 'Ajuste x festivo 20 de julio' },
            11: { txt: 'Oftalmologia Joyce 2:30pm' },
          },
          10: {
            // Octubre
            9: { txt: 'Receso escolar Joyce' },
            10: { txt: 'Receso escolar Joyce' },
            11: { txt: 'Receso escolar Joyce' },
            12: { txt: 'Receso escolar Joyce' },
            13: { txt: 'Receso escolar Joyce' },
          },
          11: {
            // Noviembre
            21: { txt: 'No hay clases' },
          },
          12: {
            1: { txt: 'No hay clases' },
            // Diciembre
            15: { txt: 'Vacaciones Joyce' },
          },
        },
      },
    });
  }

  explain(dia: MiDia) {
    this.modalService.alert({
      title: 'Detalle',
      //txt: JSON.stringify(dia),
      txt: 'assets/templates/calendar/popup.html',
      payload: { elementos: dia.explain },
      ishtml: true,
      isUrl: true,
    });
  }

  weekOfYear(fecha: Date) {
    const currentDate = fecha.getTime();
    const startDate = new Date(fecha.getFullYear(), 0, 1).getTime();
    var days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  }

  weekCount(year: number, monthNumber: number): number {
    // monthNumber is in the range 1..12
    const firstOfMonth = new Date(year, monthNumber - 1, 1);
    const lastOfMonth = new Date(year, monthNumber, 0);

    const a = this.weekOfYear(firstOfMonth);
    const b = this.weekOfYear(lastOfMonth);

    //console.log(`${firstOfMonth} is ${a} ${lastOfMonth} is ${b}`);

    let ans = b - a + 1;

    if (monthNumber == 12) {
      return ans;
    }

    if (lastOfMonth.getDay() != 0) {
      // Día diferente a domingo
      ans = ans - 1;
    }
    return ans;
  }

  ngOnInit(): void {
    const TITULOS = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    let conteoSemanas = 1;
    for (let i = 1; i <= 12; i++) {
      const nuevo: MiMes = {
        txt: TITULOS[i - 1],
        semanas: this.weekCount(this.anio, i),
        fila: conteoSemanas,
      };
      conteoSemanas += nuevo.semanas;
      this.titulos.push(nuevo);
    }

    let inicio = new Date(this.anio, 0, 1);
    const final = new Date(this.anio, 11, 31);

    if (inicio.getDay() != 1) {
      //Si es diferente de lunes toca rellenar
      let offset = 0;
      if (inicio.getDay() == 0) {
        offset = 6;
      } else {
        offset = inicio.getDay() - 1;
      }
      inicio = new Date(this.anio, 0, 1 - offset);
    }

    const hoy = new Date();
    const hoyAnio = hoy.getFullYear();
    const hoyMes = hoy.getMonth() + 1;
    const hoyElDia = hoy.getDate();

    for (let d = inicio; d <= final; d.setDate(d.getDate() + 1)) {
      const anio = d.getFullYear();
      const mes = d.getMonth() + 1;
      const elDia = d.getDate();
      const dia: MiDia = {
        txt: '' + d.getDate(),
        fds: [0, 6].indexOf(d.getDay()) >= 0, // domingo o sabado
        explain: [],
        legible: elDia + 100 * mes + anio * 10000,
      };

      if (dia.legible >= 20230501 && dia.legible <= 20230612) {
        if (this.esPar && elDia % 2 == 0) {
          dia.sad = true;
        } else {
          dia.happy = true;
        }
      } else {
        if (this.esPar && elDia % 2 != 0) {
          dia.sad = true;
        } else {
          dia.happy = true;
        }
      }

      if (anio == hoyAnio && mes == hoyMes && elDia == hoyElDia) {
        dia.hoy = true;
        dia.explain.push({ txt: 'Es hoy' });
      }

      if ([0, 5, 6].indexOf(d.getDay()) >= 0) {
        //viernes, sabado o domingo
        const numWeek = this.weekOfYear(d);
        if (this.weekEven) {
          dia.happyjoyce = numWeek % 2 == 0;
        } else {
          dia.happyjoyce = numWeek % 2 != 0;
        }
        if (!dia.happyjoyce) {
          dia.happy = false;
          dia.explain.push({ txt: 'Fds sin Joyce' });
        } else {
          dia.explain.push({ txt: 'Fds con Joyce' });
        }
      }

      if (typeof dia.happyjoyce !== 'boolean') {
        if (dia.happy) {
          dia.explain.push({ txt: 'Con Joyce' });
        } else {
          dia.explain.push({ txt: 'Sin Joyce' });
        }
      }

      const p1 = this.festivos[anio];
      if (p1) {
        const p2 = p1[mes];
        if (p2) {
          const esFestivo = p2[elDia];
          if (esFestivo) {
            dia.fes = true;
            dia.explain.push({ txt: 'Festivo' });
          }
        }
      }

      for (let i = 0; i < this.calendarios.length; i++) {
        const calendario = this.calendarios[i];
        const jardin = calendario.dates;
        const j1 = jardin[anio];
        if (j1) {
          const j2 = j1[mes];
          if (j2) {
            const esJardin = j2[elDia];
            if (typeof esJardin == 'object' && esJardin != null) {
              dia.jardin = true;
              dia.explain.push({ txt: `${calendario.label}: ${esJardin.txt}` });
            }
          }
        }
      }
      this.dias.push(dia);
    }

    setTimeout(() => {
      const hoyElArray: HTMLCollectionOf<Element> =
        document.getElementsByClassName('hoy');
      const hoyEl = hoyElArray.item(0);
      hoyEl?.scrollIntoView({
        behavior: 'smooth', // smooth, instant
        block: 'center', // One of start, center, end, or nearest
        inline: 'center', //start, center, end, or nearest
      });
    });
  }
}
