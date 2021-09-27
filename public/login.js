var socket = io.connect('https://multiplayer-cursors-socketio-server.foonixthecoder.repl.co');
var button = document.getElementById("submit-data");

button.addEventListener('click', e => {
    console.log("Clicked.");
    e.preventDefault();
    socket.emit('handshake');
    socket.on('hi', function(data) {
        console.log("Server said Hi");
        socket.emit("login", {
            user: $("#userName").val(),
            pass: $("#Password").val(),
            _id: data.data._id,
            color: data.data.color
        });
    });
    socket.on("logged_in", () => {
        window.location.href = "/chat";
    })

    socket.on("Error_216", function() {
        alert("Incorrect username or password!");
    });

    socket.on("Error_217", function() {
        alert("User not found!");
    });
});