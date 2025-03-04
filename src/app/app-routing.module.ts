import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { EjflabmoduleModule } from './views/ejflabmodule/ejflabmodule.module';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['customers']);

const routes: Routes = [
  {
    path: '',
    loadChildren: () => EjflabmoduleModule,
  },
];

/*
IMPORTANTE: Cuando agregue un módulo acá, debe modificar tsconfig.app.json
Ver MyConstants.js static ANONYMOUS_PATHS = ['/uechat'];
*/
const PAGINAS = [
  { id: 'ejflabmodule', module: 'EjflabmoduleModule' },
  { id: 'imagiation', module: 'ImagiationModule' },
  { id: 'gcp', module: 'GcpModule' },
];

for (let i = 0; i < PAGINAS.length; i++) {
  const actual = PAGINAS[i];
  routes.push({
    path: `${actual.id}`,
    //canActivate: [AuthGuard],
    //data: { authGuardPipe: redirectUnauthorizedToLogin },
    loadChildren: () =>
      import(`./views/${actual.id}/${actual.id}.module`).then(
        (m) => m[actual.module]
      ),
  });
  routes.push({
    path: `${actual.id}/p/:path`,
    //canActivate: [AuthGuard],
    //data: { authGuardPipe: redirectUnauthorizedToLogin },
    loadChildren: () =>
      import(`./views/${actual.id}/${actual.id}.module`).then(
        (m) => m[actual.module]
      ),
  });
  routes.push({
    path: `${actual.id}/p/:path/:detail`,
    //canActivate: [AuthGuard],
    //data: { authGuardPipe: redirectUnauthorizedToLogin },
    loadChildren: () =>
      import(`./views/${actual.id}/${actual.id}.module`).then(
        (m) => m[actual.module]
      ),
  });
  routes.push({
    path: `${actual.id}/:id`,
    //canActivate: [AuthGuard],
    //data: { authGuardPipe: redirectUnauthorizedToLogin },
    loadChildren: () =>
      import(`./views/${actual.id}/${actual.id}.module`).then(
        (m) => m[actual.module]
      ),
  });
}

routes.push({
  path: '**',
  redirectTo: '',
  pathMatch: 'full',
});

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
