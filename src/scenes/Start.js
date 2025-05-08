export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
        // Define the three lane positions (x-coordinates)
        this.lanes = [300, 512, 724];
        this.currentLane = 1; // Start in the middle lane (index 1)
        this.score = 0;
        this.scoreRate = 100; // Points per second
        
        // Obstacle settings
        this.baseObstacleSpeed = 300; // Starting pixels per second
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.baseSpawnRate = 2000; // Starting milliseconds between obstacle spawns
        this.obstacleSpawnRate = this.baseSpawnRate;
        this.nextObstacleSpawn = 0; // Time tracker for next spawn
        
        // Difficulty scaling
        this.difficultyTimer = 0; // Time tracker for difficulty increases
        this.difficultyInterval = 10000; // Increase difficulty every 10 seconds
        this.speedIncreaseRate = 137; // Increase from 20 to 50 for more noticeable changes
        this.spawnRateDecreaseRate = 100; // How much to decrease spawn time each difficulty jump
        this.minSpawnRate = 500; // Minimum spawn rate (milliseconds)
        
        // Game state
        this.gameOver = false;
    }

    preload() {
        // Load the river background
        this.load.image('river', 'assets/base_v2.png');
        
        // Load character components
        this.load.image('canoe', 'assets/canoev2.png');
        this.load.image('researcher', 'assets/mc_nohat.png');
        this.load.image('hat', 'assets/hat.png');
        
        // Load obstacle
        this.load.image('rock', 'assets/rock.png');
        this.load.image('log', 'assets/log.png');
        
        // Load audio
        this.load.audio('bgMusic', 'assets/music.mp3');
        this.load.audio('waves', 'assets/waves.mp3');
        this.load.audio('gameOver', 'assets/game_over.mp3');
    }

    create() {
        // Set up the scrolling river background
        this.river = this.add.tileSprite(512, 750, 1024, 1500, 'river');
        
        // Add background music
        this.bgMusic = this.sound.add('bgMusic', {
            volume: 0.2,
            loop: true
        });
        
        // Add wave sound effects
        this.waveSound = this.sound.add('waves', {
            volume: 0.08,
            loop: true
        });
        
        // Position for our character (center-bottom area of screen)
        const characterX = this.lanes[this.currentLane];
        const characterY = 1200;
        
        // Add the character components in the correct order (bottom to top)
        this.canoe = this.add.image(0, 0, 'canoe');
        this.canoe.setScale(0.21); // Adjust scale as needed
        
        this.researcher = this.add.image(0, 0, 'researcher');
        this.researcher.setScale(0.92); // Adjust scale as needed
        
        this.hat = this.add.image(0, -20, 'hat');
        this.hat.setScale(0.73); // Adjust scale as needed
        
        // Group all character parts into a container for easier manipulation
        this.character = this.add.container(characterX, characterY, [this.canoe, this.researcher, this.hat]);
        
        // Create a group for obstacles
        this.obstacles = this.add.group();
        
        // Add game title text
        this.titleText = this.add.text(512, 200, 'LAVA NEXT ESCKING', {
            fontFamily: 'sans-serif',
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add start game text
        const startText = this.add.text(512, 400, 'TAP TO START', {
            fontFamily: 'sans-serif',
            fontSize: 36,
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Make the text blink
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Create score text (initially hidden)
        this.scoreText = this.add.text(512, 100, 'SCORE: 0', {
            fontFamily: 'sans-serif',
            fontSize: 64,
            fontWeight: '900', // 900 is equivalent to "Black" weight
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.scoreText.setVisible(false);
        
        // Add tap/click event to start the game
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                console.log('Game started');
                startText.setVisible(false);
                this.titleText.setVisible(false);
                this.scoreText.setVisible(true);
                this.gameStarted = true;
                this.lastTime = this.time.now;
                this.nextObstacleSpawn = this.time.now + this.obstacleSpawnRate;
                this.difficultyTimer = this.time.now + this.difficultyInterval;
                
                // Reset difficulty settings
                this.obstacleSpeed = this.baseObstacleSpeed;
                this.obstacleSpawnRate = this.baseSpawnRate;
                
                // Start playing the background music and wave sounds
                this.bgMusic.play();
                this.waveSound.play();
            }
        });
        
        // Add keyboard controls for lane switching
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        
        // Add touch controls for mobile
        this.input.on('pointerdown', (pointer) => {
            if (this.gameStarted) {
                // Move left if tap is on left side of screen
                if (pointer.x < 512) {
                    this.moveLeft();
                } 
                // Move right if tap is on right side of screen
                else {
                    this.moveRight();
                }
            }
        });
        
        this.gameStarted = false;
        
        // Create game over container (initially hidden)
        this.gameOverContainer = this.add.container(512, 750);
        this.gameOverContainer.setVisible(false);
        
        // Add semi-transparent background
        const gameOverBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
        this.gameOverContainer.add(gameOverBg);
        
        // Add game over text
        const gameOverText = this.add.text(0, -200, 'GAME OVER', {
            fontFamily: 'sans-serif',
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ff0000'
        }).setOrigin(0.5);
        this.gameOverContainer.add(gameOverText);
        
        // Add final score text (will be updated when game ends)
        this.finalScoreText = this.add.text(0, -100, 'SCORE: 0', {
            fontFamily: 'sans-serif',
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.gameOverContainer.add(this.finalScoreText);
        
        // Add retry button
        const retryButton = this.add.rectangle(0, 50, 200, 60, 0x00aa00);
        const retryText = this.add.text(0, 50, 'RETRY', {
            fontFamily: 'sans-serif',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Make button interactive
        retryButton.setInteractive();
        retryButton.on('pointerdown', () => this.restartGame());
        retryButton.on('pointerover', () => retryButton.fillColor = 0x00cc00);
        retryButton.on('pointerout', () => retryButton.fillColor = 0x00aa00);
        
        this.gameOverContainer.add(retryButton);
        this.gameOverContainer.add(retryText);
    }
    
    // Create a rock or log obstacle in a random lane
    spawnObstacle() {
        // Choose a random lane
        const laneIndex = Phaser.Math.Between(0, 2);
        const x = this.lanes[laneIndex];
        
        // Randomly choose between rock and log
        const obstacleType = Phaser.Math.Between(0, 1) === 0 ? 'rock' : 'log';
        
        // Create the obstacle at the top of the screen
        const obstacle = this.add.image(x, -100, obstacleType);
        
        // Set scale based on obstacle type
        if (obstacleType === 'rock') {
            obstacle.setScale(0.15); // Adjust scale as needed for rock
        } else {
            obstacle.setScale(0.15); // Adjust scale as needed for log
        }
        
        // Add to the obstacles group
        this.obstacles.add(obstacle);
        
        // Store the velocity and type as properties on the obstacle object
        obstacle.speedY = this.obstacleSpeed;
        obstacle.type = obstacleType;
        
        // We'll handle movement and destruction in the update method
    }
    
    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.tweenToLane();
        }
    }
    
    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.tweenToLane();
        }
    }
    
    tweenToLane() {
        // Animate the character moving to the new lane
        this.tweens.add({
            targets: this.character,
            x: this.lanes[this.currentLane],
            duration: 200,
            ease: 'Power2'
        });
    }

    checkCollisions() {
        // Simple collision detection between character and obstacles
        const characterBounds = new Phaser.Geom.Rectangle(
            this.character.x - 40,
            this.character.y - 40,
            80,
            80
        );
        
        let collision = false;
        
        this.obstacles.getChildren().forEach(obstacle => {
            const obstacleBounds = new Phaser.Geom.Rectangle(
                obstacle.x - 30,
                obstacle.y - 30,
                60,
                60
            );
            
            if (Phaser.Geom.Rectangle.Overlaps(characterBounds, obstacleBounds)) {
                collision = true;
            }
        });
        
        return collision;
    }
    
    showGameOver() {
        // Update final score
        this.finalScoreText.setText('SCORE: ' + Math.floor(this.score));
        
        // Show game over container
        this.gameOverContainer.setVisible(true);
        
        // Add a simple animation to make it more dynamic
        this.tweens.add({
            targets: this.gameOverContainer,
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Play game over sound
        this.sound.play('gameOver', { volume: 0.5 });
        
        // Lower background music and wave sounds
        this.bgMusic.setVolume(0.05);
        this.waveSound.setVolume(0.02);
        
        // Set game state
        this.gameOver = true;
    }
    
    restartGame() {
        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.gameOverContainer.setVisible(false);
        
        // Reset character position
        this.currentLane = 1;
        this.character.x = this.lanes[this.currentLane];
        
        // Clear all obstacles
        this.obstacles.clear(true, true);
        
        // Reset difficulty
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.obstacleSpawnRate = this.baseSpawnRate;
        this.difficultyLevel = 0;
        
        // Reset timers
        this.nextObstacleSpawn = this.time.now + this.obstacleSpawnRate;
        this.difficultyTimer = this.time.now + this.difficultyInterval;
        this.lastTime = this.time.now;
        
        // Reset audio volumes and ensure they're playing
        this.bgMusic.setVolume(0.2);
        this.waveSound.setVolume(0.08);
        
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
        if (!this.waveSound.isPlaying) {
            this.waveSound.play();
        }
    }
    
    increaseDifficulty() {
        // Track difficulty level
        this.difficultyLevel = (this.difficultyLevel || 0) + 1;
        
        // Increase obstacle speed
        this.obstacleSpeed += this.speedIncreaseRate;
        
        // Decrease spawn rate (time between obstacles)
        this.obstacleSpawnRate = Math.max(this.minSpawnRate, this.obstacleSpawnRate - this.spawnRateDecreaseRate);
        
        // Add extra spawn rate decrease for the first 3 levels
        if (this.difficultyLevel <= 3) {
            // Additional spawn rate decrease for early levels
            const extraDecrease = 200;
            this.obstacleSpawnRate = Math.max(this.minSpawnRate, this.obstacleSpawnRate - extraDecrease);
            
            // Show a special message for the first three levels
            const levelText = this.add.text(512, 300, 'DANGER INCREASING!', {
                fontFamily: 'sans-serif',
                fontSize: 36,
                fontWeight: 'bold',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            // Make it fade out
            this.tweens.add({
                targets: levelText,
                alpha: { from: 1, to: 0 },
                y: 250,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => levelText.destroy()
            });
        }
        
        // Visual feedback for difficulty increase
        this.tweens.add({
            targets: this.scoreText,
            scale: { from: 1.2, to: 1 },
            duration: 300,
            ease: 'Bounce.easeOut'
        });
        
        console.log(`Difficulty increased! Level: ${this.difficultyLevel}, Speed: ${this.obstacleSpeed}, Spawn Rate: ${this.obstacleSpawnRate}`);
    }

    update(time, delta) {
        // Calculate a scroll speed that increases with difficulty
        const baseScrollSpeed = 4;
        const scrollSpeed = baseScrollSpeed + (this.obstacleSpeed - this.baseObstacleSpeed) / 60;
        
        // Scroll the river to create movement illusion
        this.river.tilePositionY -= scrollSpeed;
        
        // Add a slight bobbing motion to the character container
        this.character.y = 1200 + Math.sin(this.time.now / 300) * 3;
        
        // Game logic only runs if the game has started and is not over
        if (this.gameStarted && !this.gameOver) {
            // Calculate time difference in seconds since last update
            const currentTime = this.time.now;
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Update score based on time survived (100 points per second)
            this.score += this.scoreRate * deltaTime;
            
            // Update score display (round to whole number)
            this.scoreText.setText('SCORE: ' + Math.floor(this.score));
            
            // Check if it's time to increase difficulty
            if (time > this.difficultyTimer) {
                this.increaseDifficulty();
                this.difficultyTimer = time + this.difficultyInterval;
            }
            
            // Check if it's time to spawn a new obstacle
            if (time > this.nextObstacleSpawn) {
                this.spawnObstacle();
                this.nextObstacleSpawn = time + this.obstacleSpawnRate;
            }
            
            // Check for keyboard input
            if (Phaser.Input.Keyboard.JustDown(this.leftKey) || Phaser.Input.Keyboard.JustDown(this.aKey)) {
                this.moveLeft();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.rightKey) || Phaser.Input.Keyboard.JustDown(this.dKey)) {
                this.moveRight();
            }
            
            // Update and clean up obstacles
            this.obstacles.getChildren().forEach(obstacle => {
                // Move obstacle down based on its speed and delta time
                // Use the current game speed, not the individual obstacle's original speed
                obstacle.y += (this.obstacleSpeed * delta) / 1000;
                
                // Destroy obstacles that have gone off screen
                if (obstacle.y > 1600) {
                    obstacle.destroy();
                }
            });
            
            // Check for collisions
            if (this.checkCollisions()) {
                this.showGameOver();
            }
        }
    }
}
