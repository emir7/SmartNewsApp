package com.image.downloader.my;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.os.Build;
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
import java.util.List;

@NativePlugin()
public class MyImageDownloader extends Plugin {

    private static final String LOG_CHANNEL = "MY_DOWNLOADER";
    private static String root;

    @PluginMethod()
    public void saveImage(PluginCall call) {

        JSObject ret = new JSObject();
        ret.put("value", "ok");
        call.success(ret);

        root = getContext().getExternalFilesDir(null).getAbsolutePath();

        Log.i(LOG_CHANNEL, "saveImage method is called.");
        try {
            List<String> urlList = call.getArray("urls").toList();
            List<String> nameList = call.getArray("names").toList();
            SaveImage saveImage = new SaveImage(urlList, nameList, getContext().getExternalFilesDir(null).getAbsolutePath());
            if( Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB ) {
               saveImage.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
            } else {
                saveImage.execute();
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

    }

    @PluginMethod()
    public void getImage(PluginCall call) {
        Log.i(LOG_CHANNEL, "getImage method is called." +call.getString("name"));
        if(call.getString("name").equals("assets/noImg.jpg")) {
            JSObject ret = new JSObject();
            ret.put("b64", "noImage");
            call.success(ret);
            return;
        }
        try {
            String root = getContext().getExternalFilesDir(null).getAbsolutePath();
            File imgFile  = new File(root + "/Images/"+call.getString("name")+".jpg");
            if(imgFile.exists()){
                Bitmap myBitmap = BitmapFactory.decodeFile(imgFile.getAbsolutePath());
                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                myBitmap.compress(Bitmap.CompressFormat.JPEG, 100, byteArrayOutputStream);
                byte[] byteArray = byteArrayOutputStream .toByteArray();
                String encoded = Base64.encodeToString(byteArray, Base64.DEFAULT);
                JSObject ret = new JSObject();
                ret.put("b64", encoded);
                call.success(ret);
            }else {
                Log.i(LOG_CHANNEL, "Could not find image. "+call.getString("name"));
                JSObject ret = new JSObject();
                ret.put("b64", "noImage");
                call.success(ret);
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            JSObject ret = new JSObject();
            ret.put("b64", "noImage");
            call.success(ret);
        }

    }


}
