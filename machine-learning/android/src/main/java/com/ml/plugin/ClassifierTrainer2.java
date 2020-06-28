package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.ml.plugin.data.api.sender.Sender;

import org.json.JSONException;
import org.json.JSONObject;


import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.Arrays;

import weka.classifiers.Evaluation;
import weka.classifiers.trees.RandomForest;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;


public class ClassifierTrainer2 extends Worker {

    private String trainingPath;
    private String testingPath;
    private String fullDatasetPath;
    private String modelPath;
    private String banditPath;

    private boolean banditDecidedToAsk; // banditova odlocitev
    private int banditPull; // rocka bandita


    public static final String MODEL_DECISION_BOUNDRY = "boundry";
    public static final String MODEL_PRECISION = "precision";


    private boolean isFirstTime;
    private Instances trainset;
    private Instances testset;

    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;

    private String[] passedInstance;

    private String username;
    private String predictionDATA;

    public ClassifierTrainer2(Context context, WorkerParameters params) {
        super(context, params);

        sharedpreferences = getApplicationContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        editor = sharedpreferences.edit();

        trainingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTrain.csv";
        testingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTest.csv";
        fullDatasetPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/fullset.csv";
        modelPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/ModelDEV/model";
        banditPath = getApplicationContext().getExternalFilesDir(null).getAbsoluteFile() + "/banditsDEV/data.json";

        isFirstTime = getInputData().getBoolean("isFirstTime", true);
        banditDecidedToAsk = getInputData().getBoolean("banditDecidedToAsk", true);
        banditPull = getInputData().getInt("banditPull", 0);
        passedInstance = getInputData().getStringArray("newData");

        Log.d(Constants.DEBUG_VAR, "banditDecidedToAsk "+banditDecidedToAsk);
        Log.d(Constants.DEBUG_VAR, "banditPull "+banditPull);

        username = getInputData().getString("username");
        predictionDATA = getInputData().getString("predictionDATA");
    }

