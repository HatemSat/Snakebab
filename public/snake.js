const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let grid = 600;
let kebab = new Image();
let tete = new Image();
let corps = new Image();
let background = new Image();
let canvasInit = (function () {
    canvas.setAttribute('height', grid);
    canvas.setAttribute('width', grid);
    canvas.setAttribute('style', 'border: 1px solid black');
})();
const box = 30;
let snake = [];
let food;
let foodX;
let foodY;
function randomCoordinate() {
    let rnd = Math.random();
    let a = Math.floor(rnd * grid - 10);
    b = a - (a % 30);
    return b;
}
loadImages = (function () {
    kebab.src = '/kebab.png';
    tete.src = '/tete.png';
    corps.src = '/corps.png';
    background.src = '/background.png';
})();

snakeInit = (function () {
    snake[0] = { x: 5 * box, y: 5 * box };
    snake[1] = { x: 4 * box, y: 5 * box };
    snake[2] = { x: 3 * box, y: 5 * box };
})()

let direction = '';
let previousDirection = '';
let tail;
let score = 0;


//---------------------------IO----------------------------------
let socket = io();
let socketId;
let matrix = [];

socket.on('connect', () => {
    socketId = socket.id;

    socket.emit('firstConnection', () => {
    })
});

function matrixUpdate() {
    socket.on('matrixUpdate', (updatedMatrix) => {
        matrix = updatedMatrix;
    })
}

let billboardUpdate = function () {
    let tab = document.querySelector('ul');

    if (tab.hasChildNodes()) {
        while (tab.hasChildNodes()) {
            tab.removeChild(tab.firstChild);

        }
    }
    for (const player of matrix) {
        console.log(matrix)
        let li = document.createElement('li');
        li.innerHTML = player.name + ' ' + player.score + ' pt';
        tab.append(li);
    }
    console.log('updae !')
};
socket.on('newPlayer', () => {
    console.log('newplayer');
    billboardUpdate();;
})

// -------Chat ------------------------------------------
function msg() {
    $('form').submit(function (e) {
        e.preventDefault();
        socket.emit('message', $('#message').val());
        $('#message').val('');
        return false;
    });
};
msg();

socket.on('res', (obj) => {
    $('#messages').append($('<li>').text(obj.pseudo+ ' : ' + obj.message));
});

// ---------End----Chat------------------------------------

document.addEventListener('keydown', (event) => { directions(event) });

function draw() {

    matrixUpdate();
    ctx.drawImage(background, 0, 0, grid, grid);
    for (let i = 0; i < snake.length; i++) {
        if (i == 0) {
            ctx.drawImage(tete, snake[i].x, snake[i].y, box, box);
        } else if (i > 0) {
            ctx.drawImage(corps, snake[i].x, snake[i].y, box, box);
        }
    }
    for (let k = 0; k < matrix.length; k++) {
        for (let j = 0; j < matrix[k].snake.length; j++) {
            if (j == 0) {
                ctx.drawImage(tete, matrix[k].snake[j].x, matrix[k].snake[j].y, box, box);
            } else if (j > 0) {
                ctx.drawImage(corps, matrix[k].snake[j].x, matrix[k].snake[j].y, box, box);
            }
        }
    }

    document.getElementById('score').innerHTML = score;
    update();
    eatFood(); //push tail !!
    popFood();
    gameOver();
}

function update() {
    let newHead = { x: snake[0].x, y: snake[0].y };
    tail = snake[snake.length - 1];

    if (direction == 'RIGHT' && previousDirection != 'LEFT') {
        snake.pop();
        newHead = { x: snake[0].x + box, y: snake[0].y };
        snake.unshift(newHead);
        previousDirection = direction;
        clear();
    }
    if (direction == 'DOWN' && previousDirection != 'UP') {
        snake.pop();
        newHead = { x: snake[0].x, y: snake[0].y + box };
        snake.unshift(newHead);
        previousDirection = direction;
        clear();
    }
    if (direction == 'LEFT' && previousDirection != 'RIGHT') {
        snake.pop();
        newHead = { x: snake[0].x - box, y: snake[0].y };
        snake.unshift(newHead);
        previousDirection = direction;
        clear();
    }
    if (direction == 'UP' && previousDirection != 'DOWN') {
        snake.pop();
        newHead = { x: snake[0].x, y: snake[0].y - box };
        snake.unshift(newHead);
        previousDirection = direction;
        clear();
    }
    //----Socket-----
    if (direction != '') {
        let posObject = { id: socket.id, snake: snake };
        socket.emit('myPosition', posObject);
    }

    // console.log(socketId);
    //---------------
    direction = '';
}

function popFood() {
    socket.on('foodPosition', (position) => {
        foodX = position.foodX;
        foodY = position.foodY;
        // console.log(position)
    })
    ctx.drawImage(kebab, foodX, foodY, box, box)

}
function eatFood() {
    if (snake[0].x == foodX && snake[0].y == foodY) {
        score += 10;
        snake.push(tail);
        socket.emit('foodEaten', { isFoodEaten: true })
    }
}

function clear() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function directions(event) {
    // event.preventDefault();
    if (event.keyCode == 37) { event.preventDefault(); direction = 'LEFT' };
    if (event.keyCode == 38) { event.preventDefault(); direction = 'UP' };
    if (event.keyCode == 39) { event.preventDefault(); direction = 'RIGHT' };
    if (event.keyCode == 40) { event.preventDefault(); direction = 'DOWN' };
}
function gameOver() {
    if (snake[0].x < 0 || snake[0].x > grid - 10 || snake[0].y < 0 || snake[0].y > grid - 10) {
        gameOverScreen();
    }
    // for (let k = 1; k < snake.length; k++) {
    //     if (snake[0].x == snake[k].x && snake[0].y == snake[k].y) {
    //         gameOverScreen();
    //     }
    // }

    for (let j = 0; j < matrix.length; j++) {
        for (let l = 1; l < matrix[j].snake.length; l++) {
            if (snake[0].x == matrix[j].snake[l].x && snake[0].y == matrix[j].snake[l].y) {
                console.log('GameOver')
                gameOverScreen();
            }
        }
    }


}
function gameOverScreen() {
    clearInterval(game);
    let canvasParent = document.getElementById('test');
    let can = document.getElementById('canvas');
    can.remove();
    let imgDiv = document.createElement('img');
    imgDiv.src = 'gameOver.gif'
    canvasParent.append(imgDiv);

    let button = document.createElement('button');
    button.innerHTML = 'Recommencer';
    button.setAttribute('style', 'margin:20px auto');
    button.classList.add('btn','btn-info')

    button.addEventListener('click', () => location.reload())

    let div = document.createElement('div');
    div.setAttribute('class', 'row');
    canvasParent.append(div);
    div.append(button);
    socket.emit('iDied', socketId);

}
function scoreJam() {
    if (score > 5 && score < 10) {
        let jam = document.getElementById('jam');
        jam.innerHTML = 'Oh yeah !'
    }
}

// function message() {
//     let sendButton = document.getElementById('sendButton');
//     sendButton.addEventListener('click', () => {
//         let input = document.querySelector('input').val();
//         sendButton.preventDefault();
//         socket.emit('message', (input));
//     });
// }




let game = setInterval(draw, 30);



