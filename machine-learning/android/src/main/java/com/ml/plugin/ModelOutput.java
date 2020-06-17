package com.ml.plugin;

import com.getcapacitor.JSObject;


public class ModelOutput {

    private String theme;
    private String layout;
    private String fontSize;
    private double probability;

    public ModelOutput(String theme, String layout, String fontSize, double probability){
        this.theme = theme;
        this.layout = layout;
        this.fontSize = fontSize;
        this.probability = probability;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }

    public String getFontSize() {
        return fontSize;
    }

    public void setFontSize(String fontSize) {
        this.fontSize = fontSize;
    }

    public double getProbability(){
        return this.probability;
    }

    public void setProbability(double val){
        this.probability = val;
    }


    public String toString(){
        return String.format("%s,%s,%s %f,%b;", getTheme(), getFontSize(), getLayout(), getProbability());
    }

    public JSObject converToJSObject(){
        JSObject jsObject = new JSObject();
        jsObject.put("t", getTheme());
        jsObject.put("f", getFontSize());
        jsObject.put("l", getLayout());
        jsObject.put("p", getProbability());
        return jsObject;
    }

}
