var express = require("express");
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));

console.log("Server is running");

var io = require('socket.io')(server);

// var io = socket(server);


let connections = 0

let rooms = new Map();
let socketNames = new Map();
let socketRooms = new Map();

io.sockets.on('connection', (socket) => {
    console.log('new connection ' + socket.id);
    connections++;
    console.log("number of connections: " + connections);

    socket.on('new name', (name) => {
        socketNames.set(socket.id, name);
        console.log(socketNames)
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
            socket.join(room);
            socketRooms.set(socket.id, room);
            socket.emit('created', room);
        } else if (numClients < 3) {
            let name = socketNames.get(socket.id)
            socket.emit('joined', room, rooms.get(room));
            rooms.get(room).push(name)
            // io.sockets.in(room).emit('join', room);
            socket.join(room);
            socketRooms.set(socket.id, room);
            io.to(room).emit('otherjoined', name);
        } else {
            socket.emit("full", room)
        }

        console.log(socketRooms)
        console.log(rooms)
    });

    socket.on('start game', (room) => {
        // console.log("start")
        let name = socketNames.get(socket.id)
        if (rooms.get(room)[0] == name) {
            io.to(room).emit('start game')
        }
    });

    socket.on('mouse', (data, room) => {
        io.to(room).emit('draw', data);
    });

    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnected');
        connections--;
        console.log("number of connections: " + connections);
        if (socketNames.has(socket.id)) {
            let name = socketNames.get(socket.id);
            socketNames.delete(socket.id)
            if (socketRooms.has(socket.id)) {
                let room = socketRooms.get(socket.id);
                io.to(room).emit('otherleft', name);
                rooms.get(room).splice(room.indexOf(name), 1);
                socketRooms.delete(socket.id);
            }
        }
        console.log(socketNames);
    });
})
