'use strict';

const Gatherer = require('lighthouse').Gatherer;

class apiCallTime extends Gatherer {
    afterPass(options) {
        const driver = options.driver;

        return driver.evaluateAsync('window.ApiCall')
            .then(apiCallTime => {
                if (!apiCallTime) {

                    throw new Error('Unable to find card load metrics in page');
                }
                return apiCallTime;
            });
    }
}


module.exports = apiCallTime; 
