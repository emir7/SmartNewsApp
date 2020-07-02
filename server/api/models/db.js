const mongoose = require('mongoose')

//require('./user');

dbURI = 'mongodb://192.168.99.100/smartnews'

mongoose.connect(
    dbURI, {
        useNewUrlParser: true,
        useCreateIndex: true
    }
);

mongoose.connection.on('connected', function () {
    console.log('Mongoose is connected on: ' + dbURI);
});

mongoose.connection.on('error', function (err) {
    console.log('Mongoose encounterd an error when connecting: ' + err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose has closed the connection.');
});

let closeMongoose = function (msg, cb) {
    mongoose.connection.close(function () {
        console.log('Mongoose closed the connection via ' + msg);
        cb();
    });
};

// If using nodemon
process.once('SIGUSR2', function () {
    closeMongoose('Nodemon reboot.', function () {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// When exiting the application
process.on('SIGINT', function () {
    closeMongoose('Leaving the app.', function () {
        process.exit(0)
    });
});

// If using Heroku
process.on('SIGTERM', function () {
    closeMongoose('Leaving the app on Heroku.', function () {
        process.exit(0);
    });
});