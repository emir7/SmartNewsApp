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
import androidx.work.WorkManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.ml.plugin.data.api.sender.Sender;


import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

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
            Log.d(Constants.DEBUG_VAR, "NE treniram ker sm busy");
            // nemors sprasevt zdej nc
            JSObject ret = new JSObject();
            ret.put("s", "busy");
            call.success(ret);
        }else{
            Log.d(Constants.DEBUG_VAR, "treniram ker sm free");
            JSObject ret = new JSObject();
            ret.put("s", "free");
            call.success(ret);
            Data.Builder dataBuilder = new Data.Builder();
            this.sharedpreferences.edit().putBoolean("working", true).apply();
            dataBuilder.putBoolean("isFirstTime", call.getBoolean("firstTime"));
            dataBuilder.putString("username", call.getString("username"));

            // posljemo kot string ker mamo probleme ce user zapre aplikacijo sred treniranja se ista instanca 2x doda, NE SME SE!
            dataBuilder.putString("time", call.getString("t"));

            if(call.getBoolean("firstTime")){
                SetInitializer setInitializer = new SetInitializer(getContext());
                String fullDSpath = getContext().getExternalFilesDir(null).getAbsolutePath()+"/DatasetDEV/fullset.csv";
                String banditPath = getContext().getExternalFilesDir(null).getAbsolutePath()+"/banditsDEV/data.json";
                setInitializer.createDatasetFromScratch(fullDSpath, banditPath);
            }else{
                dataBuilder.putStringArray("newData", call.getString("newData").split(";"));
                dataBuilder.putBoolean("banditDecidedToAsk", call.getBoolean("banditDecidedToAsk"));
                dataBuilder.putInt("banditPull", call.getInt("banditPull"));
                dataBuilder.putString("predictionDATA", call.getString("predictionDATA"));
            }

            // lahko me sprasujes zdej
            Constraints.Builder constraintsBuilder = new Constraints.Builder().setRequiresBatteryNotLow(true);

            OneTimeWorkRequest.Builder builder = new OneTimeWorkRequest.Builder(ClassifierTrainer2.class);

            builder.setConstraints(constraintsBuilder.build());
            builder.setInputData(dataBuilder.build());

            WorkManager.getInstance().
                    enqueueUniqueWork("classifiertrain", ExistingWorkPolicy.KEEP, builder.build());

        }

    }

    @PluginMethod
    public void sendZeroReward(PluginCall call){
        Log.d(Constants.DEBUG_VAR, "posiljam na server zero reward");


        String username = call.getString("username");
        String predictionDATA = call.getString("predictionDATA");
        int banditPull = call.getInt("banditPull");

        sendZeroReward(username, predictionDATA, banditPull);
        call.resolve();
    }

    private void sendZeroReward(String username, String predictionDATA, int banditPull){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {
            String banditPath = getContext().getExternalFilesDir(null).getAbsoluteFile() + "/banditsDEV/data.json";
            String jsonBanditString = MLUtils.readBanditFile(banditPath);
            if(jsonBanditString == null){
                return;
            }
            JSONObject currentBandit = new JSONObject(jsonBanditString);


            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("username", username);

            String [] parsedCSVArr = predictionDATA.split(";");
            JSONObject predictionObj = new JSONObject();

            predictionObj.put("userActivity", parsedCSVArr[0]);
            predictionObj.put("environmentBrightness", Integer.parseInt(parsedCSVArr[1]));
            predictionObj.put("theme", parsedCSVArr[2]);
            predictionObj.put("layout", parsedCSVArr[3]);
            predictionObj.put("fontSize", parsedCSVArr[4]);
            predictionObj.put("predictionProbability", Double.parseDouble(parsedCSVArr[6]));
            predictionObj.put("output", parsedCSVArr[7]);

            jsonBody.put("prediction", predictionObj);

            JSONObject banditsData = new JSONObject();
            banditsData.put("trialIndex", currentBandit.getInt("allTimePulls"));
            banditsData.put("banditIndex", banditPull);
            banditsData.put("banditDecision", false);
            banditsData.put("regret", currentBandit.getInt("regret"));
            banditsData.put("reward", 0);
            banditsData.put("totalReward", currentBandit.getDouble("totalReward"));

            jsonBody.put("banditsData", banditsData);
            jsonBody.put("currentBandit", currentBandit);


            sender.sendPostRequest(Constants.SERVER_IP+"/phase1/metrics", jsonBody.toString());

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private boolean isWorkScheduled() {
        sharedpreferences = getContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);

        Log.d(Constants.DEBUG_VAR, " === isWorkScheduled");
        Log.d(Constants.DEBUG_VAR, "working bool je "+sharedpreferences.getBoolean("working", false));
        return sharedpreferences.getBoolean("working", false);
    }


    @PluginMethod
    public void classifierPrediction(final PluginCall call){
        Log.d(Constants.DEBUG_VAR, "klasifikacija se pokliče");
        if(!isWorkScheduled()){
            ModelPredictor modelPredictor = new ModelPredictor(getContext(), call, this, new AsyncResponse() {
                @Override
                public void processFinish(JSObject output) {

                    if(output != null){
                        Log.d(Constants.DEBUG_VAR, "tole vračam clientu "+output.toString());
                        call.success(output);
                    }else{
                        Log.d(Constants.DEBUG_VAR, "ERROR VRAČAM CLIENTU");
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
        String testPath = getContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTrain.csv";
        Instances currentDataset = readDatasetFromFile(testPath);

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
        String path = getContext().getExternalFilesDir(null).getAbsoluteFile() + "/banditsDEV/data.json";
        File f = new File(path);
        Scanner sc = null;
        try {
            sc = new Scanner(f);
            String bString = sc.next();
            if(bString.equals("NONE")){
                JSObject jsObject = new JSObject();
                jsObject.put("exists", false);
                jsObject.put("e", false);
                call.success(jsObject);
            }else{
                JSObject jsObject = new JSObject();
                jsObject.put("exists", true);
                jsObject.put("e", false);
                call.success(jsObject);
            }
        } catch (FileNotFoundException e) {
            JSObject jsObject = new JSObject();
            jsObject.put("e", true);
            call.success(jsObject);
            e.printStackTrace();
        }finally {
            if(sc != null){
                sc.close();
            }
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


}
