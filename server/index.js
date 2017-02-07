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

let path = require('path');
let file = require('./file')();
let directory = require('./directory')();
let config = require('./config.json')[process.env.NODE_ENV || 'production'];
let port = process.env.PORT || config.port;
let express = require("express");
let formidable = require('formidable');
let uuid = require("uuid");
let fs = require('fs');
let app = express();
let cookieParser = require('cookie-parser');
let http = require("http").Server(app);
let socketIo = require('socket.io')(http, {
    pingTimeout: 2000,
    pingInterval: 2000
});
let documentsFile = path.resolve(__dirname + '/documents.json');
const uploadDir = path.join(__dirname, '/uploads');

if (!directory.exist(uploadDir)) {
    directory.create(uploadDir);
}

let documents = {};
let saveInterval;


if (file.exist(documentsFile)) {
    documents = JSON.parse(file.read(documentsFile));
}

function makeid() {
    let id = "";
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 6; i++)
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

app.use(cookieParser());

app.get("/download/:fileId", function (req, res) {
    let files = fs.readdirSync(uploadDir);
    for (let i = 0; i < files.length; i++) {
        let fileName = files[i];

        let fileId = fileName.substr(0, fileName.indexOf("_"));
        let fileNameWithoutId = fileName.substr(fileName.indexOf("_") + 1);

        if (fileId === req.params.fileId) {
            return res.download(path.join(uploadDir, fileName), fileNameWithoutId);
        }
    }
    res.status(404).send('Not found');
});

app.post("/upload/:id", function (req, res) {
    let id = req.params.id;
    let form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = uploadDir;

    form.on('file', function (field, file) {
        const fileId = uuid.v4();
        fs.rename(file.path, path.join(form.uploadDir, fileId + "_" + file.name));

        if (!documents[id]) {
            documents[id] = {};
        }
        if (!documents[id].files) {
            documents[id].files = [];
        }
        documents[id].files.push(fileId);

        console.log(fileId);
    });

    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
    });

    form.on('end', function () {
        res.end('success');
    });

    form.parse(req);
});

//TODO: how to merge the following two app.* with the public dir?
app.use("/d/:id", express.static(path.resolve(__dirname + "/../public")));
app.get("/d/:id?", function (req, res) {
    if (!req.params.id) {
        return res.redirect('/');
    }

    return res.sendFile(path.resolve(__dirname + "/../public/index.html"));
});

app.get("/", function (req, res) {
    let id;
    let previousId = req.cookies.scribbleId;

    if (previousId) {
        id = previousId;
    }
    else {

        id = makeid();
        res.cookie('scribbleId', id, {
            expires: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
            httpOnly: false //otherwise it cannot be deleted by js on client side
        });
    }
    return res.redirect('/d/' + id);
});

socketIo.on('connection', function (socket) {
    let clientIp = socket.request.connection.remoteAddress;
    console.log('Client connected:\t' + clientIp);

    socket.on('load', function (id, callback) {
        let text = '';
        if (documents[id] && documents[id].text) {
            text = documents[id].text;
        }
        callback(text);
    });

    socket.on('change', function (e) {
        if (!documents[e.id]) {
            documents[e.id] = {};
        }
        documents[e.id].text = e.text;
        socket.broadcast.emit('change', e);
    });

    socket.on('delete', function (e) {
        stopSaveTimer();
        delete documents[e.id];
        file.write(documentsFile, JSON.stringify(documents));
        startSaveTimer();
        socket.broadcast.emit('delete', e);
    });
});

startSaveTimer();

http.listen(port, function () {
    console.log("listening on *:" + port);
});
