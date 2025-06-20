// PixiJS 솔리테어 - 카드 클래스 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import type {
  Suit,
  Rank,
  Position,
  CardEventDetail,
  CardDragEventDetail,
} from "@/types/global";
import type { CardStack } from "@/entities/CardStack";

export class Card {
  public readonly suit: Suit;
  public readonly rank: Rank;
  public faceUp: boolean = false;
  public isDragging: boolean = false;
  public isSelected: boolean = false;
  public isDraggable: boolean = false;
  public isHovered: boolean = false;

  // 화면 크기에 맞는 스케일 계산
  private scale: number;

  // 드래그 관련 변수들
  private dragStart: PIXI.Point | null = null;
  private originalPosition: Position | null = null;
  private lastClickTime: number = 0;
  private readonly doubleClickDelay: number = 300;

  // 스택 관련 변수들
  public currentStack: CardStack | null = null;
  public stackIndex: number = -1;

  // 드래그 오프셋과 프록시들
  private dragOffset: Position | null = null;
  private dragProxies: PIXI.Container[] = [];

  // PixiJS 컨테이너와 스프라이트들
  public readonly container: PIXI.Container;
  private frontSprite: PIXI.Container | null = null;
  private backSprite: PIXI.Container | null = null;

  constructor(suit: Suit, rank: Rank) {
    this.suit = suit;
    this.rank = rank;

    // 화면 크기에 맞는 스케일 계산
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    this.scale = Math.min(screenWidth / 1024, screenHeight / 720);

    // 컨테이너 생성
    this.container = new PIXI.Container();

    this.createSprites();
    this.setupInteraction();
  }

  private createSprites(): void {
    // 앞면 스프라이트 생성
    this.frontSprite = this.createCardFront();
    this.frontSprite.visible = this.faceUp;
    this.container.addChild(this.frontSprite);

    // 뒷면 스프라이트 생성
    this.backSprite = this.createCardBack();
    this.backSprite.visible = !this.faceUp;
    this.container.addChild(this.backSprite);

    // 컨테이너 가시성 설정
    this.container.visible = true;
  }

  private createCardFront(): PIXI.Container {
    const cardContainer = new PIXI.Container();

    // 카드 크기
    const cardWidth = 70 * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight = 98 * CONSTANTS.CARD_SCALE * this.scale;

    // 그림자 효과
    const shadow = new PIXI.Graphics();
    shadow.rect(4, -4, cardWidth, cardHeight);
    shadow.fill({ color: 0x000000, alpha: 0.25 });

    // 그림자에 blur 효과 추가
    shadow.filters = [new PIXI.BlurFilter(2)];
    cardContainer.addChild(shadow);

    // 카드 배경 (둥근 모서리)
    const cardBackground = new PIXI.Graphics();
    cardBackground.roundRect(0, 0, cardWidth, cardHeight, 6);
    cardBackground.fill({ color: 0xffffff });
    cardBackground.stroke({ color: 0x000000, width: 2 });
    cardContainer.addChild(cardBackground);

    // 카드 색상 결정
    const cardColor = this.isRed() ? 0xff0000 : 0x000000;

    // 카드 크기에 따른 폰트 크기 계산
    const fontSize = Math.max(12, Math.floor(14 * this.scale));
    const smallFontSize = Math.max(8, Math.floor(10 * this.scale));

    // 여백 설정
    const margin = Math.max(3, Math.floor(4 * this.scale));

    // 왼쪽 상단 숫자와 문양
    const topLeftText = new PIXI.Text({
      text: this.rank,
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: fontSize,
        fill: cardColor,
        fontWeight: "bold",
      },
    });
    topLeftText.x = margin;
    topLeftText.y = margin;
    cardContainer.addChild(topLeftText);

