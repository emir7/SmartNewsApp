package com.ml.plugin;

public class ThresholdPoint {
    private double thr;
    private double fpr;
    private double tpr;
    private double distance;

    public ThresholdPoint(double thr, double fpr, double tpr, double distance) {
        this.thr = thr;
        this.fpr = fpr;
        this.tpr = tpr;
        this.distance = distance;
    }

    public double getThr() {
        return thr;
    }

    public void setThr(double val) {
        this.thr = val;
    }

    public double getFpr() {
        return fpr;
    }

    public void setFpr(double val) {
        this.fpr = val;
    }

    public double getTpr() {
        return tpr;
    }

    public void setTpr(double val) {
        this.tpr = val;
    }


    public double getDistance() {
        return distance;
    }

    public void setDistance(double val) {
        this.distance = val;
    }

    public String toString() {
        return String.format("(fpr = %f, tpr = %f, thr = %f, d=%f)",
                this.getFpr(), this.getTpr(), this.getThr(), this.getDistance());
    }

}