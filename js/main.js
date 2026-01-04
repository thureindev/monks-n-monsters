import {
  Location,
  MountStatus,
  AvatarType,
  GameStatus,
  BoatStatus,
} from './enums.js';

/* ===========================
MODEL LAYER - CLASSES
=========================== */

import { MountObj } from './models/MountObj.js';

/**
 * @class Dock
 * @extends MountObj
 * @description Represents a dock at origin or destination
 */
class Dock extends MountObj {
  /**
   * @param {string} location - Location.ORIGIN or Location.DESTINATION (immutable)
   * @param {number} maxCapacity - Maximum number of avatars dock can hold
   */
  constructor(location, maxCapacity) {
    super(0, maxCapacity);
    this._location = location;
  }

  /**
   * @returns {string} Dock location
   */
  get location() {
    return this._location;
  }
}

/**
 * @class Boat
 * @extends MountObj
 * @description Represents the boat that transports avatars
 */
class Boat extends MountObj {
  /**
   * @param {number} maxCapacity - Maximum boat capacity
   * @param {number} minCapacity - Minimum capacity to sail (default: 1)
   */
  constructor(maxCapacity, minCapacity = 1) {
    super(minCapacity, maxCapacity);
    this._location = Location.ORIGIN;
    this._status = BoatStatus.DOCKED;
  }

  /**
   * @returns {string} Current boat location
   */
  get location() {
    return this._location;
  }

  /**
   * @returns {string} Current boat status
   */
  get status() {
    return this._status;
  }

  /**
   * @param {string} location - New location
   */
  setLocation(location) {
    this._location = location;
  }

  /**
   * @param {string} status - New status
   */
  setStatus(status) {
    this._status = status;
  }

  /**
   * @returns {string} Destination location (opposite of current)
   */
  getDestinationLocation() {
    if (this._location === Location.ORIGIN) {
      return Location.DESTINATION;
    } else if (this._location === Location.DESTINATION) {
      return Location.ORIGIN;
    }
    return Location.ORIGIN;
  }

  /**
   * @returns {boolean} True if boat has minimum passengers to sail
   */
  canSail() {
    return this._passengers.length >= this._minCapacity;
  }
}

/**
 * @class Avatar
 * @description Represents a human or monster character
 */
class Avatar {
  /**
   * @param {string} type - AvatarType.HUMAN or AvatarType.MONSTER (immutable)
   * @param {string|number} id - Unique identifier (immutable)
   */
  constructor(type, id) {
    this._type = type;
    this._id = id;
    this._location = Location.ORIGIN;
    this._mounted = MountStatus.ON_DOCK;
  }

  /**
   * @returns {string} Avatar type
   */
  getType() {
    return this._type;
  }

  /**
   * @returns {string|number} Avatar ID
   */
  getId() {
    return this._id;
  }

  /**
   * @returns {string} Current location
   */
  getLocation() {
    return this._location;
  }

  /**
   * @returns {string} Current mount status
   */
  getMounted() {
    return this._mounted;
  }

  /**
   * @param {string} location - New location
   */
  setLocation(location) {
    this._location = location;
  }

  /**
   * @param {string} mountStatus - New mount status
   */
  setMounted(mountStatus) {
    this._mounted = mountStatus;
  }
}

/**
 * @class Game
 * @description Singleton class managing game state and logic
 */
class Game {
  static #instance = null;

  /**
   * @private
   * @param {number} numMonsters - Number of monster avatars
   * @param {number} numHumans - Number of human avatars
   * @param {number} boatCapacity - Boat maximum capacity
   */
  constructor(numMonsters = 3, numHumans = 3, boatCapacity = 2) {
    if (Game.#instance) {
      throw new Error('Game is a singleton. Use Game.getInstance()');
    }

    this.uuid = crypto.randomUUID();
    this.numMonsters = numMonsters;
    this.numHumans = numHumans;
    this.totalAvatars = numMonsters + numHumans;
    this.boatCapacity = boatCapacity;
    this.status = GameStatus.ONGOING;
    this.tripCount = 0;

    this.avatars = [];
    this.boat = null;
    this.dockOrigin = null;
    this.dockDestination = null;
    this.view = null;

    Game.#instance = this;
  }