    const topLeftSuit = new PIXI.Text({
      text: this.getSuitSymbol(),
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: smallFontSize,
        fill: cardColor,
      },
    });
    topLeftSuit.x = margin;
    topLeftSuit.y = topLeftText.y + fontSize + 1;
    cardContainer.addChild(topLeftSuit);

    // 오른쪽 하단 숫자와 문양 (180도 회전)
    const bottomRightText = new PIXI.Text({
      text: this.rank,
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: fontSize,
        fill: cardColor,
        fontWeight: "bold",
      },
    });
    bottomRightText.anchor.set(0.5, 0.5);
    bottomRightText.x = cardWidth - margin - fontSize / 2;
    bottomRightText.y = cardHeight - margin - fontSize / 2;
    bottomRightText.rotation = Math.PI;
    cardContainer.addChild(bottomRightText);

    const bottomRightSuit = new PIXI.Text({
      text: this.getSuitSymbol(),
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: smallFontSize,
        fill: cardColor,
      },
    });
    bottomRightSuit.anchor.set(0.5, 0.5);
    bottomRightSuit.x = cardWidth - margin - fontSize / 2;
    bottomRightSuit.y = cardHeight - margin - fontSize - smallFontSize / 2;
    bottomRightSuit.rotation = Math.PI;
    cardContainer.addChild(bottomRightSuit);

    // 중앙 문양 (큰 크기)
    const centerSuit = new PIXI.Text({
      text: this.getSuitSymbol(),
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: fontSize * 1.8,
        fill: cardColor,
      },
    });
    centerSuit.anchor.set(0.5, 0.5);
    centerSuit.x = cardWidth / 2;
    centerSuit.y = cardHeight / 2;
    cardContainer.addChild(centerSuit);

    return cardContainer;
  }

  private createCardBack(): PIXI.Container {
    const cardContainer = new PIXI.Container();

    // 카드 크기
    const cardWidth = 70 * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight = 98 * CONSTANTS.CARD_SCALE * this.scale;

    // 그림자 효과
    const shadow = new PIXI.Graphics();
    shadow.rect(4, -4, cardWidth, cardHeight);
    shadow.fill({ color: 0x000000, alpha: 0.25 });

    // 그림자에 blur 효과 추가
    shadow.filters = [new PIXI.BlurFilter(2)];
    cardContainer.addChild(shadow);

    // 카드 배경 (둥근 모서리)
    const cardBackground = new PIXI.Graphics();
    cardBackground.roundRect(0, 0, cardWidth, cardHeight, 6);
    cardBackground.fill({ color: 0xffffff });
    cardBackground.stroke({ color: 0x000000, width: 2 });
    cardContainer.addChild(cardBackground);

    // 보라색 영역 (마진 적용)
    const purpleArea = new PIXI.Graphics();
    purpleArea.roundRect(4, 4, cardWidth - 8, cardHeight - 8, 4);
    purpleArea.fill({ color: 0x800080 });
    cardContainer.addChild(purpleArea);

    return cardContainer;
  }

  private getSuitSymbol(): string {
    return CONSTANTS.SUIT_SYMBOLS[this.suit];
  }

  private setupInteraction(): void {
    this.container.interactive = true;
    this.container.cursor = "grab";

    // 마우스 이벤트 리스너
    this.container.on("pointerdown", this.onPointerDown.bind(this));
    this.container.on("pointermove", this.onPointerMove.bind(this));
    this.container.on("pointerup", this.onPointerUp.bind(this));
    this.container.on("pointerupoutside", this.onPointerUp.bind(this));
    this.container.on("pointerover", this.onHover.bind(this));
    this.container.on("pointerout", this.onHoverOut.bind(this));
    this.container.on("dblclick", this.onDoubleClick.bind(this));
  }

  public flip(faceUp?: boolean): void {
    if (faceUp !== undefined) {
      this.faceUp = faceUp;
    } else {
      this.faceUp = !this.faceUp;
    }

    if (this.frontSprite && this.backSprite) {
      this.frontSprite.visible = this.faceUp;
      this.backSprite.visible = !this.faceUp;
    }

    // 카드가 뒤집힐 때 드래그 가능 상태 업데이트
    if (this.currentStack) {
      this.currentStack.updateAllCardsDraggable();
    }

    console.log(
      `카드 ${this.toString()} ${this.faceUp ? "앞면" : "뒷면"}으로 뒤집힘`
    );
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      // 선택된 카드 강조 - 틴트만 사용
      this.container.tint = 0xffff99;
    } else {
      this.container.tint = 0xffffff;
    }
  }

  public setDraggable(draggable: boolean): void {
    this.isDraggable = draggable;

    if (draggable && this.faceUp) {
      this.container.cursor = "grab";
    } else {
      this.container.cursor = this.faceUp ? "pointer" : "default";
    }
  }

  private onHover(): void {
    if (this.faceUp && !this.isDragging && !this.isSelected) {
      this.isHovered = true;
    }
  }

  private onHoverOut(): void {
    if (!this.isDragging && !this.isSelected) {
      this.isHovered = false;

      // 원래 위치로 복원
      if (this.currentStack) {
        this.updatePosition();
      }
    }
  }

  public setPosition(x: number, y: number): void {
    if (!this.container) {
      console.warn("카드 컨테이너가 없습니다:", this.toString());
      return;
    }

    try {
      this.container.x = x;
      this.container.y = y;
    } catch (error) {
      console.warn("카드 위치 설정 실패:", error, this.toString());
    }
  }

  public setScale(scale: number): void {
    this.scale = scale;
    this.container.scale.set(scale);
  }

  public getPosition(): Position {
    return { x: this.container.x, y: this.container.y };
  }

  public updatePosition(): void {
    if (this.currentStack) {
      this.currentStack.updateCardPosition(this);
    }
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    // 더블클릭 확인
    const currentTime = Date.now();
    const isDoubleClick =
      currentTime - this.lastClickTime < this.doubleClickDelay;
    this.lastClickTime = currentTime;

    if (isDoubleClick) {
      this.onDoubleClick();
      return;
    }

    // Stock 카드 클릭 처리
    if (this.currentStack?.type === "stock") {
      this.handleStockClick();
      return;
    }

    // 뒷면 카드 클릭 시 뒤집기 (Tableau 맨 위 카드만)
    if (!this.faceUp && this.canFlip()) {
      this.flip(true);
      this.dispatchEvent("cardflipped", { card: this });
      return;
    }

    // 드래그 시작
    if (this.faceUp && this.isDraggable) {
      this.startDrag(event);
    }
  }

  private handleStockClick(): void {
    this.dispatchEvent("stockclicked", { card: this });
  }

  private canFlip(): boolean {
    if (!this.currentStack || this.currentStack.type !== "tableau") {
      return false;
    }
    // Tableau의 맨 위 카드만 뒤집기 가능
    return this.currentStack.getTopCard() === this;
  }

  private startDrag(event: PIXI.FederatedPointerEvent): void {
    console.log(`[startDrag] 시작`);
    this.isDragging = true;

    // 클릭 위치와 카드의 글로벌 좌표 오프셋 계산
    const mousePos = event.data.global;
    console.log(`[startDrag] 마우스 위치:`, mousePos);

    let cardGlobal: Position;
    try {
      const globalPoint = this.container.parent?.toGlobal(
        new PIXI.Point(this.container.x, this.container.y)
      );
      cardGlobal = globalPoint
        ? { x: globalPoint.x, y: globalPoint.y }
        : { x: this.container.x, y: this.container.y };
      console.log(`[startDrag] cardGlobal 계산 성공:`, cardGlobal);
    } catch (error) {
      console.error(`[startDrag] cardGlobal 계산 실패:`, error);
      cardGlobal = { x: this.container.x, y: this.container.y };
    }

    this.dragOffset = {
      x: mousePos.x - cardGlobal.x,
      y: mousePos.y - cardGlobal.y,
    };
    this.dragStart = mousePos.clone();
    this.originalPosition = { x: cardGlobal.x, y: cardGlobal.y };

    // 드래그할 카드들 결정 (Tableau에서는 연속된 카드들)
    let draggedCards: Card[] = [this];
    if (this.currentStack?.type === "tableau") {
      draggedCards = this.currentStack.getCardsFromIndex(this.stackIndex);
      console.log(
        `[startDrag] Tableau에서 ${draggedCards.length}장의 카드 드래그:`,
        draggedCards.map((c) => c.toString())
      );
    }

    // 모든 드래그할 카드들을 숨기고 프록시 생성
    this.dragProxies = [];

    // 먼저 모든 원본 카드를 숨기기
    draggedCards.forEach((card) => {
      card.container.visible = false;
    });

    // 그 다음 모든 프록시를 순서대로 생성
    draggedCards.forEach((card, index) => {
      const proxy = this.createCardProxy(
        card,
        cardGlobal.x,
        cardGlobal.y + index * CONSTANTS.STACK_OFFSET_Y * this.scale,
        index === 0 // 첫 번째 프록시에만 이벤트 리스너 추가
      );
      this.dragProxies.push(proxy);
    });

    console.log(`[startDrag] ${this.dragProxies.length}개의 프록시 생성됨`);

    // 드래그 시작 시각적 효과
    if (this.dragProxies[0]) {
      this.dragProxies[0].cursor = "grabbing";
      this.dragProxies[0].alpha = 1;

      // 최상단으로 이동
      if (this.dragProxies[0].parent) {
        this.dragProxies[0].parent.setChildIndex(
          this.dragProxies[0],
          this.dragProxies[0].parent.children.length - 1
        );
      }
    }

    // 드래그 시작 이벤트 발생
    this.dispatchEvent("dragstart", {
      card: this,
      cards: draggedCards,
      event: event,
    });

    console.log(
      `[startDrag] 카드 글로벌 좌표:`,
      cardGlobal,
      "마우스:",
      mousePos,
      "오프셋:",
      this.dragOffset
    );
  }

  private createCardProxy(
    card: Card,
    globalX: number,
    globalY: number,
    isFirst: boolean = false
  ): PIXI.Container {
    console.log(
      `[createCardProxy] 프록시 생성:`,
      card.toString(),
      "위치:",
      globalX,
      globalY
    );

    const proxy = new PIXI.Container();

    // 카드 앞면 또는 뒷면 복사
    if (card.faceUp && card.frontSprite) {
      const frontCopy = card.createCardFront();
      proxy.addChild(frontCopy);
    } else if (card.backSprite) {
      const backCopy = card.createCardBack();
      proxy.addChild(backCopy);
    }

    // stage 기준 좌표로 위치
    proxy.x = globalX;
    proxy.y = globalY;

    // 레이어 순서 제어
    proxy.zIndex = 9999 + this.dragProxies.length;

    // 첫 번째 프록시에만 마우스 이벤트 리스너 추가
    if (isFirst) {
      proxy.interactive = true;
      proxy.cursor = "grabbing";
      proxy.on("pointermove", this.onPointerMove.bind(this));
      proxy.on("pointerup", this.onPointerUp.bind(this));
      proxy.on("pointerupoutside", this.onPointerUp.bind(this));
    }

    // stage에 추가
    if (window.PIXI_APP && window.PIXI_APP.stage) {
      window.PIXI_APP.stage.addChild(proxy);
    } else if (this.container.parent && this.container.parent.parent) {
      this.container.parent.parent.addChild(proxy);
    }

    return proxy;
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (
      this.isDragging &&
      this.dragProxies &&
      this.dragProxies.length > 0 &&
      this.dragOffset
    ) {
      const mousePos = event.data.global;

      // 모든 프록시를 함께 이동
      this.dragProxies.forEach((proxy, index) => {
        proxy.x = mousePos.x - this.dragOffset!.x;
        proxy.y =
          mousePos.y -
          this.dragOffset!.y +
          index * CONSTANTS.STACK_OFFSET_Y * this.scale;
      });

      console.log(
        `[onPointerMove] ${this.dragProxies.length}개 프록시 이동:`,
        this.dragProxies[0].x,
        this.dragProxies[0].y,
        "마우스:",
        mousePos,
        "오프셋:",
        this.dragOffset
      );

      this.dispatchEvent("dragmove", {
        card: this,
        event: event,
        deltaX: this.dragStart ? mousePos.x - this.dragStart.x : 0,
        deltaY: this.dragStart ? mousePos.y - this.dragStart.y : 0,
      });
    }
  }

  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      console.log(`[onPointerUp] 드래그 종료`);
      this.isDragging = false;

      // 모든 프록시 제거
      if (this.dragProxies) {
        this.dragProxies.forEach((proxy) => {
          if (proxy.parent) {
            proxy.parent.removeChild(proxy);
          }
          proxy.destroy({ children: true });
        });
        this.dragProxies = [];
      }

      // 모든 원본 카드 다시 보이기
      if (this.currentStack?.type === "tableau") {
        const draggedCards = this.currentStack.getCardsFromIndex(
          this.stackIndex
        );
        draggedCards.forEach((card) => {
          card.container.visible = true;
        });
      } else {
        this.container.visible = true;
      }

      this.container.cursor = "grab";
      this.container.alpha = 1.0;
      this.dispatchEvent("dragend", { card: this, event: event });
      console.log(`카드 ${this.toString()} 드래그 종료`);
    }
  }

  private onDoubleClick(): void {
    if (this.faceUp) {
      this.dispatchEvent("doubleclick", { card: this });
      console.log(`카드 ${this.toString()} 더블클릭`);
    }
  }

  private dispatchEvent(
    eventType: string,
    data: CardEventDetail | CardDragEventDetail
  ): void {
    const event = new CustomEvent(`card${eventType}`, {
      detail: data,
    });
    document.dispatchEvent(event);
  }

  public toString(): string {
    return `${this.rank}_${this.suit}`;
  }

  public isRed(): boolean {
    return this.suit === "hearts" || this.suit === "diamonds";
  }

  public isBlack(): boolean {
    return this.suit === "clubs" || this.suit === "spades";
  }

  public getValue(): number {
    if (this.rank === "A") return 1;
    if (this.rank === "J") return 11;
    if (this.rank === "Q") return 12;
    if (this.rank === "K") return 13;
    return parseInt(this.rank);
  }

  public destroy(): void {
    // 이벤트 리스너 제거
    this.container.removeAllListeners();

    // 부모에서 제거
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }

    // 컨테이너 파괴
    this.container.destroy({ children: true });

    // 참조 정리
    this.frontSprite = null;
    this.backSprite = null;
    this.currentStack = null;
  }

  // 스프라이트 가시성 설정을 위한 public 메서드들
  public setFrontSpriteVisible(visible: boolean): void {
    if (this.frontSprite) {
      this.frontSprite.visible = visible;
    }
  }

  public setBackSpriteVisible(visible: boolean): void {
    if (this.backSprite) {
      this.backSprite.visible = visible;
    }
  }
}
