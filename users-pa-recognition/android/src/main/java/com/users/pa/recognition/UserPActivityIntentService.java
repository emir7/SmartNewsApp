package com.users.pa.recognition;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;

import java.util.ArrayList;
import java.util.Arrays;

public class UserPActivityIntentService extends IntentService {

    protected static final String TAG = "SENSOR_DATA_READING";

    public UserPActivityIntentService() {
        super(TAG);
        Log.i(TAG, "constructor called");
    }

    @Override
    protected void onHandleIntent(Intent intent) {
        Log.i(TAG, "onHandleIntent called");

        if(ActivityRecognitionResult.hasResult(intent)) {
            ActivityRecognitionResult result = ActivityRecognitionResult.extractResult(intent);
            ArrayList<DetectedActivity> detectedActivities = (ArrayList<DetectedActivity>) result.getProbableActivities();

            int [] activityArr = new int [detectedActivities.size()];
            int [] activityProbs = new int [detectedActivities.size()];

            for(int i = 0; i < detectedActivities.size(); i++) {
                activityArr[i] = detectedActivities.get(i).getType();
                activityProbs[i] = detectedActivities.get(i).getConfidence();
            }

            Intent activityDataIntent = new Intent();
            activityDataIntent.putExtra(Constants.ACTIVITY_ARRAY_OF_TYPES, activityArr);
            activityDataIntent.putExtra(Constants.ACTIVITY_ARRAY_OF_PROBS, activityProbs);

            Log.d("USER_PA_RECOGNITION_", Arrays.toString(activityArr));
            Log.d("USER_PA_RECOGNITION_", Arrays.toString(activityProbs));

            activityDataIntent.setAction(Constants.ACTIVITY_DATA_INTENT_ACTION);
            sendBroadcast(activityDataIntent);
        }
    }
}
