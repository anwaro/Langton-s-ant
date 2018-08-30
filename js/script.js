let dom = {
    _clickLive: {
        init: false,
        events: []
    },

    click: function (el, callback) {
        if (el) {
            el.addEventListener('click', callback);
        }
    },

    change: function (el, callback) {
        if (el) {
            el.addEventListener('change', callback);
        }
    },

    execLiveClick: function (e) {
        for (let i = 0; i < dom._clickLive.events.length; i++) {
            let className = dom._clickLive.events[i][0];
            let func = dom._clickLive.events[i][1];
            if (e.target.classList.contains(className)) {
                func.call(e.target, e);
            }
        }
    },

    clickLive: function (className, callback) {
        if (!dom._clickLive.init) {
            dom._clickLive.init = true;
            document.addEventListener('click', dom.execLiveClick);
        }
        dom._clickLive.events.push([className, callback]);
    },
    _$$: function (className) {
        let elements = document.getElementsByClassName(className);
        return elements.length ? elements[0] : undefined;
    },
};

let panel = {
    addButton: dom._$$('add'),
    runButton: dom._$$('run'),
    blocksArea: dom._$$('blocks'),
    colorPicker: dom._$$('color-picker'),

    activeColorEdit: '',
    blocks: {},
    init: function () {
        dom.click(panel.addButton, panel.addBlock);
        dom.click(panel.runButton, ant.run);
        dom.change(panel.colorPicker, panel.editColor);

        dom.clickLive('block-remove', panel.removeBlock);
        dom.clickLive('block-direction', panel.changeDirection);
        dom.clickLive('block-color', panel.openColorDialog);

        panel.addBlock();
        panel.addBlock();
        panel.addBlock();
    },

    addBlock: function () {
        panel.blocks[panel.randomColor()] = Math.random() < .5; // false -left, true - right;
        panel.renderBlocks();
    },

    removeBlock: function () {
        delete panel.blocks[this.parentNode.dataset.color];
        panel.renderBlocks();
    },

    changeDirection: function () {
        panel.blocks[this.parentNode.dataset.color] = !panel.blocks[this.parentNode.dataset.color];
        panel.renderBlocks();
    },

    openColorDialog: function () {
        panel.activeColorEdit = this.parentNode.dataset.color;
        panel.colorPicker.focus();
        panel.colorPicker.value = this.parentNode.dataset.color;
        panel.colorPicker.click();
    },

    editColor: function () {
        let newColor = this.value;
        let newBlocks = {};
        for (let color in panel.blocks) {
            if (panel.blocks.hasOwnProperty(color)) {
                if (color === panel.activeColorEdit) {
                    newBlocks[newColor] = panel.blocks[color];
                } else {
                    newBlocks[color] = panel.blocks[color];
                }
            }
        }
        panel.blocks = newBlocks;
        panel.renderBlocks();
    },

    randomColor: function () {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    renderBlocks: function () {
        let blocks = '';
        for (let color in panel.blocks) {
            if (panel.blocks.hasOwnProperty(color)) {
                blocks += panel.renderBlock(color, panel.blocks[color]);
            }
        }
        panel.blocksArea.innerHTML = blocks;
    },

    renderBlock: function (color, right) {
        right = right ? 'right' : 'left';
        return `<div class="block">
            <div class="block-area ${right}" data-color="${color}" style="background: ${color}">
                <div class="block-remove"></div>
                <div class="block-color"></div>
                <div class="block-direction"></div>
            </div>
        </div>`;
    }
};

let ant = {
    CELL_MAX_SIZE: 100,
    INIT_POSITION: 5,

    height: window.innerHeight,
    width: window.innerWidth,

    needRenderAll: true,

    lastChange: {
        x: 0,
        y: 0,
        color: '',
    },

    colorSequence: {},
    loop: null,
    board: [],
    firstColor: false,
    cellSize: 1,
    cellSizeAim: 10,
    boardOffsetX: 0,
    boardOffsetY: 0,
    directions: ['top', 'right', 'down', 'left'],

    antPosition: {x: 0, y: 0, direction: 'top'},

    canvas: dom._$$('board'),
    ctx: null,
    init: function () {
        ant.ctx = ant.canvas.getContext('2d');
        window.addEventListener("resize", ant.resizeCanvas);
        ant.resizeCanvas();
        panel.init();
    },

    prepareColorsSequence: function () {
        let prevColor = false;
        ant.firstColor = false;
        ant.colorSequence = {};

        for (let color in panel.blocks) {
            if (panel.blocks.hasOwnProperty(color)) {
                ant.colorSequence[color] = {color: color, direction: panel.blocks[color], nextColor: ''};
                if (!ant.firstColor) {
                    ant.firstColor = color;
                } else {
                    ant.colorSequence[prevColor].nextColor = color;
                }
                prevColor = color;
            }

        }
        ant.colorSequence[prevColor].nextColor = ant.firstColor;
    },

    run: function () {
        ant.prepareColorsSequence();
        ant.initBoard();
        ant.resetAntPosition();
        ant.initLoop();
    },

    resetAntPosition: function () {
        ant.antPosition = {x: ant.INIT_POSITION, y: ant.INIT_POSITION, direction: 'top'};
    },

    initLoop: function () {
        cancelAnimationFrame(ant.loop);
        ant.loop = requestAnimationFrame(ant.renderBoard);
    },

    renderBoard: function () {
        ant.loop = requestAnimationFrame(ant.renderBoard);
        ant.moveAnt();
        // ant.calculateGrid();

        if (ant.needRenderAll) {
            ant.calculateGrid();
            ant.needRenderAll = false;
        }
        ant.calculateOffset();

        ant.ctx.clearRect(0, 0, ant.width, ant.height);
        for (let y = 0; y < ant.board.length; y++) {
            for (let x = 0; x < ant.board[y].length; x++) {
                if (ant.board[y][x]) {
                    ant.ctx.fillStyle = ant.board[y][x];
                    ant.ctx.fillRect(
                        ant.boardOffsetX + x * ant.cellSize,
                        ant.boardOffsetY + y * ant.cellSize,
                        ant.cellSize,
                        ant.cellSize
                    );
                }
            }
        }
        ant.cellSize += (ant.cellSizeAim - ant.cellSize) * 0.1;
    },


    moveAnt: function () {
        let currentColor = ant.board[ant.antPosition.y][ant.antPosition.x];
        currentColor = currentColor || ant.firstColor;
        ant.board[ant.antPosition.y][ant.antPosition.x] = ant.colorSequence[currentColor].nextColor;
        let direction = ant.setAndDirection(ant.colorSequence[ant.colorSequence[currentColor].nextColor].direction);
        if (direction === 'top') {
            ant.antPosition.y--;
        } else if (direction === 'right') {
            ant.antPosition.x++;
        } else if (direction === 'down') {
            ant.antPosition.y++;
        } else {
            ant.antPosition.x--;
        }
        ant.checkAntMargin();
    },

    setAndDirection: function (curveRight) {
        let index = ant.directions.indexOf(ant.antPosition.direction);
        index = (ant.directions.length + index + (curveRight ? -1 : 1)) % ant.directions.length;
        ant.antPosition.direction = ant.directions[index];
        return ant.antPosition.direction;
    },

    checkAntMargin: function () {
        if (ant.antPosition.x < 4) {
            ant.antPosition.x++;
            ant.increaseBoard(true, false);
        } else if (ant.board[0].length - ant.antPosition.x < 4) {
            ant.increaseBoard(true, true);
        } else if (ant.antPosition.y < 4) {
            ant.antPosition.y++;
            ant.increaseBoard(false, false);
        } else if (ant.board.length - ant.antPosition.y < 4) {
            ant.increaseBoard(false, true);
        }
    },

    increaseBoard: function (vertical, append) {
        ant.needRenderAll = true;
        if (vertical) {
            for (let i = 0; i < ant.board.length; i++) {
                if (append) {
                    ant.board[i].push(false);
                } else {
                    ant.board[i].unshift(false);
                }
            }
        } else {
            if (append) {
                ant.board.push(ant.boardRow(ant.board[0].length));
            } else {
                ant.board.unshift(ant.boardRow(ant.board[0].length));
            }
        }
    },

    calculateGrid: function () {
        let sizeX = Math.floor(ant.width / ant.board[0].length);
        let sizeY = Math.floor(ant.height / ant.board.length);
        // ant.cellSize = Math.min(sizeX, sizeY, ant.CELL_MAX_SIZE);
        ant.cellSizeAim = Math.min(sizeX, sizeY, ant.CELL_MAX_SIZE);
        // ant.boardOffsetX = Math.round((ant.width - ant.board[0].length * ant.cellSize) / 2);
        // ant.boardOffsetY = Math.round((ant.height - ant.board.length * ant.cellSize) / 2);
    },

    calculateOffset: function () {
        ant.boardOffsetX = Math.round((ant.width - ant.board[0].length * ant.cellSize) / 2);
        ant.boardOffsetY = Math.round((ant.height - ant.board.length * ant.cellSize) / 2);
    },

    initBoard: function () {
        ant.board = [];
        let size = ant.INIT_POSITION * 2 + 1;
        for (let i = 0; i < size; i++) {
            ant.board.push(ant.boardRow(size));
        }
    },

    boardRow: function (size) {
        let row = [];
        for (let i = 0; i < size; i++) {
            row.push(false);
        }
        return row;
    },

    resizeCanvas: function () {
        ant.height = window.innerHeight;
        ant.width = window.innerWidth - 50;
        ant.canvas.height = ant.height;
        ant.canvas.width = ant.width;
    }

};


ant.init();