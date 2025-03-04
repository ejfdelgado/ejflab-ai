import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.css'],
  host: { class: 'parent_class' },
})
export class LicenseComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
