'use strict';

const Audit = require('lighthouse').Audit;

const MAX_CARD_TIME = 3000;

class LoadAudit extends Audit {
    static get meta() {
        return {
            id: 'api-audit',
            title: 'api audit',
            category: 'MyPerformance',
            name: 'api-audit',
            description: 'Schedule api initialized and ready',
            failureDescription: 'Schedule api slow to initialize',
            helpText: 'Used to measure time from navigationStart to when the schedule' +
                ' api is shown.',
            requiredArtifacts: ['apiCallTime']
        };
    }

    static audit(artifacts) {
        const loadedTime = artifacts.apiCallTime;

        const belowThreshold = loadedTime <= MAX_CARD_TIME;

        return {
            displayValue: loadedTime,
            score: Number(belowThreshold)
        };
    }
}

module.exports = LoadAudit; 
