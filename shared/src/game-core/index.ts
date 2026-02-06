export { calculateScore, type ScoringContext, type ScoringResult } from './scoring.js';
export { validateTaps, RateLimiter, DEFAULT_ANTI_CHEAT, type AntiCheatConfig, type ValidationResult } from './anti-cheat.js';
export { generateCPUTaps, generateCPUReverseRoundTaps, CPU_PROFILES, type CPUDifficulty, type CPUProfile } from './cpu-ai.js';
export { generateMatchPlan, type MatchPlan } from './match-generator.js';
export { GameTimer, CountdownTimer } from './timer.js';
