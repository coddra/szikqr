import { contrast } from './color.js';
import { drawMatrix } from './graphics.js';
import { getQRMatrix } from './qr.js';

var qrContentInput, generateButton,
    qrCodeDisplay, qrContainer, errorMessage,
    logoCheckbox, shapeDropdown,
    bgCPicker, qrCPicker, logoCPicker;

const MINCONTRAST = 3.5;

const colors = {
    1: {
        hex: '#ffffff',
        fullMerge: true
    },
    2: {
        hex: '#000000',
        fullMerge: false
    },
    3: {
        hex: '#b7182e',
        fullMerge: false
    }
};

function generateQrCode(qrContent) {
    qrContent = qrContent.trim();
    if (!qrContent) {
        showErrorMessage('Írj be egy URL-t vagy szöveget a generáláshoz!');
        return;
    }

    hideErrorMessage();
    const includeLogo = logoCheckbox.checked;
    const maxarc = parseInt(shapeDropdown.value);

    colors[1].hex = bgCPicker.value;
    colors[2].hex = qrCPicker.value;
    colors[3].hex = logoCPicker.value;

    var cont = contrast(colors[1].hex, colors[2].hex);
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
        ctx.scale(moduleSize, moduleSize);

        drawMatrix(ctx, matrix, maxarc, colors);

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

    //generateQrCode("https://www.szentignac.hu");
});
