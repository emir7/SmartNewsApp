package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;

import org.json.JSONException;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.ObjectOutputStream;
import java.util.ArrayList;

import weka.classifiers.Evaluation;
import weka.classifiers.evaluation.ThresholdCurve;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.converters.CSVLoader;

public class ClassifierTrainer extends AsyncTask<Void, Void, JSObject> {

    public AsyncResponse delegate = null;//Call back interface

    private Context ctx;
    private double decisionBoundry;

    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;

    public static final String MODEL_PRECISION = "precision";
    public static final String MODEL_DECISION_BOUNDRY = "boundry";

    private PluginCall pluginCall;
    private Plugin plugin;

    private Instances trainset;
    private Instances testset;

    public ClassifierTrainer(Context ctx, PluginCall pluginCall, Plugin plugin, AsyncResponse asyncResponse){
        super();
        this.ctx = ctx;
        sharedpreferences = getCtx().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        editor = sharedpreferences.edit();
        this.pluginCall = pluginCall;
        this.plugin = plugin;
        delegate = asyncResponse;//Assigning call back interfacethrough constructor
    }

    public RandomForest trainClassifier(){
        RandomForest rf = null;
        if(getPluginCall().getBoolean("firstTime")){
            Instances dataset = createDatasetFromScratch();
            Instances [] trainTestSplit = trainTestSplit(dataset);
            String trainPath = getCtx().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTrain.csv";
            String testPath = getCtx().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTest.csv";

            trainset = trainTestSplit[0];
            testset = trainTestSplit[1];

            writeDataToFile(trainPath, trainset, false);
            writeDataToFile(testPath, testset, false);

            rf = trainClfWithData(trainset, true);
        }else{
            JSArray newTrainingInstances = pluginCall.getArray("vals");
            Instances instances = constructDatasetHeader();
            instances.setClassIndex(instances.numAttributes()-1);
            for(int i = 0; i < newTrainingInstances.length(); i++){
                Instance instance = new DenseInstance(6);
                try {
                    Log.d("EO_ME", "u = "+ newTrainingInstances.getJSONObject(i).getString("u"));
                    Log.d("EO_ME", "e = "+ newTrainingInstances.getJSONObject(i).getString("e"));
                    Log.d("EO_ME", "t = "+ newTrainingInstances.getJSONObject(i).getString("t"));
                    Log.d("EO_ME", "l = "+ newTrainingInstances.getJSONObject(i).getString("l"));
                    Log.d("EO_ME", "f = "+ newTrainingInstances.getJSONObject(i).getString("f"));
                    Log.d("EO_ME", "o = "+ newTrainingInstances.getJSONObject(i).getString("o"));

                    instance.setValue(instances.attribute("u"), newTrainingInstances.getJSONObject(i).getString("u")); // user activity
                    instance.setValue(instances.attribute("e"), Double.parseDouble(newTrainingInstances.getJSONObject(i).getString("e"))); // env brightness
                    instance.setValue(instances.attribute("t"), newTrainingInstances.getJSONObject(i).getString("t")); // theme
                    instance.setValue(instances.attribute("l"), newTrainingInstances.getJSONObject(i).getString("l")); // layout
                    instance.setValue(instances.attribute("f"), newTrainingInstances.getJSONObject(i).getString("f")); // font size
                    instance.setValue(instances.attribute("o"), newTrainingInstances.getJSONObject(i).getString("o")); // output
                    instances.add(instance);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            rf = trainClfWithData(instances, false);
        }

        return rf;
    }

    public void serializeModel(RandomForest randomForest){
        ObjectOutputStream oos = null;
        FileOutputStream fout = null;

        String path = getCtx().getExternalFilesDir(null).getAbsoluteFile() + "/Model/model";
        File f = new File(path);
        f.getParentFile().mkdirs();
        try{
            fout = new FileOutputStream(path);
            oos = new ObjectOutputStream(fout);
            oos.writeObject(randomForest);

        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            if(oos != null){
                try {
                    oos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public RandomForest buildRF(Instances data){
        RandomForest forest = null;
        forest = new RandomForest();
        forest.setNumTrees(100);
        try {
            forest.buildClassifier(data);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return forest;
    }

    public RandomForest trainClfWithData(Instances newInstances, boolean firstTime){
        RandomForest forest;
        Log.d("EO_ME", ""+firstTime);
        if(firstTime){
            forest = buildRF(newInstances);
        }else{
            String trainPath = getCtx().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTrain.csv";
            Instances instances = readDatasetFromFile(trainPath);
            writeDataToFile(trainPath, newInstances, true);
            instances.addAll(newInstances);
            trainset = instances;
            String testPath = getCtx().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTest.csv";
            testset = readDatasetFromFile(testPath);
            forest = buildRF(trainset);
        }

        return forest;
    }

    public void writeDataToFile(String path, Instances newData, boolean append) {
        FileWriter fileWriter = null;
        try {
            if(!append){
                File f = new File(path);
                f.getParentFile().mkdirs();
                fileWriter = new FileWriter(path, append);
                fileWriter.write("u,e,t,l,f,o");
            }else{
                fileWriter = new FileWriter(path, append);
            }
            for(int i = 0; i < newData.size(); i++){
                String line = "\n"+newData.get(i).stringValue(0);
                for(int j = 1; j < newData.get(i).numAttributes(); j++){
                    if(j == 1){
                        line += ","+newData.get(i).value(j);
                    }else{
                        line += ","+newData.get(i).stringValue(j);
                    }
                }

                fileWriter.write(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if(fileWriter != null){
                try {
                    fileWriter.flush();
                    fileWriter.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
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

    private Instances[] trainTestSplit(Instances dataset){
        int trainSize = (int) Math.round(dataset.numInstances() * 0.8);
        int testSize = dataset.numInstances() - trainSize;

        dataset.randomize(new java.util.Random(5));
        Instances train = new Instances(dataset, 0, trainSize);
        Instances test = new Instances(dataset, trainSize, testSize);

        return new Instances[]{train, test};
    }

    private ThresholdPoint getThreshold(Evaluation eval) {
        ThresholdCurve tc = new ThresholdCurve();
        int classIndex = 1;
        Instances result = tc.getCurve(eval.predictions(), classIndex);


        ThresholdPoint optimalThresholdPoint = new ThresholdPoint(0, 0, 0, 100);
        for(int i = 0; i < result.numInstances(); i++) {
            double tpr = result.get(i).value(5);
            double fpr = result.get(i).value(4);
            double thr = result.get(i).value(12);

            double distance = Math.sqrt(fpr * fpr + (1 - tpr)*(1 - tpr));
            if(distance < optimalThresholdPoint.getDistance()) {
                optimalThresholdPoint = new ThresholdPoint(thr, fpr, tpr, distance);
            }

        }

        this.sharedpreferences.edit().putFloat(MODEL_DECISION_BOUNDRY, (float)optimalThresholdPoint.getThr())
            .apply();
        return optimalThresholdPoint;

    }

    private PluginCall getPluginCall(){
        return this.pluginCall;
    }

    private Instances constructDatasetHeader(){
        ArrayList<Attribute> atts = new ArrayList<Attribute>();

        ArrayList<String> userActivityVals = new ArrayList<String>();
        userActivityVals.add("STILL");
        userActivityVals.add("ON_FOOT");
        userActivityVals.add("IN_VEHICLE");
        atts.add(new Attribute("u",userActivityVals));

        atts.add(new Attribute("e"));

        ArrayList<String> themeVals = new ArrayList<String>();
        themeVals.add("light-theme");
        themeVals.add("dark-theme");
        atts.add(new Attribute("t", themeVals));

        ArrayList<String> layoutVals = new ArrayList<String>();
        layoutVals.add("xLargeCards");
        layoutVals.add("largeCards");
        atts.add(new Attribute("l", layoutVals));


        ArrayList<String> fontSizeVals = new ArrayList<String>();
        fontSizeVals.add("large-font");
        fontSizeVals.add("small-font");
        atts.add(new Attribute("f", fontSizeVals));

        ArrayList<String> outputVals = new ArrayList<String>();
        outputVals.add("N");
        outputVals.add("Y");
        atts.add(new Attribute("o", outputVals));

        return new Instances("Dataset",atts,0);
    }

    private Instances createDatasetFromScratch(){
        BufferedReader reader = null;
        Instances dataset = constructDatasetHeader();
        dataset.setClassIndex(dataset.numAttributes() - 1);
        try {

            reader = new BufferedReader(
                    new InputStreamReader( getCtx().getAssets().open("data.csv"), "UTF-8"));
            String mLine;

            reader.readLine();
            while((mLine = reader.readLine()) != null){
                String[] splitedArr = mLine.split(",");
                Instance inst = new DenseInstance(6);

                String fileWriterLine = "\n";
                for(int i = 0; i < 6; i++){
                    if(i == 1){
                        inst.setValue(dataset.attribute(i), Double.parseDouble(splitedArr[i]));
                    }else{
                        inst.setValue(dataset.attribute(i), splitedArr[i]);
                    }
                    fileWriterLine +=","+splitedArr[i];
                }



                dataset.add(inst);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if(reader != null) {
                try {
                    reader.close();
                }catch (IOException e){
                    Log.e("READER_ERROR", e.toString());
                }
            }
        }

        return dataset;

    }

    public Plugin getPlugin() {
        return plugin;
    }

    public void setPlugin(Plugin plugin) {
        this.plugin = plugin;
    }

    private Context getCtx(){
        return this.ctx;
    }

    private double getDecisionBoundry(){
        return this.decisionBoundry;
    }

    private void setDecisionBoundry(double val){
        this.decisionBoundry = val;
    }

    private double calculatePrecision(Instances test, RandomForest forest, double decisionBoundry) throws Exception {
        double tp = 0;
        double fp = 0;
        for(int i = 0; i < test.size(); i++) {
            double forestPrediction [] = forest.distributionForInstance(test.get(i));
            double prediction = 0;
            if(forestPrediction[1] >= decisionBoundry){
                prediction = 1;
            }

            if(prediction == 1){
                if(test.get(i).value(test.numAttributes() - 1) == 1){
                    tp++;
                }else{
                    fp++;
                }
            }
        }

        return tp / (tp + fp);
    }

    @Override
    protected JSObject doInBackground(Void... voids) {
        RandomForest rf = trainClassifier();
        serializeModel(rf);

        Evaluation eval = null;
        try {
            eval = new Evaluation(trainset);
            eval.evaluateModel(rf, testset);

            ThresholdPoint thresholdPoint = getThreshold(eval);
            try {
                double precision = calculatePrecision(testset, rf, thresholdPoint.getThr());

                if(!getPluginCall().getBoolean("firstTime")){
                    JSObject jsObject = new JSObject();
                    jsObject.put("reward", -1);

                    float prevPrec = sharedpreferences.getFloat(MODEL_PRECISION, 0);
                    Log.d("PREC", "prev_prec = "+prevPrec);
                    Log.d("PREC", "precision = "+precision);
                    if(precision > prevPrec){
                        jsObject.put("reward", 1);
                    }

                    this.sharedpreferences.edit().putFloat(MODEL_PRECISION, (float)precision)
                            .apply();
                    return jsObject;
                }else{
                    this.sharedpreferences.edit().putFloat(MODEL_PRECISION, (float)precision)
                            .apply();
                    return null;
                }

            } catch (Exception e) {
                e.printStackTrace();
            }

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
