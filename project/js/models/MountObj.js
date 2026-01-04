/**
 * @class MountObj
 * @description Abstract base class for objects that can hold avatars (Dock and Boat)
 * This class should not be instantiated directly.
 */
export class MountObj {
  /**
   * @param {number} minCapacity - Minimum capacity (immutable)
   * @param {number} maxCapacity - Maximum capacity (immutable)
   */
  constructor(minCapacity, maxCapacity) {
    if (new.target === MountObj) {
      throw new TypeError('Cannot construct MountObj instances directly');
    }
    this._minCapacity = minCapacity;
    this._maxCapacity = maxCapacity;
    this._passengers = [];
  }

  /**
   * @returns {number} Minimum capacity
   */
  get minCapacity() {
    return this._minCapacity;
  }

  /**
   * @returns {number} Maximum capacity
   */
  get maxCapacity() {
    return this._maxCapacity;
  }

  /**
   * @returns {Array<Avatar>} Copy of passengers array
   */
  getPassengers() {
    return [...this._passengers];
  }

  /**
   * @returns {number} Current passenger count
   */
  getPassengerCount() {
    return this._passengers.length;
  }

  /**
   * @param {Avatar} avatar - Avatar to add
   * @returns {boolean} True if successfully added
   */
  addPassenger(avatar) {
    if (this.isFull()) {
      return false;
    }
    this._passengers.push(avatar);
    return true;
  }

  /**
   * @param {Avatar} avatar - Avatar to remove
   * @returns {boolean} True if successfully removed
   */
  removePassenger(avatar) {
    const index = this._passengers.indexOf(avatar);
    if (index === -1) {
      return false;
    }
    this._passengers.splice(index, 1);
    return true;
  }

  /**
   * @returns {boolean} True if at max capacity
   */
  isFull() {
    return this._passengers.length >= this._maxCapacity;
  }

  /**
   * @returns {boolean} True if no passengers
   */
  isEmpty() {
    return this._passengers.length === 0;
  }

  /**
   * @param {Avatar} avatar - Avatar to check
   * @returns {boolean} True if avatar is a passenger
   */
  hasPassenger(avatar) {
    return this._passengers.includes(avatar);
  }
}
