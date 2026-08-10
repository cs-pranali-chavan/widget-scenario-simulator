/* Copyright start
  MIT License
  Copyright (c) 2026 Fortinet Inc
  Copyright end */
'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editScenarioSimulator100Ctrl', editScenarioSimulator100Ctrl);

    editScenarioSimulator100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config'];

    function editScenarioSimulator100Ctrl($scope, $uibModalInstance, config) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.config = config;

        function init() {
        }

        init();

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function save() {
            $uibModalInstance.close($scope.config);
        }

    }
})();
