export interface InternetStatusModel {
    type: string;
    strength: number;
    value: number | string;
}

export interface UserActivityModel {
    types: string[];
    probs: number[];
    values: number[];
}

export interface BatteryStatusModel {
    plugged: boolean;
    level: number;
    percentage: number;
}

export interface BrightnessModel {
    value: number;
    level: number;
}

export interface ContextModel {
    internetObj: InternetStatusModel;
    userActivityObj: UserActivityModel;
    batteryObj: BatteryStatusModel;
    brightnessObj: BrightnessModel;
    validObjs: boolean[];
}

export interface ViewDescription {
    view: string;
    showimages: string;
    fontSize: string;
    theme: string;
    c: number;
    d: Date;
}
