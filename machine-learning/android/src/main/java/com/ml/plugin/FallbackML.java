package com.ml.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;


import weka.classifiers.trees.RandomForest;
import weka.core.Instances;

public class FallbackML extends Worker {
    private String trainingPath;
    private String modelPath;

    private SharedPreferences sharedpreferences;
    SharedPreferences.Editor editor;

    public FallbackML(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
        Log.d(Constants.DEBUG_VAR, "fallback ml is called constructor!");
        trainingPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/DatasetDEV/dataTrain.csv";
        modelPath = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/ModelDEV/model";
        sharedpreferences = getApplicationContext().getSharedPreferences("si.fri.diploma", Context.MODE_PRIVATE);
        editor = sharedpreferences.edit();
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(Constants.DEBUG_VAR, "fallback ml is called!");
        Instances trainInstances = MLUtils.readDatasetFromFileMy(trainingPath);
        RandomForest randomForest = MLUtils.buildRF(trainInstances);
        MLUtils.serializeModel(randomForest, modelPath);
        this.sharedpreferences.edit().putBoolean("working", false).apply();
        return Result.success();
    }

    @Override
    public void onStopped() {
        super.onStopped();
        Log.d(Constants.DEBUG_VAR, "current (FallbackML) work was stopped!!!");
    }
}
