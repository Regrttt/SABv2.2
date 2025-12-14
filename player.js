// player.js

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.onPassableSurface = false;
        this.jumpsLeft = PLAYER_MAX_JUMPS;
        this.lastX = x;
        this.lastY = y;
        this.direction = 1;

        this.health = PLAYER_INITIAL_HEALTH;
        this.maxHealth = PLAYER_INITIAL_HEALTH;
        this.isInvincible = false;
        this.invincibilityTimer = 0;

        this.captureState = 'none'; 
        this.captureAnimProgress = 0;
        this.captureStartPos = null;
        this.captureEndPos = null;
        this.capturedByPlatform = null; 

        this.rewardCooldown = 0;
        this.rewardPlatform = null;
        this.rewardSource = null; // 'window' ou 'chest'
        this.canInteractWithChest = null;
        
        this.heldDebris = null;
        this.canPickUpDebris = null;

        this.lastCenterX = this.x + this.width / 2;
        this.lastCenterY = this.y + this.height / 2;
        this.trailCooldown = 0;
        this.TRAIL_INTERVAL = 0.03; 

        // Mecânica de Cambalhota
        this.isSomersaulting = false;
        this.rotation = 0;
        this.coyoteTimeCounter = 0;
    }

    canJump() {
        return this.jumpsLeft > 0 || this.coyoteTimeCounter > 0;
    }

    jump() {
        if (!this.canJump()) return;

        if (this.coyoteTimeCounter > 0) {
            this.isJumping = false;
            this.jumpsLeft = PLAYER_MAX_JUMPS;
        }
        
        if (this.jumpsLeft === PLAYER_MAX_JUMPS) {
            // Primeiro Pulo (Normal)
            this.isSomersaulting = false;
            this.rotation = 0;
        } else {
            // Pulo Duplo (Cambalhota)
            this.isSomersaulting = true;
            this.rotation = 0; 
        }
        
        this.velocityY = -JUMP_FORCE;
        this.isJumping = true;
        this.jumpsLeft--;
        this.coyoteTimeCounter = 0;
        
        playSound(sounds.jump);
    }

    draw(ctx, scrollOffset, verticalScrollOffset = 0, isVertical = false) {
        if (this.isInvincible && Math.floor(this.invincibilityTimer * 10) % 2 === 0) return;
        
        if (this.captureState === 'pulling' && this.captureAnimProgress >= 1) return;

        const playerX = this.x - (isVertical ? 0 : scrollOffset);
        const playerY = this.y - (isVertical ? verticalScrollOffset : 0);

        let drawWidth = this.width;
        let drawHeight = this.height;

        if (this.captureState === 'pulling') {
            drawWidth = this.width * (1 - this.captureAnimProgress * 0.9);
            drawHeight = this.height * (1 - this.captureAnimProgress * 0.9);
        }

        // Fatores de escala para quando o player for deformado (ex: animação final)
        const scaleFactorX = drawWidth / this.width;
        const scaleFactorY = drawHeight / this.height;

        ctx.save();
        
        // Centro do jogador para rotação e posicionamento do chapéu
        const centerX = playerX + drawWidth / 2;
        const centerY = playerY + drawHeight / 2;

        if (this.isSomersaulting) {
            ctx.translate(centerX, centerY);
            ctx.rotate(this.rotation * this.direction); 
            ctx.translate(-centerX, -centerY);
        }

        // --- CORPO DO JOGADOR ---
        const bodyGrad = ctx.createLinearGradient(playerX, playerY, playerX, playerY + drawHeight);
        bodyGrad.addColorStop(0, '#ff8b8b');
        bodyGrad.addColorStop(1, '#d13423');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(playerX, playerY, drawWidth, drawHeight);

        // --- GORRO DE NATAL (Versão v2.3 - Gradientes e Orientação Fixa) ---
        ctx.save();
        
        // Move o ponto de origem para o topo da cabeça do player
        ctx.translate(centerX, playerY);
        
        // Aplica a escala e a direção. 
        // MODIFICAÇÃO: Adicionado sinal negativo (-) em this.direction para inverter horizontalmente
        ctx.scale(-this.direction * scaleFactorX, scaleFactorY);

        // -- Desenho do Gorro --
        // Coordenadas relativas ao topo central da cabeça (0,0)
        
        // 1. Parte Vermelha (O tecido)
        const hatRedGrad = ctx.createLinearGradient(-15, -30, 20, 0);
        hatRedGrad.addColorStop(0, '#ff6b81'); // Vermelho claro/brilho no topo
        hatRedGrad.addColorStop(1, '#c0392b'); // Vermelho escuro/sombra na base
        ctx.fillStyle = hatRedGrad;
        
        ctx.beginPath();
        // Base esquerda (atrás da cabeça)
        ctx.moveTo(-18, 2); 
        // Curva superior até a ponta (caída para a direita/frente)
        ctx.bezierCurveTo(-10, -40, 15, -35, 30, -10); 
        // Curva inferior voltando para a testa
        ctx.quadraticCurveTo(20, -15, 18, 2);
        ctx.closePath();
        ctx.fill();
        
        // Linha de contorno sutil
        ctx.strokeStyle = '#a4281b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. A Faixa Branca (Base felpuda)
        // Gradiente vertical para dar volume cilíndrico
        const trimGrad = ctx.createLinearGradient(0, -8, 0, 6);
        trimGrad.addColorStop(0, '#f1f2f6'); // Branco topo
        trimGrad.addColorStop(0.5, '#ffffff'); // Branco centro
        trimGrad.addColorStop(1, '#ced6e0'); // Cinza base (sombra)
        ctx.fillStyle = trimGrad;
        
        ctx.beginPath();
        // Um retângulo arredondado levemente maior que a cabeça
        ctx.roundRect(-22, -8, 44, 14, 5); 
        ctx.fill();
        
        // 3. O Pom-pom (Bolinha na ponta)
        const ballX = 30;
        const ballY = -10;
        const ballRadius = 7;
        
        const pomGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, ballRadius);
        pomGrad.addColorStop(0, '#ffffff');
        pomGrad.addColorStop(1, '#bdc3c7');
        
        ctx.fillStyle = pomGrad;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Restaura escala/translação do gorro
        ctx.restore(); // Restaura rotação da cambalhota
        
        if (this.heldDebris) {
            this.heldDebris.draw(ctx, verticalScrollOffset);
        }
        
        if (debugMode) {
            ctx.strokeStyle = 'pink';
            ctx.lineWidth = 2;
            ctx.strokeRect(playerX, playerY, this.width, this.height);
        }
    }
    
    getCaptured(platform, windowPos) {
        if (platform.windowState !== 'active' || this.captureState !== 'none' || this.isInvincible) {
            return;
        }

        platform.windowState = 'in_progress';

        if (platform.windowType === 'reward') {
            this.rewardPlatform = platform;
            this.rewardSource = 'window';
            const spawnPos = { x: this.x + this.width / 2, y: this.y };
            triggerCoinReward(this, spawnPos, WINDOW_REWARD_COIN_COUNT);
        } else { 
            this.captureState = 'reaching';
            this.capturedByPlatform = platform; 
            this.captureAnimProgress = 0;
            this.captureStartPos = { x: this.x, y: this.y };
            this.captureEndPos = windowPos;
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }
    
    getCapturedByChest(chestPlatform) {
        this.takeDamage(true);
        chestPlatform.chestState = 'open';
    }

    update(deltaTime, keys, platforms, scrollOffset, infiniteInvincibilityCheat, enemies, sceneryManager, verticalScrollOffset, bossDebris) {
        const particlesToCreate = [];
        const isVertical = isVerticalPhase();
        const JUMP_RELEASE_DAMPING = 0.5;

        if (this.rewardPlatform && !coinRewardState.active && coinAnimations.length === 0) {
            this.rewardPlatform.windowState = 'closed';
            this.rewardPlatform = null;
        }
        
        if (this.rewardCooldown > 0) {
            this.rewardCooldown -= deltaTime;
            return { particles: particlesToCreate, closestDebris: null };
        }

        if (this.captureState !== 'none') {
            if(this.captureState === 'reaching') {
                this.captureAnimProgress += deltaTime / CAPTURE_REACH_DURATION;
                if(this.captureAnimProgress >= 1) {
                    this.captureAnimProgress = 0;
                    this.captureState = 'pulling';
                }
            } 
            else if (this.captureState === 'pulling') {
                this.captureAnimProgress += deltaTime / CAPTURE_PULL_DURATION;
                this.x = this.captureStartPos.x + (this.captureEndPos.x - this.captureStartPos.x) * this.captureAnimProgress;
                this.y = this.captureStartPos.y + (this.captureEndPos.y - this.captureStartPos.y) * this.captureAnimProgress;
                if(this.captureAnimProgress >= 1) this.captureAnimProgress = 1; 
            }
            return { particles: particlesToCreate, closestDebris: null };
        }

        if (infiniteInvincibilityCheat) {
            this.isInvincible = true;
        }

        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0 && !infiniteInvincibilityCheat) {
                this.isInvincible = false;
            }
        }

        this.lastX = this.x;
        this.lastY = this.y;
        
        this.velocityX = 0; 
        if (keys.right) this.velocityX += PLAYER_SPEED;
        if (keys.left) this.velocityX -= PLAYER_SPEED;
        
        if (keys.right) this.direction = 1;
        if (keys.left) this.direction = -1;

        this.x += this.velocityX * deltaTime;
        
        let isOnCloud = false;
        let onSolidPlatformThisFrame = false;
        let landedPlatformType = null;
        
        // --- LÓGICA DE SUPRESSÃO DE PARTÍCULAS EM PLATAFORMAS CAINDO ---
        let suppressLandingParticles = false;

        platforms.forEach(platform => {
            const onThisPlatform = (this.velocityY >= 0 && (this.x + this.width) > platform.x && this.x < (platform.x + platform.width));
            if (onThisPlatform) {
                if (platform.type === 'stable' || platform.type === 'falling') {
                    if ((this.y + this.height) >= platform.y && this.lastY + this.height <= platform.y + 10) onSolidPlatformThisFrame = true;
                } else if (platform.type === 'pass-through-slow' && !onSolidPlatformThisFrame) {
                    const sweptPlayerRect = { x: this.x, y: this.lastY, width: this.width, height: (this.y + this.height) - this.lastY };
                    const platformRect = { x: platform.x, y: platform.y, width: platform.width, height: 5 };
                    if (isColliding(sweptPlayerRect, platformRect)) isOnCloud = true;
                }
            }
        });

        const wasJumping = this.isJumping;
        
        if (keys.down && this.onPassableSurface) {
            this.y += 5;
            this.velocityY = 180;
        } else if (isOnCloud && !onSolidPlatformThisFrame) {
            this.velocityY = PLAYER_SLOW_FALL_SPEED;
            if (wasJumping) this.jumpsLeft = PLAYER_MAX_JUMPS;
            for (let i = 0; i < 3; i++) {
                particlesToCreate.push({ x: this.x + this.width / 2, y: this.y + this.height, size: Math.random() * 3 + 2, color: 'rgba(255, 255, 255, 0.8)', lifespan: 0.5 + Math.random() * 0.5, initialLifespan: 1.0, vx: (Math.random() - 0.5) * 150, vy: (Math.random() * -40) - 20, isScreenSpace: false });
            }
        } else {
            this.velocityY += GRAVITY * deltaTime;
        }
        
        if (this.velocityY < 0 && this.isJumping && !keys.space) {
            this.velocityY *= JUMP_RELEASE_DAMPING;
        }

        this.y += this.velocityY * deltaTime;
        
        // --- Animação de Cambalhota Dinâmica ---
        if (this.isSomersaulting) {
            const baseSpeed = 12;
            const dynamicSpeed = Math.abs(this.velocityY) / 60; 
            this.rotation += (baseSpeed + dynamicSpeed) * deltaTime;

            if (this.rotation >= Math.PI * 2) {
                this.rotation = 0;
                this.isSomersaulting = false;
            }
        }

        if (isVertical) {
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        } else {
            if (this.x < scrollOffset + 10) this.x = scrollOffset + 10;
        }
        
        if (this.heldDebris) {
            this.heldDebris.x = this.x + (this.width / 2) - (this.heldDebris.width / 2);
            this.heldDebris.y = this.y - this.heldDebris.height - 10;
        }
        
        const playerRect = { x: this.x, y: this.y, width: this.width, height: this.height };
        
        this.isJumping = true;
        this.onPassableSurface = false; 
        let landedOnWallSurface = false; 
        let landedOnPlatformSurface = false;
        
        const playerScreenRect = {
            x: this.x - (isVertical ? 0 : scrollOffset),
            y: this.y - (isVertical ? verticalScrollOffset : 0),
            width: this.width,
            height: this.height
        };
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            let hasCollided = false;

            if (enemy.type === 'falling_rock') {
                const rockRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                if(isColliding(playerRect, rockRect)) {
                    hasCollided = true;
                }
            } else {
                let effectivePlayerRect, enemyRect;
                if (enemy.isScreenSpaceEntity) {
                    effectivePlayerRect = playerScreenRect;
                    enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                } else {
                    effectivePlayerRect = playerRect;
                    enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                }
                
                if (enemy.type === 'patrol') {
                    if (isColliding(effectivePlayerRect, enemyRect)) {
                        hasCollided = true;
                    }
                } else {
                    const enemyCircle = {
                        x: enemyRect.x + enemyRect.width / 2,
                        y: enemyRect.y + enemyRect.height / 2,
                        radius: enemyRect.width / 2
                    };
                    if (isCollidingCircleRect(enemyCircle, effectivePlayerRect)) {
                        hasCollided = true;
                    }
                }
            }

            if (hasCollided) {
                if (enemy.type === 'rebound') {
                    enemy.rebound(scrollOffset); 
                } else {
                    if (!this.isInvincible) {
                        this.takeDamage(true);
                        enemies.splice(i, 1);
                    }
                }
            }
        }
        
        this.canInteractWithChest = null;

        platforms.forEach((platform) => {
            if (platform.hasChest && platform.chestState === 'closed') {
                const chestWidth = 50;
                const chestHeight = 40;
                const chestX = platform.x + (platform.width / 2) - (chestWidth / 2);
                const chestY = platform.y - chestHeight;
                
                const dx = (this.x + this.width / 2) - (chestX + chestWidth / 2);
                const dy = (this.y + this.height / 2) - (chestY + chestHeight / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CHEST_PROMPT_DISTANCE) {
                    this.canInteractWithChest = platform;
                }
            }

            if (platform.hasWindowTrap) {
                const windowWidth = 60;
                const windowHeight = 90;
                const windowX = platform.x + (platform.width / 2) - (windowWidth / 2);
                const windowY = platform.y - windowHeight;
                
                const windowHitbox = { x: windowX, y: windowY, width: windowWidth, height: windowHeight };

                if (isColliding(playerRect, windowHitbox) && keys.up) {
                    this.getCaptured(platform, { x: windowX + windowWidth / 2, y: windowY + windowHeight / 2 });
                }
            }

            let onObstacleSurface = false;
            
            platform.obstacles.forEach(obs => {
                if (obs.type === 'bush') return;

                let obsMainRect, obsSpikePartRect, lateralSpikeHitbox;
                let tookDamageFromSpike = false;

                if (obs.type === 'wall') {
                    obsMainRect = { x: platform.x + obs.x, y: platform.y - obs.height, width: obs.width, height: obs.height };
                    if (obs.lateralSpikes) {
                        lateralSpikeHitbox = { x: platform.x + obs.x - obs.lateralSpikes.protrusion, y: platform.y - obs.height + obs.lateralSpikes.yOffset, width: obs.lateralSpikes.protrusion, height: obs.lateralSpikes.height };
                    }
                } else if (obs.type === 'spike') {
                    obsMainRect = { x: platform.x + obs.x, y: platform.y - obs.height, width: obs.width, height: obs.height };
                } else if (obs.type === 'wallWithTopSpikes') {
                    obsMainRect = { x: platform.x + obs.x, y: platform.y - obs.wallHeight, width: obs.width, height: obs.wallHeight };
                    obsSpikePartRect = { x: platform.x + obs.x, y: platform.y - obs.wallHeight - obs.spikeHeight, width: obs.width, height: obs.spikeHeight };
                } else if (obs.type === 'spike-down') {
                    if (!this.isInvincible && isColliding(playerRect, { x: platform.x + obs.x, y: platform.y + platform.height, width: obs.width, height: obs.height })) {
                        this.takeDamage(true);
                        if (this.velocityY < 0) this.velocityY = JUMP_FORCE * 0.3;
                    }
                    return;
                }

                const playerBottom = this.y + this.height;
                const lastPlayerBottom = this.lastY + this.height;

                const primarySurface = obsSpikePartRect || obsMainRect;
                if (primarySurface) {
                    const surfaceY = primarySurface.y;
                    const isHorizontallyAligned = this.x + this.width > primarySurface.x && this.x < primarySurface.x + primarySurface.width;

                    if (this.velocityY >= 0 && lastPlayerBottom <= surfaceY && playerBottom >= surfaceY && isHorizontallyAligned) {
                        onObstacleSurface = true;
                        
                        if (obs.type === 'spike' || obs.type === 'wallWithTopSpikes') {
                            if (!this.isInvincible) {
                                this.takeDamage(true);
                                tookDamageFromSpike = true;
                            }
                            landedOnWallSurface = true;
                        } else {
                            landedOnWallSurface = true;
                        }

                        if (!tookDamageFromSpike) {
                            this.y = surfaceY - this.height;
                            this.velocityY = 0;
                        }
                        this.isJumping = false;
                    }
                }
                
                if (isColliding(playerRect, obsMainRect)) {
                    if (!this.isInvincible) {
                        if (lateralSpikeHitbox && isColliding(playerRect, lateralSpikeHitbox)) {
                            this.takeDamage(true);
                        } else if (obs.type === 'spike') {
                            this.takeDamage(true);
                        }
                    }

                    if (obs.type === 'wall' || obs.type === 'wallWithTopSpikes') {
                        if (this.velocityY < 0 && this.lastY >= obsMainRect.y + obsMainRect.height) {
                            this.y = obsMainRect.y + obsMainRect.height;
                            this.velocityY = 0;
                        } else if (this.velocityX !== 0) {
                            if (this.lastX + this.width <= obsMainRect.x) {
                                this.x = obsMainRect.x - this.width;
                            } else if (this.lastX >= obsMainRect.x + obsMainRect.width) {
                                this.x = obsMainRect.x + obsMainRect.width;
                            }
                            this.velocityX = 0;
                        }
                    }
                }
                 if (obsSpikePartRect && isColliding(playerRect, obsSpikePartRect)) {
                    if (!this.isInvincible) this.takeDamage(true);
                }
            });

            if ((this.velocityY >= 0 && (this.x + this.width) > platform.x && this.x < (platform.x + platform.width) && (this.y + this.height) >= platform.y && this.lastY + this.height <= platform.y) && !onObstacleSurface) {
                if (platform.type === 'pass-through-slow') {
                    this.isJumping = false; 
                    this.onPassableSurface = true;
                } else {
                    this.velocityY = 0; 
                    this.y = platform.y - this.height; 
                    this.isJumping = false; 
                    this.onPassableSurface = (platform.type !== 'falling'); 
                    landedOnPlatformSurface = true; 
                    landedOnWallSurface = false;
                    landedPlatformType = platform.visualType;
                    
                    if (platform.type === 'falling') {
                        // Se a plataforma já tem velocidade, ela já estava caindo
                        // Então suprimimos as partículas de "pouso" para evitar spam
                        if (platform.fallSpeed > 0) {
                            suppressLandingParticles = true;
                        }
                        platform.isFalling = true;
                    }
                }
            }
        });
        
        if (wasJumping && !this.isJumping) {
            this.jumpsLeft = PLAYER_MAX_JUMPS; 
            
            // Só toca som e solta partículas se NÃO estamos surfando numa plataforma caindo
            if (!suppressLandingParticles) {
                playSound(sounds.land);
                
                this.isSomersaulting = false;
                this.rotation = 0;

                let landingParticleColor = '#4CAF50'; 

                if (landedOnWallSurface) {
                    landingParticleColor = '#A9A9A9'; 
                } else if (landedPlatformType === 'stone') {
                    landingParticleColor = '#7f8c8d'; 
                } else if (landedPlatformType === 'cloud') {
                    landingParticleColor = 'rgba(255, 255, 255, 0.8)'; 
                }

                if (landedOnPlatformSurface || landedOnWallSurface || isOnCloud) { 
                    for (let i = 0; i < 20; i++) { particlesToCreate.push({ x: this.x + this.width / 2, y: this.y + this.height, size: Math.random() * 4 + 3, color: landingParticleColor, lifespan: 0.6 + Math.random() * 0.4, initialLifespan: 1.0, vx: (Math.random() - 0.5) * 350, vy: (Math.random() * -200) - 80, isScreenSpace: false }); }
                }
            }
        }
        
        if (!this.isJumping) {
            this.coyoteTimeCounter = COYOTE_TIME_DURATION;
        } else {
            this.coyoteTimeCounter -= deltaTime;
        }

        if (Math.abs(this.velocityX) > 10 || (Math.abs(this.velocityY) > 10 && this.isJumping)) {
            for (let i = 0; i < 2; i++) {
                const life = Math.random() * 0.4 + 0.2; 
                particlesToCreate.push({
                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                    y: this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                    size: Math.random() * 3 + 2, 
                    color: Math.random() < 0.5 ? '#e67e22' : '#c0392b',
                    lifespan: life,
                    initialLifespan: life,
                    vx: -(this.velocityX * 0.2), 
                    vy: -(this.velocityY * 0.2),
                    isScreenSpace: false
                });
            }
        }

        let closestDebris = null;
        if (bossDebris && !this.heldDebris) { 
            let minDistance = DEBRIS_PICKUP_DISTANCE;
            bossDebris.forEach(debris => {
                if (debris.state === 'landed') {
                    const dx = (this.x + this.width / 2) - (debris.x + debris.width / 2);
                    const dy = (this.y + this.height / 2) - (debris.y + debris.height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestDebris = debris;
                    }
                }
            });
        }
        this.canPickUpDebris = closestDebris;

        return { particles: particlesToCreate, closestDebris: this.canPickUpDebris };
    }

    triggerFallRespawn(platforms, verticalScrollOffset) {
        this.takeDamage(false);
        if (this.health > 0) {
            const visiblePlatforms = platforms.filter(p => p.y > verticalScrollOffset && p.y < verticalScrollOffset + canvas.height);
            const safePlatforms = visiblePlatforms.filter(p => p.visualType !== 'cloud' && !p.obstacles.some(obs => obs.type === 'spike-down'));

            let respawnPlatform = null;
            if (safePlatforms.length > 0) {
                respawnPlatform = safePlatforms.reduce((lowest, current) => (current.y > lowest.y) ? lowest : current);
            }

            if (respawnPlatform) {
                this.x = respawnPlatform.x + (respawnPlatform.width / 2) - (this.width / 2);
                this.y = respawnPlatform.y - this.height - 50;
            } else {
                this.x = canvas.width / 2 - this.width / 2;
                this.y = verticalScrollOffset + canvas.height / 2;
            }

            this.velocityY = 0;
            this.jumpsLeft = PLAYER_MAX_JUMPS;
        }
    }

    takeDamage(applyKnockback = false) {
        if (!this.isInvincible && this.captureState === 'none') {
            this.health--;
            this.jumpComboCount = 0; 
            this.isSomersaulting = false;
            playSound(sounds.damage);
            this.isInvincible = true;
            this.invincibilityTimer = INVINCIBILITY_DURATION;
            
            if(applyKnockback) {
                this.velocityY = -JUMP_FORCE / 2;
            }
        }
    }

    respawnInTower(platforms) {
        const platformCapturedOn = this.capturedByPlatform;
        if(!platformCapturedOn) return;
        
        if (platformCapturedOn.hasWindowTrap) {
            platformCapturedOn.windowState = 'closed';
        } else if (platformCapturedOn.hasChest) {
            // No futuro, podemos adicionar um estado de 'fechado e usado' se necessário
        }

        this.x = platformCapturedOn.x + (platformCapturedOn.width / 2) - (this.width / 2);
        this.y = platformCapturedOn.y - this.height - 5;
        
        this.velocityY = 0;
        this.jumpsLeft = PLAYER_MAX_JUMPS;
        this.captureState = 'none';
        this.capturedByPlatform = null;
        this.captureAnimProgress = 0;
    }

    respawn(platforms, scrollOffset) {
        this.health--;
        if (this.health > 0) {
            playSound(sounds.damage);
            this.isInvincible = true;
            this.invincibilityTimer = INVINCIBILITY_DURATION;

            const visiblePlatforms = platforms.filter(p => p.x + p.width > scrollOffset && p.x < scrollOffset + canvas.width);
            const safePlatforms = visiblePlatforms.filter(p => !p.obstacles.some(obs => obs.type === 'wall' || obs.type === 'spike' || obs.lateralSpikes || obs.type === 'wallWithTopSpikes'));
            let closestPlatform = null;
            let minDistance = Infinity;
            if (safePlatforms.length > 0) {
                safePlatforms.forEach(p => { const distance = Math.abs((p.x + p.width / 2) - (this.x)); if (distance < minDistance) { minDistance = distance; closestPlatform = p; } });
            }
            if (closestPlatform) { this.x = closestPlatform.x + (closestPlatform.width / 2) - (this.width / 2); this.y = closestPlatform.y - this.height - 150; } else { this.x = scrollOffset + 100; this.y = 100; }
            this.velocityY = 0;
            this.jumpsLeft = PLAYER_MAX_JUMPS;
        }
    }
}