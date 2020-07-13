package com.users.pa.recognition;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.android.gms.location.ActivityRecognitionClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import java.util.Arrays;

@NativePlugin()
public class UsersPARecognition extends Plugin {

    protected static final String TAG = "SENSOR_DATA_READING";
    private ActivityRecognitionClient mActivityRecognitionClient;
    private Intent mIntentService;
    private PendingIntent mPendingIntent;

    private class ActivityRecognitionReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            int [] typesArr = intent.getIntArrayExtra(Constants.ACTIVITY_ARRAY_OF_TYPES);
            int [] probsArr = intent.getIntArrayExtra(Constants.ACTIVITY_ARRAY_OF_PROBS);

            JSObject jsObject = new JSObject();

            JSArray jsTypesArr = new JSArray();
            JSArray jsProbsArr = new JSArray();
            JSArray jsStringTypesArr = new JSArray();

            for(int i = 0; i < typesArr.length; i++) {
                jsTypesArr.put(typesArr[i]);
                jsProbsArr.put(probsArr[i]);
                jsStringTypesArr.put(activityTypeToString(typesArr[i]));
            }

            Log.d("USER_PA_RECOGNITION_", jsStringTypesArr.toString());


            jsObject.put("values", jsTypesArr);
            jsObject.put("probs", jsProbsArr);
            jsObject.put("types", jsStringTypesArr);

            notifyListeners("userPhysicalActivity", jsObject);
        }


        public String activityTypeToString(int activityType) {
            switch (activityType) {
                case 0: return "IN_VEHICLE";
                case 1: return "ON_FOOT"; // ON_BICYCLE
                case 2: return "ON_FOOT";
                case 3: return "STILL";
                case 4: return "ON_FOOT"; // UNKNOWN
                case 5: return "ON_FOOT"; // TILTING
                case 7: return "ON_FOOT"; // WALKING
                case 8: return "ON_FOOT"; // RUNNING
            }

            return "ON_FOOT";
        }
    }

    private ActivityRecognitionReceiver activityReceiver;

    @PluginMethod()
    public void startTrackingUserActivity(PluginCall call) {
        Log.i(TAG, "startTrackingUserActivity called");
        registerActivityReceiver();
        init();
        requestActivityUpdates();

        JSObject ret = new JSObject();
        ret.put("value", "ok");
        call.success(ret);
    }

    private void registerActivityReceiver(){
        activityReceiver = new ActivityRecognitionReceiver();
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(Constants.ACTIVITY_DATA_INTENT_ACTION);
        getContext().registerReceiver(activityReceiver, intentFilter);
    }

    private void init() {
        mActivityRecognitionClient = new ActivityRecognitionClient(getContext());
        mIntentService = new Intent(getContext(), UserPActivityIntentService.class);
        mPendingIntent = PendingIntent.getService(getContext(), 1, mIntentService, PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void requestActivityUpdates() {
        Task<Void> task = mActivityRecognitionClient.requestActivityUpdates(3000, mPendingIntent);
        task.addOnSuccessListener(new OnSuccessListener<Void>() {
            @Override
            public void onSuccess(Void aVoid) {
                Log.i(TAG, "Successfully requested activity updates.");
            }
        });

        task.addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {
                Log.i(TAG, "Requesting activity updates failed to start.");
            }
        });
    }

}