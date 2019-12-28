declare module "@capacitor/core" {
  interface PluginRegistry {
    UsersPARecognition: UsersPARecognitionPlugin;
  }
}

export interface UsersPARecognitionPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
