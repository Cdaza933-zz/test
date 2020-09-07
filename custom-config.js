'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [
        
            'api-gatherer',
            'card-gatherer'
        ]
    }],

    audits: [
        'card-audit',
        'api-audit'
    ],

    categories: {
        ratp_pwa: {
            name: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            auditRefs: [
                {id: 'api-audit', weight: 1},
                {id: 'card-audit', weight: 1}
            ]
        }
    }
}; 
