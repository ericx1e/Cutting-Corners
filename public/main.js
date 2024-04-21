
// socket = io.connect('https://floating-earth-49506-74598c9829a7.herokuapp.com/');
socket = io.connect('http://localhost:3000/');
const maxStringLength = 7;
const maxPlayers = 2

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

let finalImages = [];
let finalClassifications = [];

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight)
    canvas.position(0, 0)

    startButtonY = height
    instructionsY = -height / 2
    boardstartX = width / 2.5 - whiteBoardWidth / 2
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
    wabbitImg = loadImage('/assets/wabbit.png');
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
        case "end":
            drawEndPage()
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

function drawBackground() {
    c1 = color(backgroundColor);
    c2 = color(63, 191, 191);

    for (let y = 0; y < height; y++) {
        n = map(y, 0, height, 0, 1);
        let newc = lerpColor(c1, c2, n);
        stroke(newc);
        line(0, y, width, y);
    }
}

let startButtonY
let instructionsY
let isInstructions = false
function drawHomePage() {
    //background(backgroundColor)
    drawBackground()
    // noStroke()
    textOptions(width / 10)
    textWiggle('Cutting Corners', width / 2, height / 4, width / 10)

    // noStroke()
    if (frameCount < 60) {
        // button("Join Game!", width / 2, height - height / 4 * frameCount / (60), width / 4, width / 20, () => {
        //     screen = "join"
        // })
        startButtonY = lerp(startButtonY, height * 3 / 4, 0.1)
        button("Join Game!", width / 2, startButtonY, width / 4, width / 20, () => {
            screen = "join"
        })
        button("How To", width * 8.5 / 10, startButtonY, width / 4, width / 20, () => {
            isInstructions = true
        })
        // button("Join Game!", width * 3 / 4, startButtonY, width / 4, width / 20, () => {
        //     screen = "join"
        // })
    } else {
        button("Join Game!", width / 2, height * 3 / 4, width / 4, width / 20, () => {
            screen = "join"
        })
        button("How To", width * 8.5 / 10, startButtonY, width / 4, width / 20, () => {
            isInstructions = true
        })

        if (isInstructions) {
            instructionsY = lerp(instructionsY, height / 2, 0.1)
        } else {
            instructionsY = lerp(instructionsY, -height / 2, 0.1)
        }
    }

    noStroke()
    rectMode(CENTER)
    fill(255, 200)
    rect(width / 2, instructionsY, width * 3 / 4, height * 2 / 3, width / 20, width / 20)
    textSize(width / 40)
    let txt = `
    Everyone starts by drawing a picture based on a prompt.
    Each player’s drawing will be handed to the next player,
    but with 3/4ths of it hidden, so make sure to be thorough!
    With a fourth of your drawing as context, the next player 
    will attempt to fill in the rest of the drawing, but without the prompt. 
    The drawing will bubble down, with each player adding a quarter,
    until it’s completely filled in; then, our AI agent will try and 
    classify your image. See if your drawings can pass!

    (click to close)
    `;
    fill(0)
    text(txt, width / 2, instructionsY)


    push()
    translate(width / 10, height * 9 / 10)
    rotate(cos(frameCount / 60) / 2 / PI)
    imageMode(CENTER)
    image(wabbitImg, 0, 0)
    pop()

    drawTrail();
    drawCursor();
}

let trail = [];
let fLength = 10;
let fadeDuration = 500; // fading effect in milliseconds
let lasttraillUpdateTime;

function drawCursor() {
    let cursorSize = 10;
    fill(255); // white
    noStroke();
    ellipse(mouseX, mouseY, cursorSize, cursorSize);

    // store cursor position for trail
    trail.push(createVector(mouseX, mouseY));

    // limit trail length
    if (trail.length > fLength) {
        trail.splice(0, 1);
    }
}

function drawTrail() {
    for (let i = 1; i < trail.length; i++) {
        let timeElapsed = millis() - lasttraillUpdateTime;
        let fadeRatio = constrain(timeElapsed / fadeDuration, 0, 1); // fading ratio based on time

        // DEFINITELY NOT about transpacency
        let alpha = map(i, 0, trail.length, 255, 0);

        alpha *= 10 + fadeRatio; // fading effect over time

        if (alpha > 0) {
            stroke(255, alpha); // draw with adjusted fading alpha
            strokeWeight(10); // line thickness
            line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y); // Draw line segment
        }
    }

    // update last trail's update time
    lasttraillUpdateTime = millis();
}

function drawNamePage() {
    //background(backgroundColor)
    drawBackground()
    textAlign(CENTER, CENTER);
    textSize(width / 15);
    fill(255);

    isInputting = true
    if (playerInfo.username == null) {
        text("Enter your name:", width / 2, height / 3);
        noStroke()
        fill(255)
        text(input, width / 2, height / 2);
        return;
    } else if (playerInfo.room == null) {
        text("Enter a room name:", width / 2, height / 3);
        noStroke()
        fill(255)
        text(input, width / 2, height / 2);
        return;
    }
    isInputting = false
    screen = "lobby"
}

