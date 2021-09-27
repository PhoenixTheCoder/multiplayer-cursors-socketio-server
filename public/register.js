var socket = io.connect('https://multiplayer-cursors-socketio-server.foonixthecoder.repl.co');
var button = document.getElementById("submit-data");

button.addEventListener('click', e => {
    console.log("Clicked.");
    e.preventDefault();
    socket.emit('handshake');
    socket.on('hi', function(data) {
        console.log("Server said Hi");
        socket.emit("register", {
            user: $("#userName").val(),
            pass: $("#Password").val(),
            _id: data.data._id,
            color: data.data.color
        });
    });

    socket.on("logged_in", () => {
        window.location.href = "/chat";
    })

    socket.on("Error_214", function() {
        alert("Username can't include html!");
    });

    socket.on("Error_215", function() {
        alert("Username can't be blank or have spaces in it!");
    });

    socket.on("error", function() {
        alert("Error: Please try again!");
    });

});