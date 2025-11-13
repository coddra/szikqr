import { cloneMatrix, floodFill, getOutline } from './matrix.js';

function drawBlob(ctx, outline, color, maxarc) {
    ctx.beginPath();
    const current = outline.start;
    ctx.moveTo(current.x, current.y);
    for (let i = 0; i < outline.lines.length; i++) {
        const window = [-1, 0, 1, 2].map(offset =>
            outline.lines[(i + offset + outline.lines.length) % outline.lines.length]
        );
        const arcs = [0, 1, 2].map(j =>
            Math.min(Math.abs(window[j].x + window[j].y), Math.abs(window[j + 1].x + window[j + 1].y), maxarc) / 2
        );
        const arc = Math.min(Math.max(...arcs), 2 * arcs[1] - Math.min(arcs[0], arcs[2]));
        const target = {
            y: current.y + window[1].y - Math.sign(window[1].y) * arc,
            x: current.x + window[1].x - Math.sign(window[1].x) * arc,
        }
        ctx.lineTo(target.x, target.y);

        current.y += window[1].y;
        current.x += window[1].x;
        target.y = current.y + Math.sign(window[2].y) * arc;
        target.x = current.x + Math.sign(window[2].x) * arc;
        ctx.arcTo(current.x, current.y, target.x, target.y, arc);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawMatrix(ctx, matrix, maxarc, colors) {
    matrix = cloneMatrix(matrix);
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
