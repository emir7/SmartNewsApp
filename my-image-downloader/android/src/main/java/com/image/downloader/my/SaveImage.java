package com.image.downloader.my;

import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.os.Environment;
import android.util.Log;

import com.squareup.picasso.Picasso;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

public class SaveImage extends AsyncTask<Void, Void, Void> {

    private static final String LOG_CHANNEL = "MY_DOWNLOADER";

    private List<String> urls;
    private List<String> names;

    public SaveImage(List<String> urls, List<String>names){
        super();
        this.urls = urls;
        this.names = names;
    }

    @Override
    protected Void doInBackground(Void... voids) {
        Log.i(LOG_CHANNEL, "doInBackground1");

        try{

            for(int i = 0; i < urls.size(); i++){
                createImage(urls.get(i), names.get(i));
                Log.i(LOG_CHANNEL, "shranjena slika2 "+i);
            }

        }catch (Exception e){
            Log.i(LOG_CHANNEL+"e1", e.toString());
        }

        return null;
    }

    private void createImage(String url, String name){
        Log.i(LOG_CHANNEL, "shranjena slika2222222 "+url + " =========== "+name);

        String path = Environment.getExternalStorageDirectory() + "/" + "MyFirstApp/";

        File dir = new File(path);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File file = new File (path + name + ".jpg");
        FileOutputStream fos = null;
        try {
            Log.i(LOG_CHANNEL, "gucci2");
            fos = new FileOutputStream(file);
            Bitmap bitmap = Picasso.get().load(url).get();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 60, fos);
            Log.i(LOG_CHANNEL, "gucci3");
        } catch (IOException e) {
            Log.i(LOG_CHANNEL, "gucci4");
            e.printStackTrace();
        } finally {
            try {
                if(fos != null)
                    fos.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void onPostExecute(Void aVoid) {
        super.onPostExecute(aVoid);
        Log.i(LOG_CHANNEL, "onPostExecute");

    }

    @Override
    protected void onPreExecute() {
        super.onPreExecute();
        Log.i(LOG_CHANNEL, "onPreExecute4");
    }
}
