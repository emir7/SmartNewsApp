const API = require('../utils/api.request');

module.exports = class Cache {

    constructor() {
        this.news = {};
        this.api = new API();
        this.apiUrl = 'https://newsapi.org/v2';
        this.apiKey = 'cc5c7c95c27a4b1890f1bd224ef9a2db';
        this.categories = ['entertainment', 'sports'];
        this.startIntervalNewsFetching();
    }

    startIntervalNewsFetching() {
        this.fetchData();
        setInterval(() => {
            this.fetchData();
        }, 15 * 60000)
    }

    fetchData() {
        let promiseArr = [];
        for (const category of this.categories) {
            promiseArr.push(this.sendRequestWithCategories(category));
        }

        promiseArr.push(this.sendRequestTopHeadlines())

        return Promise.all(promiseArr).then(results => {
            for (const result of results) {
                console.log('got results');
                this.news[result.category] = result.res;
            }
        });
    }

    sendRequestWithCategories(category) {
        const options = {
            uri: `${this.apiUrl}/top-headlines/?country=si&category=${category}&apiKey=${this.apiKey}`,
            method: 'GET'
        };

        return this.api.sendRequest(options).then(res => {
            return {
                category,
                res
            };
        });

    }

    sendRequestTopHeadlines() {
        const options = {
            uri: `${this.apiUrl}/top-headlines/?country=si&apiKey=${this.apiKey}`,
            method: 'GET'
        };

        return this.api.sendRequest(options).then(res => {
            return {
                category: 'top-headlines',
                res
            };
        });
    }

    getNews(key) {
        return this.news[key];
    }
};