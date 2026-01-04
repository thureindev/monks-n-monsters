/* ===========================
ENUMS
=========================== */

/**
 * @readonly
 * @enum {string}
 * @description Location enumeration for game entities
 */
export const Location = Object.freeze({
  ORIGIN: 'origin',
  DESTINATION: 'destination',
  RIVER: 'river',
});

/**
 * @readonly
 * @enum {string}
 * @description Mount status for avatars
 */
export const MountStatus = Object.freeze({
  ON_DOCK: 'onDock',
  ON_BOAT: 'onBoat',
});

/**
 * @readonly
 * @enum {string}
 * @description Avatar type enumeration
 */
export const AvatarType = Object.freeze({
  HUMAN: 'human',
  MONSTER: 'monster',
});

/**
 * @readonly
 * @enum {string}
 * @description Game status enumeration
 */
export const GameStatus = Object.freeze({
  ONGOING: 'ongoing',
  WON: 'won',
  LOST: 'lost',
});

/**
 * @readonly
 * @enum {string}
 * @description Boat status enumeration
 */
export const BoatStatus = Object.freeze({
  DOCKED: 'docked',
  SAILING: 'sailing',
});
