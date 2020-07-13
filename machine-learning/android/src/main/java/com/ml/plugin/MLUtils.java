package com.ml.plugin;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Scanner;

import weka.classifiers.Evaluation;
import weka.classifiers.evaluation.ThresholdCurve;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.converters.CSVLoader;

public class MLUtils {

    public static RandomForest buildRF(Instances data){
        try{
            for(int i = 10; i >= 1; i--){
                Log.d(Constants.DEBUG_VAR, data.get(data.size()-i).toString());
            }
        }catch(Exception e) {
            Log.d(Constants.DEBUG_VAR, "CWASH");
        }

        Log.d(Constants.DEBUG_VAR, "treniram rf s toliko instanc "+data.numInstances());
        RandomForest forest = null;
        forest = new RandomForest();
        forest.setSeed(5);
        forest.setNumTrees(100);
        try {
            forest.buildClassifier(data);
            Log.d(Constants.DEBUG_VAR, "passu sm cez z modelom11");
        } catch (Exception e) {
            Log.d(Constants.DEBUG_VAR, "for some reason mi ni ratal natrenirat modelaa");
            Log.d(Constants.DEBUG_VAR, e.toString());
            e.printStackTrace();
        }

        Log.d(Constants.DEBUG_VAR, "passu sm cez z modelom");
        return forest;
    }

    public static JSONObject punishBandit(String banditPath, int banditPull, float punishment){
        // kazn
        String jsonBanditString = readBanditFile(banditPath);
        JSONObject jsonObject = null;
        try{
            jsonObject = new JSONObject(jsonBanditString);
            jsonObject.put("totalReward", jsonObject.getDouble("totalReward") + punishment);
            jsonObject.put("regret", jsonObject.getInt("regret") + 1);

            jsonObject.put("allTimePulls", jsonObject.getInt("allTimePulls") + 1);
            String numberOfSelectionsString = jsonObject.getString("numberOfSelections");
            int [] numOfSelIntArr = stringToArrInt(numberOfSelectionsString);
            numOfSelIntArr[banditPull]++;
            jsonObject.put("numberOfSelections", Arrays.toString(numOfSelIntArr));

            String selectionsString = jsonObject.getString("selections");
            Log.d("PARSING_SELECTIONS", selectionsString);
            if(selectionsString.equals("[]")){
                int [] selectionsArr = new int []{banditPull};
                Log.d("PARSING_SELECTIONS", Arrays.toString(selectionsArr));
                jsonObject.put("selections", Arrays.toString(selectionsArr));
            }else{
                int [] selectionsArr = stringToArrInt(selectionsString);
                int [] selectionsArr2 = new int[selectionsArr.length+1];
                for(int i = 0; i < selectionsArr.length; i++){
                    selectionsArr2[i] = selectionsArr[i];
                }

                selectionsArr2[selectionsArr2.length-1] = banditPull;
                Log.d("PARSING_SELECTIONS", Arrays.toString(selectionsArr2));
                jsonObject.put("selections", Arrays.toString(selectionsArr2));
            }

            Log.d(Constants.DEBUG_VAR, " total reward "+jsonObject.getDouble("totalReward"));
            String sumOfRewardsAsString = jsonObject.getString("sumOfRewards");
            Log.d(Constants.DEBUG_VAR, "sumOfRewardsAsString "+sumOfRewardsAsString);
            double[] sumOfRewards = stringToArr(sumOfRewardsAsString);
            Log.d(Constants.DEBUG_VAR, "sumOfRewards "+Arrays.toString(sumOfRewards));
            sumOfRewards[banditPull]+=punishment;
            Log.d(Constants.DEBUG_VAR, "sumOfRewards2 "+Arrays.toString(sumOfRewards));
            jsonObject.put("sumOfRewards", Arrays.toString(sumOfRewards));
            writeToBanditFile(banditPath, jsonObject.toString());
            Log.d(Constants.DEBUG_VAR, "Sledec objekt pisem v datoteko" + jsonObject.toString());
        }catch (JSONException e){
            e.printStackTrace();
            Log.d(Constants.DEBUG_VAR, "error while punishing bandit");
            Log.e(Constants.DEBUG_VAR, e.toString());
        }

        return jsonObject;
    }

