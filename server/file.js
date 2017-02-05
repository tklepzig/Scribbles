'use strict';

module.exports = function() {

    let module = {};

    let fs = require('fs');

    module.write = function(path, content) {
        return fs.writeFileSync(path, content);
    };

    module.read = function(path) {
        return fs.readFileSync(path, 'utf8');
    };

    module.exist = function(file) {
        try {
            fs.statSync(file);
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
