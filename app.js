var http = require('http');
var fs = require('fs');
var path = require('path');
var util = require('util');
var formidable = require('formidable');
var unzip = require('unzip2');

function handle404Request(response){
    console.log("404 Occurs");
    response.writeHead(404, {"Context-Type": "text/plain"});
    response.write("404 Occurs for the webpage");
    response.end();
}

function webRequest(request, response){

    if (request.method == "GET" && request.url == "/"){
        response.writeHead(200, {"Context-Type": "text/html"});
        fs.createReadStream('./index.html').pipe(response);
    } else if(request.method == "POST" && request.url == "/upload") {
        console.log("triggered");
        var form = new formidable.IncomingForm();

        form.parse(request, function(err, fields, files) {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('done');
            response.end(util.inspect({fields: fields, files: files}));
            var tmp_path = files['upload-file']['path'];
            var tmp_name = files['upload-file']['name'];
            move_to(tmp_path, tmp_name);
        });

    }

    else {
        handle404Request(response);
    }
}

function wrapper(name) {
    var paths = './songs/' + name + '/map.osu';
    console.log(paths);
    if(fs.existsSync(paths)) {
        console.log("process json");
        handleMap('./songs/' + name + '/map.osu', './songs/' + name + '/map.json');
    }
}

function move_to(path, newname){
    var name = newname.split('.')[0];
    var newpath = './songs/' + newname;
    fs.renameSync(path, newpath);
    console.log('new path is ' + newpath);
    var stream = fs.createReadStream(newpath).pipe(unzip.Extract({path:'./songs/'}));
    stream.on('finish', function(){wrapper(name)});
    fs.appendFile('songlist.txt', name + '\n', function (err){
        if (err) throw err;
        console.log('updated list');
    });
}

function internalRequest(request, response){

    if (request.method == "GET" && request.url == "/songlist"){
        response.writeHead(200, {"Context-Type": "text/plain"});
        var songlist = path.join(__dirname, 'songlist.txt');
        fs.readFile(songlist, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log("openned list");
            response.write(data.toString());
            response.end();
        });
    }

    else {
        handle404Request(response);
    }
}

function songsRequest(request, response) {
    if (request.method == "GET" && request.url.indexOf("/songs") > -1) {
        if (true) {
            console.log("mp3");
            var filePath = path.join(__dirname, request.url);

            console.log(filePath);

            var stat = fs.statSync(filePath);
            response.writeHead(200, {
                'Content-Type': 'audio/mp3',
                'Content-length': stat.size
            });

            var readStream = fs.createReadStream(filePath);
            readStream.pipe(response);
        }
    }
    else {
        handle404Request(response);
    }
}

function backgroundRequest(request, response) {
    if (request.method == "GET" && request.url.indexOf("/songs") > -1) {
        if (true) {
            console.log("background");
            var filePath = path.join(__dirname, request.url);

            console.log(filePath);

            var stat = fs.statSync(filePath);
            response.writeHead(200, {
                'Content-length': stat.size
            });

            var readStream = fs.createReadStream(filePath);
            readStream.pipe(response);
        }
    }
    else {
        handle404Request(response);
    }
}
function jsonRequest(request, response) {
    if (request.method == "GET" && request.url.indexOf("/songs") > -1) {
        console.log("json");
        var filePath = path.join(__dirname, request.url);

        console.log(filePath);

        var stat = fs.statSync(filePath);
        response.writeHead(200, {
            'Content-length': stat.size
        });

        var readStream = fs.createReadStream(filePath);
        readStream.pipe(response);
    }
    else {
        handle404Request(response);
    }
}

/*--------------------OSU PARSER---------------------------*/
var directionEnum = {
    0 : 'left',
    1 : 'right',
    2 : 'up',
    3 : 'down',
    4 : 'hold'
}

function randomDirection(s) {
    if (s != "circle") {
        return directionEnum[4];
    }
    return directionEnum[Math.random()*4294967296 % 4];
}

function handleMap(name, path) {
    var parser = require('osu-parser');
    parser.parseFile(name, function (err, beatmap) {
        if(beatmap){
            beatmap.hitObjects.map(function(dict) {
                for (var prop in dict) {
                    if(prop != 'startTime' && prop != 'position' && prop!= 'objectName' && prop!= 'endTime') {
                        delete dict[prop];
                    }
                }
                for (var prop in dict) {
                    if(prop == 'objectName') {
                        dict[prop] = randomDirection(dict[prop]);
                    }
                }
                return dict;
            })
        }
        sendOut(beatmap, path, unifySongname(beatmap));
    });
}

function unifySongname(beatmap){
    beatmap['AudioFilename'] = 'music.mp3';
}

function sendOut(objects, path, callback){
    if (objects) {
        for (var prop in objects) {
            if(prop != 'breakTimes' && prop != 'hitObjects' && prop != 'AudioFilename' && prop != 'TitleUnicode'){
                delete objects[prop];
            }
        }
    }
    callback;
    fs.writeFile(path , JSON.stringify(objects));
}

/*------------------------Score----------------------------*/

function receiveScore(request, response){
    if (request.method == "GET" && request.url == "/uploadscore") {
        try {
            var h = request.headers;
            var songname = h['songname'];
            var score = h['score'];
            var time = h['time'];
            var f = "./scorelist.txt";

            /*TOBE IMPLEMENTED IN MySQL*/
            fs.appendFile(f, songname + ' ' + score + ' ' + time + ' ' + '\n', function (err){
                if (err) throw err;
                console.log('score received');
            });
            /*temp solution*/
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('score uploaded at ' + time);
            response.end();

        } catch (e) {
            console.log("header problem")
            console.log(e);
        }
    }
}


/*---------------------------------------------------------*/

http.createServer(webRequest).listen(8888);
http.createServer(internalRequest).listen(9012);
http.createServer(songsRequest).listen(9013); //songs
http.createServer(backgroundRequest).listen(9014); //background
http.createServer(jsonRequest).listen(9015); //json
http.createServer(receiveScore).listen(12099); // receiveScore
console.log('starting');