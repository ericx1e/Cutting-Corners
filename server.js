const fs = require('fs');
var express = require("express");
const { log } = require('console');
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));

console.log("Server is running");

var io = require('socket.io')(server);

// var io = socket(server);

fs.readFile('prompts.txt', (err, data) => {
    if (err) throw err;

    all_prompts = data.toString().split("\n");
});

let connections = 0

const maxPlayers = 2
const drawTime = 10 * 1000 // Millis

let rooms = new Map();
let socketNames = new Map();
let socketRooms = new Map();
let prompts = new Map();
let roomImageData = new Map();

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
        } else if (numClients < maxPlayers) {
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
        let name = socketNames.get(socket.id)
        if (rooms.get(room)[0] == name) {
            let p = []
            while (p.length < maxPlayers) {
                let e = all_prompts[Math.floor(all_prompts.length * Math.random())]
                if (!p.includes(e)) {
                    p.push(e)
                }
            }
            prompts.set(room, p)
            roomImageData.set(room, Array.from(Array.apply(null, Array(maxPlayers)).map(function () { })))
            console.log(p)
            io.to(room).emit('start game', p)
            io.to(room).emit('begin timer', [Date.now(), Date.now() + drawTime])
        }
    });

    socket.on('first round', (base64Image) => {
        let room = socketRooms.get(socket.id)
        let index = rooms.get(room).indexOf(socketNames.get(socket.id))
        console.log(roomImageData.get(room));
        roomImageData.get(room)[index] = [base64Image]

        // Check if room is done
        let isDone = true
        for (let i = 0; i < maxPlayers; i++) {
            if (roomImageData.get(room)[i] == null) {
                isDone = false
            }
        }

        if (isDone) {
            io.to(room).emit('second round', roomImageData.get(room))
            io.to(room).emit('begin timer', [Date.now(), Date.now() + drawTime])
        }
    });

    socket.on('second round', (base64Image) => {
        let room = socketRooms.get(socket.id)
        let index = rooms.get(room).indexOf(socketNames.get(socket.id))
        console.log(roomImageData.get(room));
        roomImageData.get(room)[index].append(base64Image)

        // Check if room is done
        let isDone = true
        for (let i = 0; i < maxPlayers; i++) {
            if (roomImageData.get(room)[i].length == 1) {
                isDone = false
            }
        }

        if (isDone) {
            io.to(room).emit('third round', roomImageData.get(room))
            io.to(room).emit('begin timer', [Date.now(), Date.now() + drawTime])
        }
    });

    socket.on('third round', (base64Image) => {
        let room = socketRooms.get(socket.id)
        let index = rooms.get(room).indexOf(socketNames.get(socket.id))
        roomImageData.get(room)[index].append(base64Image)

        // Check if room is done
        let isDone = true
        for (let i = 0; i < maxPlayers; i++) {
            if (roomImageData.get(room)[i].length == 2) {
                isDone = false
            }
        }

        if (isDone) {
            io.to(room).emit('fourth round', roomImageData.get(room))
            io.to(room).emit('begin timer', [Date.now(), Date.now() + drawTime])
        }
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
