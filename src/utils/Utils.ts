// PixiJS 솔리테어 - 유틸리티 함수들 (TypeScript)

import { CONSTANTS } from '@/core/Constants';
import type { Position, StackType, CardData, Suit } from '@/types/global';

export class Utils {
  // 배열 셔플 (Fisher-Yates 알고리즘)
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 52장 카드 덱 생성
  static createDeck(): CardData[] {
    const deck: CardData[] = [];
    CONSTANTS.SUITS.forEach((suit) => {
      CONSTANTS.RANKS.forEach((rank) => {
        deck.push({ suit, rank });
      });
    });
    return deck;
  }

  // 카드가 다른 카드 위에 올릴 수 있는지 확인 (Tableau 규칙)
  static canPlaceOnTableau(card: { getValue(): number; isRed(): boolean }, targetCard?: { getValue(): number; isRed(): boolean } | null): boolean {
    if (!targetCard) return card.getValue() === 13; // 빈 공간에는 K만

    // 색상이 반대이고 값이 1 작아야 함
    const isDifferentColor = card.isRed() !== targetCard.isRed();
    const isOneLess = card.getValue() === targetCard.getValue() - 1;

    return isDifferentColor && isOneLess;
  }

  // Foundation에 카드를 올릴 수 있는지 확인
  static canPlaceOnFoundation(card: { getValue(): number; suit: Suit }, foundation: { getValue(): number; suit: Suit }[]): boolean {
    if (foundation.length === 0) {
      return card.getValue() === 1; // 빈 Foundation에는 A만
    }

    const topCard = foundation[foundation.length - 1];
    const isSameSuit = card.suit === topCard.suit;
    const isOneMore = card.getValue() === topCard.getValue() + 1;

    return isSameSuit && isOneMore;
  }

  // 두 점 사이의 거리 계산
  static distance(point1: Position, point2: Position): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 점이 사각형 안에 있는지 확인
  static isPointInRect(point: Position, rect: { x: number; y: number; width: number; height: number }): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  // 게임 시간 포맷팅 (초 -> MM:SS)
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  // 점수 계산
  static calculateScore(moves: number, time: number, foundationCards: number): number {
    let score = 0;

    // Foundation에 올린 카드당 점수
    score += foundationCards * 10;

    // 시간 보너스 (빠를수록 높은 점수)
    const timeBonus = Math.max(0, 500 - Math.floor(time / 10));
    score += timeBonus;

    // 움직임 패널티 (적을수록 좋음)
    const movePenalty = Math.floor(moves / 2);
    score = Math.max(0, score - movePenalty);

    return score;
  }

  // 깊은 복사
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // 배열에서 랜덤 요소 선택
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // 숫자를 범위 내로 제한
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // 선형 보간
  static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  // 이지징 함수 (부드러운 애니메이션)
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // 카드 더미 위치 계산
  static getStackPosition(stackType: StackType, index: number = 0, scale: number = 1): Position {
    // 현재 화면 크기 사용
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * scale;
    const cardHeight = CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * scale;

    const horizontalGap = 10 * scale;
    const margin = CONSTANTS.MARGIN * scale;

    switch (stackType) {
      case 'stock':
        // 좌하단에 배치
        return {
          x: margin,
          y: screenHeight - margin - cardHeight,
        };

      case 'waste':
        // Stock 옆에 배치
        return {
          x: margin + cardWidth + horizontalGap,
          y: screenHeight - margin - cardHeight,
        };

      case 'foundation':
        // 우하단에 4개 배치
        const foundationStartX =
          screenWidth - margin - (cardWidth + horizontalGap) * 4;
        return {
          x: foundationStartX + index * (cardWidth + horizontalGap),
          y: screenHeight - margin - cardHeight,
        };

      case 'tableau':
        // 중앙 상단에 7개 배치
        const tableauTotalWidth = cardWidth * 7 + horizontalGap * 6;
        const tableauStartX = (screenWidth - tableauTotalWidth) / 2;
        const tableauStartY = margin;
        return {
          x: tableauStartX + index * (cardWidth + horizontalGap),
          y: tableauStartY,
        };

      default:
        return { x: 0, y: 0 };
    }
  }

  // 디버그 정보 출력
  static debug(message: string, data?: any): void {
    if (window.DEBUG_MODE) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  // 타입 가드 함수들
  static isValidSuit(suit: string): suit is Suit {
    return CONSTANTS.SUITS.includes(suit as Suit);
  }

  static isValidStackType(type: string): type is StackType {
    return ['stock', 'waste', 'foundation', 'tableau'].includes(type as StackType);
  }

  // DOM 유틸리티
  static getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  static getElementByIdRequired(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element with id '${id}' not found`);
    }
    return element;
  }

  // 로컬 스토리지 유틸리티 (타입 안전)
  static saveToStorage<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
      return false;
    }
  }

  static loadFromStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to load from localStorage: ${key}`, error);
      return null;
    }
  }

  static removeFromStorage(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  }

  // 성능 모니터링
  static createPerformanceTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    };
  }

  // 비동기 딜레이
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 배열 청크 분할
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 숫자 포맷팅 (천 단위 구분자)
  static formatNumber(num: number): string {
    return num.toLocaleString();
  }

  // 퍼센트 계산
  static calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  }
}