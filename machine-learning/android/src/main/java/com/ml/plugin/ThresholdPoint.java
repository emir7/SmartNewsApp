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

    private double getThr() {
        return thr;
    }

    private void setThr(double val) {
        this.thr = val;
    }

    private double getFpr() {
        return fpr;
    }

    private void setFpr(double val) {
        this.fpr = val;
    }

    private double getTpr() {
        return tpr;
    }

    private void setTpr(double val) {
        this.tpr = val;
    }


    private double getDistance() {
        return distance;
    }

    private void setDistance(double val) {
        this.distance = val;
    }

    public String toString() {
        return String.format("(fpr = %f, tpr = %f, thr = %f, d=%f)",
                this.getFpr(), this.getTpr(), this.getThr(), this.getDistance());
    }

}