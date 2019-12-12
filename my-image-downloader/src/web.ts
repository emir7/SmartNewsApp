import { WebPlugin } from '@capacitor/core';
import { MyImageDownloaderPlugin } from './definitions';

export class MyImageDownloaderWeb extends WebPlugin implements MyImageDownloaderPlugin {
  constructor() {
    super({
      name: 'MyImageDownloader',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const MyImageDownloader = new MyImageDownloaderWeb();

export { MyImageDownloader };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(MyImageDownloader);
