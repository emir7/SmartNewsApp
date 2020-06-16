package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
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
import com.ml.plugin.data.api.sender.Sender;


import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import weka.core.Instance;
import weka.core.Instances;
import weka.core.converters.CSVLoader;


@NativePlugin()
public class MachineLearning extends Plugin {
    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;

    @PluginMethod()
    public void trainClf(final PluginCall call){

        if(isWorkScheduled()){
            Log.d("EO_ME", "NE treniram ker sm busy");
            // nemors sprasevt zdej nc
            JSObject ret = new JSObject();
            ret.put("s", "busy");
            call.success(ret);
        }else{
            Log.d("EO_ME", "treniram ker sm free");
            JSObject ret = new JSObject();
            ret.put("s", "free");
            call.success(ret);
            Data.Builder dataBuilder = new Data.Builder();
            this.sharedpreferences.edit().putBoolean("working", true).apply();
            dataBuilder.putBoolean("isFirstTime", call.getBoolean("firstTime"));
            dataBuilder.putString("username", call.getString("username"));

            if(call.getBoolean("firstTime")){
                SetInitializer setInitializer = new SetInitializer(getContext());
                setInitializer.createDatasetFromScratch(getContext().getExternalFilesDir(null).getAbsolutePath()+"/DatasetDEV/fullset.csv");
            }else{
                dataBuilder.putStringArray("newData", call.getString("newData").split(";"));
                dataBuilder.putBoolean("banditDecidedToAsk", call.getBoolean("banditDecidedToAsk"));
                dataBuilder.putInt("banditPull", call.getInt("banditPull"));
                dataBuilder.putString("predictionDATA", call.getString("predictionDATA"));
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

    @PluginMethod
    public void sendZeroReward(PluginCall call){
        Log.d("EO_ME", "posiljam na server zero reward");

        String username = call.getString("username");
        String predictionDATA = call.getString("predictionDATA");
        int banditPull = call.getInt("banditPull");
        sendDataAPI(username, predictionDATA, banditPull);
        call.resolve();
        //call.reject("Problem while sending request to the server!");
    }

    private void sendDataAPI(String username, String predictionDATA, int banditPull){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {
            String banditPath = getContext().getExternalFilesDir(null).getAbsoluteFile() + "/banditsDEV/data.json";
            String jsonBanditString = MLUtils.readBanditFile(banditPath);
            if(jsonBanditString == null){
                return;
            }
            JSONObject banditData = new JSONObject(jsonBanditString);

            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", false);
            jsonBody.put("username", username);
            jsonBody.put("dataModel", "same;as;before");
            jsonBody.put("predictionDATA", predictionDATA);

            int currentNumberOfPulls = banditData.getInt("allTimePulls");
            int regret = banditData.getInt("regret");
            int totalReward = banditData.getInt("totalReward");

            jsonBody.put("banditCSV", currentNumberOfPulls+";"+banditPull+";"+"false;"+regret+";"+totalReward);
            jsonBody.put("banditJSON", banditData);
            sender.sendPostRequest("http://163.172.169.249:9082/phase1/metrics", jsonBody.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private boolean isWorkScheduled() {
        sharedpreferences = getContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);

        Log.d("EO_ME", " === isWorkScheduled");
        Log.d("EO_ME", "working bool je "+sharedpreferences.getBoolean("working", false));
        return sharedpreferences.getBoolean("working", false);
    }


    @PluginMethod
    public void classifierPrediction(final PluginCall call){
        Log.d("EO_ME", "klasifikacija se pokliče");
        if(!isWorkScheduled()){
            ModelPredictor modelPredictor = new ModelPredictor(getContext(), call, this, new AsyncResponse() {
                @Override
                public void processFinish(JSObject output) {

                    if(output != null){
                        Log.d("EO_ME", "tole vračam clientu "+output.toString());
                        call.success(output);
                    }else{
                        Log.d("EO_ME", "ERROR VRAČAM CLIENTU");
                        call.reject("Error while training model");
                    }

                }
            });

            if( Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB ) {
                modelPredictor.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
            } else {
                modelPredictor.execute();
            }
        }else{
            call.reject("Error while predicting IM BUSY WITH MODEL TRAININGA");
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
