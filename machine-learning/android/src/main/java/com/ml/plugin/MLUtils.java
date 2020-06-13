package com.ml.plugin;

import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Scanner;

import weka.classifiers.Evaluation;
import weka.classifiers.evaluation.ThresholdCurve;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.Instances;
import weka.core.converters.CSVLoader;

public class MLUtils {

    public static RandomForest buildRF(Instances data){
        Log.d("EO_ME", "treniram rf s toliko instanc "+data.numInstances());
        RandomForest forest = null;
        forest = new RandomForest();
        forest.setNumTrees(100);
        try {
            forest.buildClassifier(data);
            Log.d("EO_ME", "passu sm cez z modelom11");
        } catch (Exception e) {
            Log.d("EO_ME", "for some reason mi ni ratal natrenirat modelaa");
            Log.d("EO_ME", e.toString());
            e.printStackTrace();
        }

        Log.d("EO_ME", "passu sm cez z modelom");
        return forest;
    }

    public static void writeDataToFile(String path, Instances newData, boolean append) {
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

    public static void serializeModel(RandomForest randomForest, String path){
        ObjectOutputStream oos = null;
        FileOutputStream fout = null;

        //String path = getCtx().getExternalFilesDir(null).getAbsoluteFile() + "/Model/model";
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

    public static Instances constructDatasetHeader(){
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

    public static Instances readDatasetFromFile(String path){
        CSVLoader csvLoader = new CSVLoader();
        Log.d("EO_ME", "?=????????????");

        Instances data = null;
        try {
            Log.d("EO_ME", "?????????????");
            csvLoader.setSource(new File(path));
            data = csvLoader.getDataSet();
            data.setClassIndex(data.numAttributes() - 1);
            Log.d("EO_ME", "data = "+data.numInstances());
        } catch (IOException e) {
            Log.e("EO_ME", "an error occured while reading dataset from file!");
            Log.e("EO_ME", e.toString());
            e.printStackTrace();
        }

        Log.d("EO_ME", "data = "+data.numInstances());
        return data;
    }

    public static ThresholdPoint getThreshold(Evaluation eval) {
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

        return optimalThresholdPoint;
    }

    public static double calculatePrecision(Instances test, RandomForest forest, double decisionBoundry) throws Exception {
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

    public static Instances[] splitDataset(Instances dataset){
        int trainSize = (int) Math.round(dataset.numInstances() * 0.8);
        int testSize = dataset.numInstances() - trainSize;

        dataset.randomize(new java.util.Random(5));
        Instances train = new Instances(dataset, 0, trainSize);
        Instances test = new Instances(dataset, trainSize, testSize);

        return new Instances[]{train, test};
    }

    public static String readBanditFile(String banditPath){
        File f = new File(banditPath);
        try {
            Scanner sc = new Scanner(f);
            return sc.nextLine();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static void writeToBanditFile(String banditPath, String banditData){
        File f = new File(banditPath);
        FileWriter fileWriter = null;
        try{
            fileWriter = new FileWriter(f);
            fileWriter.write(banditData);
            Log.d("EO_ME", "uspesno sm dou nagrado");
        }catch (Exception e){
            Log.e("EO_ME", "there was an error while updating bandits!");
            Log.e("EO_ME", e.toString());
        }finally {
            try {
                if(fileWriter != null){
                    fileWriter.flush();
                    fileWriter.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