  // TODO: description
  destroy() {
    this.uuid = null;
    this.numMonsters = null;
    this.numHumans = null;
    this.totalAvatars = null;
    this.boatCapacity = null;
    this.status = null;
    this.tripCount = null;

    this.avatars = [];
    this.boat = null;
    this.dockOrigin = null;
    this.dockDestination = null;
    this.view = null;

    Game.#instance = null;
  }

  /**
   * @static
   * @param {number} numMonsters - Number of monsters
   * @param {number} numHumans - Number of humans
   * @param {number} boatCapacity - Boat capacity
   * @returns {Game} Singleton instance
   */
  static getInstance(numMonsters = 3, numHumans = 3, boatCapacity = 2) {
    if (!Game.#instance) {
      Game.#instance = new Game(numMonsters, numHumans, boatCapacity);
    }
    return Game.#instance;
  }

  /**
   * @static
   * @description Resets singleton instance for new game
   */
  static resetInstance() {
    Game.#instance = null;
  }

  /**
   * @description Initializes game with avatars and objects
   */
  initialize() {
    // reset game status
    this.status = GameStatus.ONGOING;
    // reset trip counter
    this.tripCount = 0;

    // Create docks
    this.dockOrigin = new Dock(Location.ORIGIN, this.totalAvatars);
    this.dockDestination = new Dock(Location.DESTINATION, this.totalAvatars);

    // Create boat
    this.boat = new Boat(this.boatCapacity, 1);

    // Create avatars
    for (let i = 0; i < this.numMonsters; i++) {
      const avatar = new Avatar(AvatarType.MONSTER, `monster-${i}`);
      this.avatars.push(avatar);
      this.dockOrigin.addPassenger(avatar);
    }
    for (let i = 0; i < this.numHumans; i++) {
      const avatar = new Avatar(AvatarType.HUMAN, `human-${i}`);
      this.avatars.push(avatar);
      this.dockOrigin.addPassenger(avatar);
    }
  }

  /**
   * @param {Avatar} avatar - Avatar that was clicked
   */
  handleAvatarClick(avatar) {
    if (this.status !== GameStatus.ONGOING) return;

    if (avatar.getMounted() === MountStatus.ON_DOCK) {
      const currentDock = this.getDockByLocation(this.boat.location);
      if (!currentDock.hasPassenger(avatar)) {
        this.view.showMessage('Boat is on the other side!', 'info');
        return; // Avatar not at current dock
      }

      // Move from dock to boat
      if (this.boat.isFull()) {
        this.view.showMessage('Boat is at full capacity!', 'info');
        return;
      }

      currentDock.removePassenger(avatar);
      this.boat.addPassenger(avatar);
      avatar.setMounted(MountStatus.ON_BOAT);
      this.view.render();
    } else if (avatar.getMounted() === MountStatus.ON_BOAT) {
      // Move from boat to dock
      if (!this.boat.hasPassenger(avatar)) {
        return;
      }

      this.boat.removePassenger(avatar);
      const currentDock = this.getDockByLocation(this.boat.location);
      currentDock.addPassenger(avatar);
      avatar.setMounted(MountStatus.ON_DOCK);
      this.view.render();
    } else {
      console.error('Avatar mount status is invalid:', avatar);
    }
  }

  /**
   * @description Handles boat click - initiates voyage
   */
  handleBoatClick() {
    if (this.status !== GameStatus.ONGOING) return;

    if (!this.boat.canSail()) {
      this.view.showMessage('Someone needs to row the boat!', 'info');
      return;
    }

    const voyageTo = this.boat.getDestinationLocation();

    // Update boat status
    this.boat.setStatus(BoatStatus.SAILING);
    this.boat.setLocation(Location.RIVER);

    // Update passengers location
    this.boat.getPassengers().forEach((avatar) => {
      avatar.setLocation(Location.RIVER);
    });

    // Update boat trip counter
    this.tripCount++;
    // Start voyage animation
    this.view.playVoyageAnimation(() => {
      // After animation completes
      this.boat.setStatus(BoatStatus.DOCKED);
      this.boat.setLocation(voyageTo);

      this.boat.getPassengers().forEach((avatar) => {
        avatar.setLocation(voyageTo);
      });

      this.view.render();
      this.handleGameStatus();
      // Check game status after 700ms pause
      // setTimeout(() => {
      //   this.handleGameStatus();
      // }, 700);
    });
  }

