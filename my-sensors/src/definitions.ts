declare module "@capacitor/core" {
  interface PluginRegistry {
    MySensors: MySensorsPlugin;
  }
}

export interface MySensorsPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
