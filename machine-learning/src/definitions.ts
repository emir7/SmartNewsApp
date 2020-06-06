declare module "@capacitor/core" {
  interface PluginRegistry {
    MachineLearning: MachineLearningPlugin;
  }
}

export interface MachineLearningPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
