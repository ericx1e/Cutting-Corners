const fs = require('fs');
// const cors = require('cors');
const fetch = require('node-fetch')
var express = require("express");
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));

// app.use(cors());

console.log("Server is running");

var io = require('socket.io')(server, {
    cors: {
        origin: "https://cuttingcorners.netlify.app",
        methods: ["GET", "POST"]
    }
});


// var io = socket(server);

fs.readFile('prompts.txt', (err, data) => {
    if (err) throw err;

    all_prompts = data.toString().split("\n");
});

let connections = 0

const maxPlayers = 4
const drawTime = 15 * 1000 // Millis

let rooms = new Map();
let socketNames = new Map();
let socketRooms = new Map();
let roomImageData = new Map();
let roomPrompts = new Map();

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
            // console.log(all_prompts)
            while (p.length < maxPlayers) {
                let e = all_prompts[Math.floor(all_prompts.length * Math.random())]
                if (!p.includes(e)) {
                    p.push(e)
                }
            }

            roomImageData.set(room, Array.from(Array.apply(null, Array(maxPlayers)).map(function () { })))
            roomPrompts.set(room, Array.from(Array.apply(null, Array(maxPlayers)).map(function () { })))
            io.to(room).emit('start game', p)
            io.to(room).emit('begin timer', [Date.now(), Date.now() + drawTime])
        }
    });

    socket.on('first round', (data) => {
        let base64Image = data[0]
        let prompt = data[1]
        let room = socketRooms.get(socket.id)
        let index = rooms.get(room).indexOf(socketNames.get(socket.id))
        roomImageData.get(room)[index] = [base64Image]
        roomPrompts.get(room)[index] = [prompt]

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
        roomImageData.get(room)[(index + 1) % maxPlayers].push(base64Image)

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
        roomImageData.get(room)[(index + 2) % maxPlayers].push(base64Image)

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

    socket.on('fourth round', async (base64Image) => {
        let room = socketRooms.get(socket.id)
        let index = rooms.get(room).indexOf(socketNames.get(socket.id))
        roomImageData.get(room)[(index + 3) % maxPlayers].push(base64Image)

        // Check if room is done
        let isDone = true
        for (let i = 0; i < maxPlayers; i++) {
            if (roomImageData.get(room)[i].length == 3) {
                isDone = false
            }
        }

        if (isDone) {
            const images = [];
            const classifications = [];
            const p = []

            const promises = roomImageData.get(room).map(async (ele, i) => {
                try {
                    // First API call to combine images
                    const combineResponse = await fetch('https://fastapi-production-af2a.up.railway.app/api/v1/drawing/combine', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify([
                            { "base64_rep": ele[0] },
                            { "base64_rep": ele[1] },
                            { "base64_rep": ele[2] },
                            { "base64_rep": ele[3] }
                        ])
                    });
                    const combinedjson = await combineResponse.json();

                    // Second API call to process the combined image
                    const drawResponse = await fetch('https://fastapi-production-af2a.up.railway.app/api/v1/drawing', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "base64_rep": combinedjson
                        })
                    });
                    const result = await drawResponse.json();

                    // Store the combined image data and the classification result
                    images.push("data:image/png;base64," + combinedjson);
                    classifications.push(result);
                    p.push(roomPrompts.get(room)[i])
                } catch (error) {
                    console.error('Error:', error);
                }
            });

            // Wait for all promises to resolve
            await Promise.all(promises);

            // Emit the end screen event after all images and classifications are processed
            io.to(room).emit('end screen', [images, classifications, p]);

            roomPrompts.delete(room)
            roomImageData.delete(room)
            rooms.delete(room)



            // images = []
            // classifications = []
            // roomImageData.get(room).forEach((ele) => {

            //     fetch('https://fastapi-production-af2a.up.railway.app/api/v1/drawing/combine', {
            //         method: "POST",
            //         headers: {
            //             "Content-Type": "application/json"
            //         },
            //         body: JSON.stringify(
            //             [{
            //                 "base64_rep": ele[0]
            //             },
            //             {
            //                 "base64_rep": ele[1]
            //             },
            //             {
            //                 "base64_rep": ele[2]
            //             },
            //             {
            //                 "base64_rep": ele[3]
            //             }]
            //         )
            //     })
            //         .then((response) => response.json())
            //         .then((combinedjson) => {
            //             fetch('https://fastapi-production-af2a.up.railway.app/api/v1/drawing', {
            //                 method: "POST",
            //                 headers: {
            //                     "Content-Type": "application/json"
            //                 },
            //                 body: JSON.stringify({
            //                     "base64_rep": combinedjson
            //                 })
            //             })
            //                 .then((response) => response.json())
            //                 .then((result) => {
            //                     images.push(combinedjson)
            //                     classifications.push(result)
            //                 })
            //                 .catch((error) => {
            //                     console.error('Error:', error);
            //                 });
            //         })
            //         .catch((error) => {
            //             console.error('Error:', error);
            //         });
            // });

            // io.to(room).emit('end screen', [images, classifications])

        }
    });

    socket.on('leave room', (room) => {
        socketRooms.delete(socket)
        socket.leave(room)
    })

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
                if (rooms.has(room)) {
                    rooms.get(room).splice(room.indexOf(name), 1);
                    socketRooms.delete(socket.id);
                    if (rooms.get(room).length == 0) {
                        rooms.delete(room)
                    }
                }
            }
        }
        console.log(socketNames);
    });
})
