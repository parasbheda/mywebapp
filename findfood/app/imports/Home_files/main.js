// this controller is for the index page
var app = angular.module('app', ['ui.router']);
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider.state('home', {
        templateUrl: 'home.html',
        controller: 'HomeController',
        authenticate: false
    })
    .state('login', {
        templateUrl: 'login.html',
        controller: 'LoginController',
        authenticate:false
    })
    .state('home.yelpitems', {
        templateUrl: 'yelpitems.html',
        params: ['data'],
        controller: 'YelpController',
        authenticate:true
    })
    .state('favourites', {
        templateUrl: 'favourites.html',
        controller: 'FavouritesController',
        authenticate: true
    })
    .state('writereview', {
        templateUrl: 'writereview.html',
        controller: 'ReviewController',
        params:['business'],
        authenticate: true
    })
    .state('reviews', {
        templateUrl: 'viewreview.html',
        controller: 'ViewReviewController',
        authenticate: true
    })
})
.run(function ($rootScope, $state, loginServices) {
    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
        if (toState.authenticate && !loginServices.isAuthenticated()) {
            $state.transitionTo('login');
            event.preventDefault();
        }
    });
});

// controllers
app.controller('MainController', function ($scope, $state, $http,loginServices) {
    $state.go('home');
    $scope.login = function () {
        $state.go('login');
    }

    $scope.home = function () {
        $state.go('home');
    }

    $scope.logout = function () {
        loginServices.logout();
        angular.element(document.querySelector('#logout')).removeClass('displayblock');
        angular.element(document.querySelector('#logout')).addClass('displaynone');
        angular.element(document.querySelector('#favourites')).removeClass('displayblock');
        angular.element(document.querySelector('#favourites')).addClass('displaynone');
        angular.element(document.querySelector('#reviews')).removeClass('displayblock');
        angular.element(document.querySelector('#reviews')).addClass('displaynone');
        angular.element(document.querySelector('#login')).addClass('displayblock');
        $state.go('home');
    }

    $scope.favourites = function () {
        $state.go('favourites');
    }

    $scope.reviews = function () {
        $state.go('reviews');
    }
});

app.controller('HomeController', function ($scope, $state, $http, searchCall) {
    $scope.review = false;
    $scope.distance = false;
    var sort = 0;
    $scope.changeReview = function (review, distance) {
        if (!review) {
            sort = 0;
        }
        else if (distance && review) {
            $scope.distance = false;
            sort = 2;
        }
        else
            sort = 2;

        searchCall.search($scope.food, $scope.place, sort)
        .then(function (data) {
            $state.go('home.yelpitems', { data: JSON.stringify(data) });
        },
        function (error) {
            console.log(error);
        });
    }

    $scope.changeDistance = function (review, distance) {
        if (!distance) {
            sort = 0;
        }
        else if (distance && review) {
            $scope.review = false;
            sort = 1;
        }
        else
            sort = 1;

        searchCall.search($scope.food, $scope.place, sort)
        .then(function (data) {
            $state.go('home.yelpitems', { data: JSON.stringify(data) });
        },
        function (error) {
            console.log(error);
        });
    }
    
    $scope.search = function () {
        searchCall.search($scope.food, $scope.place, sort)
        .then(function (data) {
            $state.go('home.yelpitems', { data: JSON.stringify(data) });
        },
        function (error) {
            console.log(error);
        });
    }
});

app.controller('LoginController', function ($scope, $http, $state, loginServices) {
    $scope.authenticate = function () {
        loginServices.login($scope.username, $scope.password).then(function (data) {
            var res = angular.fromJson(data);
            if (res != null) {
                angular.element(document.querySelector('#login')).removeClass('displayblock');
                angular.element(document.querySelector('#login')).addClass('displaynone');
                angular.element(document.querySelector('#logout')).addClass('displayblock');
                angular.element(document.querySelector('#favourites')).addClass('displayblock');
                angular.element(document.querySelector('#reviews')).addClass('displayblock');
                $state.go('home');
            }
            else {
                angular.element(document.querySelector('#invalid-user')).removeClass('displaynone');
                angular.element(document.querySelector('#invalid-user')).addClass('displayblock');
            }
        }
        ,
        function(data){
          console.log(data);
        });
    }
});

