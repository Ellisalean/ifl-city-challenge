import {SpriteConfig} from './utils/helper';

/**
 * Configuration for IFL City Challenge.
 */
export const CONFIG = {
  // Game System & Canvas
  title: {
    value: 'IFL City Challenge',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Game Rules & Difficulty (Tunable in Playground)
  timeLimit: {
    value: 30,
    type: 'number',
    label: 'Question Time Limit (s)',
    group: 'Rules',
  },
  maxStrikes: {
    value: 3,
    type: 'number',
    label: 'Max Strikes Allowed',
    group: 'Rules',
  },
  passThresholdPercent: {
    value: 70,
    type: 'number',
    label: 'Pass Threshold (%)',
    group: 'Rules',
  },
  baseScorePerQuestion: {
    value: 500,
    type: 'number',
    label: 'Base Score Per Question',
    group: 'Rules',
  },
  maxSpeedBonus: {
    value: 300,
    type: 'number',
    label: 'Max Speed Bonus',
    group: 'Rules',
  },
  confidenceGainPerCorrect: {
    value: 15,
    type: 'number',
    label: 'Confidence Gain',
    group: 'Rules',
  },
  confidencePenaltyPerMistake: {
    value: 20,
    type: 'number',
    label: 'Confidence Penalty',
    group: 'Rules',
  },

  // Thematic UI Styling
  backgroundColor: {
    value: '#0f172a',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#0ea5e9',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  accentColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Accent Color',
    group: 'THEME',
  },
  fontFamily: {
    value: "'Inter', system-ui, sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Standard audio levels
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Asset dimensions and aspect ratios from metadata
  assetBgTitleWidth: {
    value: 1376,
    type: 'number',
    label: 'Title BG Width',
    group: 'ASSETS',
  },
  assetBgTitleHeight: {
    value: 768,
    type: 'number',
    label: 'Title BG Height',
    group: 'ASSETS',
  },
  assetBgTitleAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Title BG Aspect Ratio',
    group: 'ASSETS',
  },

  assetBgCafeWidth: {
    value: 1376,
    type: 'number',
    label: 'Cafe BG Width',
    group: 'ASSETS',
  },
  assetBgCafeHeight: {
    value: 768,
    type: 'number',
    label: 'Cafe BG Height',
    group: 'ASSETS',
  },
  assetBgCafeAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Cafe BG Aspect Ratio',
    group: 'ASSETS',
  },

  assetBgBankWidth: {
    value: 1376,
    type: 'number',
    label: 'Bank BG Width',
    group: 'ASSETS',
  },
  assetBgBankHeight: {
    value: 768,
    type: 'number',
    label: 'Bank BG Height',
    group: 'ASSETS',
  },
  assetBgBankAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Bank BG Aspect Ratio',
    group: 'ASSETS',
  },

  assetBgMixerWidth: {
    value: 1376,
    type: 'number',
    label: 'Mixer BG Width',
    group: 'ASSETS',
  },
  assetBgMixerHeight: {
    value: 768,
    type: 'number',
    label: 'Mixer BG Height',
    group: 'ASSETS',
  },
  assetBgMixerAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Mixer BG Aspect Ratio',
    group: 'ASSETS',
  },

  assetIconStarAspectRatio: {
    value: 781 / 709,
    type: 'number',
    label: 'Star Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconCoffeeAspectRatio: {
    value: 607 / 616,
    type: 'number',
    label: 'Coffee Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconContractAspectRatio: {
    value: 902 / 633,
    type: 'number',
    label: 'Contract Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconCardAspectRatio: {
    value: 831 / 597,
    type: 'number',
    label: 'Card Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconTimerAspectRatio: {
    value: 684 / 624,
    type: 'number',
    label: 'Timer Icon Aspect Ratio',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/** Type helper for reading values in game code */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}