    @NonNull
    @Override
    public Result doWork() {
        RandomForest randomForest = trainClassifier();

        MLUtils.serializeModel(randomForest, getModelPath());
        Log.d(Constants.DEBUG_VAR, "ratal mi je serializacijo izvesti");

        this.sharedpreferences.edit().putBoolean("working", true).apply();

        try {
            this.sharedpreferences.edit().putFloat(MODEL_DECISION_BOUNDRY, 0.5f).apply(); // zapisemo threshold

            if (getIsFirstTime()) {
                this.sharedpreferences.edit().putBoolean("started", false).apply();
                Log.d(Constants.DEBUG_VAR, "WORKING BOOL DAJEM NA FALSE");
                sendPostRequestFirstTime(username);

                this.sharedpreferences.edit().putBoolean("working", false).apply();
                return Result.success();
            } else {
                Log.d("predDATA", predictionDATA);
                JSONObject jsonObject = null;

                float outcomeProbablityY = sharedpreferences.getFloat("maxProbability", 0);
                float outcomeProbabilityN = 1 - outcomeProbablityY;

                float [] oldPrediction = new float[]{outcomeProbabilityN, outcomeProbablityY};

                Instance lastInstance = getTrainset().lastInstance();
                int groundTruthIndex = (int)lastInstance.value(getTrainset().numAttributes()-1);

                double [] newPredictionProbs = randomForest.distributionForInstance(lastInstance);

                float newPredictionP = (float) newPredictionProbs[groundTruthIndex];
                float oldPredictionP = oldPrediction[groundTruthIndex];

                int oldPredictionClass = 0;
                if(outcomeProbablityY > outcomeProbabilityN){
                    oldPredictionClass = 1;
                }

                int newPredictionClass = 0;
                if(newPredictionProbs[1] > newPredictionProbs[0]){
                    newPredictionClass = 1;
                }

                Log.d(Constants.DEBUG_VAR, "ground_truth = "+groundTruthIndex);
                Log.d(Constants.DEBUG_VAR, "ucasih: "+ Arrays.toString(oldPrediction) + " govoru sm "+oldPredictionClass);
                Log.d(Constants.DEBUG_VAR, "zdej: "+ Arrays.toString(newPredictionProbs) + " zdej govorim "+newPredictionClass);

                float directionVector = newPredictionP - oldPredictionP;

                if (banditDecidedToAsk) {
                    // preverimo ali gremo v pravi smeri
                    Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK");

                    float reward = directionVector;

                    if (directionVector > 0) {
                        if(oldPredictionClass != newPredictionClass && newPredictionClass == groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG REWARD");
                            reward += 1;
                        }
                        Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK IM GIVING HIM A REWARD FOR BETTER PRECISION "+reward);
                        jsonObject = MLUtils.giveBanditReward(getBanditPath(), banditPull, reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk);
                    } else if(directionVector < 0){
                        if(oldPredictionClass != newPredictionClass && newPredictionClass != groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG PUNISHMENT");
                            reward -= 1;
                        }
                        Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK IM GIVING HIM PUNISHMENT FOR WORSE PRECISION "+reward);
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull, reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk);
                    }else{
                        sendZeroReward(username, predictionDATA, banditPull);
                    }
                } else {
                    Log.d(Constants.DEBUG_VAR, "BANDIT HAS NOT DECIDED TO ASK TIME FOR REVERSE LOGIC");
                    // ce gre v napacni smer nagrada, ker je meu bandit prou da tega ne rab
                    float reward = directionVector;
                    if (directionVector < 0) {
                        if(oldPredictionClass != newPredictionClass && newPredictionClass != groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG REWARD");
                            reward-=1;
                        }
                        // nagrada
                        Log.d(Constants.DEBUG_VAR, "bandit decided not to ask and he was right. Precision now is even worse "+reward);
                        jsonObject = MLUtils.giveBanditReward(getBanditPath(), banditPull, -reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk);

                    } else if(directionVector > 0){
                        if(oldPredictionClass != newPredictionClass && newPredictionClass == groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG PUNISHMENT");
                            reward+=1;
                        }
                        // kazn
                        Log.d(Constants.DEBUG_VAR, "bandit decided not to ask and he was WRONG. Precision is now grater, we need to punish him "+reward);
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull, -reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk);
                    }else{
                        sendZeroReward(username, predictionDATA, banditPull);
                    }

                }


                this.sharedpreferences.edit().putBoolean("working", false).apply();
                Log.d(Constants.DEBUG_VAR, "WORKING BOOL DAJEM NA FALSE");

                return Result.success();
            }

        } catch (Exception e) {
            Log.e(Constants.DEBUG_VAR, "error while evaluating rf!");
            Log.e(Constants.DEBUG_VAR, e.toString());
            return Result.failure();
        }


    }


    private void sendZeroReward(String username, String predictionDATA, int banditPull){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {
            String jsonBanditString = MLUtils.readBanditFile(banditPath);
            if(jsonBanditString == null){
                return;
            }
            JSONObject banditData = new JSONObject(jsonBanditString);

            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", false);
            jsonBody.put("username", username);
            jsonBody.put("dataModel", "none;");
            jsonBody.put("predictionDATA", predictionDATA);

            Log.d(Constants.DEBUG_VAR, banditData.toString());
            int currentNumberOfPulls = banditData.getInt("allTimePulls");
            int regret = banditData.getInt("regret");
            double totalReward = banditData.getDouble("totalReward");

            jsonBody.put("banditCSV", currentNumberOfPulls+";"+banditPull+";"+"false;"+regret+";"+totalReward);
            jsonBody.put("banditJSON", banditData);
            sender.sendPostRequest(Constants.SERVER_IP+"/phase1/metrics", jsonBody.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }


    private void sendPostRequestFirstTime(String username){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {
            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", true);
            jsonBody.put("username", username);

            jsonBody.put("dataModel", "none");

            sender.sendPostRequest(Constants.SERVER_IP+"/phase1/metrics", jsonBody.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }

    }

    private void sendPostRequestNotFirstTime(String username, JSONObject banditData, String predictionDATA, int banditPull, boolean banditDecidedToAsk){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try{
            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", false);
            jsonBody.put("username", username);

            jsonBody.put("dataModel", "none");
            jsonBody.put("predictionDATA", predictionDATA);


            int currentNumberOfPulls = banditData.getInt("allTimePulls");
            int regret = banditData.getInt("regret");
            double totalReward = banditData.getDouble("totalReward");

            jsonBody.put("banditCSV", currentNumberOfPulls+";"+banditPull+";"+banditDecidedToAsk+";"+regret+";"+totalReward);
            jsonBody.put("banditJSON", banditData);

            sender.sendPostRequest(Constants.SERVER_IP+"/phase1/metrics", jsonBody.toString());
        }catch (JSONException e){
            Log.e(Constants.DEBUG_VAR, "there was an error while creating jsonobject");
            Log.e(Constants.DEBUG_VAR, e.toString());
        }
    }

    public RandomForest trainClassifier() {
        RandomForest randomForest = null;

        if (getIsFirstTime()) {
            Log.d(Constants.DEBUG_VAR, "STVAR JE FIRST TIME");
            Instances dataset = MLUtils.readDatasetFromFile(getFullDatasetPath()); // 1) Ker prvic treniram preberem vse iz fajla kar imam
            setTrainset(dataset);
            Log.d(Constants.DEBUG_VAR, "NUM INSTANCES IN TRAIN SET" + getTrainset().numInstances());
            MLUtils.writeDataToFile(getTrainingPath(), getTrainset(), false); // 5) Zacnem s pisanjem train seta (FULL DATASET)
            randomForest = MLUtils.buildRF(getTrainset()); // 7) Natreniramo model
            Log.d(Constants.DEBUG_VAR, "STVAR JE FIRST TIME11");
        } else {
            Log.d(Constants.DEBUG_VAR, "STVAR NI FIRST TIME");
            Instances instances = MLUtils.constructDatasetHeader(); // 1) Skonstruiramo header za novo dodane instance
            instances.setClassIndex(instances.numAttributes() - 1); // 2) Povemo kateri index je class
            Instance instance = new DenseInstance(6); // 3) Kreiramo prazno instanco

            instance.setValue(instances.attribute("u"), getPassedInstance()[0]); // user activity
            instance.setValue(instances.attribute("e"), Double.parseDouble(getPassedInstance()[1])); // env brightness
            instance.setValue(instances.attribute("t"), getPassedInstance()[2]); // theme
            instance.setValue(instances.attribute("l"), getPassedInstance()[3]); // layout
            instance.setValue(instances.attribute("f"), getPassedInstance()[4]); // font size
            // na indeksu 5 in 6 so boundary in probability
            instance.setValue(instances.attribute("o"), getPassedInstance()[7]); // output

            instances.add(instance); // 7) Instanco dodamo
            Log.d(Constants.DEBUG_VAR, "treniram model s toliko novih instanc " + instances.numInstances());
            randomForest = trainClfWithData(instances); // 7) Model treniramo

        }

        return randomForest; //8) model vrnemo
    }

    public RandomForest trainClfWithData(Instances newInstances) {

        Log.d(Constants.DEBUG_VAR, "first time je drugic false, appendam v trenining berem iz iz treninga");
        Instances instances = MLUtils.readDatasetFromFile(getTrainingPath()); // 1) Preberemo obstojece instance
        Log.d(Constants.DEBUG_VAR, "st prebranih instanc po dodajanju je " + instances.numInstances());

        instances.addAll(newInstances);  // 2) Dodamo nove instance
        MLUtils.writeDataToFile(getTrainingPath(), newInstances, true); // Appendamo instance v fajl
        setTrainset(instances); // 3) Nastavimo trainset globalen in testset -> rabimo za evalvacijo modela
        return MLUtils.buildRF(getTrainset()); // 6) Model vrnemo in pošljemo v serialzacijo
    }

    public String getBanditPath() {
        return banditPath;
    }


    public Instances getTrainset() {
        return trainset;
    }

    public Instances getTestset() {
        return testset;
    }

    public void setTrainset(Instances trainset) {
        this.trainset = trainset;
    }

    public void setTestset(Instances testset) {
        this.testset = testset;
    }

    public void setFirstTime(boolean val) {
        this.isFirstTime = val;
    }

    public boolean getIsFirstTime() {
        return isFirstTime;
    }

    public String getFullDatasetPath() {
        return fullDatasetPath;
    }

    public String[] getPassedInstance() {
        return passedInstance;
    }

    public void setPassedInstance(String[] passedInstance) {
        this.passedInstance = passedInstance;
    }

    public void setFullDatasetPath(String fullDatasetPath) {
        this.fullDatasetPath = fullDatasetPath;
    }

    public String getTrainingPath() {
        return trainingPath;
    }

    public void setTrainingPath(String trainingPath) {
        this.trainingPath = trainingPath;
    }

    public String getTestingPath() {
        return testingPath;
    }

    public void setTestingPath(String testingPath) {
        this.testingPath = testingPath;
    }

    public String getModelPath() {
        return modelPath;
    }

    public void setModelPath(String modelPath) {
        this.modelPath = modelPath;
    }


}
