// PixiJS 솔리테어 - 에셋 로더 (TypeScript)

import * as PIXI from 'pixi.js';
import { CONSTANTS } from '@/core/Constants';
import type { Suit, Rank } from '@/types/global';

interface CardTextures {
  [key: string]: PIXI.Texture;
}

interface SymbolPosition {
  x: number;
  y: number;
  flip?: boolean;
}

export class AssetLoader {
  private app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  public async loadAssets(): Promise<boolean> {
    try {
      // 카드 텍스처들 생성
      const cardTextures = this.createCardTextures();

      // PIXI.Assets에 텍스처 등록
      Object.keys(cardTextures).forEach((key) => {
        PIXI.Assets.cache.set(key, cardTextures[key]);
      });

      console.log('모든 에셋이 성공적으로 로드되었습니다.');
      return true;
    } catch (error) {
      console.error('에셋 로딩 중 오류:', error);
      return false;
    }
  }

  private createCardTextures(): CardTextures {
    const textures: CardTextures = {};

    // 카드 뒷면 텍스처
    textures['card_back'] = this.createCardBackTexture();

    // 각 카드의 앞면 텍스처 생성
    CONSTANTS.SUITS.forEach((suit) => {
      CONSTANTS.RANKS.forEach((rank) => {
        const key = `${rank}_${suit}`;
        textures[key] = this.createCardFrontTexture(rank, suit);
      });
    });

    // 빈 슬롯 텍스처
    textures['empty_slot'] = this.createEmptySlotTexture();

    return textures;
  }

  private createCardBackTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const width = CONSTANTS.CARD_WIDTH;
    const height = CONSTANTS.CARD_HEIGHT;
    const cornerRadius = 8;

    // 그림자 효과
    graphics.roundRect(2, 2, width - 2, height - 2, cornerRadius);
    graphics.fill({ color: 0x000000, alpha: 0.3 });

    // 메인 카드 배경 (그라데이션 효과)
    graphics.roundRect(0, 0, width, height, cornerRadius);
    graphics.fill({ color: 0x1a237e }); // 진한 파랑

    // 밝은 테두리
    graphics.roundRect(0, 0, width, height, cornerRadius);
    graphics.stroke({ color: 0x3949ab, width: 2 });

    // 내부 장식 프레임
    graphics.roundRect(6, 6, width - 12, height - 12, cornerRadius - 2);
    graphics.stroke({ color: 0x7986cb, width: 1 });

    // 중앙 패턴 - 다이아몬드 격자
    const centerX = width / 2;
    const centerY = height / 2;

    // 다이아몬드 패턴
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const x = 15 + i * 20;
        const y = 20 + j * 16;

