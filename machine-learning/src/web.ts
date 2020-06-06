import { WebPlugin } from '@capacitor/core';
import { MachineLearningPlugin } from './definitions';

export class MachineLearningWeb extends WebPlugin implements MachineLearningPlugin {
  constructor() {
    super({
      name: 'MachineLearning',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const MachineLearning = new MachineLearningWeb();

export { MachineLearning };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(MachineLearning);
