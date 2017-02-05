var socket = io();
var path = window.location.pathname;
var pathArray = path.split('/');
var id = pathArray.pop();
if (id.length === 0) {
    id = pathArray.pop();
}

function getFirstLine(text) {
    var indexOfFirstLineBreak = text.indexOf('\n');
    if (indexOfFirstLineBreak === -1) {
        return text;
    }
    return text.substring(0, indexOfFirstLineBreak);
}

function setWindowTitle(title) {
    if (title.length > 0) {
        document.title = title + " - Scribbles";
    }
    else {
        document.title = "Scribbles";
    }
}

function deleteScribbleIdCookie() {
    document.cookie = 'scribbleId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

socket.emit('load', id, function (text) {
    $('textarea').val(text);
    $('body').addClass('ready');
    setWindowTitle(getFirstLine(text));
});

$('textarea').on('input', function () {
    socket.emit('change', { id: id, text: $('textarea').val() });
    setWindowTitle(getFirstLine($('textarea').val()));
});

$('.fa-clone').on('click', function () {
    $('textarea').select();
    var success = document.execCommand('copy');
    console.log(success);
});

$('.fa-trash-o').on('click', function () {
    if (confirm("Are you sure?")) {
        socket.emit('delete', { id: id });
        deleteScribbleIdCookie();
        window.location = '/';
    }
});

socket.on('change', function (e) {
    if (e.id === id) {
        $('textarea').val(e.text);
        setWindowTitle(getFirstLine(e.text));
    }
});

socket.on('delete', function (e) {
    if (e.id === id) {
        window.location = '/';
    }
});