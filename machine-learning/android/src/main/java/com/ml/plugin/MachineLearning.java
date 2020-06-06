package com.ml.plugin;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.BufferedReader;
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


@NativePlugin()
public class MachineLearning extends Plugin {

    @PluginMethod()
    public void echo(PluginCall call) {

        String value = call.getString("value");
        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }

    @PluginMethod()
    public void trainClfFirstTime(PluginCall call){
        JSObject ret = new JSObject();
        Log.d("HEREIAM", "klicu sm se");
        try {
            trainClassifier();
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("FUUCK", e.toString());
        }
        ret.put("value", "uredu smo fantje");
        call.success(ret);
    }

    private void trainClassifier() throws Exception {
        Instances dataset = createDataset();
        dataset.setClassIndex(dataset.numAttributes() - 1);
        Log.d("OPA", ""+dataset.size());
        int trainSize = (int) Math.round(dataset.numInstances() * 0.8);
        int testSize = dataset.numInstances() - trainSize;

        dataset.randomize(new java.util.Random(5));
        Instances train = new Instances(dataset, 0, trainSize);
        Instances test = new Instances(dataset, trainSize, testSize);
        RandomForest forest = new RandomForest();

        Log.d("EO_ME", ""+train.size());
        Log.d("EO_ME", "compilana nova koda123");
        forest.buildClassifier(train);
        Log.d("EO_ME",  "po treniranju");


        Evaluation eval = new Evaluation(train);
        eval.evaluateModel(forest, test);
        Log.d("EO_ME", "po evalvaciji");

        Log.d("MY_METRIC", "Accuracy = "+eval.pctCorrect());
        Log.d("MY_METRIC", "AUC = "+eval.areaUnderROC(1));
        Log.d("MY_METRIC", calculateMetrics(eval));

    }

    private String calculateMetrics(Evaluation eval) {
        double tp = eval.numTruePositives(1);
        double fp = eval.numFalsePositives(1);
        double fn = eval.numFalseNegatives(1);
        double tn  = eval.numTrueNegatives(1);

        double precision = tp / (tp + fp);
        double recall = tp / (tp + fn);
        double f = (2*precision*recall) / (precision + recall);
        double acc = (tp + tn) / (tp + fp + fn + tn);

        return String.format("precision = %f recall = %f, f-measure = %f accuracy = %f", precision, recall, f, acc);
    }

    private Instances constructDatasetHeader(){
        ArrayList<Attribute> atts = new ArrayList<Attribute>();

        ArrayList<String> userActivityVals = new ArrayList<String>();
        userActivityVals.add("STILL");
        userActivityVals.add("ON_FOOT");
        userActivityVals.add("IN_VEHICLE");
        atts.add(new Attribute("user_activity",userActivityVals));

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

        return new Instances("Dataset",atts,0);
    }

    private Instances createDataset(){
        BufferedReader reader = null;
        Instances dataset = constructDatasetHeader();
        try {
            reader = new BufferedReader(
                    new InputStreamReader( getContext().getAssets().open("data.csv"), "UTF-8"));
            String mLine;

            reader.readLine();
            while((mLine = reader.readLine()) != null){
                String[] splitedArr = mLine.split(",");
                Instance inst = new DenseInstance(6);

                inst.setValue(dataset.attribute(0), splitedArr[0]);
                inst.setValue(dataset.attribute(1), Float.parseFloat(splitedArr[1]));
                inst.setValue(dataset.attribute(2), splitedArr[2]);
                inst.setValue(dataset.attribute(3), splitedArr[3]);
                inst.setValue(dataset.attribute(4), splitedArr[4]);
                inst.setValue(dataset.attribute(5), splitedArr[5]);
                Log.d("SVE_OK", Arrays.toString(splitedArr));
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

            return dataset;
        }
    }
}
