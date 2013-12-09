'use strict';

var app = angular.module('datagridApp', []);

app.controller("DataGridController", function($scope, $http, $filter){

    // Define scope variables

    $scope.items = [];
    $scope.columns = [];
    $scope.sortBy = 0;
    $scope.sortReverse = false;
    $scope.columnHighlight = 1;

    // Value formatter

    $scope.formatter = function(value) {
        var val = value.$t;
        return value.numericValue
            ? val.indexOf("%") == val.length - 1
                ? $filter('number')(parseFloat(val), 2)
                : val.indexOf("\u00a3") == 0
                    ? val
                    : $filter('number')(val)
            : val
    };

    // Method to set sorting column

    $scope.sort = function(col) {
        if ($scope.sortBy == col) {
            $scope.sortReverse = !$scope.sortReverse;
        } else {
            $scope.sortBy = col;
            $scope.sortReverse = false;
        }
    };

    // Sort "getter" function

    $scope.sorter = function(item){
        var tmp = item[parseInt($scope.sortBy)];
        return tmp.isNumeric
            ? tmp.numeric
            : tmp.value;
    };

    // Google Spreadsheet access

    var sheet = "od6";
    var key = "0Ag_YtyCYFWyydGYxYWtzWmpIelVYTTNnTkR2ajNZNEE";

    // Request cells to get full column names

    var url = "http://spreadsheets.google.com/feeds/cells/"
            + key + "/"
            + sheet + "/public/values?alt=json-in-script";

    $http.jsonp(url + '&callback=JSON_CALLBACK').success(function(data) {
        angular.forEach(data, function(value, index){

            // Test to see if this is the body of the response

            if (!value.entry) {
                return;
            }

            // Jump past header

            var col = parseInt(value.gs$colCount.$t);
            var total = parseInt(value.openSearch$totalResults.$t);
            for(var e = col; e < total; e += col) {

                var obj = [];

                // Load row data

                for (var u = 0; u < col; u++) {
                    var isNumeric = value.entry[e + u].gs$cell.numericValue != undefined;
                    obj.push({
                        value: $scope.formatter(value.entry[e + u].gs$cell),
                        isNumeric: isNumeric,
                        numeric: isNumeric ? parseFloat(value.entry[e + u].gs$cell.numericValue) : false,
                        percentage: value.entry[e + u].gs$cell.$t.indexOf("%") == value.entry[e + u].gs$cell.$t.length - 1
                    });
                }

                $scope.items.push(obj);
            }

            // Load headers with data types

            for (var i = 0; i < col; i++) {
                $scope.columns.push({
                    label: value.entry[i].gs$cell.$t,
                    isNumeric: $scope.items[0][i].isNumeric,
                    isHighlighted: false
                });
            }

        });
    });

});