    public static JSONObject giveZeroReward(String banditPath, int banditPull){
        String jsonBanditString = readBanditFile(banditPath);
        JSONObject jsonObject = null;

        try {
            jsonObject = new JSONObject(jsonBanditString);
            jsonObject.put("allTimePulls", jsonObject.getInt("allTimePulls") + 1); // increment number of all time pulls
            String numberOfSelectionsString = jsonObject.getString("numberOfSelections"); // update pulled bandit index
            int [] numOfSelIntArr = stringToArrInt(numberOfSelectionsString);
            numOfSelIntArr[banditPull]++;
            jsonObject.put("numberOfSelections", Arrays.toString(numOfSelIntArr));

            // dodamo v selections arr
            String selectionsString = jsonObject.getString("selections");
            Log.d("PARSING_SELECTIONS", selectionsString);

            if(selectionsString.equals("[]")){
                int [] selectionsArr = new int []{banditPull};
                jsonObject.put("selections", Arrays.toString(selectionsArr));
            }else{
                int [] selectionsArr = stringToArrInt(selectionsString);
                int [] selectionsArr2 = new int[selectionsArr.length+1];
                for(int i = 0; i < selectionsArr.length; i++){
                    selectionsArr2[i] = selectionsArr[i];
                }

                selectionsArr2[selectionsArr2.length-1] = banditPull;
                jsonObject.put("selections", Arrays.toString(selectionsArr2));
            }

            String sumOfRewardsAsString = jsonObject.getString("sumOfRewards");
            double[] sumOfRewards = stringToArr(sumOfRewardsAsString);
            jsonObject.put("sumOfRewards", Arrays.toString(sumOfRewards));

            writeToBanditFile(banditPath, jsonObject.toString());

        }catch (JSONException e){
            Log.d(Constants.DEBUG_VAR, "there was an error while giving zero reward");
            Log.d(Constants.DEBUG_VAR, e.toString());
        }

        return jsonObject;
    }

    public static JSONObject giveBanditReward(String banditPath, int banditPull, float reward){
        // nagrada
        String jsonBanditString = readBanditFile(banditPath);
        JSONObject jsonObject = null;
        try {
            Log.d(Constants.DEBUG_VAR, "I AM GIVING BANDIT REWARD");
            jsonObject = new JSONObject(jsonBanditString);
            Log.d(Constants.DEBUG_VAR, "pass1");

            jsonObject.put("allTimePulls", jsonObject.getInt("allTimePulls") + 1);

            String numberOfSelectionsString = jsonObject.getString("numberOfSelections");
            int [] numOfSelIntArr = stringToArrInt(numberOfSelectionsString);
            numOfSelIntArr[banditPull]++;
            jsonObject.put("numberOfSelections", Arrays.toString(numOfSelIntArr));

            String selectionsString = jsonObject.getString("selections");
            Log.d("PARSING_SELECTIONS", selectionsString);

            if(selectionsString.equals("[]")){
                int [] selectionsArr = new int []{banditPull};
                Log.d("PARSING_SELECTIONS", Arrays.toString(selectionsArr));
                jsonObject.put("selections", Arrays.toString(selectionsArr));
            }else{
                int [] selectionsArr = stringToArrInt(selectionsString);
                int [] selectionsArr2 = new int[selectionsArr.length+1];
                for(int i = 0; i < selectionsArr.length; i++){
                    selectionsArr2[i] = selectionsArr[i];
                }

                selectionsArr2[selectionsArr2.length-1] = banditPull;
                Log.d("PARSING_SELECTIONS", Arrays.toString(selectionsArr2));
                jsonObject.put("selections", Arrays.toString(selectionsArr2));
            }

            jsonObject.put("totalReward", jsonObject.getDouble("totalReward") + reward);
            Log.d(Constants.DEBUG_VAR, " total reward "+jsonObject.getDouble("totalReward"));
            String sumOfRewardsAsString = jsonObject.getString("sumOfRewards");
            Log.d(Constants.DEBUG_VAR, "sumOfRewardsAsString "+sumOfRewardsAsString);
            double[] sumOfRewards = stringToArr(sumOfRewardsAsString);
            Log.d(Constants.DEBUG_VAR, "sumOfRewards "+ Arrays.toString(sumOfRewards));
            sumOfRewards[banditPull]+=reward;
            Log.d(Constants.DEBUG_VAR, "sumOfRewards2 "+Arrays.toString(sumOfRewards));
            jsonObject.put("sumOfRewards", Arrays.toString(sumOfRewards));
            Log.d(Constants.DEBUG_VAR, "Sledec objekt pisem v datoteko" + jsonObject.toString());
            writeToBanditFile(banditPath, jsonObject.toString());
        } catch (JSONException e) {
            e.printStackTrace();
            Log.d(Constants.DEBUG_VAR, "error while giving bandit reward");
            Log.e(Constants.DEBUG_VAR, e.toString());
        }

        return jsonObject;
    }

