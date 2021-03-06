package io.ionic.starter;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.image.downloader.my.MyImageDownloader;
import com.ml.plugin.MachineLearning;
import com.my.custom.browser.plugin.CustomChromeBrowserZwei;
import com.my.sensors.MySensors;
import com.users.pa.recognition.UsersPARecognition;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      add(MyImageDownloader.class);
      add(UsersPARecognition.class);
      add(MySensors.class);
      add(CustomChromeBrowserZwei.class);
      add(MachineLearning.class);
    }});
  }
}
