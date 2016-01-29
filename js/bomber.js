(function() {
    var game = new Phaser.Game(672, 480, Phaser.AUTO, 'canvas',
        {preload: preload, create: create, update: update, move: move,
        checkKeys: checkKeys, checkDirection: checkDirection, turn: turn});
    
    var map = null;
    var layer = null;
    var marker = new Phaser.Point();
    var turnPoint = new Phaser.Point();
    var directions = [null, null, null, null, null];
    var opposites = [Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];
    var Zombies = [];
    
    var player = null;
    var speed = 150;
    var speed2 = 150;
    var current = Phaser.UP;
    var cursors = null;
    var turning = null;
    var spaceKey = null;
    var baddieCounter = 5;

    var musicPlayNormal, musicLevelComplete, musicDead, musicBoom, musicSplat, musicBump;
    
    for(var i = 0; i < baddieCounter; ++i)
    {
        Zombies[i] = null;
    }
    
    // note: graphics copyright 2015 Photon Storm Ltd
    function preload() {
        game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('tiles', 'assets/tiles.png');
        this.load.image('bomb', 'assets/bomb.png');
        game.load.spritesheet('baddie', 'assets/baddie.png', 32,32);
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        game.load.spritesheet('explosion', 'assets/explosion17.png', 64, 64);
        game.load.audio('musicPN', 'assets/audio/-003-game-play-normal-.mp3');
        game.load.audio('musicLC', 'assets/audio/-005-level-complete.mp3');
        game.load.audio('musicDead', 'assets/audio/-009-dead.mp3');
        game.load.audio('musicDead', 'assets/audio/-009-dead.mp3');
        game.load.audio('musicBoom', 'assets/audio/bomb-03.mp3');
        game.load.audio('musicSplat', 'assets/audio/splat.mp3');
        game.load.audio('musicBump', 'assets/audio/bump-cut.mp3');
    }
    
    function Zombie(sprite) {
        this.sprite = sprite
        
   
    }
    
    Zombie.prototype.Act = function() {
        
    }
    
    
    function create() {
        map = game.add.tilemap('map');
        map.addTilesetImage('tiles');
        layer = map.createLayer('Tile Layer 1');
        map.setCollision(6, true, this.layer);
        
        for(var i = 0; i < baddieCounter; ++i)
        {
            if(i < 3)
            {
                Zombies[i] = makeZombie(32*5.5, 32*rand(1, 14));
                Zombies[i].body.velocity.x = speed2;
            }
            else
            {
                Zombies[i] = makeZombie(32*rand(4,18),32*4.5);
                Zombies[i].body.velocity.y = (i == 4) ? -speed2 : speed2;
            }
            Zombies[i].animations.play('right');
        }
        
        musicPlayNormal = game.add.audio('musicPN');
        musicLevelComplete = game.add.audio('musicLC');
        musicDead = game.add.audio('musicDead');
        musicBoom = game.add.audio('musicBoom');
        musicSplat = game.add.audio('musicSplat');
        musicBump = game.add.audio('musicBump');

        musicBoom.volume = 0.15;
        musicSplat.volume = 0.7;
        musicBump.volume = 0.3;
        musicPlayNormal.loop = true;
        musicPlayNormal.play();
     
        player = game.add.sprite(48, 48, 'dude', 4);
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
        player.anchor.set(0.5);
        player.scale.set(1, .66);    
        game.physics.arcade.enable(player);    
        
        cursors = game.input.keyboard.createCursorKeys();
        spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        
        spaceKey.onDown.add(function() {
        	if(player.alive) {
	            var bomb = game.add.sprite(marker.x * 32 + 16, marker.y * 32 + 16, 'bomb', 0);
	            bomb.anchor.set(0.5);
	            bomb.scale.set(.40, .30);
	            setTimeout(function() {                
	                fallout(bomb);
	                setTimeout(function() {
	                    fallout(bomb);
	                }, 25);
	                boom(bomb);
	                bomb.destroy();
	            }, 1000);        
	        }
        }, this);
    }
    
    function rand(min, max) {
        var x = Math.floor(Math.random()*(max - min + 1) + min);
        if(x % 2 === 0) {  x--; }
        x += 0.5;
        return x;
    }
    
    function makeZombie(px, py) {
        zombie = game.add.sprite(px, py, 'baddie', 2);
        zombie.animations.add('left',[0,1],10,true);
        zombie.animations.add('right',[2,3],10,true);
        zombie.anchor.set(.5);
        zombie.scale.set(.95, .66);
        game.physics.arcade.enable(zombie);
        return zombie;
    }
    
    function update() {
        AnimateZombie();
           
        if(!player.alive) {  endGame("lose"); }
            
        // check for collisions
        game.physics.arcade.collide(player, layer, function() { /*musicBump.play();*/ });
        
        for(var i = 0; i < baddieCounter; ++i)
            hitBaddie(Zombies[i]);
        
        marker.x = game.math.snapToFloor(Math.floor(player.x), 32) / 32;
        marker.y = game.math.snapToFloor(Math.floor(player.y), 32) / 32;
    
        if(cursors.left.isDown) {
            player.body.velocity.x = -speed;
            player.animations.play('left');
        } else if (cursors.right.isDown) {
            player.body.velocity.x = speed;
            player.animations.play('right');
        } else if (cursors.up.isDown) {
            player.body.velocity.y = -speed;
            player.animations.stop();
            player.frame = 4;
        } else if (cursors.down.isDown) {
            player.body.velocity.y = speed;
            player.animations.stop();
            player.frame = 4;
        } else {
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            snapToCenter();
            player.animations.stop();
            player.frame = 4;
        }
    
        checkWin();
    }
    
    function anyZombiesAlive() {
        var answer = false;
        for(var i = 0; i < baddieCounter; ++i)
            if(Zombies[i].alive)
                answer = true;
        return answer;
        
    }
    
    function checkWin() {

        if(!anyZombiesAlive() && player.alive)
            endGame("win");
    }
    
    function spriteEquals(sprite1, sprite2){
        return sprite1 === sprite2;
    }
    
    function isAZombie(sprite){
        for(var i = 0; i < baddieCounter; i++){
            if(spriteEquals(sprite, Zombies[i]))
                return true;
        }
        return false;
    }
    
    function hitBaddie(sprite) {
        // set sprite collision
        game.physics.arcade.collide(sprite, layer);
        
        if(isAZombie(sprite)) {
            game.physics.arcade.overlap(player, sprite, function() {
                musicSplat.play();
                player.kill();
            }, null, game);
        }
    }
    
    function snapToCenter()
    {
        marker.x = game.math.snapToFloor(Math.floor(player.x), 32) / 32;
        marker.y = game.math.snapToFloor(Math.floor(player.y), 32) / 32;
    
        player.body.x = (marker.x * 32);
        player.body.y = (marker.y * 32);
    }
    
    function getTileCoord(o){
        var pz = new Phaser.Point();
        pz.x = game.math.snapToFloor(Math.floor(o.x), 32) / 32;
        pz.y = game.math.snapToFloor(Math.floor(o.y), 32) / 32;
        return pz;
    }
    
    //Pass this function a bomb!!!
    function boom(b){
        musicBoom.play();

        var fireSprites = [];
        var x = getTileCoord(b).x;
        var y = getTileCoord(b).y;
        var hitTiles = [new Phaser.Point(x,y), new Phaser.Point(x+1,y), new Phaser.Point(x-1,y), new Phaser.Point(x,y+1),new Phaser.Point(x, y-1)];
        for(var i = 0; i<5; ++i){
            fireSprites.push(game.add.sprite(hitTiles[i].x * 32 + 16, hitTiles[i].y * 32 + 16, 'explosion', 0));
            fireSprites[i].anchor.set(0.5);
            fireSprites[i].scale.set(.40, .30);  
            fireSprites[i].animations.add('left',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],10,true);
            fireSprites[i].animations.play('left');
        }
    	
        setTimeout(function(){
            fireSprites.forEach(function(s){
                s.destroy();
            });
        }, 2000);
    
        for(var x = 0; x < 5; x++) {
            setTimeout(function(){
                fireSprites.forEach(function(s){
                    fallout(b);
                });
            }, x * 400);
            setTimeout(function(){
                fireSprites.forEach(function(s){
                    fallout(b);
                });
            }, x * 400 + 200);
        }	
    }
    

    function AnimateZombie(){
        for(var i = 0; i < baddieCounter; ++i)
        {
            var point = getTileCoord(Zombies[i]);
        
            if(point.x===3 && i == 0){
                Zombies[i].animations.play('right');
                Zombies[i].body.velocity.x = speed2;
            }
            if(point.x===15 && i == 0) {
                Zombies[i].animations.play('left');
                Zombies[i].body.velocity.x = -speed2;
            }
            if(point.x===5 && i == 1){
                Zombies[i].animations.play('right');
                Zombies[i].body.velocity.x = speed2;
            }
            if(point.x===18 && i == 1) {
                Zombies[i].animations.play('left');
                Zombies[i].body.velocity.x = -speed2;
            }
            if(point.x===2 && i == 2){
                Zombies[i].animations.play('right');
                Zombies[i].body.velocity.x = speed2;
            }
            if(point.x===9 && i == 2)
            {
                Zombies[i].animations.play('left');
                Zombies[i].body.velocity.x = -speed2;
            }
            if(point.y===3 && i == 3){
                Zombies[i].animations.play('right');
                Zombies[i].body.velocity.y = speed2;
            }
            if(point.y===12 && i == 3)
            {
                Zombies[i].animations.play('left');
                Zombies[i].body.velocity.y = -speed2;
            }
            if(point.y===4 && i == 4){
                Zombies[i].animations.play('right');
                Zombies[i].body.velocity.y = speed2;
            }
            if(point.y===11 && i == 4)
            {
                Zombies[i].animations.play('left');
                Zombies[i].body.velocity.y = -speed2;
            }

        }
    }
    
    function snapToY() {
        marker.y = game.math.snapToFloor(Math.floor(player.y), 32) / 32;
        player.body.y = (marker.y * 32);
    }
    
    function snapToX() {
        marker.x = game.math.snapToFloor(Math.floor(player.x), 32) / 32;
        player.body.x = (marker.x * 32);
    }
    
    function move(direction) {
        var velocity = speed;
        
        if(direction === Phaser.LEFT || direction === Phaser.UP) {
            velocity = -velocity;
        }
        if(direction === Phaser.LEFT || direction === Phaser.RIGHT) {
            player.body.velocity.x = velocity;
        } else {
            player.body.velocity.y = velocity;
        }
        
        current = direction;
    }
    
    function checkKeys() {
        if(cursors.left.isDown && current !== Phaser.LEFT) {
            checkDirection(Phaser.LEFT);
            player.animations.play('left');
        } else if(cursors.right.isDown && current !== Phaser.RIGHT) {
            checkDirection(Phaser.RIGHT);
            player.animations.play('right');
        } else if(cursors.up.isDown && current !== Phaser.UP) {
            checkDirection(Phaser.UP);
            player.animations.play('stop');
        } else if(cursors.down.isDown && current !== Phaser.DOWN) {
            checkDirection(Phaser.DOWN);
            player.animations.play('stop');
        } else {
            turning = Phaser.NONE;
            player.animations.play('stop');
        }
    }
    
    function checkDirection(direction) {
        if(current === opposites[direction]) {
            move(direction);
        } else {
            turning = direction;        
            turnPoint.x = marker.x*32 + 32/2;
            turnPoint.y = marker.y*32 + 32/2;    
        }
    }
    
    function distance(px, py) {
        return Math.pow((Math.pow(py.x - px.x, 2) + Math.pow(py.y - px.y, 2)), 0.5);
    }
    
    function turn() {
        var px = Math.floor(player.x);
        var py = Math.floor(player.y);
        
        var playerPoint = new Phaser.Point(px, py);
        
        if(distance(playerPoint, turnPoint) > 3) {
            return false;
        } else {
            player.x = turnPoint.x;
            player.y = turnPoint.y;
            player.body.reset(turnPoint.x, turnPoint.y);
            move(turning);
            turning = Phaser.NONE;
            return true;
        }
    }
    
    function endGame(status) {

    	game.input.keyboard.removeKeyCapture(Phaser.Keyboard.SPACEBAR);
        

        musicPlayNormal.stop();

        game.paused = true;
        game.sound.mute = false;
        clearAllTimeout();
        var text = game.add.text(0, game.camera.height / 3, "", {
            font: "129px Arial",
            fill: "#ffffff",
            align: "center"
        });
        text.fixedToCamera = false;
        if(status === "win") {
            musicLevelComplete.play();
            text.setText("You win!!!!!!");
        } else {
            musicDead.play();
            text.setText("Game Over");        
        }
        setTimeout(function() {
            text.setText("");
            musicLevelComplete.stop();
            musicDead.stop();
            create();
            game.paused = false;
        }, 3000);
    }
    
    function fallout(b) {
        marker.x = game.math.snapToFloor(Math.floor(b.x), 32);
        marker.y = game.math.snapToFloor(Math.floor(b.y), 32);
        
        for(var i = 0; i < baddieCounter; ++i)
            checkFallout(Zombies[i]);
        checkFallout(player);
    }
    
    function checkFallout(sprite) {
        if(sprite.body.y >= marker.y && sprite.y <= (marker.y + 32)) {
            if(sprite.body.x > (marker.x - 64) && sprite.body.x < (marker.x + 64) && sprite.alive) {
                musicSplat.play();
                sprite.kill();
            }
        }
        if(sprite.body.x >= marker.x && sprite.x <= (marker.x + 32)) {
            if(sprite.body.y > (marker.y - 64) && sprite.body.y < (marker.y + 64) && sprite.alive) {
                musicSplat.play();
                sprite.kill();
            }
        }
    }
})();
