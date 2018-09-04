module.exports = {
    getCurrentFile: function (module) {
        'use strict';

        return module.filename.split('/').pop();
    }
};
