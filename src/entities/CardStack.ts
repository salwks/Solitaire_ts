// PixiJS 솔리테어 - 카드 스택 클래스 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import { Utils } from "@/utils/Utils";
import type { Card } from "@/entities/Card";
import type { StackType, Position } from "@/types/global";

export class CardStack {
  public readonly type: StackType;
  public readonly index: number;
  public readonly cards: Card[] = [];

  private scale: number;
  private originalScale: number;
  private isClickAnimating: boolean = false;

  public readonly container: PIXI.Container;
  public readonly position: Position;

  private dropZone!: PIXI.Graphics;
  private dropZoneAnimation: number | null = null;
  private emptyStockGraphic?: PIXI.Graphics;

  constructor(type: StackType, index: number = 0, scale: number = 1) {
    this.type = type;
    this.index = index;
    this.scale = scale;
    this.originalScale = type === "stock" ? 1 : scale;

    this.container = new PIXI.Container();

    // 스택 위치
    this.position = Utils.getStackPosition(type, index, this.scale);
    this.container.x = this.position.x;
    this.container.y = this.position.y;

    // 드롭존 설정
    this.setupDropZone();

    // Stock 스택에 클릭 이벤트 추가
    if (this.type === "stock") {
      this.setupStockClick();
    }
  }

  private setupDropZone(): void {
    // 드롭존 영역 (투명한 사각형)
    this.dropZone = new PIXI.Graphics();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau") {
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    } else {
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    }

    this.dropZone.fill({ color: 0x000000, alpha: 0 }); // 투명

    this.dropZone.interactive = true;
    this.dropZone.on("pointerover", this.onDropZoneEnter.bind(this));
    this.dropZone.on("pointerout", this.onDropZoneLeave.bind(this));

