process.env.NODE_ENV = "development";

var request = require("supertest");
var app = require("../app");
var db = require("../models");
var should = require("should");

describe("Order", function () {
    var sofia;
    before(function (done) {
        db.User.create({name: "sofia"}).success(function(user) {
            sofia = user;
            done();
        }).fail(function(err) {
            done(err);
        });
    });


    describe("Get orders", function () {
        it("get", function (done) {
            request(app).get("/users/" + sofia.id + "/orders").expect(200).end(function (err, result) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });

        it("return 404 when not find user", function (done) {
            request(app).get("/users/-1/orders").expect(404).end(function (err, result) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });
    });


});