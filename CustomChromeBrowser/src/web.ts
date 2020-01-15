import { WebPlugin } from '@capacitor/core';
import { CustomChromeBrowserPlugin } from './definitions';

export class CustomChromeBrowserWeb extends WebPlugin implements CustomChromeBrowserPlugin {
  constructor() {
    super({
      name: 'CustomChromeBrowser',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const CustomChromeBrowser = new CustomChromeBrowserWeb();

export { CustomChromeBrowser };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CustomChromeBrowser);
