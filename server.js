var express = require("express");
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));

console.log("Server is running");

var io = require('socket.io')(server);

// var io = socket(server);


let connections = 0

let socketNames = new Map();
let socketRooms = new Map();

io.sockets.on('connection', (socket) => {
    console.log('new connection ' + socket.id);
    connections++;
    console.log("number of connections: " + connections);

    socket.on('new name', (name) => {
        console.log(name)
        socketNames.set(socket.id, name);
    });

    socket.on('create or join', (room) => {
        // numClients = io.of('/').in(room).clients;
        let numClients;
        if (rooms.get(room) == undefined) {
            numClients = 0;
        } else {
            numClients = rooms.get(room).length;
        }
        console.log("user joining the room");
        console.log(numClients);

        if (numClients === 0) {
            rooms.set(room, [socketNames.get(socket.id)]);
            turns.set(room, 0);
            isPlaying.set(room, false);
            socket.join(room);
            socketRooms.set(socket.id, room);
            socket.emit('created', room);
            totalTiles.set(room, []);
            playedTiles.set(room, []);
        } else if (numClients < 4) {
            socket.emit('joined', room, rooms.get(room));
            let temp = rooms.get(room);
            temp.push(socketNames.get(socket.id));
            rooms.set(room, temp);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socketRooms.set(socket.id, room);
            io.to(room).emit('otherjoined', socketNames.get(socket.id));
        } else {
            socket.emit("full", room)
        }
    });


    socket.on('disconnect', disconnected);
    function disconnected() {
        console.log(socket.id + ' disconnected');
        connections--;
    }
})
