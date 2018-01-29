const DIR = {
    IDDLE: [0, 0],
    N: [0, -1],
    S: [0, 1],
    O: [-1, 0],
    L: [1, 0],
    NO: [-1, -1],
    NL: [1, -1],
    SO: [-1, 1],
    SL: [1, 1]
};

const KEYS = {
    ARROW_LEFT: 37,
    ARROW_RIGHT: 39
};

const STATE = {
    START: 1,
    RUNNING: 2,
    OVER: 3
};

class GameEngine {
    constructor(element, fps) {
        this.element = element;
        this.fps = fps;
        this.objects = [];
        this.isPaused = false;
        this.isSoundPlaying = true;
        this.loop = null;
        this._frameCount = 0;
        this.levelNumber = 0;
        this.level = levels[this.levelNumber];
        this.isMouseMove = false;
        this.state = STATE.START;
        this.lives = 3;
        this.score = 0;
    }

    update() {
        let isThereBlocks = false;
        let racket = this.objects[0];
        let ball = this.objects[1];
        this.objects.forEach((object, i) => {
            if (object instanceof Brick) {
                isThereBlocks = true;
            }
            object.update();
        });
        if (!isThereBlocks) {
            this.gameWin();
        }
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i] instanceof Brick) {
                let brick = this.objects[i];
                if (ball.verifyCollision(brick)) {
                    if (this.isSoundPlaying) {
                        document.querySelector('#hit').play()
                    }
                    brick.decressBrickLife();
                    if (brick.type === 3) {
                        this.score += 30;
                    } else if (brick.type === 2) {
                        this.score += 20;
                    } else {
                        this.score += 10;
                    }
                    if (brick.life < 1) {
                        this.objectRemove(brick);
                    }
                    if (ball.x + (ball.width / 2) < brick.x + (brick.width / 2)) {
                        ball.dir[0] = -1;
                    } else {
                        ball.dir[0] = 1;
                    }
                    if (ball.y +ball.height > brick.y && brick.y + brick.height > ball.y +ball.height) {
                        ball.dir[1] = -1;
                    } else {
                        ball.dir[1] = 1;
                    }
                }
            }
        }
        if (ball.verifyCollision(racket)) {
            ball.dir[1] = ball.dir[1] * racket.dir[1];
            ball.dir[1] = -1;
            if(this.isSoundPlaying) {
                document.querySelector('#racket-hit').play();
            }
        }
        document.querySelector('#score').innerHTML = this.score.toString();
        document.querySelector('#level').innerHTML = (this.levelNumber + 1).toString();
        document.querySelector('#lives').innerHTML = this.lives.toString();
    }

    start() {
        this.restoreGameDefault();
        this.loadLevel();
        this.loop = setInterval(() => {

            this._frameCount++;

            // Game run if is not paused
            if (!this.isPaused) {
                this.update();
            }

            // Set the game loop counter to ZERO again
            if (this._frameCount === 60) {
                this._frameCount = 0;
            }

        }, 1000 / this.fps)
    }

    objectRemove(object) {
        let index = this.objects.indexOf(object);
        this.element.removeChild(object.element);
        this.objects.splice(index, 1);
    }

    gameInit() {
        let racket = new Racket(document.querySelector('#racket'), 0, 0, 0, 0, 9, DIR.IDDLE);
        racket.setInitialPosition();
        this.objects.push(racket);

        let ball = new Ball(document.querySelector('#ball'), 0, 0, 0, 0, 6, DIR.IDDLE);
        ball.setInitialPosition();
        this.objects.push(ball);
    }

    loadLevel() {
        let x = 11;
        let y = 5;
        this.level.bricks.forEach((brick, index) => {
            if (brick === 0) {
                if (x > 650) {
                    x = 11;
                    y = y + 40;
                }
                x += 101;
            } else {
                if (x > 650) {
                    x = 11;
                    y = y + 40;
                }
                let div = document.createElement('div');
                div.classList.add('game-object');
                div.classList.add('block');
                this.element.appendChild(div);
                let b = new Brick(div, 90, 30, x, y, 1, DIR.IDDLE, brick);
                this.objects.push(b);
                x += b.element.offsetWidth + 11;
            }
        });
        this.element.addEventListener('mousedown', () => {
            if (this.state === STATE.START) {
                this.objects[1].dir = DIR.N;
                this.objects[1].isOnRacket = false;
                this.state = STATE.RUNNING;
            }
        });
    }

    gameMovement() {
        if (!this.isMouseMove) {
            document.addEventListener('keydown', (e) => {
                if (!this.isMouseMove) {
                    if (e.keyCode === KEYS.ARROW_LEFT) {
                        if (this.objects[0] instanceof Racket) {
                            this.objects[0].moveLeft();
                        }
                    } else if (e.keyCode === KEYS.ARROW_RIGHT) {
                        if (this.objects[0] instanceof Racket) {
                            this.objects[0].moveRight();
                        }
                    }
                }
            });

            document.addEventListener('keyup', (e) => {
                if (this.objects[0] instanceof Racket) {
                    this.objects[0].iddle();
                }
            });
        }
        this.element.addEventListener('mousemove', (e) => {
            if (this.isMouseMove) {
                let racket = this.objects[0];
                if (e.layerX > racket.x && e.layerX < racket.x + racket.width) {
                    racket.dir = DIR.IDDLE;
                } else if (e.layerX > racket.x) {
                    racket.dir = DIR.L;
                } else if (e.layerX < racket.x) {
                    racket.dir = DIR.O;
                }
                racket.lastMousePosition = e.layerX;
            }
        });
    }

    setLevel(number) {
        this.levelNumber = number;
        this.level = levels[this.levelNumber];
    }

    verifyGameOver() {
        this.lives--;
        if (this.lives < 1) {
            this.gameOver();
        }
        this.restoreBallAndRacket();
        this.state = STATE.START;
    }

    gameOver() {
        if (this.isSoundPlaying) {
            document.querySelector('#gameover').play()
        }
        let m = document.querySelector('#help-modal');
        let mi = document.querySelector('#help-modal .modal-inside');
        mi.innerHTML = '';

        let h1 = document.createElement('h1');
        h1.innerText = 'GAME IS OVER!';

        let p = document.createElement('p');
        p.innerText = 'I\'m sorry looser.';

        let btn = document.createElement('button');
        btn.classList.add('btn');
        btn.classList.add('btn-default');
        btn.innerText = 'TRY AGAIN';
        btn.addEventListener('click', () => {
            this.state = STATE.START;
            m.classList.toggle('active');
            this.start();
        });

        mi.appendChild(h1);
        mi.appendChild(p);
        mi.appendChild(btn);

        m.classList.toggle('active');
        clearInterval(this.loop);
        this.state = STATE.OVER;
    }

    gameWin() {
        if (this.isSoundPlaying) {
            document.querySelector('#win').play()
        }
        let m = document.querySelector('#help-modal');
        let mi = document.querySelector('#help-modal .modal-inside');
        mi.innerHTML = '';

        let h1 = document.createElement('h1');
        h1.innerText = 'YOU WIN THIS LEVEL, YEEEAH!';

        let p = document.createElement('p');
        p.innerText = 'You rock!';

        mi.appendChild(h1);
        mi.appendChild(p);
        if (this.levelNumber <= levels.length) {
            let btn = document.createElement('button');
            btn.classList.add('btn');
            btn.classList.add('btn-default');
            btn.innerText = 'NEXT LEVEL';
            btn.addEventListener('click', () => {
                this.levelNumber++;
                this.setLevel(this.levelNumber);
                this.state = STATE.START;
                m.classList.toggle('active');
                this.start();
            });
            mi.appendChild(btn);
        }

        m.classList.toggle('active');
        clearInterval(this.loop);
    }

    restoreBallAndRacket() {
        this.objects[0].setInitialPosition();
        this.objects[1].setInitialPosition();
        this.objects[1].restoreInitialPosition();
    }

    restoreGameDefault() {
        for (let i = 2; i < this.objects.length; i++) {
            this.objectRemove(this.objects[i]);
        }
        this.restoreBallAndRacket();
        this.objects = [];
        this.lives = 3;
        this.score = 0;
        this.gameInit();
    }
}

