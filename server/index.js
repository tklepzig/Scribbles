/*

// send to current request socket client
 socket.emit('message', 'this is a test');

 // sending to all clients, include sender
 io.sockets.emit('message', 'this is a test');

 // sending to all clients except sender
 socket.broadcast.emit('message', 'this is a test');

 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');

  // sending to all clients in 'game' room(channel), include sender
 io.sockets.in('game').emit('message', 'cool game');

 // sending to individual socketid
 io.sockets.socket(socketid).emit('message', 'for your eyes only');

*/

var path = require('path');
var file = require('./file')();
var config = require('./config.json')[process.env.NODE_ENV || 'production'];
var port = process.env.PORT || config.port;
var express = require("express");
var app = express();
// var bodyParser = require("body-parser");
var http = require("http").Server(app);
var socketIo = require('socket.io')(http, {
    pingTimeout: 2000,
    pingInterval: 2000
});
var documentsFile = path.resolve(__dirname + '/documents.json');
var documents = {};
var saveInterval;


if (file.exist(documentsFile)) {
    documents = JSON.parse(file.read(documentsFile));
}

function makeid() {
    var id = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++)
        id += possible.charAt(Math.floor(Math.random() * possible.length));

    return id;
}

function startSaveTimer() {
    saveInterval = setInterval(function () {
        file.write(documentsFile, JSON.stringify(documents));
    }, 1000 * 60 * 5);
}

function stopSaveTimer() {
    clearInterval(saveInterval);
}

app.get("/clear", function (req, res) {
    stopSaveTimer();
    documents = {};
    file.write(documentsFile, JSON.stringify(documents));
    startSaveTimer();
    return res.redirect('/');
});

app.use("/d/:id?", function (req, res, next) {
    if (!req.params.id) {
        return res.redirect('/');
    }
    next();
}, express.static(path.resolve(__dirname + "/../public")));

app.get("/", function (req, res) {
    var id = makeid();
    documents[id] = '';
    return res.redirect('/d/' + id);
});

socketIo.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    console.log('Client connected:\t' + clientIp);

    socket.on('load', function (id, callback) {
        var text = '';
        if (documents[id]) {
            var text = documents[id];
        }
        callback(text);
    });

    socket.on('change', function (obj) {
        documents[obj.id] = obj.text;
        socket.broadcast.emit('change', obj);
    });
});

startSaveTimer();

http.listen(port, function () {
    console.log("listening on *:" + port);
});