  /**
   * @description Checks win/loss conditions
   */
  handleGameStatus() {
    if (this.status !== GameStatus.ONGOING) return;

    // Check win condition
    if (
      this.dockOrigin.isEmpty() &&
      this.boat.location === Location.DESTINATION &&
      this.dockDestination.getPassengerCount() +
        this.boat.getPassengerCount() >=
        this.totalAvatars
    ) {
      this.status = GameStatus.WON;
      this.view.playWinAnimation();
      return true;

      // TODO: prevent cheat in browser
      const monsters = this.dockDestination
        .getPassengers()
        .filter((a) => a.getType() === AvatarType.MONSTER).length;
      const humans = this.dockDestination
        .getPassengers()
        .filter((a) => a.getType() === AvatarType.HUMAN).length;

      if (monsters === this.numMonsters && humans === this.numHumans) {
        this.status = GameStatus.WON;
        this.view.playWinAnimation();
        return;
      }
    }

    // Check loss conditions
    if (!this.isBalanced(this.dockOrigin)) {
      this.status = GameStatus.LOST;
      this.handleFeast(this.dockOrigin);
      return;
    }

    if (!this.isBalanced(this.dockDestination)) {
      this.status = GameStatus.LOST;
      this.handleFeast(this.dockDestination);
      return;
    }
  }

  /**
   * @param {Dock} dock - Dock to check
   * @returns {boolean} True if balanced (humans >= monsters or humans == 0)
   */
  isBalanced(dock) {
    let monsters = 0;
    let humans = 0;

    // count avatars on dock
    dock.getPassengers().forEach((avatar) => {
      if (avatar.getType() === AvatarType.MONSTER) {
        monsters++;
      } else if (avatar.getType() === AvatarType.HUMAN) {
        humans++;
      }
    });
    // count avatars on boat if boat is on this dock.
    if (dock.location === this.boat.location) {
      this.boat.getPassengers().forEach((avatar) => {
        if (avatar.getType() === AvatarType.MONSTER) {
          monsters++;
        } else if (avatar.getType() === AvatarType.HUMAN) {
          humans++;
        }
      });
    }

    // Balanced if no humans, or humans >= monsters
    return humans === 0 || humans >= monsters;
  }

  /**
   * @param {Dock} dock - Dock where feast occurs
   */
  handleFeast(dock) {
    const predatorList = [];
    const preyList = [];

    // list avatars on dock
    dock.getPassengers().forEach((avatar) => {
      if (avatar.getType() === AvatarType.MONSTER) {
        predatorList.push(avatar);
      } else if (avatar.getType() === AvatarType.HUMAN) {
        preyList.push(avatar);
      }
    });
    // list avatars on boat if boat is on this dock.
    if (dock.location === this.boat.location) {
      this.boat.getPassengers().forEach((avatar) => {
        if (avatar.getType() === AvatarType.MONSTER) {
          predatorList.push(avatar);
        } else if (avatar.getType() === AvatarType.HUMAN) {
          preyList.push(avatar);
        }
      });
    }

    this.view.playFeastAnimation(predatorList, preyList);
  }

  /**
   * @param {string|number} id - Avatar ID
   * @returns {Avatar|undefined} Avatar with matching ID
   */
  getAvatarById(id) {
    return this.avatars.find((avatar) => avatar.getId() === id);
  }

  /**
   * @param {string} location - Location to search
   * @returns {Dock|null} Dock at specified location
   */
  getDockByLocation(location) {
    if (location === Location.ORIGIN) {
      return this.dockOrigin;
    } else if (location === Location.DESTINATION) {
      return this.dockDestination;
    }
    return null;
  }
}

/* ===========================
           VIEW LAYER
           =========================== */

/**
 * @class ViewController
 * @description Handles all UI rendering and animations
 */
class ViewController {
  /**
   * @param {Game} game - Reference to game instance
   */
  constructor(game) {
    this.game = game;
    this.uuid = crypto.randomUUID();
    this.elements = {
      originContent: document.getElementById('origin-content'),
      destinationContent: document.getElementById('destination-content'),
      boat: document.getElementById('boat'),
      boatActionBtn: document.getElementById('boat-action-btn'),
      river: document.getElementById('river'),
      messageBox: document.getElementById('message-box'),
      overlay: document.getElementById('overlay'),
      timer: document.getElementById('timer'),
    };
    this.animationDuration = 3000; // Feast animation duration
    this.voyageDuration = 2000; // Voyage animation duration
    this.isAnimating = false;
    this.timerInterval = null;
    this.startTime = null;
  }

