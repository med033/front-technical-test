import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { hmrBootstrap } from './hmr';

declare const module: any;

const bootstrap = () => bootstrapApplication(AppComponent, appConfig);

if (module.hot) {
	hmrBootstrap(module, bootstrap);
} else {
	bootstrap().catch(err => console.error(err));
}