        // 다이아몬드 모양
        graphics.moveTo(x, y - 4);
        graphics.lineTo(x + 4, y);
        graphics.lineTo(x, y + 4);
        graphics.lineTo(x - 4, y);
        graphics.lineTo(x, y - 4);
        graphics.fill({ color: 0x9fa8da, alpha: 0.6 });
      }
    }

    // 중앙 로고/엠블럼
    graphics.circle(centerX, centerY, 12);
    graphics.fill({ color: 0xc5cae9, alpha: 0.8 });

    graphics.circle(centerX, centerY, 8);
    graphics.fill({ color: 0x3f51b5 });

    // 별 모양 중앙
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * 4;
      const y = centerY + Math.sin(angle) * 4;

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.fill({ color: 0xe8eaf6 });

    return this.app.renderer.generateTexture(graphics);
  }

  private createCardFrontTexture(rank: Rank, suit: Suit): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const width = CONSTANTS.CARD_WIDTH;
    const height = CONSTANTS.CARD_HEIGHT;
    const cornerRadius = 8;

    // 그림자 효과
    graphics.roundRect(2, 2, width - 2, height - 2, cornerRadius);
    graphics.fill({ color: 0x000000, alpha: 0.2 });

    // 메인 카드 배경 (흰색)
    graphics.roundRect(0, 0, width, height, cornerRadius);
    graphics.fill({ color: 0xffffff });

    // 카드 테두리 (그라데이션 효과)
    graphics.roundRect(0, 0, width, height, cornerRadius);
    graphics.stroke({ color: 0xe0e0e0, width: 2 });

    // 내부 프레임
    graphics.roundRect(3, 3, width - 6, height - 6, cornerRadius - 1);
    graphics.stroke({ color: 0xf5f5f5, width: 1 });

    // 수트 색상 결정
    const isRed = suit === 'hearts' || suit === 'diamonds';
    const color = isRed ? 0xd32f2f : 0x1a1a1a; // 진한 빨강 또는 검정

    // 수트 심볼 가져오기
    const suitSymbol = CONSTANTS.SUIT_SYMBOLS[suit];

    // 컨테이너 생성
    const container = new PIXI.Container();
    container.addChild(graphics);

    // 왼쪽 상단 랭크와 수트
    const topText = new PIXI.Text({
      text: rank,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        fill: color,
        fontWeight: 'bold',
      },
    });
    topText.position.set(5, 3);
    container.addChild(topText);

    const topSuit = new PIXI.Text({
      text: suitSymbol,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        fill: color,
        fontWeight: 'bold',
      },
    });
    topSuit.position.set(5, 14);
    container.addChild(topSuit);

    // 중앙 패턴 생성
    this.createCardCenterPattern(container, rank, suit, color, width, height);

    // 오른쪽 하단 (180도 회전된 랭크와 수트)
    const bottomText = new PIXI.Text({
      text: rank,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        fill: color,
        fontWeight: 'bold',
      },
    });
    bottomText.anchor.set(1, 1);
    bottomText.position.set(width - 5, height - 3);
    bottomText.rotation = Math.PI;
    container.addChild(bottomText);

    const bottomSuit = new PIXI.Text({
      text: suitSymbol,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        fill: color,
        fontWeight: 'bold',
      },
    });
    bottomSuit.anchor.set(1, 1);
    bottomSuit.position.set(width - 5, height - 14);
    bottomSuit.rotation = Math.PI;
    container.addChild(bottomSuit);

    return this.app.renderer.generateTexture(container);
  }

  // 카드 중앙 패턴 생성
  private createCardCenterPattern(
    container: PIXI.Container,
    rank: Rank,
    suit: Suit,
    color: number,
    width: number,
    height: number
  ): void {
    const suitSymbol = CONSTANTS.SUIT_SYMBOLS[suit];
    const centerX = width / 2;
    const centerY = height / 2;

    // 카드 값에 따른 패턴
    const value = this.getCardValue(rank);

    if (value >= 11) {
      // J, Q, K
      // 페이스 카드는 큰 수트 심볼과 문자
      const faceText = new PIXI.Text({
        text: rank,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 24,
          fill: color,
          fontWeight: 'bold',
        },
      });
      faceText.anchor.set(0.5);
      faceText.position.set(centerX, centerY - 8);
      container.addChild(faceText);

      const centerSuit = new PIXI.Text({
        text: suitSymbol,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 20,
          fill: color,
          fontWeight: 'bold',
        },
      });
      centerSuit.anchor.set(0.5);
      centerSuit.position.set(centerX, centerY + 10);
      container.addChild(centerSuit);
    } else if (value === 1) {
      // Ace
      const aceText = new PIXI.Text({
        text: suitSymbol,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 32,
          fill: color,
          fontWeight: 'bold',
        },
      });
      aceText.anchor.set(0.5);
      aceText.position.set(centerX, centerY);
      container.addChild(aceText);
    } else {
      // 숫자 카드 (2-10)
      this.createNumberCardPattern(
        container,
        value,
        suitSymbol,
        color,
        width,
        height
      );
    }
  }

  // 숫자 카드 패턴 생성
  private createNumberCardPattern(
    container: PIXI.Container,
    value: number,
    suitSymbol: string,
    color: number,
    width: number,
    height: number
  ): void {
    const positions = this.getCardSymbolPositions(value, width, height);

    positions.forEach((pos) => {
      const symbol = new PIXI.Text({
        text: suitSymbol,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 14,
          fill: color,
          fontWeight: 'bold',
        },
      });
      symbol.anchor.set(0.5);
      symbol.position.set(pos.x, pos.y);

      // 일부 심볼은 뒤집기
      if (pos.flip) {
        symbol.rotation = Math.PI;
      }

      container.addChild(symbol);
    });
  }

  // 카드 값에 따른 심볼 위치 반환
  private getCardSymbolPositions(value: number, width: number, height: number): SymbolPosition[] {
    const positions: SymbolPosition[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const topY = 25;
    const bottomY = height - 25;
    const leftX = width * 0.3;
    const rightX = width * 0.7;

    switch (value) {
      case 2:
        positions.push({ x: centerX, y: topY });
        positions.push({ x: centerX, y: bottomY, flip: true });
        break;
      case 3:
        positions.push({ x: centerX, y: topY });
        positions.push({ x: centerX, y: centerY });
        positions.push({ x: centerX, y: bottomY, flip: true });
        break;
      case 4:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 5:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: centerX, y: centerY });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 6:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: leftX, y: centerY });
        positions.push({ x: rightX, y: centerY });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 7:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: centerX, y: topY + 15 });
        positions.push({ x: leftX, y: centerY });
        positions.push({ x: rightX, y: centerY });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 8:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: centerX, y: topY + 12 });
        positions.push({ x: leftX, y: centerY });
        positions.push({ x: rightX, y: centerY });
        positions.push({ x: centerX, y: bottomY - 12, flip: true });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 9:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: leftX, y: topY + 18 });
        positions.push({ x: rightX, y: topY + 18 });
        positions.push({ x: centerX, y: centerY });
        positions.push({ x: leftX, y: bottomY - 18, flip: true });
        positions.push({ x: rightX, y: bottomY - 18, flip: true });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
      case 10:
        positions.push({ x: leftX, y: topY });
        positions.push({ x: rightX, y: topY });
        positions.push({ x: leftX, y: topY + 15 });
        positions.push({ x: rightX, y: topY + 15 });
        positions.push({ x: centerX, y: topY + 8 });
        positions.push({ x: centerX, y: bottomY - 8, flip: true });
        positions.push({ x: leftX, y: bottomY - 15, flip: true });
        positions.push({ x: rightX, y: bottomY - 15, flip: true });
        positions.push({ x: leftX, y: bottomY, flip: true });
        positions.push({ x: rightX, y: bottomY, flip: true });
        break;
    }

    return positions;
  }

  // 카드 값 반환 (내부 사용)
  private getCardValue(rank: Rank): number {
    if (rank === 'A') return 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank);
  }

  private createEmptySlotTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    const width = CONSTANTS.CARD_WIDTH;
    const height = CONSTANTS.CARD_HEIGHT;
    const cornerRadius = 8;

    // 투명한 배경
    graphics.roundRect(0, 0, width, height, cornerRadius);
    graphics.fill({ color: 0x000000, alpha: 0.1 });

    // 점선 테두리 (더 세련된 스타일)
    const dashLength = 4;
    const gapLength = 3;
    const perimeter = 2 * (width + height);
    const totalDashes = Math.floor(perimeter / (dashLength + gapLength));

    // 수동으로 점선 그리기
    graphics.lineStyle(2, CONSTANTS.COLORS.EMPTY_SLOT, 0.6);

    // 상단
    for (let x = 0; x < width; x += dashLength + gapLength) {
      graphics.moveTo(x, 0);
      graphics.lineTo(Math.min(x + dashLength, width), 0);
    }

    // 우측
    for (let y = 0; y < height; y += dashLength + gapLength) {
      graphics.moveTo(width, y);
      graphics.lineTo(width, Math.min(y + dashLength, height));
    }

    // 하단
    for (let x = width; x > 0; x -= dashLength + gapLength) {
      graphics.moveTo(x, height);
      graphics.lineTo(Math.max(x - dashLength, 0), height);
    }

    // 좌측
    for (let y = height; y > 0; y -= dashLength + gapLength) {
      graphics.moveTo(0, y);
      graphics.lineTo(0, Math.max(y - dashLength, 0));
    }

    // 중앙에 작은 아이콘 (카드 모양)
    const centerX = width / 2;
    const centerY = height / 2;
    const iconSize = 12;

    graphics.roundRect(
      centerX - iconSize / 2,
      centerY - iconSize / 2,
      iconSize,
      iconSize * 1.4,
      2
    );
    graphics.fill({ color: CONSTANTS.COLORS.EMPTY_SLOT, alpha: 0.3 });

    return this.app.renderer.generateTexture(graphics);
  }
}