  // TODO: description
  destroy() {
    this.game = null;
    this.uuid = null;
    this.elements = null;
    this.animationDuration = null;
    this.voyageDuration = null;
    this.isAnimating = null;
    this.timerInterval = null;
    this.startTime = null;
  }

  /**
   * @description Starts the game timer
   */
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const milliseconds = elapsed % 1000;

      // this.displayGeekStats();

      this.elements.timer.textContent = `${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(
        3,
        '0'
      )}`;
    }, 10);
  }

  /**
   * @description Stops the game timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /**
   * @description Gets elapsed time string
   * @returns {string} Formatted time string
   */
  getElapsedTime() {
    const elapsed = Date.now() - this.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const milliseconds = elapsed % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}.${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * @description Initializes UI and starts timer
   */
  initialize() {
    this.bindEvents();
    this.render();
    // this.startTimer();
  }

  /**
   * @description Binds event listeners to UI elements
   */
  bindEvents() {
    // Boat click
    this.elements.boatActionBtn.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.game.handleBoatClick();
      }
    });
  }

  /**
   * @description Renders complete game state
   */
  render() {
    this.renderDock(this.game.dockOrigin, this.elements.originContent);
    this.renderDock(
      this.game.dockDestination,
      this.elements.destinationContent
    );
    this.renderBoat();
    // TODO: optimize this view render.
    this.elements.timer.textContent = `Boat Trips: ${this.game.tripCount}`;
  }

  displayGeekStats() {
    document.getElementById(
      'geek-stats'
    ).innerHTML = `<p style="color: black; font-size: 14px;">Game UUID: ${
      this.game.uuid
    } | View UUID: ${
      this.uuid
    }</p><p style="color: black; font-size: 14px;">Boat Passengers: ${this.game.boat.getPassengerCount()} | Origin Dock: ${this.game.dockOrigin.getPassengerCount()} | Destination Dock: ${this.game.dockDestination.getPassengerCount()} | </p>`;
  }

  /**
   * @param {Dock} dock - Dock to render
   * @param {HTMLElement} container - Container element
   */
  renderDock(dock, container) {
    container.innerHTML = '';
    dock.getPassengers().forEach((avatar) => {
      const avatarEl = this.createAvatarElement(avatar);
      container.appendChild(avatarEl);
    });
  }

  /**
   * @description Renders boat with passengers
   */
  renderBoat() {
    const boat = this.game.boat;
    const boatEl = this.elements.boat;
    const river = this.elements.river;

    // Clear boat content except emoji
    boatEl.innerHTML = '<span style="color: white; font-size: 24px;">🛶</span>';

    // Add passengers
    boat.getPassengers().forEach((avatar) => {
      const avatarEl = this.createAvatarElement(avatar, true);
      boatEl.appendChild(avatarEl);
    });

    // Move boat to left dock
    if (this.game.boat.location === Location.ORIGIN) {
      river.style.alignItems = 'flex-start';
    } else if (this.game.boat.location === Location.DESTINATION) {
      river.style.alignItems = 'flex-end';
    }
  }

  /**
   * @param {Avatar} avatar - Avatar to create element for
   * @param {boolean} isOnBoat - Whether avatar is on boat
   * @returns {HTMLElement} Avatar DOM element
   */
  createAvatarElement(avatar, isOnBoat = false) {
    const div = document.createElement('div');
    div.className = `avatar ${avatar.getType()}`;
    div.dataset.avatarId = avatar.getId();

    // Try to load image, fallback to emoji
    const img = document.createElement('img');
    const imageName = `${avatar.getType()}-idle.gif`;
    img.src = `images/${imageName}`;
    img.alt = avatar.getType();
    img.onerror = () => {
      // Fallback to emoji
      div.innerHTML = avatar.getType() === AvatarType.HUMAN ? '😐' : '👹';
    };

    div.appendChild(img);

    // Add click handler
    if (!isOnBoat || this.game.boat.location !== Location.RIVER) {
      div.addEventListener('click', () => {
        if (!this.isAnimating) {
          this.game.handleAvatarClick(avatar);
        }
      });
    }

    return div;
  }

  /**
   * @param {string} message - Message to display
   * @param {string} type - Message type (info/win/lose)
   */
  showMessage(message, type = 'info') {
    const msgBox = this.elements.messageBox;
    const overlay = this.elements.overlay;

    msgBox.textContent = message;
    msgBox.className = `message-box show ${type}`;
    overlay.classList.add('show');

    setTimeout(() => {
      msgBox.classList.remove('show');
      overlay.classList.remove('show');
    }, 2000);
  }

  /**
   * @param {Function} callback - Function to call after animation
   */
  playVoyageAnimation(callback) {
    this.isAnimating = true;
    this.elements.boat.classList.add('sailing');
    this.render();

    setTimeout(() => {
      this.elements.boat.classList.remove('sailing');
      this.isAnimating = false;
      callback();
    }, this.voyageDuration);
  }

  /**
   * @param {Array<Avatar>} predatorList - List of monsters
   * @param {Array<Avatar>} preyList - List of humans
   */
  playFeastAnimation(predatorList, preyList) {
    this.isAnimating = true;
    this.stopTimer();

    // Assign targets
    const targets = new Map();
    let preyIndex = 0;
    predatorList.forEach((predator, i) => {
      targets.set(predator.getId(), preyList[preyIndex].getId());
      preyIndex = (preyIndex + 1) % preyList.length;
    });

    // Phase 1: Horrified (0-1s)
    preyList.forEach((prey) => {
      this.updateAvatarImage(prey, 'human-horrified.gif', '😱');
      const el = document.querySelector(`[data-avatar-id="${prey.getId()}"]`);
      if (el) el.classList.add('vibrate');
    });

    predatorList.forEach((predator) => {
      this.updateAvatarImage(predator, 'monster-happy.gif', '😈');
    });

    // Phase 2: Move and feast (1-2s)
    setTimeout(() => {
      predatorList.forEach((predator, index) => {
        const targetId = targets.get(predator.getId());
        const predatorEl = document.querySelector(
          `[data-avatar-id="${predator.getId()}"]`
        );
        const targetEl = document.querySelector(
          `[data-avatar-id="${targetId}"]`
        );

        if (predatorEl && targetEl) {
          const targetRect = targetEl.getBoundingClientRect();
          const predatorRect = predatorEl.getBoundingClientRect();

          // Add offset to prevent complete overlap
          const offsetX = index * 15;
          const offsetY = index * 10;

          const deltaX = targetRect.left - predatorRect.left + offsetX;
          const deltaY = targetRect.top - predatorRect.top + offsetY;

          predatorEl.style.transition = 'transform 1s ease-in-out';
          predatorEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          predatorEl.style.zIndex = 100 + index;
        }
      });

      this.updateAvatarImages(predatorList, 'monster-feast.gif', '😈');
      this.updateAvatarImages(preyList, 'human-deceased.gif', '🍖');
    }, 2000);

    // Phase 3: Satisfied and skulls (2-3s)
    setTimeout(() => {
      this.updateAvatarImages(predatorList, 'monster-satisfied.gif', '👹');
      this.updateAvatarImages(preyList, 'human-skull.gif', '💀');
    }, 2000);

    // Complete animation
    setTimeout(() => {
      this.isAnimating = false;
      const timeStr = this.getElapsedTime();
      this.showMessage(
        `Game Over! The monsters feasted!\n Boat trips: ${this.game.tripCount}`,
        'lose'
      );
    }, this.animationDuration);
  }

  /**
   * @description Plays win animation
   */
  playWinAnimation() {
    this.stopTimer();
    const timeStr = this.getElapsedTime();
    this.showMessage(
      `🥳🥳🥳🎉 Victory! People safely crossed! People thank you. Monsters hate you.\n Boat trips: ${this.game.tripCount}`,
      'win'
    );
  }

  /**
   * @param {Avatar} avatar - Avatar to update
   * @param {string} imageName - New image filename
   * @param {string} emojiF Fallback - Fallback emoji
   */
  updateAvatarImage(avatar, imageName, emojiFallback) {
    const el = document.querySelector(`[data-avatar-id="${avatar.getId()}"]`);
    if (!el) return;

    const img = el.querySelector('img');
    if (img) {
      const newSrc = `images/${imageName}`;
      img.src = newSrc;
      img.onerror = () => {
        el.innerHTML = emojiFallback;
      };
    } else {
      el.innerHTML = emojiFallback;
    }
  }

  /**
   * @param {Array<Avatar>} avatars - Avatars to update
   * @param {string} imageName - New image filename
   * @param {string} emojiFallback - Fallback emoji
   */
  updateAvatarImages(avatars, imageName, emojiFallback) {
    avatars.forEach((avatar) => {
      this.updateAvatarImage(avatar, imageName, emojiFallback);
    });
  }

  /**
   * @description Disables user interactions
   */
  disableInteractions() {
    this.isAnimating = true;
  }

  /**
   * @description Enables user interactions
   */
  enableInteractions() {
    this.isAnimating = false;
  }
}

