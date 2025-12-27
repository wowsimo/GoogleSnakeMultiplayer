// MultiplayerMod.js
window.MultiplayerMod = {};

////////////////////////////////////////////////////////////////////
// RUNCODEBEFORE - Inizializzazione
////////////////////////////////////////////////////////////////////

window.MultiplayerMod.runCodeBefore = function() {
  console.log("[MultiplayerMod] Initializing...");
  
  // Setup per 2 giocatori locali
  this.setupLocalMultiplayer();
  
  // Per la versione online, qui aggiungeremo WebSocket
  // this.connectToServer('ws://localhost:3000');
};

////////////////////////////////////////////////////////////////////
// ALTERSNAKECODE - Modifica il codice del gioco
////////////////////////////////////////////////////////////////////

window.MultiplayerMod.alterSnakeCode = function(code) {
  // Cerca la funzione di inizializzazione del serpente
  if (code.includes('this.snake=') || code.includes('snake:')) {
    console.log("[MultiplayerMod] Found snake initialization code");
    
    // Modifica per creare 2 serpenti
    code = code.replace(/this\.snake\s*=\s*\{/g, 
      'this.snakes = [{ // Player 1\n' +
      '  body: [{x: 10, y: 10}],\n' +
      '  direction: "right",\n' +
      '  color: "#4CAF50",\n' +
      '  score: 0,\n' +
      '  alive: true\n' +
      '}, { // Player 2\n' +
      '  body: [{x: 15, y: 10}],\n' +
      '  direction: "left",\n' +
      '  color: "#FF5252",\n' +
      '  score: 0,\n' +
      '  alive: true\n' +
      '}];\n' +
      'this.snake = this.snakes[0]; // Mantieni compatibilità');
  }
  
  return code;
};

////////////////////////////////////////////////////////////////////
// RUNCODEAFTER - Dopo che il gioco è caricato
////////////////////////////////////////////////////////////////////

window.MultiplayerMod.runCodeAfter = function() {
  console.log("[MultiplayerMod] Game loaded, setting up multiplayer...");
  
  // 1. Sovrascrivi i controlli tastiera
  this.setupDualControls();
  
  // 2. Modifica la logica di gioco
  this.modifyGameLogic();
  
  // 3. Aggiungi HUD per entrambi i giocatori
  this.addMultiplayerHUD();
};

////////////////////////////////////////////////////////////////////
// FUNZIONI DELLA MOD
////////////////////////////////////////////////////////////////////

window.MultiplayerMod.setupLocalMultiplayer = function() {
  this.players = [
    { id: 1, controls: { up: 'w', down: 's', left: 'a', right: 'd' }, snake: null },
    { id: 2, controls: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, snake: null }
  ];
  
  console.log("[MultiplayerMod] Local multiplayer ready: P1(WASD), P2(Arrow Keys)");
};

window.MultiplayerMod.setupDualControls = function() {
  const game = window.snakeGame; // Il gioco è solitamente accessibile globalmente
  
  if (!game) {
    console.error("[MultiplayerMod] Game object not found!");
    return;
  }
  
  // Salva il gestore originale degli eventi
  const originalKeyDown = game.onKeyDown || document.onkeydown || function() {};
  
  // Sovrascrivi
  game.onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    
    // Player 1: WASD
    if (key === 'w' || key === 'arrowup') {
      if (this.players[0].snake && this.players[0].snake.direction !== 'down') {
        this.players[0].snake.direction = 'up';
      }
    }
    if (key === 's' || key === 'arrowdown') {
      if (this.players[0].snake && this.players[0].snake.direction !== 'up') {
        this.players[0].snake.direction = 'down';
      }
    }
    if (key === 'a' || key === 'arrowleft') {
      if (this.players[0].snake && this.players[0].snake.direction !== 'right') {
        this.players[0].snake.direction = 'left';
      }
    }
    if (key === 'd' || key === 'arrowright') {
      if (this.players[0].snake && this.players[0].snake.direction !== 'left') {
        this.players[0].snake.direction = 'right';
      }
    }
    
    // Player 2: Freccie (separate per compatibilità)
    if (e.key === 'ArrowUp' && key !== 'w') {
      if (this.players[1].snake && this.players[1].snake.direction !== 'down') {
        this.players[1].snake.direction = 'up';
      }
    }
    if (e.key === 'ArrowDown' && key !== 's') {
      if (this.players[1].snake && this.players[1].snake.direction !== 'up') {
        this.players[1].snake.direction = 'down';
      }
    }
    if (e.key === 'ArrowLeft' && key !== 'a') {
      if (this.players[1].snake && this.players[1].snake.direction !== 'right') {
        this.players[1].snake.direction = 'left';
      }
    }
    if (e.key === 'ArrowRight' && key !== 'd') {
      if (this.players[1].snake && this.players[1].snake.direction !== 'left') {
        this.players[1].snake.direction = 'right';
      }
    }
    
    // Chiama anche l'handler originale se esiste
    if (typeof originalKeyDown === 'function') {
      originalKeyDown.call(this, e);
    }
  };
  
  console.log("[MultiplayerMod] Dual controls setup complete");
};

