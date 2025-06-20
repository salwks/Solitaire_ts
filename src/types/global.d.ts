// PixiJS 전역 타입 정의
import * as PIXI from 'pixi.js';

declare global {
  const PIXI: typeof import('pixi.js');
  
  interface Window {
    PIXI_APP?: PIXI.Application;
    solitaireGame?: any;
    DEBUG_MODE?: boolean;
    fs?: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
  }

  // 커스텀 이벤트 타입
  interface CustomEventMap {
    'carddragstart': CustomEvent<CardDragEventDetail>;
    'carddragmove': CustomEvent<CardDragEventDetail>;
    'carddragend': CustomEvent<CardDragEventDetail>;
    'cardstockclicked': CustomEvent<CardEventDetail>;
    'carddoubleclick': CustomEvent<CardEventDetail>;
    'cardcardflipped': CustomEvent<CardEventDetail>;
    'cardstack_stockclicked': CustomEvent<StackEventDetail>;
    'gameStateChanged': CustomEvent<GameStateEventDetail>;
  }

  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): boolean;
  }
}

// 이벤트 세부 타입들
export interface CardEventDetail {
  card: import('@/entities/Card').Card;
  event?: PIXI.FederatedPointerEvent;
}

export interface CardDragEventDetail extends CardEventDetail {
  cards?: import('@/entities/Card').Card[];
  deltaX?: number;
  deltaY?: number;
}

export interface StackEventDetail {
  stack: import('@/entities/CardStack').CardStack;
  event?: Event;
}

export interface GameStateEventDetail {
  isStarted: boolean;
  isCompleted: boolean;
  isPaused: boolean;
  score: number;
  moves: number;
  time: number;
  foundationCards: number;
  progress: number;
  canUndo: boolean;
}

// 유틸리티 타입들
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type StackType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CardData {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
}

export interface MoveData {
  type: string;
  card?: string;
  cards?: string[];
  count?: number;
  from?: string;
  to?: string;
  fromIndex?: number;
  toIndex?: number;
  timestamp?: number;
  moveNumber?: number;
  stack?: string;
  stackIndex?: number;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalTime: number;
  totalMoves: number;
  bestTime: number | null;
  bestScore: number;
  winRate?: string;
  averageTime?: number;
  currentStreak?: number;
}

export interface GameSettings {
  drawCount: number;
  allowUndo: boolean;
  showTimer: boolean;
  autoComplete: boolean;
  hintEnabled: boolean;
}

export {};