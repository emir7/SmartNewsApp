package com.ml.plugin;

import android.os.AsyncTask;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;

import weka.classifiers.Evaluation;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.converters.CSVLoader;


@NativePlugin()
public class MachineLearning extends Plugin {

    @PluginMethod()
    public void trainClf(final PluginCall call){
        ClassifierTrainer classifierTrainer = new ClassifierTrainer(getContext(), call, this, new AsyncResponse() {
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
            classifierTrainer.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
        } else {
            classifierTrainer.execute();
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

}
