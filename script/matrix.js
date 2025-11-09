function safeRead(matrix, coord) {
    return coord.x < 0 || coord.y < 0 || coord.x >= matrix.length || coord.y >= matrix.length
        ? -1 : matrix[coord.y][coord.x];
}


export function overlay(matrix1, matrix2, shift) {
    for (let y = 0; y < matrix2.length; y++) {
        for (let x = 0; x < matrix2.length; x++) {
            if (matrix2[y][x])
                matrix1[y + shift.y][x + shift.x] = matrix2[y][x];
        }
    }
}

export function floodFill(matrix, start, fullMerge) {
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
        if (!fullMerge)
            continue;
        stack.push({ x: coord.x + 1, y: coord.y + 1 });
        stack.push({ x: coord.x + 1, y: coord.y - 1 });
        stack.push({ x: coord.x - 1, y: coord.y + 1 });
        stack.push({ x: coord.x - 1, y: coord.y - 1 });
    }
}

export function getOutline(matrix, coord, fullMerge) {
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
        let turn = fullMerge
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
