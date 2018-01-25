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
}

class GameEngine {
    constructor(element, fps) {
        this.element = element;
        this.fps = fps;
        this.objects = [];
        this.isPaused = false;
        this.isSoundPlaying = true;
        this.loop;
        this._frameCount = 0;
        this.level = levels[0];
        this.isMouseMove = false;
    }

    update() {
        this.objects.forEach((object, i) => {
            object.update();
        })
    }

    start() {
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
        this.objects.splice(index, 1);
        this.element.removeChild(object.element);
    }

    gameInit() {
        let racket = new Racket(document.querySelector('#racket'), 0, 0, 0, 0, 3, DIR.IDDLE);
        racket.setInitialPosition();
        this.objects.push(racket);

        let ball = new Ball(document.querySelector('#ball'), 0, 0, 0, 0, 5, DIR.IDDLE);
        ball.setInitialPosition(racket.x + (gameEngine.objects[0].width / 2) - 12, racket.y - 25);
        this.objects.push(ball);
    }

    loadLevel() {
        let x = 11;
        let y = 5;
        this.level.bricks.forEach((brick, index) => {
            if (brick === 0) {
                if(x > 650) {
                    x = 11;
                    y = y+40;
                }
                x += 101;
            } else {
                if(x > 650) {
                    x = 11;
                    y = y+40;
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
    }

    gameMovement() {
        if(!this.isMouseMove) {
            document.addEventListener('keydown', (e) => {
                if (e.keyCode === KEYS.ARROW_LEFT) {
                    if (this.objects[0] instanceof Racket) {
                        this.objects[0].moveLeft();
                    }
                } else if (e.keyCode === KEYS.ARROW_RIGHT) {
                    if (this.objects[0] instanceof Racket) {
                        this.objects[0].moveRight();
                    }
                }
            });

            document.addEventListener('keyup', (e) => {
                if (this.objects[0] instanceof Racket) {
                    this.objects[0].iddle();
                }
            });
        } else {
            this.element.addEventListener('mousemove', (e) => {
                console.log(e);
            });
        }
    }

    changeMove() {
        this.isMouseMove = !this.isMouseMove;
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
        if(nextX > 0 && nextX < (720 - this.width)) {
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

    setInitialPosition(x, y) {
        this.x = x;
        this.y = y;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
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

        if(nextX < 0) {
            this.dir[0] = 1;
        }
        else if(nextX > (720 - this.width)) {
            this.dir[0] = -1;
        }
        if (nextY > gameEngine.objects[0].y + 50) {
            gameEngine.isPaused = true;
        } else if(nextY <= 0) {
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
    }

    setInitialPosition() {
        this.x = this.element.offsetLeft;
        this.y = this.element.offsetTop;
        this.width = this.element.offsetWidth
        this.height = this.element.offsetHeight;
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

    setColor() {
        switch (this.type) {
            case 1:
                this.element.style.backgroundColor = "#8f1e5b"
                this.life = 1;
                break;
            case 2:
                this.element.style.backgroundColor = "#009bdb"
                this.life = 2;
                break;
            case 3:
                this.element.style.backgroundColor = "#a9a9a9"
                this.life = 3;
                break;
        }
    }

}