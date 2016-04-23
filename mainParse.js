var fs = require('fs');
var f = "./map.json";
var directionEnum = {
    1 : 'left',
    2 : 'right',
    3 : 'up',
    4 : 'down',
    5 : 'hold'
}

function randomDirection() {
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
                        dict[prop] = randomDirection();
                    }
                }
                return dict;
            })
        }
        sendOut(beatmap, path, unifySongname(beatmap));
    });
}

function unifySongname(beatmap){
    beatmap['AudioFilename'] = 'song.mp3';
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
    return;
}