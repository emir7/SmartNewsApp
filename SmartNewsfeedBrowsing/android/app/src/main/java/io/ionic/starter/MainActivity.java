package io.ionic.starter;

import android.Manifest;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.image.downloader.my.MyImageDownloader;
import com.users.pa.recognition.UsersPARecognition;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    ActivityCompat.requestPermissions(this,
            new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
            101);
    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      // Ex: add(TotallyAwesomePlugin.class);
        add(MyImageDownloader.class);
        add(UsersPARecognition.class);
    }});
  }
}
