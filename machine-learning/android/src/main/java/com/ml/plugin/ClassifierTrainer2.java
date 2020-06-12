package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

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

    public ClassifierTrainer2(Context context, WorkerParameters params) {
        super(context, params);

        sharedpreferences = getApplicationContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        editor = sharedpreferences.edit();

        trainingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTrain.csv";
        testingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/dataTest.csv";
        fullDatasetPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/Dataset/fullset.csv";
        modelPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/Model/model";
        banditPath = getApplicationContext().getExternalFilesDir(null).getAbsoluteFile() + "/bandits/data.json";

        isFirstTime = getInputData().getBoolean("firstTime", true);
        banditDecidedToAsk = getInputData().getBoolean("banditDecidedToAsk", true);
        banditPull = getInputData().getInt("banditPull", 0);
    }

    @NonNull
    @Override
    public Result doWork() {

        RandomForest randomForest = trainClassifier();
        MLUtils.serializeModel(randomForest, getModelPath());
        Log.d("EO_ME", "ratal mi je serializacijo izvesti");

        Evaluation eval = null;
        try {
            eval = new Evaluation(getTrainset()); // Rabimo za threshold
            eval.evaluateModel(randomForest, getTestset());

            ThresholdPoint optimalThresholdPoint = MLUtils.getThreshold(eval); // Izracunamo threshold
            this.sharedpreferences.edit().putFloat(MODEL_DECISION_BOUNDRY, (float) optimalThresholdPoint.getThr())
                    .apply(); // zapisemo threshold

            double precision = MLUtils.calculatePrecision(getTestset(), randomForest, optimalThresholdPoint.getThr()); // prever če se da brez tega iz evala ze

            if (getIsFirstTime()) {
                this.sharedpreferences.edit().putFloat(MODEL_PRECISION, (float) precision)
                        .apply();
                Log.d("EO_ME", "ratal mi je do konca pridt z usm 11");
                Log.d("EO_ME", "precision = " + precision);
                Log.d("EOP_ME", optimalThresholdPoint.toString());
                this.sharedpreferences.edit().putBoolean("started", false).apply();
                return Result.success();
            } else {
                float prevPrec = sharedpreferences.getFloat(MODEL_PRECISION, 0);
                String jsonBanditString = MLUtils.readBanditFile(getBanditPath());
                JSONObject jsonObject = new JSONObject(jsonBanditString);

                if (banditDecidedToAsk) {
                    if (precision > prevPrec) {
                        jsonObject.put("totalReward", jsonObject.getInt("totalReward") + 1);
                        String sumOfRewardsAsString = jsonObject.getString("sumOfReward");
                        int[] sumOfReward = stringToArr(sumOfRewardsAsString);
                        sumOfReward[banditPull]++;
                        jsonObject.put("sumOfReward", Arrays.toString(sumOfReward));
                    } else {
                        jsonObject.put("totalReward", jsonObject.getInt("totalReward") - 1);
                        String sumOfRewardsAsString = jsonObject.getString("sumOfReward");
                        int[] sumOfReward = stringToArr(sumOfRewardsAsString);
                        sumOfReward[banditPull]--;
                        jsonObject.put("sumOfReward", Arrays.toString(sumOfReward));
                    }
                } else {
                    if (precision < prevPrec) {
                        jsonObject.put("totalReward", jsonObject.getInt("totalReward") + 1);
                        String sumOfRewardsAsString = jsonObject.getString("sumOfReward");
                        int[] sumOfReward = stringToArr(sumOfRewardsAsString);
                        sumOfReward[banditPull]++;
                        jsonObject.put("sumOfReward", Arrays.toString(sumOfReward));
                    } else {
                        jsonObject.put("totalReward", jsonObject.getInt("totalReward") - 1);
                        String sumOfRewardsAsString = jsonObject.getString("sumOfReward");
                        int[] sumOfReward = stringToArr(sumOfRewardsAsString);
                        sumOfReward[banditPull]--;
                        jsonObject.put("sumOfReward", Arrays.toString(sumOfReward));
                    }
                }

                MLUtils.writeToBanditFile(getBanditPath(), jsonObject.toString());
                Log.d("EO_ME", "ratal mi je do konca pridt z usm");
                this.sharedpreferences.edit().putBoolean("started", false).apply();

                return Result.success();
            }

        } catch (Exception e) {
            Log.e("EO_ME", "error while evaluating rf!");
            Log.e("EO_ME", e.toString());
            return Result.failure();
        }


    }

    public int[] stringToArr(String string) {
        String[] strings = string.replace("[", "").replace("]", "").split(", ");
        int[] result = new int[strings.length];
        for (int i = 0; i < result.length; i++) {
            result[i] = Integer.parseInt(strings[i]);
        }
        return result;
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

            for (int i = 0; i < instances.numAttributes(); i++) { // 4) ji dodamo atribute
                if (i == 1) { // 5) Edini field ki je double
                    instance.setValue(i, Double.parseDouble(getPassedInstance()[i]));
                } else { // 6) Vsi ostali fieldi so string
                    instance.setValue(i, getPassedInstance()[i]);
                }
            }
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