window.MultiplayerMod.modifyGameLogic = function() {
  const game = window.snakeGame;
  if (!game) return;
  
  // Trova e salva i riferimenti ai serpenti
  this.players[0].snake = game.snakes ? game.snakes[0] : game.snake;
  this.players[1].snake = game.snakes ? game.snakes[1] : null;
  
  // Se non c'è un secondo serpente, crealo
  if (!this.players[1].snake && game.snake) {
    this.players[1].snake = {
      body: [{x: 15, y: 10}, {x: 15, y: 11}, {x: 15, y: 12}],
      direction: 'left',
      color: '#FF5252',
      score: 0,
      alive: true
    };
  }
  
  // Sovrascrivi la funzione di update del gioco
  const originalUpdate = game.update || function() {};
  
  game.update = () => {
    // Logica originale
    originalUpdate.call(game);
    
    // Logica per il secondo serpente
    this.updatePlayer2();
    
    // Disegna entrambi i serpenti
    this.drawBothSnakes();
  };
  
  console.log("[MultiplayerMod] Game logic modified for 2 players");
};

window.MultiplayerMod.updatePlayer2 = function() {
  const player2 = this.players[1].snake;
  if (!player2 || !player2.alive) return;
  
  // Muovi il serpente
  const head = {...player2.body[0]};
  
  switch(player2.direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // Controlla collisioni (semplificato)
  const gridSize = 20; // Dimensione griglia tipica
  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
    player2.alive = false;
    console.log("[MultiplayerMod] Player 2 died (wall)");
    return;
  }
  
  // Controlla collisione con se stesso (semplificato)
  for (let segment of player2.body) {
    if (segment.x === head.x && segment.y === head.y) {
      player2.alive = false;
      console.log("[MultiplayerMod] Player 2 died (self)");
      return;
    }
  }
  
  // Aggiungi nuova testa
  player2.body.unshift(head);
  
  // Controlla se mangia una mela (logica semplificata)
  const game = window.snakeGame;
  if (game && game.fruit) {
    if (head.x === game.fruit.x && head.y === game.fruit.y) {
      player2.score += 10;
      // NON rimuovere la coda (cresce)
      // Genera nuova mela
      if (typeof game.generateFruit === 'function') {
        game.generateFruit();
      }
    } else {
      // Rimuovi la coda solo se non ha mangiato
      player2.body.pop();
    }
  } else {
    // Se non c'è logica delle mele, rimuovi sempre la coda
    player2.body.pop();
  }
};

window.MultiplayerMod.drawBothSnakes = function() {
  const game = window.snakeGame;
  if (!game || !game.ctx) return;
  
  const ctx = game.ctx;
  
  // Disegna il secondo serpente
  const player2 = this.players[1].snake;
  if (player2 && player2.alive) {
    ctx.fillStyle = player2.color;
    player2.body.forEach(segment => {
      // Adatta alle coordinate del gioco
      const cellSize = game.cellSize || 20;
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 2, cellSize - 2);
    });
  }
};

window.MultiplayerMod.addMultiplayerHUD = function() {
  // Crea HUD
  const hud = document.createElement('div');
  hud.id = 'multiplayer-hud';
  hud.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    pointer-events: none;
  `;
  
  hud.innerHTML = `
    <div><span style="color: #4CAF50">●</span> Player 1 (WASD): <span id="p1-score">0</span></div>
    <div><span style="color: #FF5252">●</span> Player 2 (Arrows): <span id="p2-score">0</span></div>
    <div style="margin-top: 5px; font-size: 12px; opacity: 0.8;">Multiplayer Mod v1.0</div>
  `;
  
  document.body.appendChild(hud);
  
  // Aggiorna i punteggi periodicamente
  setInterval(() => {
    const p1Score = document.getElementById('p1-score');
    const p2Score = document.getElementById('p2-score');
    
    if (p1Score && this.players[0].snake) {
      p1Score.textContent = this.players[0].snake.score || 0;
    }
    if (p2Score && this.players[1].snake) {
      p2Score.textContent = this.players[1].snake.score || 0;
    }
  }, 100);
};