var qrContentInput, generateButton,
    qrCodeDisplay, qrContainer, errorMessage,
    logoCheckbox, shapeDropdown,
    bgCPicker, qrCPicker, logoCPicker;

const textEncoder = new TextEncoder();

const colors = {
    1: '#ffffff',
    2: '#000000',
    3: '#b7182e'
};

const MINCONTRAST = 3.5;

const inclusive = {
    1: true,
    2: false,
    3: false,
}

const logoMatrix = [
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 3, 3, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0, 0, 0],
    [0, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0],
    [0, 1, 1, 1, 3, 3, 1, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0],
    [0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0],
    [1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0],
    [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 3, 1, 1, 0],
    [1, 1, 3, 3, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0],
    [0, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0],
    [0, 1, 3, 3, 3, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 3, 1, 3, 3, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
];

function safeRead(matrix, coord) {
    return coord.x < 0 || coord.y < 0 || coord.x >= matrix.length || coord.y >= matrix.length
        ? -1 : matrix[coord.y][coord.x];
}

function floodFill(matrix, start) {
    const stack = [start];
    const val = safeRead(matrix, start);
    while (stack.length > 0) {
        const coord = stack.pop();
        if (safeRead(matrix, coord) !== val)
            continue;
        matrix[coord.y][coord.x] = -1;
        stack.push({ x: coord.x + 1, y: coord.y });
        stack.push({ x: coord.x - 1, y: coord.y });
        stack.push({ x: coord.x, y: coord.y + 1 });
        stack.push({ x: coord.x, y: coord.y - 1 });
        if (!inclusive[val])
            continue;
        stack.push({ x: coord.x + 1, y: coord.y + 1 });
        stack.push({ x: coord.x + 1, y: coord.y - 1 });
        stack.push({ x: coord.x - 1, y: coord.y + 1 });
        stack.push({ x: coord.x - 1, y: coord.y - 1 });
    }
}

function getOutline(matrix, coord) {
    const direction = { y: 0, x: 1 };
    const outline = { start: coord, lines: [] };
    const val = safeRead(matrix, coord);
    const current = { y: coord.y, x: coord.x + 1 };
    const last = { ...coord };

    while (current.x != coord.x || current.y != coord.y) {
        let lcoord, rcoord;
        if (direction.x > 0 || direction.y > 0) {
            lcoord = { y: current.y - direction.x, x: current.x };
            rcoord = { y: current.y, x: current.x - direction.y };
        } else {
            lcoord = { y: current.y + direction.y, x: current.x + direction.y + direction.x };
            rcoord = { y: current.y + direction.y + direction.x, x: current.x + direction.x }
        }

        let left = safeRead(matrix, lcoord);
        let right = safeRead(matrix, rcoord);
        let turn = inclusive[val]
            ? left == val ? 1 : right == val ? 0 : -1
            : right != val ? -1 : left != val ? 0 : 1;

        const x = direction.x;
        direction.x = turn == 0 ? direction.x : turn * direction.y;
        direction.y = turn == 0 ? direction.y : -turn * x;

        if (turn != 0) {
            outline.lines.push({ y: current.y - last.y, x: current.x - last.x });
            last.x = current.x;
            last.y = current.y
        }
        current.x += direction.x;
        current.y += direction.y;
    }

    outline.lines.push({ y: current.y - last.y, x: current.x - last.x });
    return outline;
}

function drawBlob(ctx, outline, color, moduleSize, maxarc) {
    ctx.beginPath();
    const c = outline.start;
    ctx.moveTo(c.x * moduleSize, c.y * moduleSize);
    for (let i = 0; i < outline.lines.length; i++) {
        const r = outline.lines[i];
        const n = i == outline.lines.length - 1 ? outline.lines[0] : outline.lines[i + 1];
        const a = Math.min(Math.abs(r.x + r.y), Math.abs(n.x + n.y), maxarc) / 2;
        const p = {
            y: c.y + r.y - Math.sign(r.y) * a,
            x: c.x + r.x - Math.sign(r.x) * a,
        }
        ctx.lineTo(p.x * moduleSize, p.y * moduleSize);

        c.y += r.y;
        c.x += r.x;
        p.y = c.y + Math.sign(n.y) * a;
        p.x = c.x + Math.sign(n.x) * a;
        ctx.arcTo(c.x * moduleSize, c.y * moduleSize, p.x * moduleSize, p.y * moduleSize, a * moduleSize);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

function drawMatrix(ctx, matrix, moduleSize, maxarc) {
    const size = matrix.length;
    ctx.fillStyle = colors[1];
    ctx.fillRect(0, 0, size * moduleSize, size * moduleSize);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = matrix[y][x];
            if (!colors[val])
                continue;
            const outline = getOutline(matrix, { y, x });
            drawBlob(ctx, outline, colors[val], moduleSize, maxarc);
            floodFill(matrix, { y, x });
        }
    }
}

