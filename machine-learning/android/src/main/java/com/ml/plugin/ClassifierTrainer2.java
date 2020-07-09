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

import java.util.Arrays;

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
    private String generalModelPath;

    private boolean banditDecidedToAsk; // banditova odlocitev
    private int banditPull; // rocka bandita


    public static final String MODEL_DECISION_BOUNDRY = "boundry";
    public static final String MODEL_PRECISION = "precision";


    private boolean isFirstTime;
    private Instances trainset;
    private Instances testset;
    private Instance lastUserFeedback;

    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;

    private String[] passedInstance;

    private String username;
    private String predictionDATA;
    private String lastInstanceTime;

    public ClassifierTrainer2(Context context, WorkerParameters params) {
        super(context, params);

        sharedpreferences = getApplicationContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        editor = sharedpreferences.edit();

        trainingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTrain.csv";
        testingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTest.csv";
        fullDatasetPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/fullset.csv";
        modelPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/ModelDEV/model";
        banditPath = getApplicationContext().getExternalFilesDir(null).getAbsoluteFile() + "/banditsDEV/data.json";
        generalModelPath = getApplicationContext().getExternalFilesDir(null).getAbsoluteFile() + "/ModelDEV/generalModel";

        isFirstTime = getInputData().getBoolean("isFirstTime", true);
        banditDecidedToAsk = getInputData().getBoolean("banditDecidedToAsk", true);
        banditPull = getInputData().getInt("banditPull", 0);
        passedInstance = getInputData().getStringArray("newData");

        Log.d(Constants.DEBUG_VAR, "banditDecidedToAsk "+banditDecidedToAsk);
        Log.d(Constants.DEBUG_VAR, "banditPull "+banditPull);

        username = getInputData().getString("username");
        predictionDATA = getInputData().getString("predictionDATA");
        lastInstanceTime = getInputData().getString("time");
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
                MLUtils.serializeModel(randomForest, generalModelPath);

                this.sharedpreferences.edit().putBoolean("working", false).apply();
                return Result.success();
            } else {
                Log.d(Constants.DEBUG_VAR, "BEFORE APPEND TO FILE: "+getTrainset().lastInstance().toString() + " SIZE: "+getTrainset().numInstances());

                Log.d("predDATA", predictionDATA);
                JSONObject jsonObject = null;

                // get last maximum view probability p(Y), p(N) = 1 - p(Y)
                float outcomeProbablityY = sharedpreferences.getFloat("maxProbability", 0);
                float outcomeProbabilityN = 1 - outcomeProbablityY;

                // construct old prediction
                // [p(N), p(Y)]
                float [] oldPrediction = new float[]{outcomeProbabilityN, outcomeProbablityY};

                // get last instance from trainset and ground truth
                //Instance lastInstance = getTrainset().lastInstance();
                Log.d(Constants.DEBUG_VAR, "vals3: "+lastUserFeedback.toString());

                int groundTruthIndex = (int)lastUserFeedback.classValue();


                Log.d(Constants.DEBUG_VAR, ""+lastUserFeedback.classValue());
                // make new predcition
                double [] newPredictionProbs = randomForest.distributionForInstance(lastUserFeedback);

                // rabimo da vidmo, ce gremo v pravi smeri
                float newPredictionP = (float) newPredictionProbs[groundTruthIndex];
                float oldPredictionP = oldPrediction[groundTruthIndex];


                // calculate real class old
                int oldPredictionClass = 0;
                if(outcomeProbablityY > outcomeProbabilityN){
                    oldPredictionClass = 1;
                }

                // calculate new prediction
                int newPredictionClass = 0;
                if(newPredictionProbs[1] > newPredictionProbs[0]){
                    newPredictionClass = 1;
                }

                Log.d(Constants.DEBUG_VAR, "AFTER APPEND TO FILE: "+getTrainset().lastInstance().toString() + " SIZE: "+getTrainset().numInstances());

                //RandomForest randomForest2 = MLUtils.buildRF(MLUtils.readDatasetFromFile(getTrainingPath()));

                Log.d(Constants.DEBUG_VAR, "ground_truth = "+groundTruthIndex);
                Log.d(Constants.DEBUG_VAR, "ucasih: "+ Arrays.toString(oldPrediction) + " govoru sm "+oldPredictionClass);
                Log.d(Constants.DEBUG_VAR, "zdej: "+ Arrays.toString(newPredictionProbs) + " zdej govorim "+newPredictionClass);
                //Log.d(Constants.DEBUG_VAR, "  ---- "+Arrays.toString(randomForest2.distributionForInstance(lastUserFeedback)));


                float directionVector = newPredictionP - oldPredictionP;

                // check if bandit decided to ask
                if (banditDecidedToAsk) {
                    // preverimo ali gremo v pravi smeri
                    Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK");

                    float reward = directionVector;

                    if (directionVector > 0) {
                        // ce se prejsna in zdejsna predikcija razlikujeta in je nova celo pravilna => BONUS NAGRADA!
                        if(oldPredictionClass != newPredictionClass && newPredictionClass == groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG REWARD");
                            reward += 1;
                        }
                        Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK IM GIVING HIM A REWARD FOR BETTER PRECISION "+reward);
                        jsonObject = MLUtils.giveBanditReward(getBanditPath(), banditPull, reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk, reward);
                    } else if(directionVector < 0){
                        // ce se prejsna in zdejsna predikcija razlikujeta in zdej sploh nimamo prou => BONUS KAZN
                        if(oldPredictionClass != newPredictionClass && newPredictionClass != groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG PUNISHMENT");
                            reward -= 1;
                        }
                        Log.d(Constants.DEBUG_VAR, "BANDIT DECIDED TO ASK IM GIVING HIM PUNISHMENT FOR WORSE PRECISION "+reward);
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull, reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk, reward);
                    }else{
                        jsonObject = MLUtils.giveZeroReward(getBanditPath(), banditPull);
                        sendZeroReward(username, predictionDATA, banditPull, jsonObject);
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
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk, -reward);

                    } else if(directionVector > 0){
                        if(oldPredictionClass != newPredictionClass && newPredictionClass == groundTruthIndex){
                            Log.d(Constants.DEBUG_VAR, "TIME FOR BIG PUNISHMENT");
                            reward+=1;
                        }
                        // kazn
                        Log.d(Constants.DEBUG_VAR, "bandit decided not to ask and he was WRONG. Precision is now grater, we need to punish him "+reward);
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull, -reward);
                        sendPostRequestNotFirstTime(username, jsonObject, predictionDATA, banditPull, banditDecidedToAsk,-reward);
                    }else{
                        jsonObject = MLUtils.giveZeroReward(getBanditPath(), banditPull);
                        sendZeroReward(username, predictionDATA, banditPull, jsonObject);
                    }

                }


                this.sharedpreferences.edit().putBoolean("working", false).apply();
                Log.d(Constants.DEBUG_VAR, "WORKING BOOL DAJEM NA FALSE");
                sharedpreferences.edit().putFloat("maxProbability", (float)newPredictionProbs[1]).apply();

                return Result.success();
            }

        } catch (Exception e) {
            Log.e(Constants.DEBUG_VAR, "error while evaluating rf!");
            Log.e(Constants.DEBUG_VAR, e.toString());
            return Result.success();
        }


    }


    private void sendZeroReward(String username, String predictionDATA, int banditPull, JSONObject currentBandit){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {

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
            banditsData.put("banditDecision", banditDecidedToAsk);
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


    private void sendPostRequestNotFirstTime(String username, JSONObject currentBandit, String predictionDATA, int banditPull, boolean banditDecidedToAsk, float reward){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try{

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
            banditsData.put("banditDecision", banditDecidedToAsk);
            banditsData.put("regret", currentBandit.getInt("regret"));
            banditsData.put("reward", reward);
            banditsData.put("totalReward", currentBandit.getDouble("totalReward"));

            jsonBody.put("banditsData", banditsData);

            jsonBody.put("currentBandit", currentBandit);

            Log.d(Constants.DEBUG_VAR, "SLEDEC OBJEKT POSILJAM NA SERVER:" +jsonBody.toString());
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
            Log.d(Constants.DEBUG_VAR, "STVAR NI FIRST TIME "+Arrays.toString(getPassedInstance()));
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

            Log.d(Constants.DEBUG_VAR, "HADUKEN: "+instance.toString());

            instances.add(instance); // 7) Instanco dodamo
            setLastUserFeedback(instances.get(0));
            Log.d(Constants.DEBUG_VAR, "treniram model s toliko novih instanc " + instances.numInstances());
            randomForest = trainClfWithData(instances); // 7) Model treniramo

        }

        return randomForest; //8) model vrnemo
    }

    public RandomForest trainClfWithData(Instances newInstances) {
        // delamo ker pr ondestroy se stvar poklice 2x
        Log.d(Constants.DEBUG_VAR, "first time je drugic false, appendam v trenining berem iz iz treninga");
        Log.d(Constants.DEBUG_VAR, "v metodo sm prsu z "+newInstances.get(0).toString());

        if(!sharedpreferences.getString("lastInstanceTime", "").equals(lastInstanceTime)){
            Instances instances = MLUtils.readDatasetFromFile(getTrainingPath()); // 1) Preberemo obstojece instance
            Log.d(Constants.DEBUG_VAR, "zadnja instanca iz datoteke je"+instances.lastInstance().toString());
            instances.addAll(newInstances);  // 2) Dodamo novo instanco
            setLastUserFeedback(newInstances.get(0));
            Log.d(Constants.DEBUG_VAR, "zadnja instanca po dodajanju nove datotek not je"+lastUserFeedback.toString());
            setTrainset(instances); // 3) Nastavimo trainset globalen in testset -> rabimo za evalvacijo modela
            Log.d(Constants.DEBUG_VAR, "zadnja instanca po initu trainseta je "+lastUserFeedback.toString());
            MLUtils.writeDataToFile(getTrainingPath(), newInstances, true); // Appendamo instance v fajl
            sharedpreferences.edit().putString("lastInstanceTime",lastInstanceTime).apply();
            Log.d(Constants.DEBUG_VAR, "vals1: "+lastUserFeedback.toString());
            return MLUtils.buildRF(getTrainset()); // 6) Model vrnemo in pošljemo v serialzacijo
        }else{
            Instances instances = MLUtils.readDatasetFromFile(getTrainingPath()); // 1) Preberemo obstojece instance
            Log.d(Constants.DEBUG_VAR, "st prebranih instanc po dodajanju je " + instances.numInstances());
            setTrainset(instances); // 3) Nastavimo trainset globalen in testset -> rabimo za evalvacijo modela

            Log.d(Constants.DEBUG_VAR, "vals2: "+lastUserFeedback.toString());
            return MLUtils.buildRF(getTrainset()); // 6) Model vrnemo in pošljemo v serialzacijo
        }

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

    public void setLastUserFeedback(Instance lastInstance){
        this.lastUserFeedback = lastInstance;
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
