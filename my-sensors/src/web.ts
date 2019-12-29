import { WebPlugin } from '@capacitor/core';
import { MySensorsPlugin } from './definitions';

export class MySensorsWeb extends WebPlugin implements MySensorsPlugin {
  constructor() {
    super({
      name: 'MySensors',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const MySensors = new MySensorsWeb();

export { MySensors };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(MySensors);
