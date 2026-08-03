/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('scenarioSimulator100Ctrl', scenarioSimulator100Ctrl);

  scenarioSimulator100Ctrl.$inject = ['$scope', '$http', 'Entity', 'playbookService', 'widgetBasePath', 'websocketService', '$timeout', 'markdownEditorService', 'API', '$filter', '$q', 'scenarioSimulatorService'];

  function scenarioSimulator100Ctrl($scope, $http, Entity, playbookService, widgetBasePath, websocketService, $timeout, markdownEditorService, API, $filter, $q, scenarioSimulatorService) {
    const CURRENT_MODULE = 'scenario';
    let entity = new Entity(CURRENT_MODULE);
    let websocketProcessingTime = new Date();
    const websocketThresholdTime = 10000;//10 seconds threshold set to refresh grid
    let webSocketSubscription;
    let delayTimer;
    let destroyCollection; 
    const iconPath = widgetBasePath + 'widgetAssets/images/noImage.png';
    $scope.data = [];
    $scope.totalItems = 0;

    $scope.fetchMDDescription = fetchMDDescription;
    $scope.config = { 'searchText': '' };

    $scope.actionPlaybooks = {
      runScenario: {
        'id': '/api/3/workflows/a10522ac-2622-40bd-ad79-4487d9a1d7d7',
        'name': 'Run Scenario',
        'icon': 'fa fa-play',
        'btnClass': 'btn-primary'
      },
      resetScenario: {
        'id': '/api/3/workflows/98506caa-32ab-429d-9c0f-42d92a71b5d1',
        'name': 'Reset Scenario',
        'icon': 'fa fa-repeat',
        'btnClass': 'btn-default'
      }
    };

    function init() {
      $scope.loadingData = true;
      entity.loadFields().then(function () {
        populateData();
      });
    }


    function populateData() {
      $scope.loadingData = true;
      scenarioSimulatorService.fetchData(CURRENT_MODULE, $scope.config.searchText).then(function (response) {
        const data = response.data['hydra:member'];
        $scope.totalItems = response.data['hydra:totalItems'];
        data.forEach(function (scenario) {
          scenario.descriptionHtml = markdownEditorService.mdToHTML(scenario.description);
          scenario.expanded = false;
          scenario.icon = scenario.icon || iconPath;
        });
        $scope.data = data;
        $timeout(function () {
          const elements = document.querySelectorAll('.mdEditor');
          angular.forEach(elements, function (el, index) {
            const scenario = $scope.data[index];
            scenario.showViewMore = el.scrollHeight > el.clientHeight;
          });
          $scope.$applyAsync();
          if (!webSocketSubscription) {
            initWebsocket();
          }
        });

      }).finally(function () {
        $scope.loadingData = false;
      });
    }

    function fetchMDDescription(description) {
      return markdownEditorService.mdToHTML(description);
    }

    //to explicitly fetch the action item
    function initWebsocket() {
      websocketService.subscribe(CURRENT_MODULE, function (data) {
        if (data.sourceWebsocketId !== websocketService.getWebsocketSessionId()) {
          if (data.operation === 'update') {
            if (data.changeData && data.changeData.length > 0) {
              let foundField;
              const found = _.find($scope.data, function (scenario) {
                return data.entityUuid.indexOf(scenario['@id']) >= 0;
              });
              if (found) {
                const _mapKeys = ['title', 'description', 'createdAlertsID', 'recordTags'];
                foundField = _mapKeys.some(item => data.changeData.includes(item));
              }
              if (foundField || data.changeData.indexOf('deletedAt') >= 0) {
                websocketRefresh();
              }
            }
          }
        }
      }
      ).then(function (data) {
        webSocketSubscription = data;
      });
    }

    $scope.searchContent = function () {
      populateData();
    }

    function websocketRefresh() {
      if (websocketThresholdTime < (new Date().getTime() - websocketProcessingTime.getTime())) {
        websocketProcessingTime = new Date();
        populateData();
      } else {
        $timeout.cancel(delayTimer);
        delayTimer = $timeout(function () {
          populateData();
        }, 5000);
      }
    }

    $scope.$on('popupClosed', function (data) {
      if (data === $scope.config.name + '_' + $scope.config.version) {
        unsubscribe();
      }
    });

    $scope.$on('popupOpened', function (data) {
      if (data === $scope.config.name + '_' + $scope.config.version) {
        $scope.searchContent();
        initWebsocket();
      }
    });

    function unsubscribe() {
      $timeout.cancel(delayTimer);
      if (webSocketSubscription) {
        websocketService.unsubscribe(webSocketSubscription);
        webSocketSubscription = undefined;
      }
    }

    $scope.$on('$destroy', function () {
      unsubscribe();
      if (destroyCollection) {
        destroyCollection();
      }
    });

    $scope.triggerScenario = function (scenario) {
      scenario.running = true;
      const defer = $q.defer();
      const scenarioAction = scenario.createdAlertsID ? 'resetScenario' : 'runScenario';
      const playbook = $scope.actionPlaybooks[scenarioAction].playbook;
      if (playbook) {
        defer.resolve(playbook);
      } else {
        const playbookIRI = $scope.actionPlaybooks[scenarioAction].id;
        getPlaybook(playbookIRI).then(function (response) {
          $scope.actionPlaybooks[scenarioAction].playbook = response.data;
          defer.resolve(response.data);
        }, function () {
          defer.reject();
        });
      }
      defer.promise.then(function (playbook) {
        const actionPlaybook = angular.copy(playbook);
        playbookService.triggerPlaybookAction(actionPlaybook, () => [scenario], $scope, true, entity);
      });
    }

    function getPlaybook(playbookIRI) {
      const defer = $q.defer();
      if (playbookService.loadedPlaybookActions && playbookService.loadedPlaybookActions[CURRENT_MODULE]) {
        const playbook = _.find(playbookService.loadedPlaybookActions[CURRENT_MODULE].playbooks, function (pb) {
          return pb['@id'] === playbookIRI;
        });
        if (playbook) {
          defer.resolve({ data: playbook });
          return defer.promise;
        }
      }
      const playbookUUID = $filter('getEndPathName')(playbookIRI);
      $http.get(`${API.BASE}${API.WORKFLOWS}${playbookUUID}?$relationships=true`).then(function (response) {
        defer.resolve(response);
      }, function (error) {
        defer.reject(error);
      });
      return defer.promise;
    }

    $scope.getAllSelectedRows = function (row) {
      return [row.entity];
    }

    $scope.getTotalCount = function () {
      return ($scope.data || []).length;
    };

    $scope.fullRefresh = function () {
      $scope.searchContent();
    }

    $scope.clearSearch = function () {
      $scope.config.searchText = '';
      $scope.searchContent();
    }
    init();

  }
})();