class GameObject {

    constructor(element, w, h, x, y, v, dir) {
        this.element = element;
        this.width = w;
        this.height = h;
        this.x = x;
        this.y = y;
        this.velocity = v;
        this.dir = dir;
    }

    update() {
        this.move();
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    setInitialPosition() {
        this.x = this.element.offsetLeft;
        this.y = this.element.offsetTop;
    }

    verifyCollision(obj) {
        return (this.x < obj.x + obj.width && this.x + this.width > obj.x) &&
            (this.y < obj.y + obj.height && this.height + this.y > obj.y)
    }

    move() {
        let nextX = this.x + (this.velocity * this.dir[0]);
        let nextY = this.y + (this.velocity * this.dir[1]);
        if (nextX > 0 && nextX < (720 - this.width)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

}

/**
 * @class Brick
 * game ball
 */
class Ball extends GameObject {

    constructor(element, w, h, x, y, v, dir) {
        super(element, w, h, x, y, v, dir);
        this.isOnRacket = true;
    }

    setInitialPosition() {
        this.x = gameEngine.objects[0].x + (gameEngine.objects[0].width / 2) - 12;
        this.y = gameEngine.objects[0].y - 25;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
    }

    restoreInitialPosition() {
        this.dir = DIR.IDDLE;
        this.isOnRacket = true;
    }

    update() {
        this.move();
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    move() {

        if (this.isOnRacket) {
            this.x = gameEngine.objects[0].x + (gameEngine.objects[0].width / 2) - 10;
        }

        let nextX = this.x + (this.velocity * this.dir[0]);
        let nextY = this.y + (this.velocity * this.dir[1]);

        if (nextX < 0) {
            this.dir[0] = 1;
        }
        else if (nextX > (720 - this.width)) {
            this.dir[0] = -1;
        }
        if (nextY > gameEngine.objects[0].y + 50) {
            gameEngine.verifyGameOver();
        } else if (nextY <= 0) {
            this.dir[1] = 1;
        }
        nextX = this.x + (this.velocity * this.dir[0]);
        nextY = this.y + (this.velocity * this.dir[1]);
        this.x = nextX;
        this.y = nextY;
    }

}

/**
 * @class Brick
 * game racket
 */
class Racket extends GameObject {

    constructor(element, w, h, x, y, v, dir) {
        super(element, w, h, x, y, v, dir);
        this.isMoving = false;
        this.initialPosition = {};
        this.lastMousePosition = 0;
    }

    setInitialPosition() {
        this.x = this.element.offsetLeft;
        this.y = this.element.offsetTop;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
        this.initialPosition = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        }
    }

    restoreInitialPosition() {
        this.x = this.initialPosition.x;
        this.y = this.initialPosition.y;
        this.width = this.initialPosition.width;
        this.height = this.initialPosition.height;
    }

    moveRight() {
        if (!this.isMoving) {
            this.dir = DIR.L;
            this.isMoving = true;
        }
    }

    moveLeft() {
        if (!this.isMoving) {
            this.dir = DIR.O;
            this.isMoving = true;
        }
    }

    iddle() {
        this.dir = DIR.IDDLE;
        this.isMoving = false;
    }

    move() {
        let nextX = this.x + (this.velocity * this.dir[0]);
        let nextY = this.y + (this.velocity * this.dir[1]);
        if (gameEngine.isMouseMove) {
            if (this.lastMousePosition > this.x && this.lastMousePosition < this.x + this.width) {
                this.dir = DIR.IDDLE;
            }
        }
        if (nextX > 0 && nextX < (720 - this.width)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

}

/**
 * @class Brick
 * game brick
 */
class Brick extends GameObject {
    constructor(element, w, h, x, y, v, dir, type) {
        super(element, w, h, x, y, v, dir);
        this.type = type;
        this.life = 0;
        this.setColor();
    }

    decressBrickLife() {
        --this.life;
        if (this.life < 2) {
            this.element.style.opacity = "0.3";
        } else if (this.life < 3) {
            this.element.style.opacity = "0.5";
        }
    }

    setColor() {
        switch (this.type) {
            case 1:
                this.element.style.backgroundColor = "rgba(143, 30, 91, 1)";
                this.life = 1;
                break;
            case 2:
                this.element.style.backgroundColor = "rgba(0, 155, 219, 1)";
                this.life = 2;
                break;
            case 3:
                this.element.style.backgroundColor = "rgba(169, 169, 169, 1)";
                this.life = 3;
                break;
        }
    }

}