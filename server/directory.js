'use strict';

module.exports = function() {

    let module = {};

    let fs = require('fs');

    module.create = function (path) {
        fs.mkdirSync(path);
    }
    
    module.exist = function(directory) {
        try {
            fs.statSync(directory).isDirectory();
            return true;
        } catch (ex) {
            if (ex.code === 'ENOENT') { //file not found
                return false;
            } else {
                throw ex;
            }
        }
    };


    return module;
};
