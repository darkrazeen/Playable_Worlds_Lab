export {
  activateTemporaryInstance,
  type ActivateTemporaryInstanceResult,
} from "./activateTemporaryInstance.js";
export { activateStonepassHiddenCave, loadStonepassHiddenCave } from "./loadStonepassHiddenCave.js";
export {
  loadTemporaryInstance,
  type LoadTemporaryInstanceResult,
  type LoadedTemporaryInstance,
} from "./loadTemporaryInstance.js";
export {
  moveToTemporaryRoom,
  type MoveTemporaryInstanceRoomResult,
} from "./moveTemporaryInstanceRoom.js";
export { CAVE_EXPOSED_FLAG, STONEPASS_HIDDEN_CAVE_INSTANCE_ID } from "./stonepassInstances.js";
export {
  canEnterTemporaryInstance,
  getTemporaryInstance,
  validateTemporaryInstanceEntry,
  type TemporaryInstanceEntryResult,
} from "./temporaryInstanceEntry.js";
export {
  canMoveToTemporaryRoom,
  getActiveTemporaryInstance,
  getCurrentTemporaryInstanceRoom,
  getTemporaryInstanceRoom,
  listConnectedTemporaryRoomIds,
  validateTemporaryRoomMove,
  type ValidateTemporaryRoomMoveResult,
} from "./temporaryInstanceRoom.js";
