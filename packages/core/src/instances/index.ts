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
export {
  applyInstanceEncounterChoice,
  type ApplyInstanceEncounterChoiceResult,
} from "./applyInstanceEncounterChoice.js";
export {
  findInstanceEncounterChoice,
  MAX_INSTANCE_ENCOUNTER_CHOICES,
  parseInstanceEncounter,
  safeParseInstanceEncounter,
  validateInstanceEncounterAgainstWorld,
  InstanceEncounterChoiceSchema,
  InstanceEncounterSchema,
  type InstanceEncounter,
  type InstanceEncounterChoice,
} from "./instanceEncounter.js";
export {
  isKnownInstanceEncounterId,
  loadInstanceEncounter,
  loadInstanceEncounterFromFile,
  parseLoadedInstanceEncounter,
  type LoadInstanceEncounterResult,
} from "./loadInstanceEncounter.js";
export {
  resolveCurrentRoomEncounter,
  resolveRoomEncounter,
  type InstanceEncounterSource,
  type ResolveInstanceEncounterResult,
} from "./resolveInstanceEncounter.js";
export {
  appendEncounterDebugEvent,
  appendEncounterLedgerEvent,
  buildEncounterInteractionDebugEvent,
  type EncounterEventInput,
} from "./recordEncounterEvent.js";
export {
  submitInstancePuzzleSolution,
  type SubmitInstancePuzzleSolutionResult,
} from "./submitInstancePuzzleSolution.js";
export {
  findInstancePuzzleSolution,
  isInstancePuzzleCompletionSolution,
  MAX_INSTANCE_PUZZLE_SOLUTIONS,
  parseInstancePuzzle,
  safeParseInstancePuzzle,
  validateInstancePuzzleAgainstWorld,
  InstancePuzzleSchema,
  InstancePuzzleSolutionSchema,
  type InstancePuzzle,
  type InstancePuzzleSolution,
} from "./instancePuzzle.js";
export {
  isKnownInstancePuzzleId,
  loadInstancePuzzle,
  loadInstancePuzzleFromFile,
  parseLoadedInstancePuzzle,
  type LoadInstancePuzzleResult,
} from "./loadInstancePuzzle.js";
export {
  resolveCurrentRoomPuzzle,
  type InstancePuzzleSource,
  type ResolveInstancePuzzleResult,
} from "./resolveInstancePuzzle.js";
export {
  appendPuzzleDebugEvent,
  appendPuzzleLedgerEvent,
  buildPuzzleInteractionDebugEvent,
  type PuzzleEventInput,
} from "./recordPuzzleEvent.js";