function drawLobbyPage() {
    //background(backgroundColor)
    drawBackground()
    textAlign(CENTER, CENTER);
    textSize(width / 15);
    fill(255);
    text("Room " + playerInfo.room, width / 2, height / 8)
    textSize(width / 25);
    fill(255);
    noStroke()
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
    if (roomInfo.players.length < maxPlayers) {
        text(`(${roomInfo.players.length}/4)`, width / 2, height * 3 / 4)
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
    //background(backgroundColor)
    drawBackground()
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

    imgButton(pencilImg, width / 10, height / 3, width / 12, !isErasing, () => {
        isErasing = false
    })

    imgButton(eraserImg, width / 10, height * 2 / 3, width / 12, isErasing, () => {
        isErasing = true
    })

    let referenceW = width / 10
    let referenceH = width / 10
    let referenceX = width * 7.5 / 10
    let referenceY = height / 2 - referenceH / 2

    let quarterWidth = referenceW;
    let quarterLength = referenceH;

    let selectedQuarter = round; // Change this variable to select the quarter to colo

    if (round == 1) {
        textOptions(width / 20)
        noStroke()
        text("Draw a\n" + playerInfo.prompt, referenceX, referenceY)
    } else {
        noStroke()
        noFill();

        fill(0, 255, 0, 100); // Green color
        if (selectedQuarter === 1) {
            rect(referenceX, referenceY, quarterWidth, quarterLength);
        } else if (selectedQuarter === 2) {
            rect(referenceX + quarterWidth, referenceY, quarterWidth, quarterLength);
        } else if (selectedQuarter === 3) {
            rect(referenceX, referenceY + quarterLength, quarterWidth, quarterLength);
        } else if (selectedQuarter === 4) {
            rect(referenceX + quarterWidth, referenceY + quarterLength, quarterWidth, quarterLength);
        }
        // fill(255)
        // textAlign(CENTER, CENTER)
        // textSize(referenceW / 5)
        // text("you are\ndrawing here", referenceX, referenceY)
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
        colorMode(HSB)
        stroke(map(x, boardstartX, boardstartX + whiteBoardWidth, 120, 0), 255, 255)
        colorMode(RGB)
        strokeWeight(width / 50)
        line(boardstartX, boardstartY / 2, boardstartX + boardstartX + whiteBoardWidth - x, boardstartY / 2)

        if (Date.now() > drawingEndTime) {
            let base64Image
            console.log(round);
            switch (round) {
                case 1:
                    base64Image = buffer.get(3, 3, whiteBoardWidth / 2, whiteBoardHeight / 2).canvas.toDataURL();
                    socket.emit('first round', [base64Image, playerInfo.prompt])
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

let finalI = 0
let changeInterval = 10 * 1000;
let lastChangedTime = 0;

function drawEndPage() {
    //background(backgroundColor)
    drawBackground()
    textOptions(width / 15)
    textWiggle("Let's look at those masterpieces!", width / 2, height / 8, width / 30)
    imageMode(CENTER)
    push()
    translate(width * 9 / 10, height * 9 / 10)
    rotate(cos(frameCount / 60) / 2 / PI)
    imageMode(CENTER)
    image(wabbitImg, 0, 0)
    pop()
    image(finalImages[finalI], width / 2, height / 2, whiteBoardWidth * 2 / 3, whiteBoardHeight * 2 / 3);
    socket.emit('leave room', playerInfo.room)
    playerInfo = { username: null, room: null, prompt: null, index: null, second_round_image: null, third_round_image: null, fourth_round_image: null }
    roomInfo = { players: [] }
    playerInfo.room = null

    let p = actual_prompts[finalI]
    let guess = finalClassifications[finalI][0]
    // let confidence = Math.floor(finalClassifications[finalI][1] * 100)
    text(`Actual: ${p}, Guess: ${guess}`, width / 2, height * 5 / 6)

    // Check if it's time to change the image
    if (millis() - lastChangedTime > changeInterval) {
        finalI++;  // Move to the next image
        if (finalI >= finalImages.length) {
            finalI = 0;  // Loop back to the first image
            screen = "home"
        }
        lastChangedTime = millis();  // Reset the timer
    }
}

function mousePressed() {
    if (screen == "game" && isOnCanvas()) {
        penDown = true;
    }
    if (isInstructions) {
        isInstructions = false
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
    let spacing = size / 1.7
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

    if (mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2) {

        if (mouseIsPressed) {
            onClick()
        }
    }
}

function imgButton(img, x, y, s, isHighlighted, onClick) {
    imageMode(CENTER)
    rectMode(CENTER)
    noFill()
    if (isHighlighted) {
        stroke(255, 150, 100)
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
    noStroke()
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
    playerInfo.index = roomInfo.players.indexOf(playerInfo.username)
    playerInfo.prompt = prompts[playerInfo.index]
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


socket.on('end screen', (data) => {
    finalImages = []
    data[0].forEach((img) => {
        finalImages.push(loadImage(img))
    })
    finalClassifications = data[1]
    actual_prompts = data[2]
    screen = "end"
    lastChangedTime = millis();
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
