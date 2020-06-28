package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.ArrayList;
import java.util.Arrays;

import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;

public class ModelPredictor extends AsyncTask<Void, Void, JSObject> {

    private Context ctx;
    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;
    private float decisionBoundry;
    private PluginCall call;
    private Plugin plugin;
    private ArrayList<Attribute> attributes;

    public AsyncResponse delegate = null;//Call back interface

    public ModelPredictor(Context ctx, PluginCall call, Plugin plugin, AsyncResponse delegate){
        super();
        this.ctx = ctx;
        sharedpreferences = getCtx().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        this.setDecisionBoundry(sharedpreferences.getFloat("boundry", 0.5f));
        this.call = call;
        this.plugin = plugin;
        this.delegate = delegate;
    }


    public void setDecisionBoundry(float val){
        this.decisionBoundry = val;
    }

    public float getDecisionBoundry(){
        return this.decisionBoundry;
    }

    public Context getCtx(){
        return this.ctx;
    }

    public PluginCall getCall(){
        return this.call;
    }

    public void setCall(PluginCall call) {
        this.call = call;
    }

    public Plugin getPlugin() {
        return plugin;
    }

    public void setPlugin(Plugin plugin) {
        this.plugin = plugin;
    }

    public Instances initDataset(){
        ArrayList<Attribute> atts = new ArrayList<Attribute>();

        ArrayList<String> userActivityVals = new ArrayList<String>();
        userActivityVals.add("STILL");
        userActivityVals.add("ON_FOOT");
        userActivityVals.add("IN_VEHICLE");
        atts.add(new Attribute("user_activity", userActivityVals));

        atts.add(new Attribute("e_brightness"));

        ArrayList<String> themeVals = new ArrayList<String>();
        themeVals.add("light-theme");
        themeVals.add("dark-theme");
        atts.add(new Attribute("theme", themeVals));

        ArrayList<String> layoutVals = new ArrayList<String>();
        layoutVals.add("xLargeCards");
        layoutVals.add("largeCards");
        atts.add(new Attribute("layout", layoutVals));

        ArrayList<String> fontSizeVals = new ArrayList<String>();
        fontSizeVals.add("large-font");
        fontSizeVals.add("small-font");
        atts.add(new Attribute("fontSize", fontSizeVals));

        ArrayList<String> outputVals = new ArrayList<String>();
        outputVals.add("N");
        outputVals.add("Y");
        atts.add(new Attribute("output", outputVals));
        attributes = atts;
        return new Instances("Dataset", atts, 0);
    }

    @Override
    protected JSObject doInBackground(Void... voids) {
        RandomForest rf = MLUtils.getModel(getCtx().getExternalFilesDir(null).getAbsoluteFile() + "/ModelDEV/model");
        if(rf == null){
            return null;
        }
        String [] possibleThemes = new String[]{"light-theme", "dark-theme"};
        String [] possibleLayouts = new String[]{"xLargeCards", "largeCards"};
        String [] possibleFontSizes = new String[]{"small-font", "large-font"};

        String userActivity = this.getCall().getString("u");
        double envBrightness = Double.parseDouble(this.getCall().getString("e"));
        Instances dataset = initDataset();
        dataset.setClassIndex(dataset.numAttributes() - 1);
        JSArray jsArray = new JSArray();
        int i = 0;
        JSObject response = new JSObject();


        double maxProbability = 0;
        for(String theme : possibleThemes){
            for(String layout : possibleLayouts){
                for(String fontSize: possibleFontSizes){
                    Instance instance = new DenseInstance(5);
                    try {
                        instance.setValue(attributes.get(0), userActivity);
                        instance.setValue(attributes.get(1), envBrightness);
                        instance.setValue(attributes.get(2), theme);
                        instance.setValue(attributes.get(3), layout);
                        instance.setValue(attributes.get(4), fontSize);
                        dataset.add(instance);
                        double result [] = rf.distributionForInstance(dataset.lastInstance());

                        Log.d(Constants.DEBUG_VAR, "UA = "+userActivity + " envb = "+envBrightness + " THEME = "+theme + " FONTSIZE = "+fontSize + " LAYOUT = "+layout +" probs = "+ Arrays.toString(result));

                        ModelOutput modelOutput = new ModelOutput(theme, layout, fontSize, result[1]);

                        if(modelOutput.getProbability() > maxProbability){
                            maxProbability = modelOutput.getProbability();
                        }

                        jsArray.put(i, modelOutput.converToJSObject());
                        i++;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }


        Log.d(Constants.DEBUG_VAR, "maxProbablity = "+maxProbability);
        sharedpreferences.edit().putFloat("maxProbability",(float)maxProbability).apply();

        try {
            response.put("a", jsArray);
            response.put("b", getDecisionBoundry());
            return response;
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    @Override
    protected void onPostExecute(JSObject jsObject) {
        delegate.processFinish(jsObject);
    }
}
