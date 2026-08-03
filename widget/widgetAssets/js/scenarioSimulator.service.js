/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';

(function () {
  angular
    .module('cybersponse')
    .factory('scenarioSimulatorService', scenarioSimulatorService);

  scenarioSimulatorService.$inject = ['$http', 'API'];

  function scenarioSimulatorService($http, API) {
    var service;
    service = {
      fetchData: fetchData
    };

    function fetchData( module, searchText) {
      const payload = {
        sort: [{ field: 'createDate', direction: 'DESC' }],
        logic: 'AND',
        limit: 30,
        filters: [],
        __selectFields: ['title', 'description', 'createdAlertsID', 'recordTags']
      };
      if (searchText) {
        payload.filters.push({
          logic: 'OR',
          filters: [
            { field: 'title', operator: 'like', _operator: 'like', value: `%${searchText}%`, type: 'primitive' },
            { field: 'description', operator: 'like', _operator: 'like', value: `%${searchText}%`, type: 'primitive' },
            { field: 'recordTags', value: [`/api/3/tags/${searchText}`], operator: 'in', type: 'array', OPERATOR_KEY: '$' }
          ]
        });
      }
      return $http.post(API.QUERY + module, payload);
    }

    return service;
  }
})();
