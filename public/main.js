// socket = io.connect('https://radiant-fortress-82724.herokuapp.com/');

const maxStringLength = 7

let canvas
let playerInfo = { username: null, room: null }
let input = ''
let isInputting = true

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight)
    canvas.position(0, 0)
}

function windowResized() {
    if (canvas != undefined) {
        resizeCanvas(window.innerWidth, window.innerHeight)
        // canvas.position(0, 0)
    }
}

function draw() {
    background(51);
    textAlign(CENTER, CENTER);
    textSize(70);
    fill(255);

    isInputting = true
    if (playerInfo.username == null) {
        text("Enter your name", width / 2, height / 3);
        text(input, width / 2, height / 2);
        return;
    } else if (playerInfo.room == null) {
        text("Enter a room name", width / 2, height / 3);
        text(input, width / 2, height / 2);
        return;
    }
    isInputting = false
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

socket = io.connect('https://radiant-fortress-82724.herokuapp.com/');

socket.on('created', (room) => {
    console.log('created room', room);
    newMessage('created room ' + room);
    myRoom = room;
});

socket.on('joined', (room, others) => {
    console.log('joined room', room);
    newMessage('joined room ' + room);
    myRoom = room;
    otherPlayers = others;
});

socket.on('full', (room) => {
    console.log('room', room, 'is full');
    newMessage('room ' + room + ' is full');
});
