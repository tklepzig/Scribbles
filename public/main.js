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

socket.emit('load', id, function (doc) {
    $('textarea').val(doc.text);
    $('body').addClass('ready');
    setWindowTitle(getFirstLine(doc.text));

    if (doc.files.length > 0) {
        for (var i = 0; i < doc.files.length; i++) {
            var file = doc.files[i];

            var $name = $("<span>").addClass("name flex").text(file.name).attr("title", file.name);
            var $size = $("<span>").addClass("size").text(file.size);
            var $a = $("<a>").addClass("layout-h").attr("href", "/download/" + file.id).append($name).append($size);
            var $li = $("<li>").append($a);
            $("#files > ul").append($li);
        }
        $("#commands").addClass("short");
    }
    else {
        $("#files").addClass("hidden");
    }
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


$('body').bind('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();

    if (e.originalEvent.dataTransfer.items) {
        $('#dropArea > h4').text('Dateien und Ordner hier ablegen, um sie der Upload-Liste hinzuzufügen');
    } else {
        $('#dropArea > h4').text('Dateien hier ablegen, um sie der Upload-Liste hinzuzufügen');
    }

    $('#dropArea').addClass('visible');
    e.originalEvent.dataTransfer.dropEffect = 'copy';
});

$('#dropArea').bind('dragleave', function () {
    $('#dropArea').removeClass('visible');
});

$('#dropArea').bind('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    var files;

    // if (e.originalEvent.dataTransfer.items) {
    //     files = e.originalEvent.dataTransfer.items;
    //     // for (var i = 0; i < e.dataTransfer.items.length; i++) {
    //     //     var item = e.dataTransfer.items[i].webkitGetAsEntry();
    //     //     if (item) {
    //     //         processSubdirectory(item);
    //     //     }
    //     // }
    // } else if (e.originalEvent.dataTransfer.files) {
    files = e.originalEvent.dataTransfer.files;
    // }

    console.dir(files);

    if (files.length > 0) {
        var formData = new FormData();
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            console.log(file.size);
            formData.append('uploads[]', file, file.name);
        }

        $.ajax({
            url: '/upload/' + id,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function () {
                console.log('upload successful!');
            },
            xhr: function () {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function (evt) {

                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);

                        console.log(percentComplete + '%');
                        // update the Bootstrap progress bar with the new percentage
                        // $('.progress-bar').text(percentComplete + '%');
                        // $('.progress-bar').width(percentComplete + '%');

                        // once the upload reaches 100%, set the progress bar text to done
                        if (percentComplete === 100) {
                            console.log("done");
                            // $('.progress-bar').html('Done');
                        }

                    }

                }, false);

                return xhr;
            }
        });
    }

    $('#dropArea').removeClass('visible');
});