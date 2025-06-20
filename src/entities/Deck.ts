// PixiJS 솔리테어 - 덱 관리 클래스 (TypeScript)

import { CONSTANTS } from '@/core/Constants';
import { Card } from '@/entities/Card';
import { Utils } from '@/utils/Utils';
import type { Suit, Rank, CardData } from '@/types/global';

export interface DealResult {
  tableau: Card[][];
  stock: Card[];
}

export interface DeckInfo {
  totalCards: number;
  topCard: string;
  isEmpty: boolean;
}

type TestPattern = 'sorted' | 'reverse' | 'alternating';

export class Deck {
  private cards: Card[] = [];
  private originalOrder: Card[] = [];

  constructor() {
    this.createDeck();
  }

  // 52장 카드 덱 생성
  private createDeck(): void {
    this.cards = [];

    CONSTANTS.SUITS.forEach((suit) => {
      CONSTANTS.RANKS.forEach((rank) => {
        const card = new Card(suit, rank);
        this.cards.push(card);
      });
    });

    // 원본 순서 저장
    this.originalOrder = [...this.cards];

    console.log(`${this.cards.length}장의 카드 덱이 생성되었습니다.`);
  }

  // 덱 셔플
  public shuffle(): this {
    const cardData = this.cards.map((card) => ({
      suit: card.suit,
      rank: card.rank,
    }));

    const shuffledData = Utils.shuffle(cardData);

    // 기존 카드들 정리
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    // 셔플된 순서로 새 카드들 생성
    shuffledData.forEach((data) => {
      const card = new Card(data.suit, data.rank);
      this.cards.push(card);
    });

    console.log('덱이 셔플되었습니다.');
    return this;
  }

  // 카드 뽑기
  public dealCard(): Card | null {
    if (this.cards.length === 0) {
      console.warn('덱에 카드가 없습니다.');
      return null;
    }

    const card = this.cards.pop();
    if (card) {
      console.log(`카드 ${card.toString()}가 딜되었습니다.`);
      return card;
    }

    return null;
  }

  // 솔리테어 초기 배치용 카드 딜링
  public dealForSolitaire(): DealResult {
    const dealResult: DealResult = {
      tableau: [[], [], [], [], [], [], []], // 7개 컬럼
      stock: [],
    };

    // Tableau 배치: 첫 번째 컬럼에 1장, 두 번째에 2장... 일곱 번째에 7장
    for (let col = 0; col < CONSTANTS.GAME.TABLEAU_COLUMNS; col++) {
      for (let row = 0; row <= col; row++) {
        const card = this.dealCard();
        if (card) {
          // 맨 위 카드만 앞면으로
          card.flip(row === col);
          dealResult.tableau[col].push(card);
        }
      }
    }

    // 나머지 카드들은 Stock으로
    while (this.cards.length > 0) {
      const card = this.dealCard();
      if (card) {
        card.flip(false); // 뒷면으로
        dealResult.stock.push(card);
      }
    }

    console.log('솔리테어 초기 배치 완료:', {
      tableau: dealResult.tableau.map((col) => col.length),
      stock: dealResult.stock.length,
    });

    return dealResult;
  }

  // 특정 카드 찾기
  public findCard(suit: Suit, rank: Rank): Card | null {
    return this.cards.find((card) => card.suit === suit && card.rank === rank) || null;
  }

  // 남은 카드 수
  public getCount(): number {
    return this.cards.length;
  }

  // 덱이 비어있는지 확인
  public isEmpty(): boolean {
    return this.cards.length === 0;
  }

  // 덱 리셋 (원본 순서로)
  public reset(): this {
    // 기존 카드들 정리
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    // 원본 순서로 새 카드들 생성
    this.originalOrder.forEach((originalCard) => {
      const card = new Card(originalCard.suit, originalCard.rank);
      this.cards.push(card);
    });

    console.log('덱이 리셋되었습니다.');
    return this;
  }

  // 카드 추가 (되돌리기나 특수 상황용)
  public addCard(card: Card): void {
    this.cards.push(card);
  }

  // 덱 상태 정보
  public getInfo(): DeckInfo {
    return {
      totalCards: this.cards.length,
      topCard:
        this.cards.length > 0
          ? this.cards[this.cards.length - 1].toString()
          : 'none',
      isEmpty: this.isEmpty(),
    };
  }

