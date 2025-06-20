// PixiJS 솔리테어 - 게임 상수들 (TypeScript)

import type { Suit, Rank } from '@/types/global';

export interface GameConstants {
  // 게임 설정
  GAME_WIDTH: number;
  GAME_HEIGHT: number;

  // 카드 설정
  CARD_WIDTH: number;
  CARD_HEIGHT: number;
  CARD_SCALE: number;
  CARD_SPACING: number;
  STACK_OFFSET_Y: number;

  // 레이아웃 설정
  MARGIN: number;
  TOP_AREA_HEIGHT: number;
  FOUNDATION_START_X: number;
  TABLEAU_START_Y: number;

  // 색상
  COLORS: {
    BACKGROUND: number;
    CARD_OUTLINE: number;
    VALID_DROP: number;
    INVALID_DROP: number;
    HIGHLIGHT: number;
    CARD_BACK: number;
    CARD_FRONT: number;
    RED_SUIT: number;
    BLACK_SUIT: number;
    EMPTY_SLOT: number;
  };

  // 카드 종류
  SUITS: readonly Suit[];
  RANKS: readonly Rank[];

  // 수트 심볼
  SUIT_SYMBOLS: Record<Suit, string>;

  // 애니메이션 설정
  ANIMATION: {
    DURATION: number;
    FLIP_DURATION: number;
    DEAL_DELAY: number;
    AUTO_MOVE_DURATION: number;
  };

  // 게임 설정
  GAME: {
    TABLEAU_COLUMNS: number;
    FOUNDATION_PILES: number;
    CARDS_PER_SUIT: number;
    TOTAL_CARDS: number;
  };
}

export const CONSTANTS: GameConstants = {
  // 게임 설정
  GAME_WIDTH: 1024,
  GAME_HEIGHT: 720,

  // 카드 설정
  CARD_WIDTH: 71,
  CARD_HEIGHT: 96,
  CARD_SCALE: 1.0,
  CARD_SPACING: 18,
  STACK_OFFSET_Y: 20,

  // 레이아웃 설정
  MARGIN: 20,
  TOP_AREA_HEIGHT: 120,
  FOUNDATION_START_X: 600,
  TABLEAU_START_Y: 160,

  // 색상
  COLORS: {
    BACKGROUND: 0x0f4c3a,
    CARD_OUTLINE: 0xffffff,
    VALID_DROP: 0x90ee90,
    INVALID_DROP: 0xff6b6b,
    HIGHLIGHT: 0xffd700,
    CARD_BACK: 0x0066cc,
    CARD_FRONT: 0xffffff,
    RED_SUIT: 0xff0000,
    BLACK_SUIT: 0x000000,
    EMPTY_SLOT: 0x888888,
  },

  // 카드 종류
  SUITS: ['hearts', 'diamonds', 'clubs', 'spades'] as const,
  RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const,

  // 수트 심볼
  SUIT_SYMBOLS: {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  },

  // 애니메이션 설정
  ANIMATION: {
    DURATION: 0.3,
    FLIP_DURATION: 0.2,
    DEAL_DELAY: 0.1,
    AUTO_MOVE_DURATION: 0.4,
  },

  // 게임 설정
  GAME: {
    TABLEAU_COLUMNS: 7,
    FOUNDATION_PILES: 4,
    CARDS_PER_SUIT: 13,
    TOTAL_CARDS: 52,
  },
} as const;