import { cloneMatrix, floodFill, getOutline } from './matrix.js';

function lineLength(line) {
    return Math.abs(line.x + line.y);
}

function wrapRead(array, i) {
    const n = array.length;
    return array[(i % n + n) % n];
}

function mapWindow(array, f, size = 1) {
    let result = new Array(array.length);
    for (let i = 0; i < array.length; i++) {
        const window = [];
        for (let j = -size; j <= size; j++)
            window.push(wrapRead(array, i + j));
        result[i] = f(window);
    }
    return result;
}

function getArcs(lines, maxarc) {
    if (maxarc < 2)
        return lines.map(line => ({ ...line, arc: maxarc / 2 }));
    let result = lines.map((line, i) => ({
        ...line,
        arc: Math.min(lineLength(line), lineLength(wrapRead(lines, i + 1)), maxarc) / 2
    }));
    result = mapWindow(result, l => ({
        ...l[1],
        arc: Math.min(Math.max(...l.map(l => l.arc)), 2 * l[1].arc - Math.min(...l.map(l => l.arc)))
    }));
    result = mapWindow(result, l => ({
        ...l[1],
        arc: l[1].arc >= Math.max(...l.map(l => l.arc))
            ? Math.min(Math.min(...l.map(l => l.arc)) * 3, Math.min(lineLength(l[1]) - l[0].arc, lineLength(l[2]) - l[2].arc))
            : l[1].arc
    }));
    return result;
}

function drawBlob(ctx, outline, color, maxarc) {
    ctx.beginPath();
    const coord = outline.start;
    ctx.moveTo(coord.x, coord.y);
    let lines = getArcs(outline.lines, maxarc);
    for (let i = 0; i < lines.length; i++) {
        const current = lines[i];
        const next = wrapRead(lines, i + 1);
        const target = {
            y: coord.y + current.y - Math.sign(current.y) * current.arc,
            x: coord.x + current.x - Math.sign(current.x) * current.arc,
        }
        ctx.lineTo(target.x, target.y);

        coord.y += current.y;
        coord.x += current.x;
        target.y = coord.y + Math.sign(next.y) * current.arc;
        target.x = coord.x + Math.sign(next.x) * current.arc;
        ctx.arcTo(coord.x, coord.y, target.x, target.y, current.arc);
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
