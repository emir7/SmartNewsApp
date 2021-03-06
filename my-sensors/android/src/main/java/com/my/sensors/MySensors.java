package com.my.sensors;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@NativePlugin()
public class MySensors extends Plugin {

    public class SensorDataReader implements SensorEventListener {

        private SensorManager sensorManager;
        private Sensor brightnessSesnor;

        public SensorDataReader() {
            sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
            brightnessSesnor = sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT);
            sensorManager.registerListener(this, brightnessSesnor, SensorManager.SENSOR_DELAY_NORMAL);
        }

        @Override
        public void onSensorChanged(SensorEvent sensorEvent) {
            Log.i("MY_SENSOR_BRIGHTNESS", "value = " + sensorEvent.values[0]);
            JSObject jsObject = new JSObject();
            jsObject.put("value", sensorEvent.values[0]);
            notifyListeners("mySensorBrightness", jsObject);
        }

        @Override
        public void onAccuracyChanged(Sensor sensor, int i) {
            Log.i("MY_SENSOR_BRIGHTNESS", "onAccuracyChanged");
        }
    }

    @PluginMethod()
    public void startBrigtnessSensor(PluginCall call) {
        SensorDataReader sensorDataReader = new SensorDataReader();

        JSObject ret = new JSObject();
        ret.put("value", "ok");
        call.success(ret);
    }

    @PluginMethod
    public void getScreenBrightness(PluginCall call) {
        try{
            JSObject ret = new JSObject();
            float currBrightness = android.provider.Settings.System.getInt(getContext().getContentResolver(), Settings.System.SCREEN_BRIGHTNESS);
            ret.put("screenBrightness", currBrightness);
            call.success(ret);
        }catch (Settings.SettingNotFoundException e){
            e.printStackTrace();
        }
    }


    @PluginMethod()
    public void getNetworkStatus(PluginCall call) {

        ConnectivityManager connManager = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo mWifi = connManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
        NetworkInfo networkInfo = connManager.getActiveNetworkInfo();
        try{
            if(networkInfo.isConnected()) {
                if(mWifi.isConnected()) {
                    WifiManager wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    int numberOfLevels = 3;
                    WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                    int level = WifiManager.calculateSignalLevel(wifiInfo.getRssi(), numberOfLevels);
                    JSObject ret = new JSObject();
                    ret.put("type","wifi");
                    ret.put("value", level);
                    ret.put("strength", level);
                    call.success(ret);
                } else {
                    JSObject ret = new JSObject();
                    String cellularNetwork = getNetworkClass();
                    ret.put("type","cellular");
                    ret.put("value", cellularNetwork);
                    ret.put("strength", getCellularStrength(cellularNetwork));
                    call.success(ret);
                }
            }else{
                JSObject ret = new JSObject();
                ret.put("type","none");
                ret.put("value", 0);
                ret.put("strength", -1);
                call.success(ret);
            }
        }catch (Exception e) {
            Log.i("MY_SENSOR_INTERNET", "USER HAS ERROR "+e.toString());
            e.printStackTrace();
        }

    }

    private int getCellularStrength(String type) {
        if(type.equals("2G")) {
            return 0;
        }

        if(type.equals("3G")) {
            return 1;
        }

        return 2;
    }

    public String getNetworkClass() {
        TelephonyManager telephonyManager = (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);
        int networkType = telephonyManager.getNetworkType();
        switch (networkType) {
            case TelephonyManager.NETWORK_TYPE_GPRS:
            case TelephonyManager.NETWORK_TYPE_EDGE:
            case TelephonyManager.NETWORK_TYPE_CDMA:
            case TelephonyManager.NETWORK_TYPE_1xRTT:
            case TelephonyManager.NETWORK_TYPE_IDEN:
                return "2G";
            case TelephonyManager.NETWORK_TYPE_UMTS:
            case TelephonyManager.NETWORK_TYPE_EVDO_0:
            case TelephonyManager.NETWORK_TYPE_EVDO_A:
            case TelephonyManager.NETWORK_TYPE_HSDPA:
            case TelephonyManager.NETWORK_TYPE_HSUPA:
            case TelephonyManager.NETWORK_TYPE_HSPA:
            case TelephonyManager.NETWORK_TYPE_EVDO_B:
            case TelephonyManager.NETWORK_TYPE_EHRPD:
            case TelephonyManager.NETWORK_TYPE_HSPAP:
                return "3G";
            case TelephonyManager.NETWORK_TYPE_LTE:
                return "4G";
            default:
                return "Unknown";
        }
    }
}
