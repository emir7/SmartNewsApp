declare module "@capacitor/core" {
  interface PluginRegistry {
    CustomChromeBrowser: CustomChromeBrowserPlugin;
  }
}

export interface CustomChromeBrowserPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