/* ===========================
           CONTROLLER LAYER
           =========================== */

/**
 * @class GameController
 * @description Orchestrates game initialization and UI updates
 */
class GameController {
  // TODO Description
  constructor() {
    this.game = null;
    this.view = null;
  }
  // TODO Description
  destroy() {
    this.game = null;
    this.view = null;
  }

  /**
   * @param {number} numMonsters - Number of monsters
   * @param {number} numHumans - Number of humans
   * @param {number} boatCapacity - Boat capacity
   */
  startNewGame(numMonsters = 3, numHumans = 3, boatCapacity = 2) {
    // Reset singleton
    Game.resetInstance();

    // Create new game instance
    this.game = Game.getInstance(numMonsters, numHumans, boatCapacity);
    this.game.initialize();

    // Create view
    this.view = new ViewController(this.game);
    // Initialize UI
    this.view.initialize();

    this.game.view = this.view;

    console.log(this);
    console.log('view uuid');
    console.log(this.view.uuid);
    console.log('game uuid');
    console.log(this.game.uuid);
  }

  /**
   * @description Restarts game with current configuration
   */
  restartGame() {
    if (this.game) {
      const { numMonsters, numHumans, boatCapacity } = this.game;
      this.cleanGarbage();
      this.startNewGame(numMonsters, numHumans, boatCapacity);
    }
  }

