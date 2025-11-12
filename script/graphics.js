import { floodFill, getOutline } from './matrix.js';

function drawBlob(ctx, outline, color, maxarc) {
    ctx.beginPath();
    const current = outline.start;
    ctx.moveTo(current.x, current.y);
    for (let i = 0; i < outline.lines.length; i++) {
        const relative = outline.lines[i];
        const next = outline.lines[i == outline.lines.length - 1 ? 0 : i + 1];
        const arc = Math.min(Math.abs(relative.x + relative.y), Math.abs(next.x + next.y), maxarc) / 2;
        const target = {
            y: current.y + relative.y - Math.sign(relative.y) * arc,
            x: current.x + relative.x - Math.sign(relative.x) * arc,
        }
        ctx.lineTo(target.x, target.y);

        current.y += relative.y;
        current.x += relative.x;
        target.y = current.y + Math.sign(next.y) * arc;
        target.x = current.x + Math.sign(next.x) * arc;
        ctx.arcTo(current.x, current.y, target.x, target.y, arc);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawMatrix(ctx, matrix, maxarc, colors) {
    const size = matrix.length;
    ctx.fillStyle = colors[1].hex;
    ctx.fillRect(0, 0, size, size);
    floodFill(matrix, { y: 0, x: 0 });

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const value = matrix[y][x];
            if (!colors[value])
                continue;
            const outline = getOutline(matrix, { y, x }, colors[value].fullMerge);
            drawBlob(ctx, outline, colors[value].hex, maxarc);
            floodFill(matrix, { y, x }, colors[value].fullMerge);
        }
    }
}