app.controller('YelpController', function ($scope, $state, $stateParams, loginServices, $http, recomputeNonFavourites) {
    var data = angular.fromJson($stateParams.data);
    var business = data.businesses;
    var favourites = [];
    var notFav = [];
    var flag;
    recomputeNonFavourites.recompute(business).then(function (obj) {
        $scope.businesses = obj.nflist;
        $scope.favourites = obj.flist;
        //var places = data.businesses;
        var mapOptions = {
            zoom: 12,
            center: new google.maps.LatLng(data.region.center.latitude, data.region.center.longitude),
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        $scope.markers = [];
        for (var i = 0; i < data.businesses.length; i++) {
            createMarker(data.businesses[i]);
        }
        
        var infoWindow = new google.maps.InfoWindow();
        function createMarker(info) {
            var marker = new google.maps.Marker({
                map: $scope.map,
                position: new google.maps.LatLng(info.location.coordinate.latitude,
                    info.location.coordinate.longitude),
                title: info.name
            });
            marker.content = '<div class="infoWindowContent"> <p>Rating:' + info.rating + ' </p></div>';

            google.maps.event.addListener(marker, 'click', function () {
                infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
                infoWindow.open($scope.map, marker);
            });

            $scope.markers.push(marker);
        }
    });

    $http.post('/getReviewedItems', { username: loginServices.getUsername() })
        .success(function (res) {
            $scope.reviewed = angular.fromJson(res).id;
        }).error(function (data) { console.log(data); });

    $scope.ifExists = function (id) {
        var ids = $scope.reviewed;
        
        if (ids != null) {
            for (var i = 0; i < ids.length; i++) {
                console.log(id);
                if (ids[i] == id) {
                    console.log(id);
                    return false;
                }
            }
        }
        return true;
    }

    $scope.addToFavourites = function (food_place) {
        $http.post('/addToFavourites',
            { food_place: food_place, username: loginServices.getUsername() })
            .success(function (res) {
                if (res == 'added') {
                    $scope.favourites.push(food_place);
                    console.log("scope"+$scope.favourites.length)
                }

                var business = $scope.businesses;
                var favourites = $scope.favourites;
                var notFav = [];
                var flag;
                for (var i = 0; i < business.length; i++) {
                    flag = false;
                    for (var j = 0; j < favourites.length; j++) {
                        if (business[i].id == favourites[j].id) {
                            flag = true;
                        }
                    }
                    if (!flag) {
                        notFav.push(business[i]);
                    }
                }
                $scope.businesses = notFav;
            })
    }

    $scope.writeReview = function (business) {
        console.log(business+'in write function')
        $state.go('writereview', { business: JSON.stringify(business) });
    }

});

app.controller('FavouritesController', function ($scope, $http, loginServices) {
    $http.post('/getFavouriteItems', { username: loginServices.getUsername() }).success(function (res) {
        var result = angular.fromJson(res).id;
        $scope.userFavourites = result;
        $scope.numFavourites = result.length;
        $scope.username = loginServices.getUsername();
    });

    $scope.writeReview = function (business) {
        $state.go('writereview', { business: JSON.stringify(business) });
    }

    $http.post('/getReviewedItems', { username: loginServices.getUsername() })
       .success(function (res) {
           $scope.reviewed = angular.fromJson(res).id;
       }).error(function (data) { console.log(data); });

    $scope.ifExists = function (id) {
        var ids = $scope.reviewed;

        if (ids != null) {
            for (var i = 0; i < ids.length; i++) {
                console.log(id);
                if (ids[i] == id) {
                    console.log(id);
                    return false;
                }
            }
        }
        return true;
    }
});

app.controller('ReviewController', function ($scope, $stateParams, $http, loginServices) {
    angular.element(document.querySelector('#displayreview')).addClass('displaynone');
    var business = angular.fromJson($stateParams.business);
    $scope.username = loginServices.getUsername();
    $http.post('/favouritesCount', { username: loginServices.getUsername() }).success(function (data) {
        $scope.favouritesCount = angular.fromJson(data).count;
    }).error(function (error) { console.log(error) });

    $scope.submit = function (review) {
        console.log(review);
        $http.post('/saveReview', { username: loginServices.getUsername(), business: business, review: review })
        .success(function (data) {
            angular.element(document.querySelector('#displayreview')).removeClass('displaynone');
            angular.element(document.querySelector('#displayreview')).addClass('displayblock');
            angular.element(document.querySelector('#write-review')).addClass('displaynone');
            $scope.userreview = review;
            console.log(data)
        }).error(function (error) { console.log(error) });
    };
});

app.controller('ViewReviewController', function ($scope, $http, loginServices) {
    $scope.username = loginServices.getUsername();
    $http.post('/favouritesCount', { username: loginServices.getUsername() }).success(function (data) {
        $scope.favouritesCount = angular.fromJson(data).count;
    }).error(function (error) { console.log(error) });
    $http.post('/getReviewedPlaces', { username: loginServices.getUsername() }).success(function (data) {
        var x = data.obj;
        console.log(x);
    }).error(function (error) { console.log(error) });
});

    // services
angular.module('app').factory('loginServices', function($http, $q){
    var authenticatedUser = null;
    return{
        login:function(username, password){
            var deferred = $q.defer();

            $http.post('/authenticate', {username:username, password:password}).success(function (res) {
                deferred.resolve(res);
                authenticatedUser = res;
            }).error(function (error, data) { deferred.reject(error) });
            return deferred.promise;
        },

        isAuthenticated: function(){
            return authenticatedUser!=null ;
        }
        ,
        logout: function () {
            authenticatedUser = null;
        }
        ,
        getUsername: function(){
            return authenticatedUser.username;
        }
    }
});

    angular.module('app').factory('recomputeNonFavourites', function ($http, $q, loginServices) {
        return {
            recompute: function (business) {
                var deferred = $q.defer();
                var favourites = [];
                var notFav = [];
                var flag;
                $http.post('/getFavouriteItems', { username: loginServices.getUsername() }).success(function (res) {
                    var result = angular.fromJson(res).id;
                    for (var i = 0; i < business.length; i++) {
                        flag = false;
                        for (var j = 0; j < result.length; j++) {
                            if (business[i].id == result[j].id) {
                                favourites.push(business[i]);
                                flag = true;
                            }
                        }
                        if (!flag) {
                            notFav.push(business[i]);
                        }
                    }
                    deferred.resolve({ flist: favourites, nflist: notFav });
                });
                return deferred.promise;
            }
        }
    });

    angular.module('app').factory('searchCall', function ($http, $q) {
        return {
            search: function (food, place, sort) {
                var deferred = $q.defer();
                if (food == null)
                    food = 'food';
                if (place == null)
                    place = 'boston';
                $http.post('/search', { food: food, place: place, sort: sort }).success(function (data) {
                    deferred.resolve(data);
                });
                return deferred.promise;
            }
        }
    });