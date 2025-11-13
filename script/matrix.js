function safeRead(matrix, coord) {
    return matrix[coord.y] ? matrix[coord.y][coord.x] : undefined;
}

export function cloneMatrix(matrix) {
    return matrix.map(row => row.slice());
}

export function overlay(matrix1, matrix2, shift) {
    for (let y = 0; y < matrix2.length; y++) {
        for (let x = 0; x < matrix2.length; x++) {
            if (matrix2[y][x])
                matrix1[y + shift.y][x + shift.x] = matrix2[y][x];
        }
    }
}

export function floodFill(matrix, start, fullMerge = true, value = null) {
    const stack = [start];
    const search = safeRead(matrix, start);
    while (stack.length > 0) {
        const coord = stack.pop();
        matrix[coord.y][coord.x] = value;
        let neighbors = [
            { x: coord.x + 1, y: coord.y },
            { x: coord.x - 1, y: coord.y },
            { x: coord.x, y: coord.y + 1 },
            { x: coord.x, y: coord.y - 1 },
        ];
        if (fullMerge)
            neighbors = neighbors.concat([
                { x: coord.x + 1, y: coord.y + 1 },
                { x: coord.x + 1, y: coord.y - 1 },
                { x: coord.x - 1, y: coord.y + 1 },
                { x: coord.x - 1, y: coord.y - 1 },
            ]);
        for (const neighbor of neighbors)
            if (safeRead(matrix, neighbor) == search)
                stack.push(neighbor);
    }
}

export function getOutline(matrix, coord, fullMerge) {
    const direction = { y: 0, x: 1 };
    const outline = { start: coord, lines: [] };
    const search = matrix[coord.y][coord.x];
    const current = { y: coord.y, x: coord.x + 1 };
    const last = { ...coord };

    while (!(current.x == coord.x && current.y == coord.y)) {
        let left, right;
        if (direction.x > 0 || direction.y > 0) {
            left = { y: current.y - direction.x, x: current.x };
            right = { y: current.y, x: current.x - direction.y };
        } else {
            left = { y: current.y + direction.y, x: current.x + direction.y + direction.x };
            right = { y: current.y + direction.y + direction.x, x: current.x + direction.x };
        }

        let leftValue = safeRead(matrix, left);
        let rightValue = safeRead(matrix, right);
        let turn = fullMerge
            ? leftValue == search ? 1 : rightValue == search ? 0 : -1
            : rightValue != search ? -1 : leftValue != search ? 0 : 1;

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
