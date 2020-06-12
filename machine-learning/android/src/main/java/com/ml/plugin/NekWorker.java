package com.ml.plugin;


import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class NekWorker extends Worker {

    public NekWorker(Context context, WorkerParameters params){
        super(context, params);
    }


    @NonNull
    @Override
    public Result doWork() {
        Log.d("EO_ME", "treniram_model");
        trenirajModel();
        return Result.success();
    }

    public void trenirajModel(){
        Log.d("EO_ME", "trenirajModel");
        try {
            Thread.sleep(60000);
            Log.d("EO_ME", "trenirajModel konec1");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        Log.d("EO_ME", "trenirajModel konec2");

    }
}