  // TODO: description
  cleanGarbage() {
    this.game.destroy();
    this.view.destroy();
    this.destroy();
  }
}

/* ===========================
MAIN INITIALIZATION
=========================== */

// Global controller instance
let gameController = new GameController();

// Configuration modal handling
const configBtn = document.getElementById('config-btn');
const configModal = document.getElementById('config-modal');
const configForm = document.getElementById('config-form');
const cancelBtn = document.getElementById('cancel-btn');
const overlay = document.getElementById('overlay');

// Restart button
const restartBtn = document.getElementById('restart-btn');
restartBtn.addEventListener('click', () => {
  gameController.restartGame();
});

// Open config modal
configBtn.addEventListener('click', () => {
  configModal.classList.add('show');
  overlay.classList.add('show');
});

// Close config modal
cancelBtn.addEventListener('click', () => {
  configModal.classList.remove('show');
  overlay.classList.remove('show');
});

// Validate and apply configuration
configForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const numMonsters = parseInt(document.getElementById('num-monsters').value);
  const numHumans = parseInt(document.getElementById('num-humans').value);
  const boatCapacity = parseInt(document.getElementById('boat-capacity').value);

  // Validation
  let isValid = true;

  const monstersInput = document.getElementById('num-monsters');
  const humansInput = document.getElementById('num-humans');
  const capacityInput = document.getElementById('boat-capacity');

  const monstersError = document.getElementById('monsters-error');
  const humansError = document.getElementById('humans-error');
  const capacityError = document.getElementById('capacity-error');

  // Reset errors
  [monstersInput, humansInput, capacityInput].forEach((input) => {
    input.classList.remove('error');
  });
  [monstersError, humansError, capacityError].forEach((error) => {
    error.classList.remove('show');
  });

  // Validate monsters
  if (!Number.isInteger(numMonsters) || numMonsters < 1) {
    monstersInput.classList.add('error');
    monstersError.classList.add('show');
    isValid = false;
  }

  // Validate humans
  if (!Number.isInteger(numHumans) || numHumans < 1) {
    humansInput.classList.add('error');
    humansError.classList.add('show');
    isValid = false;
  }

  // Validate boat capacity
  if (!Number.isInteger(boatCapacity) || boatCapacity < 1) {
    capacityInput.classList.add('error');
    capacityError.classList.add('show');
    isValid = false;
  }

  if (isValid) {
    configModal.classList.remove('show');
    overlay.classList.remove('show');
    gameController.cleanGarbage();
    gameController.startNewGame(numMonsters, numHumans, boatCapacity);
  }
});

// Start initial game
gameController.startNewGame();
