import { ApplicationRef, NgModuleRef } from '@angular/core';
import { createNewHosts } from '@angularclass/hmr';

export function hmrBootstrap(module: any, bootstrap: () => Promise<any>) {
  let ngModule: NgModuleRef<any>;
  module.hot.accept();
  
  bootstrap().then(mod => {
    ngModule = mod;
    const appRef: ApplicationRef = mod.injector.get(ApplicationRef);

    module.hot.dispose(() => {
      const elements = appRef.components.map(c => c.location.nativeElement);
      const makeVisible = createNewHosts(elements);
      try {
        ngModule.destroy();
        makeVisible();
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
    });

    module.hot.accept(() => {
      bootstrap().then(newMod => {
        try {
          ngModule.destroy();
          ngModule = newMod;
        } catch (e) {
          console.warn('Error during update:', e);
        }
      });
    });
  });
}