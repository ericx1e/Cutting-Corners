
socket = io.connect('https://floating-earth-49506-74598c9829a7.herokuapp.com/');
// socket = io.connect('http://localhost:3000/');
const maxStringLength = 7;
const maxPlayers = 4

let canvas;
let playerInfo = { username: null, room: null, prompt: null, index: null, second_round_image: null, third_round_image: null, fourth_round_image: null }
let roomInfo = { players: [] }
let input = '';
let isInputting = false;
let message;
let messageStartFrame;
let screen = "home"
const penSize = 10;
const backgroundColor = '#8fd3f5'
let whiteBoardWidth = 600;
let whiteBoardHeight = 600;
let compressedSize = 50;
let penDown = false;
let buffer;
let boardstartX = 250
let boardstartY = 250
let isErasing = false

let drawingStartTime = 0
let drawingEndTime = 0
let timerRunning = false

let round = -1

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight)
    canvas.position(0, 0)

    startButtonY = height
    boardstartX = width / 2 - whiteBoardWidth / 2
    boardstartY = height / 2 - whiteBoardHeight / 2
}

function windowResized() {
    if (canvas != undefined) {
        resizeCanvas(window.innerWidth, window.innerHeight)
        // canvas.position(0, 0)
    }
}

function preload() {
    pangolin = loadFont('/assets/fonts/Pangolin/Pangolin-Regular.ttf');
    eraserImg = loadImage('/assets/eraser.png');
    pencilImg = loadImage('/assets/pencil.png');
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
    if (roomInfo.players.length < 1) {
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

    if (penDown && isOnCanvas()) {
        let curPenSize
        if (isErasing) {
            curPenSize = 3 * penSize
        } else {
            curPenSize = penSize
        }
        buffer.strokeWeight(curPenSize);
        buffer.stroke(isErasing ? 255 : 0);
        let padding = curPenSize / 2 + 3
        let startX = max(min(mouseX - boardstartX, whiteBoardWidth - padding), padding); // Snap X coordinate to inside the rectangle
        let startY = max(min(mouseY - boardstartY, whiteBoardHeight - padding), padding); // Snap Y coordinate to inside the rectangle
        let endX = max(min(pmouseX - boardstartX, whiteBoardWidth - padding), padding); // Snap previous X coordinate to inside the rectangle
        let endY = max(min(pmouseY - boardstartY, whiteBoardHeight - padding), padding); // Snap previous Y coordinate to inside the rectangle
        buffer.line(startX, startY, endX, endY);
    }

    imageMode(CORNER)
    noStroke()
    fill(100, 50)
    rectMode(CORNER)
    let dropShadowOffset = width / 100
    rect(boardstartX + dropShadowOffset, boardstartY + dropShadowOffset, whiteBoardWidth, whiteBoardHeight)
    image(buffer, boardstartX, boardstartY);

    imgButton(pencilImg, width / 10, height / 3, width / 10, !isErasing, () => {
        isErasing = false
    })

    imgButton(eraserImg, width / 10, height * 2 / 3, width / 10, isErasing, () => {
        isErasing = true
    })

    let referenceX = width * 8.5 / 10
    let referenceY = height / 6
    let referenceW = width / 10
    let referenceH = width / 10

    if (round == 1) {
        textOptions(width / 20)
        text("Draw a\n" + playerInfo.prompt, width * 8.5 / 10, height / 6)
    } else {
        let i = (playerInfo.index + round - 1) % maxPlayers
        switch (round) {
            case 2:
                // console.log(playerInfo.second_round_image)
                image(playerInfo.second_round_image[i][0], referenceX, referenceY, referenceW, referenceH)
                break;
            case 3:
                image(playerInfo.third_round_image[i][0], referenceX, referenceY, referenceW, referenceH)
                image(playerInfo.third_round_image[i][1], referenceX + referenceW, referenceY, referenceW, referenceH)

                // image(playerInfo.third_round_image, referenceX, referenceY, referenceW, referenceH)
                // image(playerInfo.third_round_image[0], referenceX, referenceY, referenceW, referenceH)
                // image(playerInfo.third_round_image[1], referenceX + referenceW, referenceY, referenceW, referenceH)
                break;
            case 4:
                image(playerInfo.fourth_round_image[i][0], referenceX, referenceY, referenceW, referenceH)
                image(playerInfo.fourth_round_image[i][1], referenceX + referenceW, referenceY, referenceW, referenceH)
                image(playerInfo.fourth_round_image[i][2], referenceX, referenceY + referenceH, referenceW, referenceH)
                break;
        }
    }
    // Timer 
    if (timerRunning) {
        let x = map(Date.now(), drawingStartTime, drawingEndTime, boardstartX, boardstartX + whiteBoardWidth)
        stroke(255)
        strokeWeight(width / 40)
        line(boardstartX, boardstartY / 2, boardstartX + boardstartX + whiteBoardWidth - x, boardstartY / 2)

        if (Date.now() > drawingEndTime) {
            let base64Image
            console.log(round);
            switch (round) {
                case 1:
                    base64Image = buffer.get(3, 3, whiteBoardWidth / 2, whiteBoardHeight / 2).canvas.toDataURL();
                    socket.emit('first round', base64Image)
                    timerRunning = false
                    break;
                case 2:
                    base64Image = buffer.get(3, 3, whiteBoardWidth, whiteBoardHeight).canvas.toDataURL();
                    socket.emit('second round', base64Image)
                    timerRunning = false
                    break;
                case 3:
                    base64Image = buffer.get(3, 3, whiteBoardWidth, whiteBoardHeight).canvas.toDataURL();
                    socket.emit('third round', base64Image)
                    timerRunning = false
                    break;
                case 4:
                    base64Image = buffer.get(3, 3, whiteBoardWidth, whiteBoardHeight).canvas.toDataURL();
                    socket.emit('fourth round', base64Image)
                    timerRunning = false
                    break;
            }
        }
    }
}

function mousePressed() {
    if (screen == "game" && isOnCanvas()) {
        penDown = true;
    }
}

function mouseReleased() {
    penDown = false;
}

function graphicsToBlob() {
    return buffer.elt.toDataURL('image/png');
}

function isOnCanvas() {
    return pmouseX >= boardstartX && pmouseX <= boardstartX + whiteBoardWidth && pmouseY >= boardstartY && pmouseY <= boardstartY + whiteBoardHeight;
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

function imgButton(img, x, y, s, isHighlighted, onClick) {
    imageMode(CENTER)
    rectMode(CENTER)
    noFill()
    if (isHighlighted) {
        stroke(255, 100, 100)
        strokeWeight(s / 20)
    } else {
        stroke(0)
        strokeWeight(s / 150)
    }
    image(img, x, y, s, s)
    rect(x, y, s, s)
    if (mouseIsPressed && mouseX > x - s / 2 && mouseX < x + s / 2 && mouseY > y - s / 2 && mouseY < y + s / 2) {
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



socket.on('start game', (prompts) => {
    screen = "game"
    message = ''
    buffer = createGraphics(whiteBoardWidth, whiteBoardHeight);
    buffer.background(255);
    buffer.stroke(0);
    buffer.strokeWeight(6);
    buffer.noFill();
    buffer.rect(0, 0, whiteBoardWidth, whiteBoardHeight);
    index = roomInfo.players.indexOf(playerInfo.username)
    playerInfo.prompt = prompts[index]
    playerInfo.index = roomInfo.players.indexOf(playerInfo.username)
    round = 1
});

socket.on('second round', (images) => {
    playerInfo.second_round_image = []
    images.forEach((row) => {
        arr = []
        row.forEach(
            (col) => {
                arr.push(loadImage(col))
            }
        )
        playerInfo.second_round_image.push(arr)
    })


    // index = roomInfo.players.indexOf(playerInfo.username)
    // playerInfo.second_round_image = loadImage(images[(index + 1) % maxPlayers])

    buffer.background(255);
    round = 2
});

socket.on('third round', (images) => {
    playerInfo.third_round_image = []
    images.forEach((row) => {
        arr = []
        row.forEach(
            (col) => {
                arr.push(loadImage(col))
            }
        )
        playerInfo.third_round_image.push(arr)
    })
    // index = roomInfo.players.indexOf(playerInfo.username)
    // playerInfo.second_round_image = images[(index + 1) % maxPlayers]
    // playerInfo.third_round_image = loadImage(images[(index + 1) % maxPlayers])
    buffer.background(255);
    round = 3
});

socket.on('fourth round', (images) => {
    playerInfo.fourth_round_image = []
    images.forEach((row) => {
        arr = []
        row.forEach(
            (col) => {
                arr.push(loadImage(col))
            }
        )
        playerInfo.fourth_round_image.push(arr)
    })

    // index = roomInfo.players.indexOf(playerInfo.username)
    // playerInfo.second_round_image = images[(index + 1) % maxPlayers]
    // playerInfo.third_round_image = loadImage(images[(index + 1) % maxPlayers])
    buffer.background(255);
    round = 4
});

// socket.on('fourth round', (images) => {
//     index = roomInfo.players.indexOf(playerInfo.username)
//     // playerInfo.second_round_image = images[(index + 1) % maxPlayers]
//     playerInfo.fourth_round_image = [eraserImg, eraserImg, eraserImg]
//     buffer.background(255);
//     round = 4
// });

socket.on('begin timer', (times) => {
    drawingStartTime = times[0]
    drawingEndTime = times[1]
    timerRunning = true
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