    public static double[] stringToArr(String string) {
        String[] strings = string.replace("[", "")
                .replace("]", "")
                .replaceAll(" ", "")
                .split(",");
        double[] result = new double[strings.length];
        for (int i = 0; i < result.length; i++) {
            result[i] = Double.parseDouble(strings[i].trim());
        }
        return result;
    }


    public static int[] stringToArrInt(String string) {
        String[] strings = string.replace("[", "")
                .replace("]", "")
                .replaceAll(" ", "")
                .split(",");
        int[] result = new int[strings.length];
        for (int i = 0; i < result.length; i++) {
            result[i] = Integer.parseInt(strings[i].trim());
        }
        return result;
    }

    public static void appendDataToFile(String path, String []lineArr) {
        FileWriter fileWriter = null;
        try {
            fileWriter = new FileWriter(path, true);

            String line = "\n";
            for(int j = 0; j < lineArr.length; j++){
                if(j == 0){
                    line += lineArr[j];
                } else if (j == 5 || j == 6) {
                    continue;
                } else {
                    line += ","+lineArr[j];
                }
            }

                fileWriter.write(line);
        } catch (IOException e) {
            Log.d(Constants.DEBUG_VAR, e.getMessage());
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
                Log.d(Constants.DEBUG_VAR, "SUCCESSFULLY APPEND TO FILEE!");
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

    public static RandomForest getModel(String modelPath, String backupTrainPath){
        ObjectInputStream objectinputstream = null;
        RandomForest rf = null;
        try {
            FileInputStream streamIn = new FileInputStream(modelPath);
            objectinputstream = new ObjectInputStream(streamIn);
            rf = (RandomForest) objectinputstream.readObject();
        } catch (Exception e) {
            e.printStackTrace();
            Log.d(Constants.DEBUG_VAR, "ERROR OCCURED WHILE GETTING MODEL");
            Log.d(Constants.DEBUG_VAR, e.toString());

            RandomForest randomForest = buildRF(readDatasetFromFileMy(backupTrainPath));
            serializeModel(randomForest, modelPath);
            return randomForest;
        } finally {
            if(objectinputstream != null){
                try {
                    objectinputstream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        if(rf == null){
            rf = buildRF(readDatasetFromFileMy(backupTrainPath));
            serializeModel(rf, modelPath);
        }

        return rf;
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

    public static Instances readDatasetFromFileMy(String path) {
        Instances instances = constructDatasetHeader();
        try{
            File f = new File(path);
            Scanner sc = new Scanner(f);
            sc.nextLine();
            while(sc.hasNextLine()) {
                String line = sc.nextLine();
                String [] strArr = line.split(",");
                Instance newI = new DenseInstance(6);
                newI.setDataset(instances);

                for(int i = 0; i < strArr.length; i++) {
                    if(i == 1) {
                        newI.setValue(i, Double.parseDouble(strArr[i]));
                    } else {
                        newI.setValue(i, strArr[i]);
                    }
                }

                instances.add(newI);
            }
            sc.close();
        }catch(Exception e){
            Log.d(Constants.DEBUG_VAR, "ERRRRRRRRRRRRRRRRRRORRRRRRRRRRRRR");
            Log.d(Constants.DEBUG_VAR, e.toString());
        }

        instances.setClassIndex(instances.numAttributes()-1);
        return instances;
    }

    public static Instances readDatasetFromFile(String path){
        CSVLoader csvLoader = new CSVLoader();

        Instances data = null;
        try {
            csvLoader.setSource(new File(path));
            data = csvLoader.getDataSet();
            data.setClassIndex(data.numAttributes() - 1);
        } catch (IOException e) {
            Log.e(Constants.DEBUG_VAR, "an error occured while reading dataset from file!");
            Log.e(Constants.DEBUG_VAR, e.toString());
            e.printStackTrace();
        }

        Log.d(Constants.DEBUG_VAR, "data = "+data.numInstances());
        return data;
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
        }catch (Exception e){
            Log.e(Constants.DEBUG_VAR, "there was an error while updating bandits!");
            Log.e(Constants.DEBUG_VAR, e.toString());
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
