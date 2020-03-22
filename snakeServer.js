const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const files = path.join(__dirname, '/public/');
const socketPath = path.join(__dirname, '/node_modules/socket.io-client/dist/');

app.use(express.static(files));
app.use(express.static(socketPath));


app.get('/', (req, res) => {
    res.sendFile(files + 'home.html')
});


app.get('/login', (req, res) => {
    console.log(`${req.query.name} à rejoint la partie`)
    userName = req.query.name;
    res.sendFile(files + 'snake.html')
})
let userName;

let connectedUsers = 0;
let userIds = [];
let snake = [];
const box = 30;
let grid = 600;

snake[0] = { x: 5 * box, y: 5 * box };
snake[1] = { x: 4 * box, y: 5 * box };
snake[2] = { x: 3 * box, y: 5 * box };

function randomCoordinate() {
    let rnd = Math.random();
    let a = Math.floor(rnd * grid - 10);
    b = a - (a % 30);
    return b;
}

let matrix = [];
let currentUser;

let isSomeoneConnected = false;
let isFoodEaten = true;

let actualFood = { foodX: 30, foodY: 60 };
// méthode getRandomFood() 

io.on('connection', (socket) => {

    socket.emit('foodPosition', { foodX: actualFood.foodX, foodY: actualFood.foodY })

    socket.on('foodEaten', (status) => {
        actualFood.foodX = randomCoordinate();
        actualFood.foodY = randomCoordinate();
        socket.emit('foodPosition', { foodX: actualFood.foodX, foodY: actualFood.foodY })
        let index = matrix.findIndex(x => x.id == socket.client.id);
        matrix[index].score += 10;
        refresh();
        socket.emit('newPlayer'); // updateBillboard
    });
    let refreshFood = () => { socket.emit('foodPosition', { foodX: actualFood.foodX, foodY: actualFood.foodY }) }
    setInterval(refreshFood, 100);

    currentUser = { id: socket.client.id, snake: snake, name: userName, score: 0 };
    matrix.push(currentUser);


    socket.on('myPosition', (posObject) => {
        let index = matrix.findIndex(x => x.id == posObject.id);
        matrix[index].snake = posObject.snake;
    });

    let refresh = () => { socket.emit('matrixUpdate', matrix); }
    setInterval(refresh, 100);

    socket.on('iDied', (deadId) => {
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        let index = matrix.findIndex(x => x.id == socket.client.id);
        matrix.splice(index, 1);
    });
    // chat
    socket.on('message', (msg) => {
        let index = matrix.findIndex(x => x.id == socket.client.id);
        let pseudo = matrix[index].name;
        let obj = { message: msg, pseudo: pseudo };
        console.log(obj);
        io.emit('res', (obj));
    });

})//End IO


http.listen(3003, () => {
    console.log('listening on 3003');
});