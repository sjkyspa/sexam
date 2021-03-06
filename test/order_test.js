process.env.NODE_ENV = "development";

var request = require("supertest");
var app = require("../app");
var db = require("../models");
var should = require("should");

describe("Order", function () {
    var sofia;
    var kaylaOrder;
    var apple;

    before(function (done) {

        prepareCleanDatabase(function(err, result) {
            if (err) {
                done("not clean success");
            }

            createUserAndOrder(done);
        });


        function prepareCleanDatabase(done) {
            db.User
                .destroy({})
                .success(function (affectRow) {
                    db.Order.destroy({}).success(function (affect) {
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
                })
                .fail(function (err) {
                    done(err);
                });
        }
        function createUserAndOrder(done) {
            db.Order.hasMany(db.OrderItem);
            db.OrderItem.belongsTo(db.Order);
            db.sequelize.sync({force: true}).success(function () {
                db.Product.create({name: 'little apple', price: 10}).success(
                    function (product) {
                        apple = product;
                        db.User.create({name: "sofia"}).success(function (user) {
                            sofia = user;
                            db.Order.create({receiver: "kayla", shippingAddress: "beijing"}).success(function (order) {
                                kaylaOrder = order;

                                db.OrderItem.create({quantity: 1}).success(function (orderItem) {
                                    orderItem.setProduct(product);
                                    order.setOrderItems([orderItem]);
//                                    orderItem.setOrder(order);
                                    user.setOrders([order]);
                                    done();
                                });


                            }).fail(function (err) {
                                done(err);
                            });
                        }).fail(function (err) {
                            done(err);
                        });
                    }
                );
            });
        }

    });


    describe("Get orders", function () {
        it("get", function (done) {
            var ordersUri = "/users/" + sofia.id + "/orders";
            request(app).get(ordersUri).expect(200).end(function (err, result) {
                if (err) {
                    return done(err);
                }

                result.body.length.should.eql(1);
                result.body[0].receiver.should.eql("kayla");
                result.body[0].shippingAddress.should.eql("beijing");
                result.body[0].uri.should.eql(ordersUri + "/" + kaylaOrder.id );
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

    describe("Get Order", function () {
        it("get by id", function (done) {
            var orderUri = "/users/" + sofia.id + "/orders/" + kaylaOrder.id;
            request(app).get(orderUri).expect(200).end(function (err, result) {
                if (err) {
                    return done(err);
                }

                result.body.receiver.should.eql("kayla");
                result.body.shippingAddress.should.eql("beijing");
                result.body.uri.should.eql(orderUri);

                done();
            });
        });


        it("return 404", function (done) {
            request(app).get("/users/" + sofia.id + "/orders/" + -1).expect(404).end(function (err, result) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });
    });


    describe("Post", function () {
        it("create user order", function (done) {
            request(app)
                .post("/users/" + sofia.id + "/orders")
                .send({receiver: "samiu", shippingAddress: "beijing", orderItems: [{productId:apple.id, quantity: 1}]})
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    db.Order.find({where: {receiver: "samiu"}, include: [db.OrderItem]}).success(function (findedOrder) {
                        if (findedOrder === null) {
                            return done("not find order");
                        }
                        console.log(findedOrder);
                        res.get('location').should.eql("/users/" + sofia.id + "/orders/" + findedOrder.id);
                        findedOrder.receiver.should.eql("samiu");
                        findedOrder.shippingAddress.should.eql("beijing");
                        findedOrder.orderItems.length.should.eql(1);
                        done();
                    }).fail(function (err) {
                        return done(err);
                    });
                });
        });
    });
});