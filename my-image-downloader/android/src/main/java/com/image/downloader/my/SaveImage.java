package com.image.downloader.my;

import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.util.Log;

import com.squareup.picasso.Picasso;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class SaveImage extends AsyncTask<Void, Void, Void> {

    private static final String LOG_CHANNEL = "MY_DOWNLOADER";

    private List<String> urls;
    private List<String> names;
    private String root;

    public SaveImage(List<String> urls, List<String>names, String root){
        super();
        this.urls = urls;
        this.names = names;
        this.root = root;
    }

    public void deleteImages() {
        String imagesPath = root + "/Images";
        File directory = new File(imagesPath);

        File [] files = directory.listFiles();
        if(files == null) {
            return;
        }
        Log.d(LOG_CHANNEL, "Size = "+files.length);

        for (int i = 0; i < files.length; i++) {
            Date currentDate = new Date();
            Date fileCreation = new Date(files[i].lastModified());
            long diff = currentDate.getTime() - fileCreation.getTime();
            long days = TimeUnit.DAYS.convert(diff, TimeUnit.MILLISECONDS);
            if (days >= 2) {
                Log.d(LOG_CHANNEL, "FileName: "+files[i].getName() + " deleted");
                files[i].delete();
            }
        }
    }

    @Override
    protected Void doInBackground(Void... voids) {
        Log.i(LOG_CHANNEL, "doInBackground1");

        deleteImages();
        try{

            for(int i = 0; i < urls.size(); i++){
                createImage(urls.get(i), names.get(i));
            }

        }catch (Exception e){
            e.printStackTrace();
        }

        return null;
    }

    private void createImage(String url, String name){

        if(url.equals("assets/noImg.jpg")) {
            return;
        }


        String path = root + "/Images/";

        File dir = new File(path);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File file = new File (path + name + ".jpg");

        if(file.exists()) {
            return;
        }


        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(file);
            Bitmap bitmap = Picasso.get().load(url).get();

            int currentWidth = bitmap.getWidth();
            int currentHeight = bitmap.getHeight();


            while(currentWidth >= 512 && currentHeight>=512){
                currentHeight/=2;
                currentWidth/=2;
            }


            int newWidth = Math.round(currentWidth);
            int newHeight = Math.round(currentHeight);

            Bitmap scaledImage = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true);
            if(bitmap != scaledImage){
                bitmap.recycle();
            }
            scaledImage.compress(Bitmap.CompressFormat.JPEG, 60, fos);

        } catch (IOException e) {
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
    }

    @Override
    protected void onPreExecute() {
        super.onPreExecute();
    }
}
