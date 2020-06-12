package com.ml.plugin;

import android.content.Context;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;

import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;

public class SetInitializer {

    Context context;

    public SetInitializer(Context context){
        this.context = context;
    }

    public void createDatasetFromScratch(String fullDatasetPath){
        BufferedReader reader = null;
        Instances dataset = MLUtils.constructDatasetHeader();
        dataset.setClassIndex(dataset.numAttributes() - 1);
        FileWriter fileWriter = null;
        try {
            File f = new File(fullDatasetPath);
            f.getParentFile().mkdirs();
            fileWriter = new FileWriter(f);

            reader = new BufferedReader(
                    new InputStreamReader( context.getAssets().open("data.csv"), "UTF-8"));
            String mLine = reader.readLine();

            fileWriter.write(mLine+"\n");

            while((mLine = reader.readLine()) != null){
                fileWriter.write(mLine+"\n");

                String[] splitedArr = mLine.split(",");
                Instance inst = new DenseInstance(6);

                for(int i = 0; i < 6; i++){
                    if(i == 1){
                        inst.setValue(dataset.attribute(i), Double.parseDouble(splitedArr[i]));
                    }else{
                        inst.setValue(dataset.attribute(i), splitedArr[i]);
                    }
                }

                dataset.add(inst);
            }

        } catch (IOException e) {
            e.printStackTrace();
            Log.e("EO_ME", "error occured inside setInitializer1");
            Log.e("EO_ME", e.toString());
        } finally {
            if(reader != null) {
                try {
                    reader.close();
                }catch (IOException e){
                    Log.e("EO_ME", "error occured inside setInitializer2");
                    Log.e("EO_ME", e.toString());
                }
            }

            if(fileWriter != null){
                try {
                    fileWriter.flush();
                } catch (IOException e) {
                    Log.e("EO_ME", "error while flushing filewriter inside setIniter");
                    e.printStackTrace();
                }
                try {
                    fileWriter.close();
                } catch (IOException e) {
                    Log.e("EO_ME", "error while closing filewriter inside setIniter");
                    e.printStackTrace();
                }
            }
        }

    }
}
