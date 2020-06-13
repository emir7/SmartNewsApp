package com.ml.plugin;

import android.os.AsyncTask;
import android.os.Build;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkInfo;
import androidx.work.WorkManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.common.util.concurrent.ListenableFuture;


import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutionException;

import weka.core.Instance;
import weka.core.Instances;
import weka.core.converters.CSVLoader;


@NativePlugin()
public class MachineLearning extends Plugin {

    public void trenirajPonovno(){
        Log.d("EO_ME", "dou sm  builderja");
        OneTimeWorkRequest.Builder builder = new OneTimeWorkRequest.Builder(NekWorker.class);

        WorkManager
                .getInstance()
                .enqueue(builder.build());
    }

    @PluginMethod()
    public void trainClf(final PluginCall call){

        if(isWorkScheduled("classifierTrainerML")){
            Log.d("EO_ME", "ne treniram");
            // nemors sprasevt zdej nc
            JSObject ret = new JSObject();
            ret.put("s", "busy");
            call.success(ret);
        }else{
            Log.d("EO_ME", "treniram");
            JSObject ret = new JSObject();
            ret.put("s", "free");
            call.success(ret);
            Data.Builder dataBuilder = new Data.Builder();

            dataBuilder.putBoolean("isFirstTime", call.getBoolean("firstTime"));
            if(call.getBoolean("firstTime")){
                SetInitializer setInitializer = new SetInitializer(getContext());
                setInitializer.createDatasetFromScratch(getContext().getExternalFilesDir(null).getAbsolutePath()+"/Dataset/fullset.csv");
            }else{
                dataBuilder.putStringArray("newData", call.getString("newData").split(";"));
                dataBuilder.putBoolean("banditDecidedToAsk", call.getBoolean("banditDecidedToAsk"));
                dataBuilder.putInt("banditPull", call.getInt("banditPull"));
            }

            // lahko me sprasujes zdej
            Constraints.Builder constraintsBuilder = new Constraints.Builder().setRequiresBatteryNotLow(true);

            Log.d("EO_ME", "dou sm  builderja");
            OneTimeWorkRequest.Builder builder = new OneTimeWorkRequest.Builder(ClassifierTrainer2.class);

            builder.setConstraints(constraintsBuilder.build());
            builder.setInputData(dataBuilder.build());

            WorkManager.getInstance().
                    enqueueUniqueWork("classifierTrainerML", ExistingWorkPolicy.KEEP, builder.build());

        }

    }

    private boolean isWorkScheduled(String tag) {
        WorkManager instance = WorkManager.getInstance();
        ListenableFuture<List<WorkInfo>> statuses = instance.getWorkInfosByTag(tag);
        try {
            boolean running = false;
            List<WorkInfo> workInfoList = statuses.get();
            for (WorkInfo workInfo : workInfoList) {
                WorkInfo.State state = workInfo.getState();
                running = state == WorkInfo.State.RUNNING | state == WorkInfo.State.ENQUEUED;
            }
            return running;
        } catch (ExecutionException e) {
            e.printStackTrace();
            return false;
        } catch (InterruptedException e) {
            e.printStackTrace();
            return false;
        }
    }


    @PluginMethod
    public void classifierPrediction(final PluginCall call){
        ModelPredictor modelPredictor = new ModelPredictor(getContext(), call, this, new AsyncResponse() {
            @Override
            public void processFinish(JSObject output) {

                if(output != null){
                    call.success(output);
                }else{
                    JSObject ret = new JSObject();
                    ret.put("s", "ok");
                    call.success(ret);
                }
            }
        });

        if( Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB ) {
            modelPredictor.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
        } else {
            modelPredictor.execute();
        }

    }

    @PluginMethod
    public void countByUA(PluginCall call){
        String testPath = getContext().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTrain.csv";
        Instances currentDataset = readDatasetFromFile(testPath);
        Log.d("VALS", ""+currentDataset.attribute("u").numValues());
        Log.d("VALS", ""+currentDataset.attribute("u"));

        int cStill = 0;
        int cFoot = 0;
        int cVehicle = 0;
        for(Instance instance : currentDataset){
            if(instance.stringValue(0).equals("STILL")){
              cStill++;
            }else if(instance.stringValue(0).equals("ON_FOOT")){
                cFoot++;
            }else {
                cVehicle++;
            }
        }

        JSObject jsObject = new JSObject();
        jsObject.put("cStill", cStill);
        jsObject.put("cFoot", cFoot);
        jsObject.put("cVehicle", cVehicle);

        call.success(jsObject);

    }

    @PluginMethod
    public void banditFileExists(PluginCall call){
        String path = getContext().getExternalFilesDir(null).getAbsoluteFile() + "/bandits/data.json";
        File f = new File(path);
        if(!f.exists()){
            f.getParentFile().mkdirs();
            try {
                FileWriter fileWriter = new FileWriter(f);
                fileWriter.write("");
                fileWriter.flush();
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
                JSObject jsObject = new JSObject();
                jsObject.put("e", true);
            }

            JSObject jsObject = new JSObject();
            jsObject.put("exists", false);
            call.success(jsObject);
        }else{
            JSObject jsObject = new JSObject();
            jsObject.put("exists", true);
            call.success(jsObject);
        }

    }

    public Instances readDatasetFromFile(String path){
        CSVLoader csvLoader = new CSVLoader();

        Instances data = null;
        try {
            csvLoader.setSource(new File(path));
            data = csvLoader.getDataSet();
            data.setClassIndex(data.numAttributes() - 1);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return data;
    }

    @Override
    protected void handleOnDestroy() {
        Log.d("EO_ME", "on_destroy se je poklicu11");
        //trenirajPonovno();
        super.handleOnDestroy();
    }
}
