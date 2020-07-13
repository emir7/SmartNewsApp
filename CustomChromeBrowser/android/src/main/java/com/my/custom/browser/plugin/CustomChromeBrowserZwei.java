package com.my.custom.browser.plugin;

import android.graphics.Color;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import androidx.browser.customtabs.CustomTabsIntent;

@NativePlugin(requestCodes = {Constants.BROWSER_REQUEST_CODE})
public class CustomChromeBrowserZwei extends Plugin {

    private boolean emitEvent = false;

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        Log.d("CUSTOM_BROWSER", "handleOnPause");
    }

    @PluginMethod()
    public void open(PluginCall call) {
        String url = call.getString("url");
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        CustomTabsIntent customTabsIntent = builder.build();
        customTabsIntent.launchUrl(getContext(), Uri.parse(url));
        builder.setToolbarColor(Color.WHITE);
        emitEvent = true;
        call.success();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if(emitEvent) {
            Log.d(Constants.LOGGER_VALUE, "Emit");
            notifyListeners("browserClosed", new JSObject());
            emitEvent = false;
        }

    }

}
