var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/app'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var connection_string = '127.0.0.1:27017/findfood';
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
    process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
    process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
    process.env.OPENSHIFT_APP_NAME;
}

var mongojs = require('mongojs');
var db = mongojs(connection_string, ['users', 'favourites', 'reviews']);
app.post('/search', function (req, res) {
    var obj = req.body;
    var yelp = require("yelp").createClient({
        consumer_key: "39_xKlbr1omVChFZe7-Mzw",
        consumer_secret: "LnSKCY006TcC2TEO2OdF1XXkJbU",
        token: "PLRTVj-A_n__Be2f5fm61e0m4DF_8imf",
        token_secret: "h6YaMgWxf3JNszgoqSkmYbPNyV4"
    });

    yelp.search({ term: obj.food, location: obj.place, sort:obj.sort}, function (error, data) {
        res.end(JSON.stringify(data));
    });
});

app.post('/authenticate', function (req, res) {
    var obj = req.body;
    db.users.findOne({
        username: obj.username,
        password: obj.password
    }, function (err, data) {
        res.end(JSON.stringify(data));
    });
});

app.post('/addToFavourites', function (req, res) {
    var obj = req.body;
    db.users.findOne({
        username: obj.username
    }, function (err, data) {
        db.favourites.insert({ _id: data._id, favs: obj.food_place },
            function (err, data) {
                res.send('added');
            });
        });
});

app.post('/getFavouriteItems', function (req, res) {
    var user = req.body;
    db.users.findOne({
        username: user.username
    }, function (err, data) {
        db.favourites.find({ _id: data._id },
            function (err, data) {
                var ans = data;
                var ids = [];
                for (var i = 0; i < ans.length; i++) {
                    ids.push(ans[i].favs);
                }
                res.end(JSON.stringify({ id: ids }));
            });
    });
});

app.post('/getReviewedItems', function (req, res) {
    var user = req.body;
    db.users.findOne({
        username: user.username
    }, function (err,data) {
        db.reviews.find({ user_id: data._id },
            function (err,data) {
                var ans = data;
                var ids = [];
                for (var i = 0; i < ans.length; i++) {
                    ids.push(ans[i].business.id);
                }
                res.end(JSON.stringify({ id: ids }));
            });
    });
});

app.post('/getReviewedPlaces', function (req, res) {
    var user = req.body;
    db.users.findOne({
        username: user.username
    }, function (err, data) {
        db.reviews.find({ user_id: data._id },
            function (err, data) {
                res.end(JSON.stringify({ obj: data }));
            });
    });
});


app.post('/favouritesCount', function (req, res) {
    var user = req.body;
    db.users.findOne({
        username: user.username
    }, function (err, data) {
        db.favourites.find({ _id: data._id },
            function (err, data) {
                res.end(JSON.stringify({ count: data.length }));
            });
    });
});

app.post('/saveReview', function (req, res) {
    var username = req.body.username;
    var review = req.body.review;
    var business = req.body.business;
    db.users.findOne({
        username: username
    }, function (err, data) {
        db.reviews.insert({
            user_id: data._id,
            review: review,
            business: business
        });
        res.end('review added');
    });
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
app.listen(port, ipaddress);