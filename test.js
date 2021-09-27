const express = require('express');
var db = require('quick.db');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();
var server = app.listen(3000, function() {
    console.log("listening to port 3000.");
});

var emoji = require('node-emoji');
const fs = require("fs");
const crypto = require('crypto');
const hash = crypto.getHashes();

function gen_id(ip) {
    x = ip + process.env.salt;

    ip = crypto.createHash('sha1').update(x).digest('hex')
    ip = ip.substring(ip, 25);

    return ip;
}

function gen_color(_id) {
    return "#" + _id.substring(_id, 6);
}

var users = [];
var ppl = [];
var sockets = [];

var io = require('socket.io')(server)

app.use(express.static('./public/'));

app.get("/login", (req, res) => {
    res.sendFile("login.html", {
        root: "./public/"
    });
});

app.get("/register", (req, res) => {
    res.sendFile("register.html", {
        root: "./public/"
    });
});

app.get('/', function(req, res) {
    res.redirect('/login');
});

app.get('/chat', function(req, res) {
    var ip = req.headers['x-forwarded-for'];
    x = ip + process.env.salt;

    ip = crypto.createHash('sha1').update(x).digest('hex')
    ip = ip.substring(ip, 25);
    
    if (!users.includes(ip)) return res.redirect('/login');

    res.sendFile("chat.html", {
        root: "./public/"
    });
});

