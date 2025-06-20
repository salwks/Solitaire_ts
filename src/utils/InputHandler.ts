// PixiJS 솔리테어 - 입력 처리 (TypeScript)

import * as PIXI from "pixi.js";
import type { GameController } from "@/game/GameController";
import type { GameBoard } from "@/UI/GameBoard";
import type { Card } from "@/entities/Card";
import type { CardStack } from "@/entities/CardStack";

export class InputHandler {
  private app: PIXI.Application;
  private gameBoard: GameBoard;
  private gameController: GameController | null = null;
  private enabled: boolean = true;

  // 드래그 상태
  private isDragging: boolean = false;
  private draggedCard: Card | null = null;
  private draggedCards: Card[] = [];
  private dragStartStack: CardStack | null = null;

  constructor(app: PIXI.Application, gameBoard: GameBoard) {
    this.app = app;
    this.gameBoard = gameBoard;

    this.setupEventListeners();
  }

  public setGameController(gameController: GameController): void {
    this.gameController = gameController;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancelDrag();
    }
  }

  private setupEventListeners(): void {
    // 카드 드래그 시작
    document.addEventListener("carddragstart", (e: CustomEvent) => {
      if (!this.enabled) return;
      this.handleCardDragStart(e);
    });

    // 카드 드래그 중
    document.addEventListener("carddragmove", (e: CustomEvent) => {
      if (!this.enabled) return;
      this.handleCardDragMove(e);
    });

    // 카드 드래그 종료
    document.addEventListener("carddragend", (e: CustomEvent) => {
      if (!this.enabled) return;
      this.handleCardDragEnd(e);
    });

    // 카드 더블클릭 (자동 이동)
    document.addEventListener("carddoubleclick", (e: CustomEvent) => {
      if (!this.enabled) return;
      this.handleCardDoubleClick(e);
    });

    // Stock 클릭
    document.addEventListener("cardstockclicked", (e: CustomEvent) => {
      if (!this.enabled) return;
      this.handleStockClick(e);
    });
  }

  private handleCardDragStart(event: CustomEvent): void {
    const { card } = event.detail;
    if (!card || !this.gameController) return;

    this.isDragging = true;
    this.draggedCard = card;
    this.dragStartStack = card.currentStack;

    // 다중 카드 드래그 (Tableau에서만)
    if (card.currentStack?.type === "tableau") {
      this.draggedCards = card.currentStack.getCardsFromIndex(card.stackIndex);
    } else {
      this.draggedCards = [card];
    }

    console.log(`드래그 시작: ${this.draggedCards.length}장의 카드`);
  }

  private handleCardDragMove(event: CustomEvent): void {
    if (!this.isDragging || !this.enabled) return;
    // 드래그 중 시각적 피드백은 Card 클래스에서 처리
  }

  private handleCardDragEnd(event: CustomEvent): void {
    if (!this.isDragging || !this.enabled || !this.gameController) return;

    const { event: pointerEvent } = event.detail;
    const targetStack = this.findTargetStack(pointerEvent);

    if (targetStack && this.dragStartStack && this.draggedCard) {
      // 이동 시도
      if (this.draggedCards.length > 1) {
        // 다중 카드 이동
        this.gameController.handleMultiCardMove(
          this.draggedCards,
          this.dragStartStack,
          targetStack
        );
      } else {
        // 단일 카드 이동
        this.gameController.handleCardMove(
          this.draggedCard,
          this.dragStartStack,
          targetStack
        );
      }
    }

    this.cancelDrag();
  }

  private handleCardDoubleClick(event: CustomEvent): void {
    const { card } = event.detail;
    if (!card || !this.gameController) return;

    // GameController의 더블클릭 처리 메서드 호출
    this.gameController.handleCardDoubleClick(card);
  }

  private handleStockClick(event: CustomEvent): void {
    if (!this.gameController) return;
    this.gameController.handleStockClick();
  }

  private findTargetStack(
    pointerEvent: PIXI.FederatedPointerEvent
  ): CardStack | null {
    if (!this.gameController) return null;

    const mousePos = pointerEvent.data.global;
    const allStacks = this.gameController.getAllStacks();

    // 마우스 위치에 있는 스택 찾기
    for (const stack of allStacks) {
      if (stack.containsPoint(mousePos)) {
        return stack;
      }
    }

    return null;
  }

  private cancelDrag(): void {
    this.isDragging = false;
    this.draggedCard = null;
    this.draggedCards = [];
    this.dragStartStack = null;
  }

  public destroy(): void {
    this.cancelDrag();
    this.enabled = false;
    // 이벤트 리스너는 document 레벨이므로 명시적 제거 불필요
  }
}
