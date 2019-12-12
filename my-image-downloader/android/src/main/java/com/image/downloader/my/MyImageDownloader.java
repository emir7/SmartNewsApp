package com.image.downloader.my;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.Arrays;
import java.util.List;

@NativePlugin()
public class MyImageDownloader extends Plugin {

    private static final String LOG_CHANNEL = "MY_DOWNLOADER";


    @PluginMethod()
    public void saveImage(PluginCall call) {
        Log.i(LOG_CHANNEL, "echo method is called.");
        try {
            List<String> urlList = call.getArray("urls").toList();
            List<String> nameList = call.getArray("names").toList();
            SaveImage saveImage = new SaveImage(urlList, nameList);
            saveImage.execute();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        JSObject ret = new JSObject();
        ret.put("value", "ok");
        call.success(ret);
    }

    @PluginMethod()
    public void getImage(PluginCall call) {
        Log.i(LOG_CHANNEL, "getImage method is called.");
        Log.i(LOG_CHANNEL, call.getString("name"));
        String root = Environment.getExternalStorageDirectory().toString();
        File imgFile  = new File(root + "/MyFirstApp/"+call.getString("name")+".jpg");
        Log.i(LOG_CHANNEL, "sorju");
        if(imgFile.exists()){
            Log.i(LOG_CHANNEL, "hadukeeeeen");
            Bitmap myBitmap = BitmapFactory.decodeFile(imgFile.getAbsolutePath());
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            myBitmap.compress(Bitmap.CompressFormat.JPEG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream .toByteArray();
            String encoded = Base64.encodeToString(byteArray, Base64.DEFAULT);
            JSObject ret = new JSObject();
            ret.put("b64", encoded);
            call.success(ret);
        }else {
            JSObject ret = new JSObject();
            ret.put("b64", "noImage");
            call.success(ret);
        }
    }


}