  // 테스트용: 특정 패턴으로 덱 배치
  public setTestPattern(pattern: TestPattern = 'sorted'): this {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    switch (pattern) {
      case 'sorted':
        // 수트별로 정렬된 순서
        CONSTANTS.SUITS.forEach((suit) => {
          CONSTANTS.RANKS.forEach((rank) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        });
        break;

      case 'reverse':
        // 역순
        const reversedSuits = [...CONSTANTS.SUITS].reverse();
        const reversedRanks = [...CONSTANTS.RANKS].reverse();
        reversedSuits.forEach((suit) => {
          reversedRanks.forEach((rank) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        });
        break;

      case 'alternating':
        // 색상이 번갈아가는 패턴
        const redSuits: Suit[] = ['hearts', 'diamonds'];
        const blackSuits: Suit[] = ['clubs', 'spades'];

        for (let i = 0; i < CONSTANTS.RANKS.length; i++) {
          const rank = CONSTANTS.RANKS[i];
          // 빨강, 검정, 빨강, 검정 순으로
          [redSuits[i % 2], blackSuits[i % 2]].forEach((suit) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        }
        break;
    }

    console.log(`덱이 ${pattern} 패턴으로 설정되었습니다.`);
    return this;
  }

  // 덱 검증 (모든 카드가 있는지 확인)
  public validate(): boolean {
    if (this.cards.length !== CONSTANTS.GAME.TOTAL_CARDS) {
      console.error(`덱 검증 실패: 카드 수가 ${this.cards.length}장입니다. (예상: ${CONSTANTS.GAME.TOTAL_CARDS}장)`);
      return false;
    }

    const cardSet = new Set<string>();
    for (const card of this.cards) {
      const cardKey = `${card.suit}_${card.rank}`;
      if (cardSet.has(cardKey)) {
        console.error(`덱 검증 실패: 중복 카드 발견 - ${cardKey}`);
        return false;
      }
      cardSet.add(cardKey);
    }

    // 모든 수트와 랭크가 있는지 확인
    for (const suit of CONSTANTS.SUITS) {
      for (const rank of CONSTANTS.RANKS) {
        const cardKey = `${suit}_${rank}`;
        if (!cardSet.has(cardKey)) {
          console.error(`덱 검증 실패: 누락된 카드 - ${cardKey}`);
          return false;
        }
      }
    }

    console.log('덱 검증 성공: 모든 카드가 올바르게 있습니다.');
    return true;
  }

  // 덱을 복사본으로 반환 (원본 보호)
  public getCardsCopy(): Card[] {
    return [...this.cards];
  }

  // 특정 수트의 카드들만 반환
  public getCardsBySuit(suit: Suit): Card[] {
    return this.cards.filter((card) => card.suit === suit);
  }

  // 특정 랭크의 카드들만 반환
  public getCardsByRank(rank: Rank): Card[] {
    return this.cards.filter((card) => card.rank === rank);
  }

  // 덱을 JSON으로 시리얼라이즈
  public serialize(): CardData[] {
    return this.cards.map((card) => ({
      suit: card.suit,
      rank: card.rank,
      faceUp: card.faceUp,
    }));
  }

  // JSON에서 덱을 복원
  public deserialize(cardData: CardData[]): void {
    // 기존 카드들 정리
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    // 새 카드들 생성
    cardData.forEach((data) => {
      const card = new Card(data.suit, data.rank);
      if (data.faceUp !== undefined) {
        card.flip(data.faceUp);
      }
      this.cards.push(card);
    });

    console.log(`덱이 ${cardData.length}장의 카드로 복원되었습니다.`);
  }

  // 덱 통계 정보
  public getStatistics(): {
    totalCards: number;
    suitCounts: Record<Suit, number>;
    rankCounts: Record<Rank, number>;
    faceUpCount: number;
    faceDownCount: number;
  } {
    const stats = {
      totalCards: this.cards.length,
      suitCounts: {
        hearts: 0,
        diamonds: 0,
        clubs: 0,
        spades: 0,
      } as Record<Suit, number>,
      rankCounts: {} as Record<Rank, number>,
      faceUpCount: 0,
      faceDownCount: 0,
    };

    // 랭크 카운트 초기화
    CONSTANTS.RANKS.forEach((rank) => {
      stats.rankCounts[rank] = 0;
    });

    // 통계 계산
    this.cards.forEach((card) => {
      stats.suitCounts[card.suit]++;
      stats.rankCounts[card.rank]++;
      
      if (card.faceUp) {
        stats.faceUpCount++;
      } else {
        stats.faceDownCount++;
      }
    });

    return stats;
  }

  // 메모리 정리
  public destroy(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.originalOrder = [];
  }
}