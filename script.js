class MazeSolver {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.generateValidMaze();
  }

  // Create a new maze from scratch
  createMaze() {
    this.maze = Array(this.rows)
      .fill()
      .map(() =>
        Array(this.cols)
          .fill()
          .map(() => ({
            isBlocked: true,
            isStart: false,
            isKey: false,
            isGoal: false,
          }))
      );
  }

  // Get edge position for start/goal
  getEdgePosition() {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    switch (edge) {
      case 0: // top
        x = 0;
        y = Math.floor(Math.random() * this.cols);
        break;
      case 1: // right
        x = Math.floor(Math.random() * this.rows);
        y = this.cols - 1;
        break;
      case 2: // bottom
        x = this.rows - 1;
        y = Math.floor(Math.random() * this.cols);
        break;
      case 3: // left
        x = Math.floor(Math.random() * this.rows);
        y = 0;
        break;
    }

    return { x, y };
  }

  // Calculate Manhattan distance between two points
  getDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // Find the point farthest from both start and goal
  getFarthestPoint(start, goal) {
    let maxDist = 0;
    let bestPos = { x: 0, y: 0 };

    for (let i = 1; i < this.rows - 1; i++) {
      for (let j = 1; j < this.cols - 1; j++) {
        const distToStart = this.getDistance({ x: i, y: j }, start);
        const distToGoal = this.getDistance({ x: i, y: j }, goal);
        const totalDist = distToStart + distToGoal;

        if (totalDist > maxDist) {
          maxDist = totalDist;
          bestPos = { x: i, y: j };
        }
      }
    }

    return bestPos;
  }

  initializeVisited() {
    return Array(this.rows)
      .fill()
      .map(() => Array(this.cols).fill(false));
  }

  getAdjacent(x, y) {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Up, Down, Left, Right
    return dirs
      .map(([dx, dy]) => ({
        x: x + dx,
        y: y + dy,
      }))
      .filter(({ x, y }) => x >= 0 && x < this.rows && y >= 0 && y < this.cols);
  }

  // Generate a valid, solvable maze
  generateValidMaze() {
    let isSolvable = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isSolvable && attempts < maxAttempts) {
      attempts++;
      this.createMaze();

      // Place start and goal on edges
      this.start = this.getEdgePosition();

      do {
        this.goal = this.getEdgePosition();
      } while (
        this.getDistance(this.start, this.goal) <
        Math.max(this.rows, this.cols) / 2
      );

      // Place key at the point farthest from both start and goal
      this.key = this.getFarthestPoint(this.start, this.goal);

      // Set special cells
      this.maze[this.start.x][this.start.y].isStart = true;
      this.maze[this.start.x][this.start.y].isBlocked = false;

      this.maze[this.key.x][this.key.y].isKey = true;
      this.maze[this.key.x][this.key.y].isBlocked = false;

      this.maze[this.goal.x][this.goal.y].isGoal = true;
      this.maze[this.goal.x][this.goal.y].isBlocked = false;

      // Generate maze paths using DFS with randomization
      this.visited = this.initializeVisited();
      this.visited[this.start.x][this.start.y] = true;

      const stack = [this.start];

      while (stack.length) {
        const current = stack[stack.length - 1];
        const { x, y } = current;

        const unvisitedNeighbors = this.getAdjacent(x, y).filter(
          (n) => !this.visited[n.x][n.y]
        );

        if (unvisitedNeighbors.length) {
          // Choose random unvisited neighbor
          const next =
            unvisitedNeighbors[
              Math.floor(Math.random() * unvisitedNeighbors.length)
            ];

          // Create path - 30% chance of being blocked, unless it's near key/goal
          const distToKey = this.getDistance(next, this.key);
          const distToGoal = this.getDistance(next, this.goal);
          const blockProbability =
            distToKey <= 2 || distToGoal <= 2 ? 0.1 : 0.3;

          this.maze[next.x][next.y].isBlocked =
            Math.random() < blockProbability;
          this.visited[next.x][next.y] = true;
          stack.push(next);
        } else {
          stack.pop();
        }
      }

      // Ensure paths exist between critical points
      this.ensurePath(this.start, this.key);
      this.ensurePath(this.key, this.goal);

      // Add some additional random blocked paths
      this.addRandomBlockedPaths();

      // Check if maze is solvable
      const startToKey = this.solveMaze(this.start, this.key);
      const keyToGoal = this.solveMaze(this.key, this.goal);

      isSolvable = startToKey.length > 0 && keyToGoal.length > 0;
    }

    if (!isSolvable) {
      // If we couldn't generate a solvable maze after several attempts,
      // create a simple one with direct paths
      this.createSimpleMaze();
    }
  }

  // Create a simple, guaranteed solvable maze as fallback
  createSimpleMaze() {
    this.createMaze();

    // Place start and goal on opposite edges
    this.start = { x: 0, y: 0 };
    this.goal = { x: this.rows - 1, y: this.cols - 1 };

    // Place key far from both
    this.key = {
      x: Math.floor(this.rows / 2),
      y: Math.floor(this.cols / 2),
    };

    // Set special cells
    this.maze[this.start.x][this.start.y].isStart = true;
    this.maze[this.start.x][this.start.y].isBlocked = false;

    this.maze[this.key.x][this.key.y].isKey = true;
    this.maze[this.key.x][this.key.y].isBlocked = false;

    this.maze[this.goal.x][this.goal.y].isGoal = true;
    this.maze[this.goal.x][this.goal.y].isBlocked = false;

    // Open up the maze - 70% of cells are passable
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (
          !this.maze[i][j].isStart &&
          !this.maze[i][j].isKey &&
          !this.maze[i][j].isGoal
        ) {
          this.maze[i][j].isBlocked = Math.random() > 0.7;
        }
      }
    }

    // Ensure direct paths between critical points
    this.ensurePath(this.start, this.key);
    this.ensurePath(this.key, this.goal);
  }

  // Add random blocked paths while preserving solvability
  addRandomBlockedPaths() {
    // Add additional random blocked cells (15% of the maze)
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        // Don't block special cells or cells near them
        if (
          !this.maze[i][j].isStart &&
          !this.maze[i][j].isKey &&
          !this.maze[i][j].isGoal
        ) {
          const distToStart = this.getDistance({ x: i, y: j }, this.start);
          const distToKey = this.getDistance({ x: i, y: j }, this.key);
          const distToGoal = this.getDistance({ x: i, y: j }, this.goal);

          // Less likely to block cells near key points
          let blockProbability = 0.15;
          if (distToStart <= 1 || distToKey <= 1 || distToGoal <= 1) {
            blockProbability = 0.05;
          }

          if (Math.random() < blockProbability) {
            this.maze[i][j].isBlocked = true;
          }
        }
      }
    }
  }

  ensurePath(from, to) {
    // Create a simple path between two points
    let x = from.x;
    let y = from.y;

    // Create a zigzag path instead of direct path for more interesting mazes
    const useVerticalFirst = Math.random() > 0.5;

    if (useVerticalFirst) {
      // Move in y direction first
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        this.maze[x][y].isBlocked = false;
      }

      // Then move in x direction
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        this.maze[x][y].isBlocked = false;
      }
    } else {
      // Move in x direction first
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        this.maze[x][y].isBlocked = false;
      }

      // Then move in y direction
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        this.maze[x][y].isBlocked = false;
      }
    }
  }

  solveMaze(start, end) {
    // BFS to find shortest path
    const queue = [start];
    const visited = this.initializeVisited();
    visited[start.x][start.y] = true;

    // For reconstructing path
    const prev = {};

    while (queue.length) {
      const current = queue.shift();
      const { x, y } = current;

      // Check if we reached the target
      if (x === end.x && y === end.y) {
        // Reconstruct path
        const path = [];
        let curr = `${x},${y}`;

        while (curr) {
          const [cx, cy] = curr.split(",").map(Number);
          path.unshift({ x: cx, y: cy });
          curr = prev[curr];
        }

        return path;
      }

      // Check neighbors
      for (const next of this.getAdjacent(x, y)) {
        const { x: nx, y: ny } = next;
        const key = `${nx},${ny}`;

        if (!visited[nx][ny] && !this.maze[nx][ny].isBlocked) {
          visited[nx][ny] = true;
          queue.push(next);
          prev[key] = `${x},${y}`;
        }
      }
    }

    return []; // No path found
  }

  autoSolve() {
    const startToKey = this.solveMaze(this.start, this.key);

    if (!startToKey.length) {
      document.getElementById("status").textContent =
        "No path from start to key!";
      return [];
    }

    const keyToGoal = this.solveMaze(this.key, this.goal);

    if (!keyToGoal.length) {
      document.getElementById("status").textContent =
        "No path from key to goal!";
      return [];
    }

    document.getElementById("status").textContent = "Solving maze...";

    // Combine paths (skip duplicate key position)
    return [...startToKey.slice(0, -1), ...keyToGoal];
  }

  renderMaze() {
    const mazeEl = document.getElementById("maze");
    mazeEl.innerHTML = "";
    mazeEl.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;

    document.getElementById("status").textContent = "Maze generated";

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        if (this.maze[i][j].isBlocked) cell.classList.add("blocked");
        if (this.maze[i][j].isStart) cell.classList.add("start");
        if (this.maze[i][j].isKey) cell.classList.add("key");
        if (this.maze[i][j].isGoal) cell.classList.add("goal");

        cell.dataset.pos = `${i},${j}`;
        mazeEl.appendChild(cell);
      }
    }
  }

  stepSolve(path, step = 0) {
    if (!path.length || step >= path.length) {
      document.getElementById("status").textContent = "Maze solved!";
      return;
    }

    const { x, y } = path[step];
    const cell = document.querySelector(`[data-pos="${x},${y}"]`);

    // Only add path class if not a special cell
    if (
      !this.maze[x][y].isStart &&
      !this.maze[x][y].isKey &&
      !this.maze[x][y].isGoal
    )
      cell.classList.add("path");

    setTimeout(() => this.stepSolve(path, step + 1), 200);
  }
}

let mazeSolver;

function generateMaze() {
  const mazeEl = parseInt(document.getElementById("mazeDim").value);
  if (isNaN(mazeEl) || mazeEl < 5 || mazeEl > 20)
    return alert("Please enter a number between 5 and 20");
  mazeSolver = new MazeSolver(parseInt(mazeEl), parseInt(mazeEl));
  mazeSolver.renderMaze();
}

function startSolving() {
  if (!mazeSolver) generateMaze();

  const path = mazeSolver.autoSolve();
  if (path.length) mazeSolver.stepSolve(path);
}

window.onload = generateMaze;
