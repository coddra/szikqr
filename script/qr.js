import { overlay } from './matrix.js';
import { logoSZIK } from './logo.js';

const textEncoder = new TextEncoder();

export function getQRMatrix(qrContent, includeLogo) {
    qrContent = String.fromCharCode(...textEncoder.encode(qrContent));

    let qr = qrcode(0, 'H');
    qr.addData(qrContent);
    qr.make();

    if (includeLogo && qr.getModuleCount() < logoSZIK.length * 2) {
        const typeNumber = Math.ceil((logoSZIK.length * 2 - 17) / 4)
        qr = qrcode(typeNumber, 'H');
        qr.addData(qrContent);
        qr.make();
    }

    const size = qr.getModuleCount();
    const res = new Array(size + 2);
    for (let y = 0; y < size; y++) {
        res[y + 1] = new Array(size + 2);
        res[y + 1][0] = 1;
        res[y + 1][size + 1] = 1;
        for (let x = 0; x < size; x++) {
            res[y + 1][x + 1] = qr.isDark(y, x) ? 2 : 1;
        }
    }
    res[0] = new Array(size + 2).fill(1);
    res[size + 1] = new Array(size + 2).fill(1);

    if (includeLogo) {
        const shift = Math.floor((res.length - logoSZIK.length) / 2);
        overlay(res, logoSZIK, { x: shift, y: shift });
    }

    return res
}