    this.container.addChild(this.dropZone);
  }

  private setupStockClick(): void {
    this.container.interactive = true;
    this.container.cursor = "pointer";

    this.container.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
      // Stock 클릭 이벤트 발생
      this.dispatchEvent("stockclicked", { event });
    });

    // 빈 Stock 표시 그래픽 생성
    this.createEmptyStockDisplay();
  }

  private createEmptyStockDisplay(): void {
    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // 빈 카드 배경
    this.emptyStockGraphic = new PIXI.Graphics();
    this.emptyStockGraphic.roundRect(0, 0, cardWidth, cardHeight, 6);
    this.emptyStockGraphic.fill({ color: 0x2c3e50, alpha: 0.3 });
    this.emptyStockGraphic.stroke({ color: 0x34495e, width: 2, alpha: 0.8 });

    // "덱" 텍스트
    const deckText = new PIXI.Text({
      text: "덱",
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: Math.max(12, Math.floor(14 * this.scale)),
        fill: 0x95a5a6,
        fontWeight: "bold",
      },
    });
    deckText.anchor.set(0.5, 0.5);
    deckText.x = cardWidth / 2;
    deckText.y = cardHeight / 2;
    this.emptyStockGraphic.addChild(deckText);

    this.container.addChild(this.emptyStockGraphic);
    this.updateEmptyStockVisibility();
  }

  private updateEmptyStockVisibility(): void {
    if (this.emptyStockGraphic) {
      this.emptyStockGraphic.visible = this.isEmpty();
    }
  }

  private dispatchEvent(eventType: string, data: any): void {
    const customEvent = new CustomEvent(`cardstack_${eventType}`, {
      detail: { stack: this, ...data },
    });
    window.dispatchEvent(customEvent);
  }

  public addCard(card: Card): void {
    if (!card || !card.container) {
      console.warn("유효하지 않은 카드입니다:", card);
      return;
    }

    this.cards.push(card);

    // 컨테이너가 유효한지 확인
    if (this.container && card.container) {
      this.container.addChild(card.container);

      // 카드가 보이도록 설정
      card.container.visible = true;
      card.setFrontSpriteVisible(card.faceUp);
      card.setBackSpriteVisible(!card.faceUp);
    }

    card.currentStack = this;
    card.stackIndex = this.cards.length - 1;

    // 카드 위치 업데이트 (안전하게)
    try {
      this.updateCardPosition(card);
    } catch (error) {
      console.warn("카드 위치 업데이트 실패:", error);
    }

    // 카드 드래그 가능 상태 설정
    this.updateCardDraggable(card);

    // Tableau의 경우 드롭존 크기 업데이트
    if (this.type === "tableau") {
      this.updateDropZoneSize();
    }

    // Stock의 빈 상태 표시 업데이트
    if (this.type === "stock") {
      this.updateEmptyStockVisibility();
    }

    console.log(`카드 ${card.toString()}가 ${this.type} 스택에 추가됨`);
  }

  private updateCardDraggable(card: Card): void {
    let draggable = false;

    switch (this.type) {
      case "tableau":
        // Tableau에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "waste":
        // Waste에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "foundation":
        // Foundation에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "stock":
        // Stock은 클릭만 가능, 드래그 불가
        draggable = false;
        break;
    }

    card.setDraggable(draggable);
  }

  public updateAllCardsDraggable(): void {
    this.cards.forEach((card) => {
      this.updateCardDraggable(card);
    });
  }

  public removeCard(card: Card): void {
    const index = this.cards.indexOf(card);
    if (index !== -1) {
      this.cards.splice(index, 1);
      this.container.removeChild(card.container);
      card.currentStack = null;
      card.stackIndex = -1;

      // 남은 카드들의 인덱스 업데이트
      this.updateAllCardPositions();

      // 남은 카드들의 드래그 가능 상태 업데이트
      this.updateAllCardsDraggable();

      // Tableau의 경우 드롭존 크기 업데이트
      if (this.type === "tableau") {
        this.updateDropZoneSize();
      }

      // Stock의 빈 상태 표시 업데이트
      if (this.type === "stock") {
        this.updateEmptyStockVisibility();
      }

      console.log(`카드 ${card.toString()}가 ${this.type} 스택에서 제거됨`);
    }
  }

  public getTopCard(): Card | null {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  public getCardCount(): number {
    return this.cards.length;
  }

  public isEmpty(): boolean {
    return this.cards.length === 0;
  }

  public getCardPosition(cardIndex: number): Position {
    let x = 0;
    let y = 0;

    switch (this.type) {
      case "stock":
      case "waste":
      case "foundation":
        // 이들은 같은 위치에 겹쳐서 배치
        x = 0;
        y = 0;
        break;

      case "tableau":
        // Tableau는 계단식으로 배치
        x = 0;
        y = cardIndex * CONSTANTS.STACK_OFFSET_Y * this.scale;
        break;
    }

    return { x, y };
  }

  public updateCardPosition(card: Card): void {
    const cardIndex = this.cards.indexOf(card);
    if (cardIndex === -1 || !card || !card.container) return;

    try {
      const position = this.getCardPosition(cardIndex);
      card.setPosition(position.x, position.y);
      card.stackIndex = cardIndex;
    } catch (error) {
      console.warn(`카드 ${card.toString()} 위치 설정 실패:`, error);
    }
  }

  public updateAllCardPositions(): void {
    this.cards.forEach((card, index) => {
      if (card && card.container) {
        try {
          card.stackIndex = index;
          this.updateCardPosition(card);
        } catch (error) {
          console.warn(`카드 ${card.toString()} 위치 업데이트 실패:`, error);
        }
      }
    });
  }

  public canAcceptCard(card: Card): boolean {
    switch (this.type) {
      case "foundation":
        return this.canPlaceOnFoundation(card);
      case "tableau":
        return this.canPlaceOnTableau(card);
      case "waste":
        return false; // Waste는 직접 카드를 받을 수 없음
      case "stock":
        return false; // Stock은 직접 카드를 받을 수 없음
      default:
        return false;
    }
  }

  private canPlaceOnFoundation(card: Card): boolean {
    if (this.isEmpty()) {
      return card.getValue() === 1; // 빈 Foundation에는 A만
    }

    const topCard = this.getTopCard();
    if (!topCard) return false;

    const isSameSuit = card.suit === topCard.suit;
    const isOneMore = card.getValue() === topCard.getValue() + 1;

    return isSameSuit && isOneMore;
  }

  private canPlaceOnTableau(card: Card): boolean {
    if (this.isEmpty()) {
      return card.getValue() === 13; // 빈 Tableau에는 King만
    }

    const topCard = this.getTopCard();
    if (!topCard) return false;

    // 뒷면 카드 위에는 올 수 없음
    if (!topCard.faceUp) return false;

    // 다른 색깔이고 1 작은 값이어야 함
    return (
      card.isRed() !== topCard.isRed() &&
      card.getValue() === topCard.getValue() - 1
    );
  }

  public moveCards(cards: Card[], targetStack: CardStack): boolean {
    if (!targetStack) return false;

    // 이동 가능한지 확인
    if (cards.length === 0) return false;
    const bottomCard = cards[0];
    if (!targetStack.canAcceptCard(bottomCard)) return false;

    // 카드들을 현재 스택에서 제거
    cards.forEach((card) => {
      this.removeCard(card);
    });

    // 타겟 스택에 카드들 추가
    cards.forEach((card) => {
      targetStack.addCard(card);
    });

    return true;
  }

  public getCardsFromIndex(startIndex: number): Card[] {
    if (startIndex < 0 || startIndex >= this.cards.length) {
      return [];
    }

    const cardsFromIndex = this.cards.slice(startIndex);

    // 연속된 유효한 카드들만 반환 (Tableau 규칙)
    if (this.type === "tableau") {
      return this.getValidSequence(cardsFromIndex);
    }

    return cardsFromIndex;
  }

  private getValidSequence(cards: Card[]): Card[] {
    if (cards.length <= 1) return cards;

    const validCards = [cards[0]];

    for (let i = 1; i < cards.length; i++) {
      const prevCard = cards[i - 1];
      const currCard = cards[i];

      // 모든 카드가 앞면이어야 함
      if (!prevCard.faceUp || !currCard.faceUp) break;

      // 색상이 번갈아가야 함
      if (prevCard.isRed() === currCard.isRed()) break;

      // 값이 연속적으로 감소해야 함
      if (prevCard.getValue() !== currCard.getValue() + 1) break;

      validCards.push(currCard);
    }

    return validCards;
  }

  public containsPoint(globalPoint: PIXI.Point): boolean {
    const localPoint = this.container.toLocal(globalPoint);

    // 기본 카드 크기
    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이 계산
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      return (
        localPoint.x >= 0 &&
        localPoint.x <= cardWidth &&
        localPoint.y >= 0 &&
        localPoint.y <= totalHeight
      );
    }

    // 다른 스택들은 단일 카드 크기
    return (
      localPoint.x >= 0 &&
      localPoint.x <= cardWidth &&
      localPoint.y >= 0 &&
      localPoint.y <= cardHeight
    );
  }

  public onDropZoneEnter(): void {
    // 유효한 드롭존임을 시각적으로 표시
    this.dropZone.clear();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      this.dropZone.roundRect(0, 0, cardWidth, totalHeight, 6 * this.scale);
    } else {
      this.dropZone.roundRect(0, 0, cardWidth, cardHeight, 6 * this.scale);
    }

    // 반투명 배경만 설정
    this.dropZone.fill({ color: CONSTANTS.COLORS.VALID_DROP, alpha: 0.1 });

    // 애니메이션 효과
    this.animateDropZone();
  }

  public onDropZoneLeave(): void {
    // 원래 상태로 되돌리기
    this.dropZone.clear();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      this.dropZone.rect(0, 0, cardWidth, totalHeight);
    } else {
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    }

    this.dropZone.fill({ color: 0x000000, alpha: 0 });

    // 애니메이션 중지
    this.stopDropZoneAnimation();
  }

  private animateDropZone(): void {
    if (this.dropZoneAnimation) return; // 이미 애니메이션 중

    let scale = 1;
    let growing = true;

    this.dropZoneAnimation = window.setInterval(() => {
      if (growing) {
        scale += 0.02;
        if (scale >= 1.1) growing = false;
      } else {
        scale -= 0.02;
        if (scale <= 1) growing = true;
      }

      this.dropZone.scale.set(scale);
    }, 50);
  }

  private stopDropZoneAnimation(): void {
    if (this.dropZoneAnimation) {
      clearInterval(this.dropZoneAnimation);
      this.dropZoneAnimation = null;
      this.dropZone.scale.set(1);
    }
  }

  private updateDropZoneSize(): void {
    if (this.type !== "tableau") return;

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    const totalHeight =
      cardHeight +
      (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

    this.dropZone.clear();
    this.dropZone.rect(0, 0, cardWidth, totalHeight);
    this.dropZone.fill({ color: 0x000000, alpha: 0 });
  }

  public setScale(scale: number): void {
    this.scale = scale;
    // Stock의 originalScale은 항상 1로 고정
    if (this.type !== "stock") {
      this.originalScale = scale;
    }
    this.updatePosition();
  }

  public updatePosition(): void {
    try {
      // 새로운 위치 계산
      this.position.x = Utils.getStackPosition(
        this.type,
        this.index,
        this.scale
      ).x;
      this.position.y = Utils.getStackPosition(
        this.type,
        this.index,
        this.scale
      ).y;

      // 컨테이너 위치 업데이트
      if (this.container) {
        this.container.x = this.position.x;
        this.container.y = this.position.y;
      }

      // 드롭존 크기 업데이트
      if (this.dropZone) {
        const cardWidth =
          CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
        const cardHeight =
          CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

        this.dropZone.clear();
        if (this.type === "tableau") {
          // Tableau의 경우 카드 그룹의 전체 길이로 설정
          const totalHeight =
            this.cards.length > 0
              ? cardHeight +
                (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale
              : cardHeight;
          this.dropZone.rect(0, 0, cardWidth, totalHeight);
        } else {
          this.dropZone.rect(0, 0, cardWidth, cardHeight);
        }
        this.dropZone.fill({ color: 0x000000, alpha: 0 });
      }

      // 빈 Stock 그래픽 업데이트
      if (this.type === "stock" && this.emptyStockGraphic) {
        const cardWidth =
          CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
        const cardHeight =
          CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

        this.emptyStockGraphic.clear();
        this.emptyStockGraphic.roundRect(0, 0, cardWidth, cardHeight, 6);
        this.emptyStockGraphic.fill({ color: 0x2c3e50, alpha: 0.3 });
        this.emptyStockGraphic.stroke({
          color: 0x34495e,
          width: 2,
          alpha: 0.8,
        });

        // 텍스트 크기도 업데이트
        const deckText = this.emptyStockGraphic.children[0] as PIXI.Text;
        if (deckText && deckText instanceof PIXI.Text) {
          deckText.style.fontSize = Math.max(12, Math.floor(14 * this.scale));
          deckText.x = cardWidth / 2;
          deckText.y = cardHeight / 2;
        }
      }

      // 모든 카드 위치 업데이트
      this.updateAllCardPositions();

      console.log(
        `${this.type} 스택 위치 업데이트 완료: (${this.position.x}, ${this.position.y})`
      );
    } catch (error) {
      console.error(`${this.type} 스택 위치 업데이트 중 오류:`, error);
    }
  }

  public onStockClick(): void {
    if (this.type !== "stock" || this.isClickAnimating) return;

    this.isClickAnimating = true;

    // 클릭 효과 애니메이션 - 항상 1→0.95→1로 고정
    this.container.scale.set(0.95);

    setTimeout(() => {
      this.container.scale.set(1);
      this.isClickAnimating = false;
    }, 150);

    // 클릭 사운드나 시각적 효과 추가 가능
    console.log("Stock 클릭됨");
  }

  public getInfo(): StackInfo {
    return {
      type: this.type,
      index: this.index,
      cardCount: this.cards.length,
      topCard: this.getTopCard()?.toString() || "none",
    };
  }

  public destroy(): void {
    this.stopDropZoneAnimation();

    this.cards.forEach((card) => card.destroy());
    this.cards.length = 0;

    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}

interface StackInfo {
  type: StackType;
  index: number;
  cardCount: number;
  topCard: string;
}
