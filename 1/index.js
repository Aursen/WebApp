const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const form = document.getElementById('form');
const bColor = document.getElementById('border');
const bgColor = document.getElementById('bgcolor');
const size = document.getElementById('size');
const bSize = document.getElementById('bsize');
const username = document.getElementById('username');
const loginBtn = document.getElementById('loginBtn');
const loginPanel = document.getElementById('login');
const pencilColor = document.getElementById('pencilColor');
const usernameLabel = document.getElementById('usernameLabel');
const drawerLabel = document.getElementById('drawerLabel');
const box = document.getElementsByClassName('box')[0];
const status = document.getElementById('status');

let conn = null;
let coord = { x: 0, y: 0 };
let isDrawing = false;

canvas.addEventListener('mousedown', function (e) {
    const rect = canvas.getBoundingClientRect();
    coord = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDrawing = true
});

canvas.addEventListener('mousemove', e => {
    if (isDrawing === true) {
        let line = drawLine(coord.x, coord.y, e.offsetX, e.offsetY);
        sendData("line", line);
        coord = { x: e.offsetX, y: e.offsetY };
    }
});

addEventListener('mouseup', () => {
    coord = { x: 0, y: 0 };
    isDrawing = false;
});

addEventListener('load', () => {
    resizeCanvasToDisplaySize(canvas);

    connect();
});

function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
 }

username.addEventListener('keyup', (e) => {
    if(e.code === "Enter"){
        e.preventDefault();

        loginBtn.click();
    }
});

function usernameChanged() {
    loginBtn.disabled = username.value == "";
}

function hideLogin() {
    loginPanel.style.visibility = "hidden";
    usernameLabel.innerHTML = `<b>Pseudo: </b>${username.value}`;
    document.body.style.overflow = "auto";
}

function getStartingPoint(figSize, borderSize) {
    let x = (Math.random() * (box.clientWidth - figSize - borderSize)) + borderSize
    let y = (Math.random() * (box.clientHeight - figSize - borderSize)) + borderSize
    return [x, y]
}


function addFigure() {
    const figure = drawFigure();
    sendData("figure", figure);
}

function saveCanvas() {
    window.open().document.write(`<img src="${canvas.toDataURL()}"/>`);
}

function updateCanvas(canvas) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    const figures = canvas.figures;
    const lines = canvas.lines;

    for (var i = 0; i < figures.length; i++) {
        drawFigure(figures[i].name, figures[i].form, figures[i].start, figures[i].size, figures[i].bSize, figures[i].bgColor, figures[i].borderColor);
    }

    for(var i = 0; i < lines.length; i++) {
        drawLine(lines[i].x1, lines[i].y1, lines[i].x2, lines[i].y2, lines[i].size, lines[i].color);
    }

    const lastLine = lines.slice(-1)[0];
    drawerLabel.innerHTML = `<b>Dernier dessinateur: </b>${lastLine?.name ?? ""}`;
}

function drawFigure(name = username.value, fig = form.options[form.selectedIndex].value, start = getStartingPoint(parseInt(size.value), parseInt(bSize.value)), figSize = parseInt(size.value), borderSize = parseInt(bSize.value), backgroundColor = bgColor.value, borderColor = bColor.value) {
    //c.clearRect(0, 0, canvas.width, canvas.height);	
    switch (fig) {
        case 'triangle':
            drawTriangle(name, start, figSize, borderSize, backgroundColor, borderColor);
            break;
        case 'square':
            drawSquare(name, start, figSize, borderSize, backgroundColor, borderColor);
            break;
        case 'round':
            drawRound(name, start, figSize, borderSize, backgroundColor, borderColor);
            break;
        default:
            console.log('Sorry it is an unknown figure.')
            break;
    }

    const figure = {
        name: name,
        start: start,
        form: fig,
        size: figSize,
        bSize: borderSize,
        borderColor: borderColor,
        bgColor: backgroundColor
    };

    return figure;
}

function drawTriangle(name, start, figSize, borderSize, backgroundColor, borderColor) {
    c.beginPath();
    c.moveTo(start[0], start[1]);
    c.lineTo(start[0], start[1] + figSize);
    c.lineTo(start[0] + figSize, start[1] + figSize);
    c.closePath();

    c.lineWidth = borderSize;
    c.strokeStyle = borderColor;
    c.stroke();

    c.fillStyle = backgroundColor;
    c.fill();

    c.font = '12px serif';
    c.fillStyle = "black";
    c.fillText(name, start[0] + (figSize*0.5) - (name.length*2), start[1] + 12 + figSize + borderSize);
}

function drawSquare(name, start, figSize, borderSize, backgroundColor, borderColor) {
    c.rect(start[0], start[1], figSize, figSize);

    c.lineWidth = borderSize;
    c.strokeStyle = borderColor;
    c.stroke();

    c.fillStyle = backgroundColor;
    c.fill();

    c.font = '12px serif';
    c.fillStyle = "black";
    c.fillText(name, start[0] + (figSize*0.5) - (name.length*2), start[1] + 12 + figSize + borderSize);
}

function drawRound(name, start, figSize, borderSize, backgroundColor, borderColor) {
    c.beginPath();
    c.arc(start[0], start[1], figSize / 2, 0, Math.PI * 2);
    c.closePath();

    c.lineWidth = borderSize;
    c.strokeStyle = borderColor;
    c.stroke();

    c.fillStyle = backgroundColor;
    c.fill();

    c.font = '12px serif';
    c.fillStyle = "black";
    c.fillText(name, start[0] - (name.length * 2), start[1] + (0.5 * figSize) + 12 + borderSize);
}

function drawLine(x1, y1, x2, y2, size = parseInt(pencilSize.value), color = pencilColor.value) {
    c.beginPath()
    c.lineWidth = size;
    c.lineCap = "round";
    c.strokeStyle = color;
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    const line = {
        name: username.value,
        x1,
        y1,
        x2,
        y2,
        size,
        color
    };

    return line;
}

// WEBSOCKET

function connect() {
    disconnect();
    var wsUri = (window.location.protocol == 'https:' && 'wss://' || 'ws://') + window.location.host + '/ws/';
    conn = new WebSocket(wsUri);
    status.innerHTML = "<b>Statut: </b>En cours de connexion";
    console.log('Connecting...');
    conn.onopen = function () {
        status.innerHTML = "<b>Statut: </b>Connecter";
        console.log('Connected.');
    };
    conn.onmessage = function (e) {
        const msg = e.data.split("::");

        switch (msg[0]) {
            case "canvas":
                updateCanvas(JSON.parse(msg[1]));
                break;
        }

    };
    conn.onclose = function () {
        status.innerHTML = "<b>Statut: </b>Déconnecter";
        console.log('Disconnected.');
        conn = null;
    };
}

function disconnect() {
    if (conn != null) {
        status.innerHTML = "<b>Statut: </b>En cours de déconnexion";
        console.log('Disconnecting...');
        conn.close();
        conn = null;
    }
}

function sendData(key, data) {
    conn.send(`${key}::${JSON.stringify(data)}`);
}