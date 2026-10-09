// tslint:disable
/* eslint-disable */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Play,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  Zap,
  Volume1,
  FileText,
  Coffee,
  Briefcase,
  Star,
  Check
} from 'lucide-react';
import {getConfig} from './constants';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawBackground,
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';
import {
  SCENARIO_CHAPTERS,
  GRAMMAR_GUIDES,
  ScenarioChapter,
  GrammarChallenge,
  QuestionOption
} from './scenarios';

const ASSETS_MANIFEST: Record<string, string> = {
  bg_title: 'assets/images/bg_title_screen.png',
  bg_cafe: 'assets/images/bg_corporate_cafe.png',
  bg_bank: 'assets/images/bg_bank_consultation.png',
  bg_mixer: 'assets/images/bg_networking_mixer.png',
  icon_star: 'assets/images/icon_star_badge.png',
  icon_coffee: 'assets/images/icon_coffee_cup.png',
  icon_contract: 'assets/images/icon_contract_folder.png',
  icon_card: 'assets/images/icon_business_card.png',
  icon_timer: 'assets/images/icon_timer_clock.png',
};

const BGM_TRACKS = {
  lounge: 'assets/audio/bgm_lounge_jazz.mp3',
  challenge: 'assets/audio/bgm_intense_challenge.mp3',
};

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
}

/**
 * Institutional IFL Logo Component
 * Circular speech bubble with subtle bottom-right speech tail, vibrant orange fill (#F35F1A / #FA5F14),
 * bold white stylized 'IFL' lettering with subtle drop shadow.
 */
function IflLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IFL Logo"
    >
      <defs>
        <filter id="ifl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="1" floodColor="#8B2500" floodOpacity="0.75" />
        </filter>
        <linearGradient id="ifl-grad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#FA6015" />
          <stop offset="50%" stopColor="#F35F1A" />
          <stop offset="100%" stopColor="#D94807" />
        </linearGradient>
      </defs>
      {/* Speech bubble circle with tail at bottom right */}
      <path
        d="M 50 10 C 27.9 10 10 27.9 10 50 C 10 72.1 27.9 90 50 90 C 58.2 90 65.8 87.5 72.2 83.2 L 87.5 88.5 L 83.2 73.5 C 87.5 66.8 90 58.7 90 50 C 90 27.9 72.1 10 50 10 Z"
        fill="url(#ifl-grad)"
      />
      {/* Subtle top gloss arc */}
      <path
        d="M 26 26 C 33 19 41 16 50 16"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Stylized IFL Typography */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, system-ui, sans-serif"
        fontWeight="900"
        fontSize="33"
        letterSpacing="-1.5"
        filter="url(#ifl-shadow)"
      >
        IFL
      </text>
    </svg>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // SDK Integration
  const {sdk, isReady: sdkReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // Preload Assets
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs') as number;
    const maxSubSteps = getConfig('maxSubSteps') as number;
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // Audio settings
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // Overlay navigation states
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState(0);

  // Gameplay flow state
  const [chapterIndex, setChapterIndex] = useState(0);
  const [introDialogueIndex, setIntroDialogueIndex] = useState(0);
  const [outroDialogueIndex, setOutroDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  type GamePhaseType =
    | 'TITLE'
    | 'CHAPTER_SELECT'
    | 'SCENARIO_INTRO'
    | 'QUESTION_ACTIVE'
    | 'QUESTION_FEEDBACK'
    | 'SCENARIO_OUTRO'
    | 'GRADUATION_REPORT';

  const [phase, setPhase] = useState<GamePhaseType>('TITLE');
  const [confidence, setConfidence] = useState(50); // 0-100%
  const [strikes, setStrikes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    pointsEarned: number;
    speedBonus: number;
  } | null>(null);
  const [isSecondChance, setIsSecondChance] = useState(false);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [totalQuestionsCorrect, setTotalQuestionsCorrect] = useState(0);

  // Per-chapter performance metrics for celebratory breakdown
  const [chapterScores, setChapterScores] = useState<Record<number, { correct: number; total: number }>>({
    0: { correct: 0, total: 0 },
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
  });

  // Timer state
  const timeLimit = getConfig('timeLimit') as number;
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Standard React GameState for SDK and Lifecycle
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: 3,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Sync back-key handling with SDK
  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Current chapter and question helpers
  const currentChapter: ScenarioChapter = useMemo(() => {
    return SCENARIO_CHAPTERS[chapterIndex] || SCENARIO_CHAPTERS[0];
  }, [chapterIndex]);

  const currentChallenge: GrammarChallenge | undefined = useMemo(() => {
    return currentChapter?.challenges[questionIndex];
  }, [currentChapter, questionIndex]);

  // Ambient Particles for Canvas
  const particlesRef = useRef<Particle[]>([]);
  useEffect(() => {
    const list: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      list.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.3 + 0.1),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = list;
  }, [canvasWidth, canvasHeight]);

  // Speech Synthesis helper
  const speakPrompt = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Initialize fresh run
  const initGame = useCallback(() => {
    setChapterIndex(0);
    setQuestionIndex(0);
    setIntroDialogueIndex(0);
    setOutroDialogueIndex(0);
    setConfidence(50);
    setStrikes(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedOptionId(null);
    setFeedbackResult(null);
    setIsSecondChance(false);
    setTotalQuestionsAnswered(0);
    setTotalQuestionsCorrect(0);
    setChapterScores({
      0: { correct: 0, total: 0 },
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
    });
    setTimeLeft(timeLimit);
    setIsTimerRunning(false);
    setIsGameMenuOpen(false);
    setIsHowToPlayOpen(false);
    setIsHintModalOpen(false);

    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      lives: getConfig('maxStrikes') as number,
    });
    setPhase('SCENARIO_INTRO');

    if (sdk) {
      sdk.startGame();
    }
    gameAudio.playConfirmSelect();
  }, [sdk, timeLimit]);

  const startChapter = useCallback((index: number) => {
    setChapterIndex(index);
    setQuestionIndex(0);
    setIntroDialogueIndex(0);
    setOutroDialogueIndex(0);
    setStrikes(0);
    setSelectedOptionId(null);
    setFeedbackResult(null);
    setIsSecondChance(false);
    setTimeLeft(timeLimit);
    setIsTimerRunning(false);
    setPhase('SCENARIO_INTRO');
    setGameState((prev) => ({
      ...prev,
      status: 'PLAYING',
      level: index + 1,
      lives: (getConfig('maxStrikes') as number) - 0,
    }));
    gameAudio.playConfirmSelect();
  }, [timeLimit]);

  // Advance from Intro Dialogue into Question
  const advanceIntroDialogue = useCallback(() => {
    if (introDialogueIndex < currentChapter.introDialogue.length - 1) {
      setIntroDialogueIndex((prev) => prev + 1);
      gameAudio.playCrispClick();
    } else {
      setPhase('QUESTION_ACTIVE');
      setTimeLeft(timeLimit);
      setIsTimerRunning(true);
      setSelectedOptionId(null);
      setFeedbackResult(null);
      setIsSecondChance(false);
      gameAudio.playPowerupChime();
    }
  }, [introDialogueIndex, currentChapter, timeLimit]);

  // Advance Outro Dialogue
  const advanceOutroDialogue = useCallback(() => {
    if (outroDialogueIndex < currentChapter.outroDialogue.length - 1) {
      setOutroDialogueIndex((prev) => prev + 1);
      gameAudio.playCrispClick();
    } else {
      // Check if there is a next chapter or final summary graduation
      if (chapterIndex < SCENARIO_CHAPTERS.length - 1) {
        startChapter(chapterIndex + 1);
      } else {
        // All 3 scenarios completed: Transition smoothly into Celebratory Final Summary Screen
        setPhase('GRADUATION_REPORT');
        setGameState((prev) => ({...prev, status: 'VICTORY'}));
        gameAudio.playVictoryFanfare();
      }
    }
  }, [
    outroDialogueIndex,
    currentChapter,
    chapterIndex,
    startChapter,
  ]);

  // Handle Question Submission
  const handleAnswerSubmit = useCallback(
    (option: QuestionOption) => {
      if (phase !== 'QUESTION_ACTIVE' || !isTimerRunning) return;
      setIsTimerRunning(false);
      setSelectedOptionId(option.id);

      const baseScore = getConfig('baseScorePerQuestion') as number;
      const maxSpeedBonus = getConfig('maxSpeedBonus') as number;
      const confGain = getConfig('confidenceGainPerCorrect') as number;
      const confLoss = getConfig('confidencePenaltyPerMistake') as number;
      const maxStrikes = getConfig('maxStrikes') as number;

      setTotalQuestionsAnswered((prev) => prev + 1);
      setChapterScores((prev) => {
        const cur = prev[chapterIndex] || { correct: 0, total: 0 };
        return {
          ...prev,
          [chapterIndex]: {
            correct: cur.correct + (option.isCorrect ? 1 : 0),
            total: cur.total + 1,
          },
        };
      });

      if (option.isCorrect) {
        // Correct Answer
        const speedBonus = isSecondChance
          ? 0
          : Math.floor((timeLeft / timeLimit) * maxSpeedBonus);
        const multiplier = confidence >= 80 ? 1.5 : confidence >= 50 ? 1.2 : 1.0;
        const totalAward = Math.floor(
          (baseScore * (isSecondChance ? 0.5 : 1.0) + speedBonus) * multiplier,
        );

        setTotalQuestionsCorrect((prev) => prev + 1);
        setStreak((prev) => {
          const nextStreak = prev + 1;
          setMaxStreak((m) => Math.max(m, nextStreak));
          return nextStreak;
        });

        setConfidence((prev) => Math.min(100, prev + confGain));
        setGameState((prev) => ({
          ...prev,
          score: prev.score + totalAward,
        }));

        setFeedbackResult({
          isCorrect: true,
          explanation: option.explanation,
          pointsEarned: totalAward,
          speedBonus,
        });

        gameAudio.playCoinPickup();
      } else {
        // Incorrect Answer
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        setStreak(0);
        setConfidence((prev) => Math.max(0, prev - confLoss));

        setGameState((prev) => ({
          ...prev,
          lives: Math.max(0, maxStrikes - newStrikes),
        }));

        setFeedbackResult({
          isCorrect: false,
          explanation: option.explanation,
          pointsEarned: 0,
          speedBonus: 0,
        });

        gameAudio.playErrorBuzz();

        if (newStrikes >= maxStrikes) {
          // Game Over due to 3 strikes
          setTimeout(() => {
            setGameState((prev) => ({...prev, status: 'GAME_OVER'}));
            gameAudio.playDefeatMotif();
          }, 2000);
          return;
        }
      }

      setPhase('QUESTION_FEEDBACK');
    },
    [
      phase,
      isTimerRunning,
      isSecondChance,
      timeLeft,
      timeLimit,
      confidence,
      strikes,
      chapterIndex,
    ],
  );

  // Timeout handler
  const handleTimeExpiry = useCallback(() => {
    if (phase !== 'QUESTION_ACTIVE') return;
    setIsTimerRunning(false);
    const maxStrikes = getConfig('maxStrikes') as number;
    const confLoss = getConfig('confidencePenaltyPerMistake') as number;
    const newStrikes = strikes + 1;

    setStrikes(newStrikes);
    setStreak(0);
    setConfidence((prev) => Math.max(0, prev - confLoss));
    setTotalQuestionsAnswered((prev) => prev + 1);
    setChapterScores((prev) => {
      const cur = prev[chapterIndex] || { correct: 0, total: 0 };
      return {
        ...prev,
        [chapterIndex]: {
          correct: cur.correct,
          total: cur.total + 1,
        },
      };
    });

    setGameState((prev) => ({
      ...prev,
      lives: Math.max(0, maxStrikes - newStrikes),
    }));

    setFeedbackResult({
      isCorrect: false,
      explanation: 'Time expired! In rapid professional dialogues, prompt instinctual responses are essential.',
      pointsEarned: 0,
      speedBonus: 0,
    });

    gameAudio.playErrorBuzz();

    if (newStrikes >= maxStrikes) {
      setTimeout(() => {
        setGameState((prev) => ({...prev, status: 'GAME_OVER'}));
        gameAudio.playDefeatMotif();
      }, 2000);
      return;
    }

    setPhase('QUESTION_FEEDBACK');
  }, [phase, strikes, chapterIndex]);

  // Proceed to Next Question or Chapter Outro
  const proceedToNextChallenge = useCallback(() => {
    if (questionIndex < currentChapter.challenges.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setPhase('QUESTION_ACTIVE');
      setTimeLeft(timeLimit);
      setIsTimerRunning(true);
      setSelectedOptionId(null);
      setFeedbackResult(null);
      setIsSecondChance(false);
      gameAudio.playCrispClick();
    } else {
      // Completed all challenges in this chapter
      setPhase('SCENARIO_OUTRO');
      setOutroDialogueIndex(0);
      gameAudio.playLevelUpStinger();
    }
  }, [questionIndex, currentChapter, timeLimit]);

  // Second Chance option
  const retryCurrentQuestion = useCallback(() => {
    setIsSecondChance(true);
    setPhase('QUESTION_ACTIVE');
    setTimeLeft(15);
    setIsTimerRunning(true);
    setSelectedOptionId(null);
    setFeedbackResult(null);
    gameAudio.playCrispClick();
  }, []);

  // Timer Tick Stepper
  useEffect(() => {
    if (!isTimerRunning || isGameMenuOpen || isHintModalOpen || isHowToPlayOpen)
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpiry();
          return 0;
        }
        if (prev <= 6) {
          gameAudio.playCrispClick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isTimerRunning,
    isGameMenuOpen,
    isHintModalOpen,
    isHowToPlayOpen,
    handleTimeExpiry,
  ]);

  // Keyboard navigation & Shortcuts (1-4, Enter/Space, Esc, H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHintModalOpen) {
          setIsHintModalOpen(false);
          return;
        }
        if (isHowToPlayOpen) {
          setIsHowToPlayOpen(false);
          return;
        }
        if (gameState.status === 'PLAYING') {
          setIsGameMenuOpen((prev) => !prev);
          gameAudio.playCrispClick();
        }
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        if (gameState.status === 'PLAYING' && !isGameMenuOpen) {
          setIsHintModalOpen((prev) => !prev);
          gameAudio.playCrispClick();
        }
        return;
      }

      if (isGameMenuOpen || isHintModalOpen || isHowToPlayOpen) return;

      if (phase === 'SCENARIO_INTRO' && (e.key === 'Enter' || e.key === ' ')) {
        advanceIntroDialogue();
      } else if (
        phase === 'SCENARIO_OUTRO' &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        advanceOutroDialogue();
      } else if (
        phase === 'QUESTION_FEEDBACK' &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        if (feedbackResult?.isCorrect || isSecondChance) {
          proceedToNextChallenge();
        }
      } else if (phase === 'QUESTION_ACTIVE' && currentChallenge) {
        const keyIndex = parseInt(e.key, 10);
        if (
          !isNaN(keyIndex) &&
          keyIndex >= 1 &&
          keyIndex <= currentChallenge.options.length
        ) {
          handleAnswerSubmit(currentChallenge.options[keyIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    phase,
    isGameMenuOpen,
    isHintModalOpen,
    isHowToPlayOpen,
    gameState.status,
    currentChallenge,
    feedbackResult,
    isSecondChance,
    advanceIntroDialogue,
    advanceOutroDialogue,
    proceedToNextChallenge,
    handleAnswerSubmit,
  ]);

  // Auto-start for automated testing
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // Playground SDK Lifecycle
  usePlaygroundGameLifecycle(gameState, sdk);

  // Background Canvas Update & Render
  const update = (deltaTime: number) => {
    // Animate particles
    const list = particlesRef.current;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.y += p.speedY * 60 * deltaTime;
      p.x += p.speedX * 60 * deltaTime;
      if (p.y < -10) {
        p.y = canvasHeight + 10;
        p.x = Math.random() * canvasWidth;
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    // Determine current background image
    let currentBg = assets['bg_title'];
    if (gameState.status === 'PLAYING' || phase === 'GRADUATION_REPORT') {
      if (currentChapter.bgKey === 'bg_corporate_cafe')
        currentBg = assets['bg_cafe'];
      else if (currentChapter.bgKey === 'bg_bank_consultation')
        currentBg = assets['bg_bank'];
      else if (currentChapter.bgKey === 'bg_networking_mixer')
        currentBg = assets['bg_mixer'];
    }

    drawBackground(ctx, currentBg, canvasWidth, canvasHeight, '#0f172a');

    // Ambient floating particles
    ctx.save();
    const list = particlesRef.current;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  // Main Loop
  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      stepperRef.current?.(time, (dt) => updateRef.current(dt));
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Music selector: Challenge track during timed questions, lounge jazz during dialogue and title
  const currentMusicUrl =
    phase === 'QUESTION_ACTIVE' ? BGM_TRACKS.challenge : BGM_TRACKS.lounge;

  const isMusicPlaying =
    gameState.status !== 'GAME_OVER' &&
    gameState.status !== 'VICTORY' &&
    !isGameMenuOpen;

  // Primary button autofocus hooks
  const startBtnRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  // Comprehensive Celebratory Grade and Congratulatory Feedback
  const cefrEvaluation = useMemo(() => {
    const accuracy =
      totalQuestionsAnswered > 0
        ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100)
        : 100;

    if (accuracy >= 90) {
      return {
        level: 'C1 / Advanced City Communicator',
        badge: 'Executive Fluency',
        badgeColor: 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/20',
        title: 'Executive Fluency & Strategic Mastery',
        message:
          'Warmest congratulations to you! You have demonstrated exceptional English fluency, flawless grammatical precision with Month prepositions and Possessive structures, and swift workplace confidence. You are fully equipped to excel in international corporate environments!',
        strengths: [
          'Mastery of Calendar Prepositions (in October vs. on October 15th)',
          'Flawless distinction between Possessive Adjectives & Standalone Pronouns',
          'Instinctive, rapid conversational eloquence under real-time conditions',
        ],
      };
    } else if (accuracy >= 75) {
      return {
        level: 'B2 / Professional Workplace Communicator',
        badge: 'Corporate Proficiency',
        badgeColor: 'bg-sky-950/90 border-sky-400 text-sky-300 shadow-sky-500/20',
        title: 'Workplace Fluency & Articulate Dialogue',
        message:
          'Outstanding work! You navigated fast-paced urban scenarios with clarity, poise, and strong grammar control. Your vocabulary and communication instincts are primed for career success!',
        strengths: [
          'High accuracy across professional consultations and business meetings',
          'Sharp command of scheduling deadlines and personal possession references',
          'Strong conversational rhythm and workplace etiquette',
        ],
      };
    } else if (accuracy >= 60) {
      return {
        level: 'B1 / Independent Business Communicator',
        badge: 'Operational Competence',
        badgeColor: 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-amber-500/20',
        title: 'Solid Professional Foundation',
        message:
          'Great effort! You successfully completed the full city circuit across the Cafe, Bank, and Networking Mixer. With targeted practice on possessive pronouns, your fluency will reach executive levels!',
        strengths: [
          'Full scenario completion and tenacity across all 3 chapters',
          'Solid understanding of core business English concepts',
          'Clear path for continued communication refinement',
        ],
      };
    } else {
      return {
        level: 'A2 / Developing Urban Communicator',
        badge: 'Developing Fluency',
        badgeColor: 'bg-purple-950/90 border-purple-400 text-purple-300 shadow-purple-500/20',
        title: 'Promising Journey in Progress',
        message:
          'Well done on completing the IFL City Challenge! Communication is a journey of continuous refinement. Review the grammar coaching rules and challenge yourself again to claim the C1 Executive badge!',
        strengths: [
          'Engaged in active conversational practice across urban scenarios',
          'Gained hands-on familiarity with timed English dialogue',
          'Ready to retry and boost precision and speed',
        ],
      };
    }
  }, [totalQuestionsAnswered, totalQuestionsCorrect]);

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-between bg-slate-950 text-slate-100 select-none font-sans">
      {/* Asset Preloader Shield */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
          <div className="flex items-center gap-3 text-xl font-semibold animate-pulse text-teal-400">
            <Briefcase className="animate-spin" size={28} />
            Loading IFL City Challenge...
          </div>
        </div>
      )}

      <BackgroundMusic
        url={currentMusicUrl}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
      />

      {/* TOP DEDICATED HUD PANEL WITH IFL INSTITUTIONAL LOGO WATERMARK */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-4 py-2 z-20 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Left Side: IFL Institutional Logo Watermark + Title + Scenario */}
        <div className="flex items-center gap-2.5">
          {/* IFL Logo Watermark */}
          <div
            title="IFL Institute"
            className="flex items-center justify-center p-0.5 rounded-lg bg-slate-800/80 border border-orange-500/30 shadow-sm shadow-orange-500/10 hover:border-orange-500/60 transition group cursor-default"
          >
            <IflLogo className="w-7 h-7 md:w-8 md:h-8 shrink-0 transition group-hover:scale-105" />
          </div>

          {/* IFL CITY Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-950/90 to-slate-900 border border-sky-600/40 text-sky-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-sm">
            <Award size={14} className="text-amber-400 shrink-0" />
            <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-sky-300">
              IFL CITY
            </span>
          </div>

          {gameState.status === 'PLAYING' && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300 text-xs font-medium pl-1 border-l border-slate-700/60">
              <span className="text-slate-400">Ch.{currentChapter.chapterNumber}:</span>
              <span className="text-amber-300 font-semibold">{currentChapter.title}</span>
            </div>
          )}
        </div>

        {/* Center: Live Score & Professional Confidence Meter */}
        {gameState.status === 'PLAYING' && (
          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
            {/* Score */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-lg shadow-sm">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-slate-400 hidden xs:inline">Score:</span>
              <span className="font-bold text-yellow-300">
                {gameState.score.toLocaleString()}
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-lg">
              <Zap
                size={14}
                className={
                  confidence >= 75
                    ? 'text-emerald-400 animate-pulse'
                    : 'text-amber-400'
                }
              />
              <span className="text-slate-400">Confidence:</span>
              <div className="w-20 bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    confidence >= 75
                      ? 'bg-emerald-400'
                      : confidence >= 40
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{width: `${confidence}%`}}
                />
              </div>
              <span className="font-semibold text-xs text-slate-200">
                {confidence}%
              </span>
            </div>

            {/* Strikes Remaining */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg">
              <span className="text-slate-400 text-xs mr-1 hidden xs:inline">Strikes:</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < strikes ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right Side: Grammar Hint & Game Menu Trigger */}
        <div className="flex items-center gap-2 ml-auto">
          {gameState.status === 'PLAYING' && (
            <button
              onClick={() => {
                setIsHintModalOpen(true);
                gameAudio.playCrispClick();
              }}
              title="Grammar Rules & Hint (H)"
              className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 min-h-[36px]">
              <BookOpen size={14} />
              <span className="hidden sm:inline">Grammar Rules</span>
            </button>
          )}

          {/* Menu Button */}
          <button
            onClick={() => {
              setIsGameMenuOpen((prev) => !prev);
              gameAudio.playCrispClick();
            }}
            title="Game Menu (Esc)"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 min-h-[36px]">
            <Menu size={16} />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* CENTER PLAY AREA: Background Canvas + Foreground Interactive Story Panel */}
      <main className="flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          }}
          className="h-auto max-w-full max-h-full object-contain"
        />

        {/* --- IN-GAME PLAYING UI OVERLAYS --- */}
        {gameState.status === 'PLAYING' && (
          <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-6 pointer-events-none z-10">
            {/* 1. SCENARIO INTRO DIALOGUE */}
            {phase === 'SCENARIO_INTRO' && (
              <div className="pointer-events-auto max-w-2xl mx-auto w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 md:p-6 shadow-2xl animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentChapter.avatarBgColor} flex items-center justify-center text-white font-bold text-lg shadow-md border border-white/20`}>
                      {currentChapter.npcName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-300 text-base md:text-lg">
                        {currentChapter.npcName}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {currentChapter.npcRole} • {currentChapter.location}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      speakPrompt(
                        currentChapter.introDialogue[introDialogueIndex],
                      )
                    }
                    title="Listen to dialogue"
                    className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                    <Volume1 size={18} />
                  </button>
                </div>

                <p className="text-slate-100 text-base md:text-lg leading-relaxed mb-6 italic">
                  &ldquo;{currentChapter.introDialogue[introDialogueIndex]}&rdquo;
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    Step {introDialogueIndex + 1} of{' '}
                    {currentChapter.introDialogue.length} • Press Space or Enter
                  </span>
                  <button
                    onClick={advanceIntroDialogue}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95 min-h-[48px]">
                    <span>
                      {introDialogueIndex <
                      currentChapter.introDialogue.length - 1
                        ? 'Next'
                        : 'Start Challenge'}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* 2. QUESTION ACTIVE (30S TIMED GRAMMAR CHALLENGE) */}
            {phase === 'QUESTION_ACTIVE' && currentChallenge && (
              <div className="pointer-events-auto max-w-3xl mx-auto w-full bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-4 md:p-6 shadow-2xl">
                {/* Header: Speaker, Question Counter, and 30s Countdown */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentChapter.avatarBgColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {currentChapter.npcName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-200 text-sm">
                          {currentChallenge.speaker}
                        </span>
                        <span className="bg-sky-950 border border-sky-600/40 text-sky-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          {currentChallenge.ruleTag}
                        </span>
                        {isSecondChance && (
                          <span className="bg-amber-950 border border-amber-600/40 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            Second Chance (50% pts)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        Challenge {questionIndex + 1} of{' '}
                        {currentChapter.challenges.length}
                      </span>
                    </div>
                  </div>

                  {/* Circular Timer / Chronometer Badge */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakPrompt(currentChallenge.dialogueContext)}
                      title="Pronounce prompt aloud"
                      className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                      <Volume2 size={16} />
                    </button>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
                        timeLeft <= 5
                          ? 'bg-red-950/80 border-red-500 text-red-400 animate-bounce'
                          : 'bg-slate-800/80 border-slate-700 text-amber-300'
                      }`}>
                      <Clock size={16} />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                </div>

                {/* Question Context & Prompt */}
                <div className="mb-5 text-left">
                  <p className="text-xs text-slate-400 mb-1">
                    {currentChallenge.prompt}
                  </p>
                  <p className="text-base md:text-xl font-medium text-slate-100 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 leading-relaxed">
                    {currentChallenge.dialogueContext}
                  </p>
                </div>

                {/* Options Grid (Keys 1-4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentChallenge.options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswerSubmit(opt)}
                      className="group relative flex items-center justify-between p-3.5 bg-slate-800/90 hover:bg-sky-900/60 border border-slate-700 hover:border-sky-500/80 rounded-xl text-left transition duration-150 active:scale-[0.98] min-h-[48px]">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-700 group-hover:bg-sky-500 text-slate-300 group-hover:text-slate-950 font-bold text-xs flex items-center justify-center transition">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 text-sm md:text-base group-hover:text-white">
                          {opt.text}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider opacity-60 group-hover:opacity-100">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. QUESTION FEEDBACK COACHING CARD */}
            {phase === 'QUESTION_FEEDBACK' && feedbackResult && (
              <div
                className={`pointer-events-auto max-w-2xl mx-auto w-full backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-2xl border text-left animate-fade-in ${
                  feedbackResult.isCorrect
                    ? 'bg-slate-900/95 border-emerald-500/60 text-slate-100'
                    : 'bg-slate-900/95 border-red-500/60 text-slate-100'
                }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    {feedbackResult.isCorrect ? (
                      <CheckCircle2 size={24} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={24} className="text-red-400" />
                    )}
                    <h3
                      className={`font-bold text-lg ${
                        feedbackResult.isCorrect
                          ? 'text-emerald-300'
                          : 'text-red-300'
                      }`}>
                      {feedbackResult.isCorrect
                        ? 'Accurate & Professional!'
                        : 'Grammar Insight'}
                    </h3>
                  </div>

                  {feedbackResult.isCorrect && (
                    <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 text-sm">
                      <Sparkles size={16} />
                      <span>+{feedbackResult.pointsEarned} pts</span>
                      {feedbackResult.speedBonus > 0 && (
                        <span className="text-xs text-yellow-400">
                          (Speed +{feedbackResult.speedBonus})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-slate-200 text-sm md:text-base mb-6 leading-relaxed">
                  {feedbackResult.explanation}
                </p>

                <div className="flex items-center justify-between gap-3 pt-2">
                  {!feedbackResult.isCorrect && !isSecondChance ? (
                    <button
                      onClick={retryCurrentQuestion}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition active:scale-95 min-h-[48px]">
                      <RotateCw size={16} />
                      <span>Second Chance Retry (50% pts)</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Press Enter or Space to continue
                    </span>
                  )}

                  <button
                    onClick={proceedToNextChallenge}
                    className="ml-auto bg-sky-500 hover:bg-sky-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95 min-h-[48px]">
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* 4. SCENARIO OUTRO DIALOGUE */}
            {phase === 'SCENARIO_OUTRO' && (
              <div className="pointer-events-auto max-w-2xl mx-auto w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 md:p-6 shadow-2xl text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentChapter.avatarBgColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {currentChapter.npcName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-300 text-base md:text-lg">
                        {currentChapter.npcName}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        Chapter {currentChapter.chapterNumber} Complete!
                      </p>
                    </div>
                  </div>
                  <Trophy size={22} className="text-yellow-400" />
                </div>

                <p className="text-slate-100 text-base md:text-lg leading-relaxed mb-6 italic">
                  &ldquo;{currentChapter.outroDialogue[outroDialogueIndex]}&rdquo;
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    Press Space or Enter
                  </span>
                  <button
                    onClick={advanceOutroDialogue}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 min-h-[48px]">
                    <span>
                      {chapterIndex < SCENARIO_CHAPTERS.length - 1
                        ? 'Next Scenario'
                        : 'View Final Summary'}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 5. COMPREHENSIVE CELEBRATORY FINAL SUMMARY SCREEN --- */}
        {(phase === 'GRADUATION_REPORT' || gameState.status === 'VICTORY') && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start">
            <div className="max-w-3xl w-full my-auto bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden animate-fade-in">
              {/* Subtle top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

              {/* Header Badge with IFL Watermark */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <IflLogo className="w-8 h-8" />
                <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full">
                  IFL Official Certificate of Completion
                </span>
              </div>

              {/* Main Celebratory Trophy & Title */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30 text-slate-950">
                <Trophy size={38} />
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-2 tracking-tight">
                IFL CITY CHALLENGE MASTERED!
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-6">
                Congratulations on successfully completing all 3 urban workplace communication scenarios!
              </p>

              {/* Primary Key Metrics Showcase */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {/* Score */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Sparkles size={13} className="text-yellow-400" />
                    <span>Total Score</span>
                  </div>
                  <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                    {gameState.score.toLocaleString()}
                  </span>
                </div>

                {/* Total Questions Correct */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Accuracy</span>
                  </div>
                  <span className="text-xl md:text-2xl font-black text-emerald-400 block">
                    {totalQuestionsCorrect} / {totalQuestionsAnswered || 9}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({totalQuestionsAnswered > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100) : 100}%)
                  </span>
                </div>

                {/* CEFR Grade Level */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Award size={13} className="text-sky-400" />
                    <span>Grade Level</span>
                  </div>
                  <span className="text-base md:text-lg font-black text-sky-300 block truncate">
                    {cefrEvaluation.level.split('/')[0].trim()}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {cefrEvaluation.badge}
                  </span>
                </div>

                {/* Best Streak */}
                <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Zap size={13} className="text-amber-400" />
                    <span>Max Streak</span>
                  </div>
                  <span className="text-xl md:text-2xl font-black text-amber-300 block">
                    {maxStreak}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Combo Chain
                  </span>
                </div>
              </div>

              {/* Scenario-by-Scenario Breakdown Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={14} className="text-amber-400" />
                    Scenario Performance Breakdown
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    3 of 3 Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Scenario 1: Cafe Orders */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-600/40 flex items-center justify-center text-amber-400">
                        <Coffee size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Ch. 1 Cafe Orders</span>
                        <span className="text-[10px] text-slate-400">Coffee Barista</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md">
                      {chapterScores[0].correct} / {chapterScores[0].total || 3}
                    </span>
                  </div>

                  {/* Scenario 2: Bank Advisory */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-900/40 border border-sky-600/40 flex items-center justify-center text-sky-400">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Ch. 2 Bank Advisory</span>
                        <span className="text-[10px] text-slate-400">Wealth Officer</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md">
                      {chapterScores[1].correct} / {chapterScores[1].total || 3}
                    </span>
                  </div>

                  {/* Scenario 3: Networking Mixer */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-600/40 flex items-center justify-center text-purple-400">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Ch. 3 Mixer Terrace</span>
                        <span className="text-[10px] text-slate-400">VP Partner</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md">
                      {chapterScores[2].correct} / {chapterScores[2].total || 3}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warm Professional Pedagogical Feedback Card */}
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 md:p-5 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-amber-400" />
                  <h3 className="text-sm md:text-base font-bold text-sky-300">
                    {cefrEvaluation.level}
                  </h3>
                </div>

                <p className="text-xs md:text-sm text-slate-200 leading-relaxed mb-4">
                  {cefrEvaluation.message}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Key Competencies Mastered:
                  </span>
                  {cefrEvaluation.strengths.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Play Again & Main Menu */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={initGame}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-8 py-3.5 rounded-2xl font-black text-sm md:text-base transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 min-h-[48px]">
                  <RotateCw size={18} />
                  <span>PLAY AGAIN / RETRY CHALLENGE</span>
                </button>

                <button
                  onClick={() => {
                    setGameState((prev) => ({ ...prev, status: 'START' }));
                    setPhase('TITLE');
                    gameAudio.playCrispClick();
                  }}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-2xl font-bold text-sm transition min-h-[48px] flex items-center justify-center gap-2">
                  <span>Main Menu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- START MENU OVERLAY --- */}
      {gameState.status === 'START' && (
        <MenuOverlay>
          <div className="bg-slate-900/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-lg border border-slate-700/80 text-center">
            {/* IFL Institutional Logo Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <IflLogo className="w-12 h-12" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-sky-400 tracking-tight">
              IFL CITY CHALLENGE
            </h1>
            <p className="text-sky-300 font-semibold text-xs md:text-sm mb-3">
              Professional English Speaking & Fluency Simulation
            </p>
            <p className="text-slate-300 text-xs md:text-sm mb-6 leading-relaxed">
              Navigate real-world urban workplace conversations across 3 dynamic scenarios (Cafe, Bank & Networking Mixer). Master Month prepositions and Possessive structures under 30-second rapid-fire timers!
            </p>

            {/* Scenario Previews */}
            <div className="w-full grid grid-cols-3 gap-2 mb-6 text-left">
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
                <Coffee size={18} className="text-amber-400 mb-1" />
                <span className="text-[10px] text-slate-400 block">Ch. 1</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  Cafe Orders
                </span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
                <FileText size={18} className="text-sky-400 mb-1" />
                <span className="text-[10px] text-slate-400 block">Ch. 2</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  Bank Advisory
                </span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl">
                <Briefcase size={18} className="text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400 block">Ch. 3</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  Mixer Terrace
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                ref={startBtnRef}
                autoFocus
                onClick={initGame}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-6 py-3.5 rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-yellow-500/20 transition active:scale-95 flex items-center justify-center gap-2 min-h-[48px]">
                <Play size={20} className="fill-slate-950" />
                START CAREER RUN
              </button>

              <button
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 min-h-[44px]">
                <HelpCircle size={16} />
                How to Play & Syllabus
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState.status === 'GAME_OVER' && (
        <Overlay
          title="CHALLENGE INCOMPLETE"
          description={`You accumulated 3 consecutive strikes. Final Score: ${gameState.score}`}
          actionLabel="TRY AGAIN"
          onAction={initGame}
          icon={<RotateCw size={22} />}
          tone="danger"
        />
      )}

      {/* --- PAUSE / GAME MENU MODAL --- */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <IflLogo className="w-6 h-6" />
                <h2 className="text-2xl font-black text-amber-400">GAME MENU</h2>
              </div>
              <button
                onClick={() => setIsGameMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="w-full flex flex-col gap-3">
              {/* Resume Button */}
              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 py-3 rounded-xl font-bold text-base transition min-h-[48px] flex items-center justify-center gap-2">
                <Play size={18} className="fill-slate-950" />
                Resume Game
              </button>

              {/* Music & SFX Toggles */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => {
                    setIsMusicMuted((prev) => !prev);
                    gameAudio.playCrispClick();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 min-h-[48px]">
                  {isMusicMuted ? (
                    <VolumeX size={16} className="text-red-400" />
                  ) : (
                    <Volume2 size={16} className="text-emerald-400" />
                  )}
                  <span>Music: {isMusicMuted ? 'Off' : 'On'}</span>
                </button>

                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 min-h-[48px]">
                  {isSfxMuted ? (
                    <VolumeX size={16} className="text-red-400" />
                  ) : (
                    <Volume2 size={16} className="text-emerald-400" />
                  )}
                  <span>SFX: {isSfxMuted ? 'Off' : 'On'}</span>
                </button>
              </div>

              {/* Restart Current Chapter */}
              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  startChapter(chapterIndex);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 rounded-xl font-semibold text-sm transition min-h-[48px] flex items-center justify-center gap-2">
                <RotateCw size={16} />
                Restart Current Scenario
              </button>

              {/* How to Play Guide */}
              <button
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 rounded-xl font-semibold text-sm transition min-h-[48px] flex items-center justify-center gap-2">
                <HelpCircle size={16} />
                How to Play & Rules
              </button>

              {/* Quit to Main Menu */}
              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                  setPhase('TITLE');
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 py-3 rounded-xl font-semibold text-sm transition min-h-[48px]">
                Quit to Main Menu
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- HOW TO PLAY MODAL --- */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-amber-400" />
                <h2 className="text-xl font-bold text-slate-100">
                  How to Play & Syllabus
                </h2>
              </div>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="text-slate-300 text-xs md:text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-amber-300 mb-1">
                  1. The 30-Second Rapid-Fire Rule
                </h4>
                <p>
                  Each conversation prompt features a 30-second timer. Quick, accurate answers yield up to +300 speed bonus points!
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sky-300 mb-1">
                  2. Lesson 3: Months of the Year & Prepositions
                </h4>
                <p>
                  Always capitalize all 12 calendar months. Use preposition{' '}
                  <span className="text-amber-300 font-bold">&quot;in&quot;</span>{' '}
                  with months alone (<em>in October</em>) and{' '}
                  <span className="text-amber-300 font-bold">&quot;on&quot;</span>{' '}
                  with specific calendar dates (<em>on October 15th</em>).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-emerald-300 mb-1">
                  3. Lesson 4: Possessive Adjectives vs. Pronouns
                </h4>
                <p>
                  <strong>Adjectives:</strong> my, your, his, her, its, our,
                  their (must precede a noun).
                  <br />
                  <strong>Pronouns:</strong> mine, yours, his, hers, ours,
                  theirs (stand alone, never take apostrophes).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-purple-300 mb-1">
                  4. Scaffolding & Feedback
                </h4>
                <p>
                  Tap the Grammar Rules button anytime for coaching cheat-sheets, or use the Second Chance retry if you make a slip.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              className="mt-6 w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition min-h-[48px]">
              Back to Game
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* --- GRAMMAR REFERENCE CHEAT-SHEET MODAL --- */}
      {isHintModalOpen && (
        <MenuOverlay tone="neutral" zIndex={65}>
          <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-amber-400" />
                <h2 className="text-xl font-bold text-amber-300">
                  Grammar Coaching Reference
                </h2>
              </div>
              <button
                onClick={() => setIsHintModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
              {GRAMMAR_GUIDES.map((guide, idx) => (
                <button
                  key={guide.title}
                  onClick={() => setActiveGuideTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeGuideTab === idx
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {guide.category}
                </button>
              ))}
            </div>

            {/* Guide Content */}
            <div className="text-slate-300 text-xs md:text-sm space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              <h3 className="text-base font-bold text-slate-100">
                {GRAMMAR_GUIDES[activeGuideTab].title}
              </h3>
              <p className="bg-slate-800/80 p-3 rounded-xl text-slate-300 leading-relaxed border border-slate-700/60">
                {GRAMMAR_GUIDES[activeGuideTab].summary}
              </p>

              <div className="space-y-2 mt-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Examples:
                </span>
                {GRAMMAR_GUIDES[activeGuideTab].examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="font-semibold text-amber-300 text-xs mb-0.5">
                      {ex.rule}
                    </div>
                    <div className="text-emerald-400 text-xs">
                      ✓ {ex.correct}
                    </div>
                    <div className="text-red-400 text-xs line-through opacity-80">
                      ✗ {ex.incorrect}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsHintModalOpen(false)}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition min-h-[48px]">
              Got It, Resume Challenge
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