function overlay(m1, m2, dx, dy) {
    for (let y = 0; y < m2.length; y++) {
        for (let x = 0; x < m2.length; x++) {
            if (m2[y][x] !== 0)
                m1[y + dy][x + dx] = m2[y][x];
        }
    }
}

function getQRMatrix(qrContent, includeLogo) {
    qrContent = String.fromCharCode(...textEncoder.encode(qrContent));

    let qr = qrcode(0, 'H');
    qr.addData(qrContent);
    qr.make();

    if (includeLogo && qr.getModuleCount() < logoMatrix.length * 2) {
        const typeNumber = Math.ceil((logoMatrix.length * 2 - 17) / 4)
        qr = qrcode(typeNumber, 'H');
        qr.addData(qrContent);
        qr.make();
    }

    const size = qr.getModuleCount();
    const res = new Array(size);
    for (let y = 0; y < size; y++) {
        res[y] = new Array(size);
        for (let x = 0; x < size; x++) {
            res[y][x] = qr.isDark(y, x) ? 2 : 1;
        }
    }

    if (includeLogo) {
        const disp = Math.floor((res.length - logoMatrix.length) / 2);
        overlay(res, logoMatrix, disp, disp);
    }

    return res
}

function generateQrCode(qrContent) {
    qrContent = qrContent.trim();
    if (!qrContent) {
        showErrorMessage('Írj be egy URL-t vagy szöveget a generáláshoz!');
        return;
    }

    hideErrorMessage();
    const includeLogo = logoCheckbox.checked;
    const maxarc = parseInt(shapeDropdown.value);

    colors[1] = bgCPicker.value;
    colors[2] = qrCPicker.value;
    colors[3] = logoCPicker.value;

    //check contrast
    var cont = contrast(colors[1], colors[2]);
    if(cont < MINCONTRAST)
        showErrorMessage(
            `A háttér és a QR-kód színe nem üt el eléggé egymástól, nagy eséllyel nem olvasható.
            A kontraszt értéke: ${cont.toFixed(2)}
            A kontraszt értéke legyen nagyobb, mint ${MINCONTRAST}`
        );

    generateButton.innerText = 'Generálás...';
    generateButton.disabled = true;
    qrContainer.innerHTML = '';

    try {
        const canvas = document.createElement('canvas');
        const matrix = getQRMatrix(qrContent, includeLogo);

        const moduleSize = maxarc ? 16 : 8;
        canvas.width = moduleSize * matrix.length;
        canvas.height = canvas.width;
        const ctx = canvas.getContext("2d");

        drawMatrix(ctx, matrix, moduleSize, maxarc);

        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        qrContainer.appendChild(img);
        qrCodeDisplay.classList.remove('hidden');
    } catch (err) {
        showErrorMessage(`Probléma akadt a QR-kód generálásakor: ${err.message || 'ismeretlen probléma'}`);
        console.error(err);
    } finally {
        generateButton.innerText = 'QR-kód generálása';
        generateButton.disabled = false;
    }
}

function showErrorMessage(message) {
    errorMessage.innerText = message;
    errorMessage.classList.remove('hidden');
    qrCodeDisplay.classList.add('hidden');
}

function hideErrorMessage() {
    errorMessage.classList.add('hidden');
    errorMessage.innerText = '';
}



document.addEventListener("DOMContentLoaded", () => {
    qrContentInput = document.getElementById("qr-content");
    generateButton = document.getElementById("generateButton");
    qrCodeDisplay = document.getElementById("qrCodeDisplay");
    errorMessage = document.getElementById('errorMessage');
    logoCheckbox = document.getElementById('includeLogo');
    shapeDropdown = document.getElementById('shape');
    qrContainer = document.getElementById('qr-code');
    bgCPicker = document.getElementById('bg-cpicker');
    qrCPicker = document.getElementById('qr-cpicker');
    logoCPicker = document.getElementById('logo-cpicker');

    generateButton.addEventListener("click", () => {
        generateQrCode(qrContentInput.value);
    });

    qrContentInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            generateButton.click();
        }
    });

    generateQrCode("https://www.szentignac.hu");
});
