/*$http.post('/getFavouriteItems', { username: loginServices.getUsername() }).success(function (res) {
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
                console.log(flag);
                notFav.push(business[i]);
            }
        }
    });
    $scope.businesses = notFav;
    $scope.favourites = favourites;
    var places = data.businesses;
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(data.region.center.latitude, data.region.center.longitude),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    $scope.markers = [];
    for (var i = 0; i < places.length; i++) {
        createMarker(places[i]);
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

    $scope.openInfoWindow = function (e, selectedMarker) {
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }*/