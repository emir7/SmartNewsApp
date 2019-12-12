declare module "@capacitor/core" {
  interface PluginRegistry {
    MyImageDownloader: MyImageDownloaderPlugin;
  }
}

export interface MyImageDownloaderPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
