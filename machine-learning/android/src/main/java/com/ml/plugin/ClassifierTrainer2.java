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

        Log.d("EO_ME", "banditDecidedToAsk "+banditDecidedToAsk);
        Log.d("EO_ME", "banditPull "+banditPull);

        username = getInputData().getString("username");
        predictionDATA = getInputData().getString("predictionDATA");
    }

    @NonNull
    @Override
    public Result doWork() {
        RandomForest randomForest = trainClassifier();
        MLUtils.serializeModel(randomForest, getModelPath());
        Log.d("EO_ME", "ratal mi je serializacijo izvesti");

        this.sharedpreferences.edit().putBoolean("working", true).apply();

        Evaluation eval = null;
        try {
            eval = new Evaluation(getTrainset()); // Rabimo za threshold
            eval.evaluateModel(randomForest, getTestset());

            ThresholdPoint optimalThresholdPoint = MLUtils.getThreshold(eval); // Izracunamo threshold
            this.sharedpreferences.edit().putFloat(MODEL_DECISION_BOUNDRY, (float) optimalThresholdPoint.getThr())
                    .apply(); // zapisemo threshold

            double [] metrics = MLUtils.calculatePrecision(getTestset(), randomForest, optimalThresholdPoint.getThr()); // prever če se da brez tega iz evala ze

            double precision = metrics[0];
            double recall = metrics[1];
            double accuracy = metrics[2];
            double fMeasure = metrics[3];

            Log.d("EO_ME", "Metrics: Precision = "+precision + " Recall = "+recall + " Acc = "+accuracy + " F = "+fMeasure);

            if (getIsFirstTime()) {
                this.sharedpreferences.edit().putFloat(MODEL_PRECISION, (float) precision)
                        .apply();
                Log.d("EO_ME", "ratal mi je do konca pridt z usm 11");
                Log.d("EO_ME", "precision = " + precision);
                Log.d("EO_ME", optimalThresholdPoint.toString());
                float prevPrec = sharedpreferences.getFloat(MODEL_PRECISION, 0);
                Log.d("EO_ME", "v fajl sm zapisu "+prevPrec);
                this.sharedpreferences.edit().putBoolean("started", false).apply();

                sendPostRequestFirstTime(username, metrics);
                Log.d("EO_ME", "WORKING BOOL DAJEM NA FALSE");
                this.sharedpreferences.edit().putBoolean("working", false).apply();
                return Result.success();
            } else {
                float prevPrec = sharedpreferences.getFloat(MODEL_PRECISION, 0);
                JSONObject jsonObject = null;
                Log.d("EO_ME", "prev_prec was "+prevPrec);
                Log.d("EO_ME", "current prec is "+precision);
                if (banditDecidedToAsk) {
                    Log.d("EO_ME", "BANDIT DECIDED TO ASK");
                    if (precision > prevPrec) {
                        Log.d("EO_ME", "BANDIT DECIDED TO ASK IM GIVING HIM A REWARD FOR BETTER PRECISION");
                        jsonObject = MLUtils.giveBanditReward(getBanditPath(), banditPull);
                    } else {
                        Log.d("EO_ME", "BANDIT DECIDED TO ASK IM GIVING HIM PUNISHMENT FOR WORSE PRECISION");
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull);
                    }
                } else {
                    Log.d("EO_ME", "BANDIT HAS NOT DECIDED TO ASK TIME FOR REVERSE LOGIC");
                    if (precision < prevPrec) {
                        // nagrada
                        Log.d("EO_ME", "bandit decided not to ask and he was right. Precision now is even worse");
                        jsonObject = MLUtils.giveBanditReward(getBanditPath(), banditPull);
                    } else {
                        // kazn
                        Log.d("EO_ME", "bandit decided not to ask and he was WRONG. Precision is now grater, we need to punish him");
                        jsonObject = MLUtils.punishBandit(getBanditPath(), banditPull);
                    }
                }

                Log.d("EO_ME", "predictionDATA "+predictionDATA);
                sendPostRequestNotFirstTime(username, metrics, jsonObject, predictionDATA, banditPull, banditDecidedToAsk);
                Log.d("EO_ME", "ratal mi je do konca pridt z usm");

                this.sharedpreferences.edit().putBoolean("working", false).apply();
                Log.d("EO_ME", "WORKING BOOL DAJEM NA FALSE");

                this.sharedpreferences.edit().putFloat(MODEL_PRECISION, (float) precision)
                        .apply();
                return Result.success();
            }

        } catch (Exception e) {
            Log.e("EO_ME", "error while evaluating rf!");
            Log.e("EO_ME", e.toString());
            return Result.failure();
        }


    }

    private void sendPostRequestFirstTime(String username, double [] metrics){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try {
            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", true);
            jsonBody.put("username", username);
            jsonBody.put("dataModel", metrics[0]+";"+metrics[1]+";"+metrics[2]+";"+metrics[3]);
            sender.sendPostRequest("http://163.172.169.249:9082/phase1/metrics", jsonBody.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }

    }

    private void sendPostRequestNotFirstTime(String username, double [] metrics, JSONObject banditData, String predictionDATA, int banditPull, boolean banditDecidedToAsk){
        Sender sender = Sender.getInstance();
        JSONObject jsonBody = new JSONObject();

        try{
            jsonBody.put("validID", "idjasoiadsjoiadsjdosaijadsojasdosadikjdsaoijsdaoisdaj");
            jsonBody.put("firstTime", false);
            jsonBody.put("username", username);

            float decisionBoundry = sharedpreferences.getFloat(MODEL_DECISION_BOUNDRY, -1);

            jsonBody.put("dataModel", metrics[0]+";"+metrics[1]+";"+metrics[2]+";"+metrics[3]+";"+decisionBoundry);
            jsonBody.put("predictionDATA", predictionDATA);


            int currentNumberOfPulls = banditData.getInt("allTimePulls");
            int regret = banditData.getInt("regret");
            int totalReward = banditData.getInt("totalReward");

            jsonBody.put("banditCSV", currentNumberOfPulls+";"+banditPull+";"+banditDecidedToAsk+";"+regret+";"+totalReward);
            jsonBody.put("banditJSON", banditData);

            sender.sendPostRequest("http://163.172.169.249:9082/phase1/metrics", jsonBody.toString());

        }catch (JSONException e){
            Log.e("EO_ME", "there was an error while creating jsonobject");
            Log.e("EO_ME", e.toString());
        }
    }

    public RandomForest trainClassifier() {
        RandomForest randomForest = null;

        if (getIsFirstTime()) {
            Log.d("EO_ME", "STVAR JE FIRST TIME");
            Instances dataset = MLUtils.readDatasetFromFile(getFullDatasetPath()); // 1) Ker prvic treniram preberem vse iz fajla kar imam

            Log.d("EO_ME", "NUM INSTANCES IN full SET" + dataset.numInstances());
            Instances[] splitedDataset = MLUtils.splitDataset(dataset); // 2) Splitam na train in test set
            setTrainset(splitedDataset[0]); // 3) Nastavim trainset
            setTestset(splitedDataset[1]); // 4) Nastavim testset

            Log.d("EO_ME", "NUM INSTANCES IN TRAIN SET" + getTrainset().numInstances());
            Log.d("EO_ME", "NUM INSTANCES IN TEST SET" + getTestset().numInstances());
            MLUtils.writeDataToFile(getTrainingPath(), getTrainset(), false); // 5) Zacnem s pisanjem train seta
            MLUtils.writeDataToFile(getTestingPath(), getTestset(), false); // 6) Zacnem s pisanjem testseta
            randomForest = MLUtils.buildRF(getTrainset()); // 7) Natreniramo model
            Log.d("EO_ME", "STVAR JE FIRST TIME11");
        } else {
            Log.d("EO_ME", "STVAR NI FIRST TIME");
            Instances instances = MLUtils.constructDatasetHeader(); // 1) Skonstruiramo header za novo dodane instance
            instances.setClassIndex(instances.numAttributes() - 1); // 2) Povemo kateri index je class
            Instance instance = new DenseInstance(6); // 3) Kreiramo prazno instanco

            instance.setValue(instances.attribute("u"), getPassedInstance()[0]); // user activity
            instance.setValue(instances.attribute("e"), Double.parseDouble(getPassedInstance()[1])); // env brightness
            instance.setValue(instances.attribute("t"), getPassedInstance()[2]); // theme
            instance.setValue(instances.attribute("l"), getPassedInstance()[3]); // layout
            instance.setValue(instances.attribute("f"), getPassedInstance()[4]); // font size
            instance.setValue(instances.attribute("o"), getPassedInstance()[5]); // output

            instances.add(instance); // 7) Instanco dodamo
            Log.d("EO_ME", "treniram model s toliko novih instanc " + instances.numInstances());
            randomForest = trainClfWithData(instances); // 7) Model treniramo
        }

        return randomForest; //8) model vrnemo
    }

    public RandomForest trainClfWithData(Instances newInstances) {
        Log.d("EO_ME", "first time je drugic false, appendam v trenining berem iz iz treninga");
        Instances instances = MLUtils.readDatasetFromFile(getTrainingPath()); // 1) Preberemo obstojece instance
        Log.d("EO_ME", "st prebranih instanc po dodajanju je " + instances.numInstances());
        instances.addAll(newInstances);  // 2) Dodamo nove instance
        MLUtils.writeDataToFile(getTrainingPath(), newInstances, true); // Appendamo instance v fajl
        setTrainset(instances); // 3) Nastavimo trainset globalen in testset -> rabimo za evalvacijo modela
        setTestset(MLUtils.readDatasetFromFile(getTestingPath())); // 4) Nastavimo testset ki je vedno isti iz datoteke
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
