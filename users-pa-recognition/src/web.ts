import { WebPlugin } from '@capacitor/core';
import { UsersPARecognitionPlugin } from './definitions';

export class UsersPARecognitionWeb extends WebPlugin implements UsersPARecognitionPlugin {
  constructor() {
    super({
      name: 'UsersPARecognition',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const UsersPARecognition = new UsersPARecognitionWeb();

export { UsersPARecognition };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(UsersPARecognition);