io.on("connection", socket => {

        var req = socket.request;

        socket.id = gen_id(socket.conn.remoteAddress);

        sockets.push(socket);

        socket.on('handshake', function(data) {
          console.log("Handshake received.");
            io.sockets.emit('hi', {
                data: {
                    _id: socket.id,
                    color: gen_color(socket.id)
                }
            });
        });

        socket.on("register", function(credientials) {
          console.log("User submitted form.");
                if (credientials.user.includes("<") || credientials.user.includes(">")) return socket.emit("Error_214");

                if (!credientials.user.trim()) return socket.emit("Error_215");

                db.set("_" + credientials.user, {
                    password: credientials.pass,
                    username: credientials.user
                });

                users.push(credientials._id);

                socket.emit("logged_in");
                        let entries = Object.entries(ppl);
                        ppl[credientials._id] = {
                            desiredUsername: credientials.user,
                            websocketID: credientials._id,
                            color: "#" + credientials._id.substring(credientials._id, 6),
                            chatBuffer: []
                        }

                        entries.push([ppl[credientials._id]]);

                        sockets.forEach(sock => {
                            sock.emit("Update Usercount", {
                                count: sockets.length
                            });
                        })

                        Object.keys(ppl).forEach(p => {
                                if (ppl[p].websocketID == credientials._id) return;
                                socket.emit("User Added", {
                                    user: ppl[p].desiredUsername,
                                    userID: ppl[p].websocketID,
                                    userColor: "#" + ppl[p].websocketID.substring(ppl[p].websocketID, 6)
                                });
                        });
                        sockets.forEach(sock => {
                        sock.emit("User Added", {
                            user: credientials.name,
                            userID: credientials._id,
                            userColor: credientials.color
                        });
                    })
        })

    socket.on("login", function(credientials) {
            console.log(credientials)
            if (!db.get("_" + credientials.user)) return socket.emit("Error_217");

            if (db.get("_" + credientials.user).password !== credientials.pass) return socket.emit("Error_216");

            let username = db.set("_" + credientials.user, {
                password: credientials.pass,
                username: credientials.user
            });

            users.push(credientials._id);

            socket.emit("logged_in");
                    let entries = Object.entries(ppl);
                    ppl[credientials._id] = {
                        desiredUsername: credientials.user,
                        websocketID: credientials._id,
                        color: "#" + credientials._id.substring(credientials._id, 6),
                        chatBuffer: []
                    }

                    entries.push([ppl[credientials._id]]);

                    sockets.forEach(sock => {
                        sock.emit("Update Usercount", {
                            count: sockets.length
                        });
                    })

                    Object.keys(ppl).forEach(p => {
                            if (ppl[p].websocketID == credientials._id) return;
                            socket.emit("User Added", {
                                user: ppl[p].desiredUsername,
                                userID: ppl[p].websocketID,
                                userColor: "#" + ppl[p].websocketID.substring(ppl[p].websocketID, 6)
                            })
                      }) 
                    sockets.forEach(sock => {
                    sock.emit("User Added", {
                        user: credientials.name,
                        userID: credientials._id,
                        userColor: credientials.color
                    });
                })
    })

socket.on("chat", function(msg) {
    if (ppl[msg.content.id].chatBuffer >= 4) return;
    //msg.content.msg = filter.clean(msg.content.msg);
    if (msg.content.msg.length > 100) return;
    if (msg.content.msg.includes(":")) {
        let ms = emoji.emojify(msg.content.msg)
        ppl[msg.content.id].chatBuffer += 1;
        sockets.forEach(sock => {
            sock.emit("recieveMsg", {
                content: {
                    message: ms,
                    name: msg.content.name,
                    id: msg.content.id,
                    color: "#" + msg.content.id.substring(msg.content.id, 6)
                }
            });
        })
    } else {
        ppl[msg.content.id].chatBuffer++;
        sockets.forEach(sock => {
            sock.emit("recieveMsg", {
                content: {
                    message: msg.content.msg,
                    name: msg.content.name,
                    id: msg.content.id,
                    color: "#" + msg.content.id.substring(msg.content.id, 6)
                }
            });
        })
    }

    if (msg.content.msg == "/clear") {
        console.log("[ " + msg.content.name + " ] / (" + msg.content.id + ") cleared the chat.");
        fs.readFile(__dirname + "/admins/admins.txt", (err, data) => {
                data = data;
                if (data.includes(msg.content.id)) {
                    sockets.forEach(sock => sock.emit("clearchat"));
                    }
                })
        }
        else if (msg.content.msg.includes("/ban")) {
            let m = msg.content.msg;
            let userid = m.substring(5).trim();

            if (!userid) return socket.emit("error", {
                msg: "You must specify a valid id."
            })

            if (!userid.length == 25) return socket.emit("error", {
                msg: "You must specify a valid id."
            });

            fs.readFile(__dirname + "/admins/admins.txt", (err, data) => {
                    data = data;
                    if (data.includes(msg.content.id)) {
                        sockets.forEach(socket => {
                          socket.emit("close", {
                                content: {
                                    closemsg: "You have been banned from the server.",
                                    id: userid
                                }
                            })
                        }); 
                        fs.appendFile("./banned-users/banned.txt", "\n" + userid, "UTF-8", (err) => {
                                if (err) {
                                    console.log(err);
                                }
                                //exec('refresh');
                            });
                        }
                    });
            }
        })

    socket.on("Remove User", function(msg) {
        sockets.forEach(sock => {
            sock.emit("recieveMsg", {
                content: {
                    message: msg.usern + " left.",
                    name: "Server"
                }
            });
        })
        sockets.forEach(sock => {
            if (ppl.length < 0) return;
            sock.emit("User Removed", {
                user2: msg.usern,
                userID: msg.userID
            });
        })
        usercount -= 1;
        delete ppl[msg.userID]; //this is what i was talking about
        sockets.forEach(sock => {
            sock.emit("Update Usercount", {
                count: sockets.length
            });
        })
    })

    socket.on("Cursor Move", function(msg) {
        sockets.forEach(sock => {
            if (ppl.length !== 0) return;
            let x = msg.dt.cursorData[msg.username].x;
            let y = msg.dt.cursorData[msg.username].y;
            sock.emit("Update Cursor", {
                uname: msg.username,
                userID: msg.userID,
                cdt: {
                    x: x,
                    y: y
                }
            });
        })
    })
});

setInterval(() => {
    sockets.forEach(sock => {
        sock.emit("Update Usercount", {
            count: sockets.length
        });
    })
}, 2000)

setInterval(() => {
    Object.keys(ppl).forEach(p => {
        ppl[p].chatBuffer = 0;
    })
}, 5000)
