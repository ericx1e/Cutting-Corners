
socket = io.connect('https://floating-earth-49506-74598c9829a7.herokuapp.com/');
// socket = io.connect('http://localhost:3000/');
const maxStringLength = 7;

let canvas;
let playerInfo = { username: null, room: null }
let roomInfo = { players: [] }
let input = '';
let isInputting = false;
let message;
let messageStartFrame;
let screen = "home"
const strokeSize = 25;
const backgroundColor = '#8fd3f5'

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight)
    canvas.position(0, 0)

    startButtonY = height
}

function windowResized() {
    if (canvas != undefined) {
        resizeCanvas(window.innerWidth, window.innerHeight)
        // canvas.position(0, 0)
    }
}

function preload() {
    pangolin = loadFont('/assets/fonts/Pangolin/Pangolin-Regular.ttf');
}

function draw() {
    textFont(pangolin)
    switch (screen) {
        case "home":
            drawHomePage();
            break;
        case "join":
            drawNamePage()
            break;
        case "lobby":
            drawLobbyPage()
            break;
        case "game":
            drawGamePage()
            break
    }
    if (message) {
        showMessage()
    }
}

function textOptions(size) {
    textAlign(CENTER, CENTER);
    textSize(size);
    fill(255)
    // strokeWeight(size / 15)
    // stroke('#ea966f')
}

let startButtonY
function drawHomePage() {
    background(backgroundColor)
    textOptions(width / 10)
    textWiggle('Sketch Box', width / 2, height / 8, width / 10)

    // noStroke()
    if (frameCount < 60) {
        // button("Join Game!", width / 2, height - height / 4 * frameCount / (60), width / 4, width / 20, () => {
        //     screen = "join"
        // })
        startButtonY = lerp(startButtonY, height * 3 / 4, 0.1)
        button("Join Game!", width / 2, startButtonY, width / 4, width / 20, () => {
            screen = "join"
        })
    } else {
        button("Join Game!", width / 2, height * 3 / 4, width / 4, width / 20, () => {
            transitioning = true
            screen = "join"
        })
    }
}

function drawNamePage() {
    background(backgroundColor)
    textAlign(CENTER, CENTER);
    textSize(width / 15);
    fill(255);

    isInputting = true
    if (playerInfo.username == null) {
        text("Enter your name:", width / 2, height / 3);
        fill(220)
        text(input, width / 2, height / 2);
        return;
    } else if (playerInfo.room == null) {
        text("Enter a room name:", width / 2, height / 3);
        fill(220)
        text(input, width / 2, height / 2);
        return;
    }
    isInputting = false
    screen = "lobby"
}

function drawLobbyPage() {
    background(backgroundColor)
    textAlign(CENTER, CENTER);
    textSize(width / 15);
    fill(255);
    text("Room " + playerInfo.room, width / 2, height / 8)
    textSize(width / 25);
    fill(230);
    let txt = ""
    roomInfo.players.forEach((player, i) => {
        if (i == 0) {
            txt += player + " (host)"
        } else {
            txt += player
        }
        if (i < roomInfo.players.length - 1) {
            txt += ",  "
        }
    })
    text(txt, width / 2, height / 4)
    fill(255)
    if (roomInfo.players.length < 3) {
        text(`(${roomInfo.players.length}/3)`, width / 2, height * 3 / 4)
    } else {
        if (isHost()) {
            button("Start Game!", width / 2, height * 3 / 4, width / 4, width / 20, () => {
                socket.emit('start game', playerInfo.room)
            })
        } else {
            text("Waiting for host", width / 2, height * 3 / 4)
        }
    }
}

function drawGamePage() {
    background(backgroundColor)
    textOptions(width / 10)
    text("game page", width / 2, height / 2)
}

function textWiggle(txt, x, y, size) {
    let len = txt.length
    let spacing = size / 1.5
    textSize(size)
    push()
    translate(x, y)
    for (let i = 0; i < len; i++) {
        let c = txt[i]
        push()
        translate(- len * spacing / 2 + size / 2 + i * spacing, 0)
        if (frameCount < 4 * 60)
            rotate(Math.exp(-frameCount / 60) * sin(frameCount / 10))
        text(c, 0, 0)
        pop()
    }
    pop()
}

function isHost() {
    return roomInfo.players[0] == playerInfo.username
}

function button(txt, x, y, w, h, onClick) {
    // rectMode(CENTER)
    // rect(x, y, w, h)
    textOptions((w + h) / 6)
    fill(255)
    text(txt, x, y)

    if (mouseIsPressed && mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2) {
        onClick()
    }
}

function newMessage(msg) {
    message = msg;
    messageStartFrame = frameCount;
}

function showMessage() {
    let n = frameCount - messageStartFrame;
    if (n > 255) {
        message = '';
    }
    push();
    textAlign(CENTER, CENTER);
    textSize(50);
    fill(255, 255 - n);
    text(message, width / 2, height / 3 - n / 10);
    pop();
}

function keyPressed() {
    if (isInputting) {
        if (input.length < maxStringLength && key.length == 1) {
            input += key;
        }
        if (key == 'Backspace') {
            input = input.substring(0, input.length - 1);
        }
        if (playerInfo.username == null) {
            if (input.length > 0 && key == 'Enter') {
                playerInfo.username = input;
                socket.emit('new name', playerInfo.username);
                input = '';
                return false;
            }
        } else if (playerInfo.room == null) {
            if (input.length > 0 && key == 'Enter') {
                socket.emit('create or join', input);
                input = '';
            }
        }
    }
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}


function mouseDragged() {
    socket.emit('mouse', { mouseX, mouseY }, playerInfo.room)
}

// socket.on('mouse', (data) => {
//     noStroke()
//     fill(255, 230, 230)
//     ellipse(data.x, data.y, strokeSize)
// });

socket.on('draw', (data) => {
    noStroke()
    fill(255, 255, 255)
    ellipse(data.mouseX, data.mouseY, strokeSize)
})

socket.on('players', (data) => {

});


// Room stuff
socket.on('created', (room) => {
    console.log('created room', room);
    newMessage('created room ' + room);
    playerInfo.room = room;
    roomInfo.players = [playerInfo.username];
});

socket.on('joined', (room, others) => {
    console.log('joined room', room);
    newMessage('joined room ' + room);
    playerInfo.room = room;
    roomInfo.players = others;
});

socket.on('full', (room) => {
    console.log('room', room, 'is full');
    newMessage('room ' + room + ' is full');
});

socket.on('otherjoined', (name) => {
    if (name != playerInfo.name) {
        roomInfo.players.push(name);
    }
    console.log(name, 'joined the room');
    newMessage(name + ' joined room');
});

socket.on('otherleft', (name) => {
    let index = roomInfo.players.indexOf(name);
    if (index > -1) {
        roomInfo.players.splice(index, 1);
    }
    console.log(name, 'left the room');
    newMessage(name + ' left the room');
});

socket.on('start game', () => {
    screen = "game"
});