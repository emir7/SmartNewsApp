package com.ml.plugin.data.api.sender;

import android.util.Log;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class Sender {
    private OkHttpClient client;
    public static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private static Sender singeltonSender = null;

    public Sender() {
        client = new OkHttpClient();
    }

    public void sendPostRequest(String URL, String json) {

        RequestBody body = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(URL)
                .post(body)
                .build();

        client.newCall(request)
                .enqueue(new Callback() {
                    @Override
                    public void onFailure(@NotNull Call call, @NotNull IOException e) {
                        Log.e("EO_ME", "error while sending POST request to server");
                        Log.e("EO_ME", e.toString());
                    }

                    @Override
                    public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                        Log.d("EO_ME", "Server Responded with" + response.body().string());
                    }
                });

    }

    public static Sender getInstance() {
        if (singeltonSender == null) {
            singeltonSender = new Sender();
        }

        return singeltonSender;
    }

}
