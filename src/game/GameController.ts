// PixiJS 솔리테어 - 게임 컨트롤러 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import { Deck } from "@/entities/Deck";
import { CardStack } from "@/entities/CardStack";
import { GameState } from "@/game/GameState";
import { GameLogic } from "@/game/GameLogic";
import { InputHandler } from "@/utils/InputHandler";
import { CardAnimation } from "@/utils/CardAnimation";
import { UIAnimation } from "@/utils/UIAnimation";
import { ScoreUI } from "@/UI/ScoreUI";
import { MenuUI } from "@/UI/MenuUI";
import { ToastUI } from "@/UI/ToastUI";
import type { GameBoard } from "@/UI/GameBoard";
import type { Card } from "@/entities/Card";
import type { CardData, GameStateEventDetail } from "@/types/global";

export interface DealResult {
  tableau: Card[][];
  stock: Card[];
}

export class GameController {
  private app: PIXI.Application;
  private gameBoard: GameBoard;

  // 게임 시스템들
  public readonly gameState: GameState;
  private gameLogic: GameLogic;
  private inputHandler: InputHandler;
  private cardAnimation: CardAnimation;
  private uiAnimation: UIAnimation;
  private scoreUI: ScoreUI;
  private menuUI: MenuUI;
  private toastUI: ToastUI | null = null;

  // 게임 요소들
  private deck: Deck | null = null;
  public readonly stockStack: CardStack;
  public readonly wasteStack: CardStack;
  public readonly foundationStacks: CardStack[];
  public readonly tableauStacks: CardStack[];

  // 상태
  private isInitialized: boolean = false;
  private currentHint: any = null;
  private gameMonitorInterval: number | null = null;

  constructor(app: PIXI.Application, gameBoard: GameBoard) {
    this.app = app;
    this.gameBoard = gameBoard;

    // 게임 시스템들
    this.gameState = new GameState();
    this.gameLogic = new GameLogic(this.gameState);
    this.inputHandler = new InputHandler(app, gameBoard);
    this.cardAnimation = new CardAnimation(app);
    this.uiAnimation = new UIAnimation(app);
    this.scoreUI = new ScoreUI(this.gameState, this.uiAnimation);
    this.menuUI = new MenuUI(this);

    // 게임 요소들 초기화
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const globalScale = Math.min(screenWidth / 1024, screenHeight / 720);

    // Stock & Waste 스택
    this.stockStack = new CardStack("stock", 0, globalScale);
    this.wasteStack = new CardStack("waste", 0, globalScale);

    // Foundation 스택들 (4개)
    this.foundationStacks = [];
    for (let i = 0; i < CONSTANTS.GAME.FOUNDATION_PILES; i++) {
      this.foundationStacks.push(new CardStack("foundation", i, globalScale));
    }

    // Tableau 스택들 (7개)
    this.tableauStacks = [];
    for (let i = 0; i < CONSTANTS.GAME.TABLEAU_COLUMNS; i++) {
      this.tableauStacks.push(new CardStack("tableau", i, globalScale));
    }

    this.init();
  }

  private async init(): Promise<void> {
    console.log("게임 컨트롤러 초기화 시작...");

    // 게임 스택들을 게임보드에 추가
    this.addStacksToGameBoard();

    // InputHandler에 GameController 참조 설정
    this.inputHandler.setGameController(this);

    // Stock 클릭 이벤트 리스너 추가
    this.setupStockClickListener();

    // 통계 로드
    this.gameState.loadStats();

    // UI 초기화
    this.scoreUI.updateAll();
    this.menuUI.init();

    // 게임 모니터링 시작
    this.startGameMonitoring();

    // 첫 게임 시작
    await this.newGame();

    this.isInitialized = true;
    console.log("게임 컨트롤러 초기화 완료");
  }

  private addStacksToGameBoard(): void {
    // 게임보드에 스택들 추가
    this.gameBoard.container.addChild(this.stockStack.container);
    this.gameBoard.container.addChild(this.wasteStack.container);

    this.foundationStacks.forEach((stack) => {
      this.gameBoard.container.addChild(stack.container);
    });

    this.tableauStacks.forEach((stack) => {
      this.gameBoard.container.addChild(stack.container);
    });
  }

  // Stock 클릭 이벤트 리스너 설정
  private setupStockClickListener(): void {
    window.addEventListener("cardstack_stockclicked", () => {
      this.handleStockClick();
    });
  }

  // 새 게임 시작
  public async newGame(): Promise<void> {
    console.log("새 게임 시작...");

    // 기존 게임 정리
    this.clearGame();

    // 저장된 게임 상태 삭제
    this.gameState.clearSavedGameState();
    this.clearSavedCardState();

    // 게임 상태 초기화
    this.gameState.reset();

    // 새 덱 생성 및 셔플
    this.deck = new Deck();
    this.deck.shuffle();

    // 카드 딜링
    const dealResult = this.deck.dealForSolitaire();

    // 카드들을 해당 스택에 배치
    await this.dealCards(dealResult);

    // 게임 시작
    this.gameState.startGame();

    // 힌트 초기화
    this.currentHint = null;

    // 초기 게임 막힘 확인 및 해결
    setTimeout(() => {
      this.checkAndResolveGameBlock();
    }, 1000);

    console.log("새 게임 시작 완료");
    this.dispatchGameStateChanged();
  }

  // 카드 딜링
  private async dealCards(dealResult: DealResult): Promise<void> {
    // Stock 카드들
    dealResult.stock.forEach((card) => {
      this.stockStack.addCard(card);
    });

    // Tableau 카드들
    dealResult.tableau.forEach((columnCards, columnIndex) => {
      columnCards.forEach((card) => {
        this.tableauStacks[columnIndex].addCard(card);
      });
    });
  }

  // 기존 게임 정리
  private clearGame(): void {
    // 기존 덱 정리
    if (this.deck) {
      this.deck.destroy();
      this.deck = null;
    }

    // 모든 스택에서 카드 제거
    [...this.getAllStacks()].forEach((stack) => {
      const cards = [...stack.cards];
      cards.forEach((card) => {
        stack.removeCard(card);
        card.destroy();
      });
    });

    // 힌트 제거
    this.clearHint();
  }

  // 모든 스택 반환
  public getAllStacks(): CardStack[] {
    return [
      this.stockStack,
      this.wasteStack,
      ...this.foundationStacks,
      ...this.tableauStacks,
    ];
  }

  // 모든 스택들의 스케일 업데이트 (고정 스케일 사용)
  public updateStacksScale(scale: number): void {
    try {
      // 고정 스케일 사용 - 리사이즈 시 스케일 변경하지 않음
      console.log(`[updateStacksScale] 스케일 변경 요청 무시: ${scale}`);

      // 게임이 일시정지된 상태라면 재개
      if (this.gameState.isPaused) {
        this.gameState.isPaused = false;
        console.log("게임 일시정지 해제");
      }
    } catch (error) {
      console.error("스케일 업데이트 중 오류:", error);
    }
  }

  // 게임 상태 안전성 검사
  public checkGameIntegrity(): boolean {
    try {
      if (!this.gameState || !this.gameState.isPlaying()) {
        console.warn("게임 상태가 유효하지 않습니다.");
        return false;
      }

      // 모든 스택이 유효한지 확인
      const allStacks = this.getAllStacks();
      for (const stack of allStacks) {
        if (!stack || !stack.container) {
          console.warn("유효하지 않은 스택 발견:", stack);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("게임 무결성 검사 중 오류:", error);
      return false;
    }
  }

  // 게임 복구
  public recoverGame(): void {
    try {
      console.log("게임 복구 시도...");

      // 게임 상태 재설정
      if (this.gameState.isPaused) {
        this.gameState.isPaused = false;
      }

      // 모든 스택 위치 재조정
      this.repositionAllStacks();

      console.log("게임 복구 완료");
    } catch (error) {
      console.error("게임 복구 중 오류:", error);
    }
  }

  // 모든 스택 위치 재조정
  private repositionAllStacks(): void {
    try {
      const allStacks = this.getAllStacks();
      allStacks.forEach((stack) => {
        if (stack && stack.updatePosition) {
          stack.updatePosition();
        }
      });
    } catch (error) {
      console.error("스택 위치 재조정 중 오류:", error);
    }
  }

  // Stock 클릭 처리
  public handleStockClick(): void {
    if (!this.gameState.isPlaying()) return;

    // Stock 클릭 피드백
    this.stockStack.onStockClick();

    const wasStockEmpty = this.stockStack.isEmpty();
    const drawnCards = this.gameLogic.drawFromStock(
      this.stockStack,
      this.wasteStack
    );

    if (drawnCards.length > 0) {
      if (wasStockEmpty) {
        // 재활용 애니메이션 (Waste에서 Stock으로)
        this.animateStockRecycle(drawnCards);
      } else {
        // 일반 카드 뽑기 애니메이션
        this.animateStockDraw(drawnCards);
      }
    } else {
      // Stock과 Waste가 모두 비어있을 때 피드백
      if (this.stockStack.isEmpty() && this.wasteStack.isEmpty()) {
        if (this.toastUI) {
          this.toastUI.show("더 이상 뽑을 카드가 없어요!", 5000);
        }
      }
    }

    // 게임 막힘 확인 및 해결 시도
    this.checkAndResolveGameBlock();

    this.dispatchGameStateChanged();
  }

  // Stock 카드 뽑기 애니메이션
  private async animateStockDraw(drawnCards: Card[]): Promise<void> {
    for (const card of drawnCards) {
      await this.cardAnimation.animateCardMove(
        card,
        card.container.x,
        card.container.y,
        CONSTANTS.ANIMATION.DURATION * 0.5
      );
    }
  }

  // Stock 재활용 애니메이션
  private async animateStockRecycle(cards: Card[]): Promise<void> {
    // 재활용된 카드들이 Stock으로 이동하는 애니메이션
    for (const card of cards) {
      await this.cardAnimation.animateCardMove(
        card,
        card.container.x,
        card.container.y,
        CONSTANTS.ANIMATION.DURATION * 0.3
      );
    }
  }

  // 단일 카드 이동 처리
  public handleCardMove(
    card: Card,
    fromStack: CardStack,
    toStack: CardStack
  ): boolean {
    if (!this.gameState.isPlaying()) return false;

    if (this.gameLogic.executeSingleCardMove(card, fromStack, toStack)) {
      // 성공적인 이동
      this.onSuccessfulMove(card, toStack);
      return true;
    } else {
      // 실패한 이동
      this.onFailedMove(card);
      return false;
    }
  }

  // 다중 카드 이동 처리
  public handleMultiCardMove(
    cards: Card[],
    fromStack: CardStack,
    toStack: CardStack
  ): boolean {
    if (!this.gameState.isPlaying()) return false;

    if (this.gameLogic.executeMultiCardMove(cards, fromStack, toStack)) {
      // 성공적인 이동
      this.onSuccessfulMove(cards[0], toStack);
      return true;
    } else {
      // 실패한 이동
      this.onFailedMove(cards[0]);
      return false;
    }
  }

  // 카드 뒤집기 처리
  public onCardFlipped(card: Card): void {
    // 점수 업데이트
    this.gameState.updateScore();

    // 이동 기록
    this.gameState.recordMove({
      type: "card_flip",
      card: card.toString(),
    });

    this.dispatchGameStateChanged();
  }

  // 성공적인 이동 처리
  private async onSuccessfulMove(
    card: Card,
    toStack: CardStack
  ): Promise<void> {
    // 점수 업데이트
    if (toStack.type === "foundation") {
      this.gameState.addToFoundation(card);
    }

    // 게임 완료 확인
    if (this.gameLogic.isGameComplete(this.foundationStacks)) {
      this.onGameComplete();
    }

    this.dispatchGameStateChanged();
  }

  // 게임 막힘 확인 및 해결 (사용자에게 알림만)
  private checkAndResolveGameBlock(): void {
    const allStacks = this.getAllStacks();

    if (this.gameLogic.isGameBlocked(allStacks)) {
      console.log("게임이 막혔습니다.");

      if (this.toastUI) {
        this.toastUI.show(
          "게임이 막혔어요! 힌트를 사용하거나 새 게임을 시작해보세요.",
          5000
        );
      }
    }
  }

  // 실패한 이동 처리
  private async onFailedMove(card: Card): Promise<void> {
    // 무효한 이동 애니메이션
    await this.cardAnimation.animateInvalidMove(card);
  }

  // 게임 완료 처리
  private async onGameComplete(): Promise<void> {
    console.log("게임 완료!");

    // 게임 모니터링 중지
    this.stopGameMonitoring();

    // 승리 애니메이션
    await this.uiAnimation.animateVictory(this.foundationStacks);

    // 게임 상태 업데이트
    this.gameState.completeGame();

    // 저장된 게임 상태 삭제
    this.gameState.clearSavedGameState();
    this.clearSavedCardState();

    // 완료 UI 표시
    this.scoreUI.showGameComplete();
  }

  // 되돌리기
  public undoLastMove(): boolean {
    if (!this.gameState.canUndo()) return false;

    const lastMove = this.gameState.undoLastMove();
    if (lastMove) {
      // 실제 이동 되돌렸습니다.
      this.gameLogic.undoMove(lastMove);

      console.log("이동을 되돌렸습니다.");
      this.dispatchGameStateChanged();
      return true;
    }

    return false;
  }

  // 힌트 표시
  public showHint(): void {
    if (!this.gameState.isPlaying() || !this.gameState.settings.hintEnabled) {
      if (this.toastUI) {
        this.toastUI.show(
          "게임이 진행 중이 아니거나 힌트가 비활성화되어 있습니다.",
          5000
        );
      }
      return;
    }

    // 기존 힌트 제거
    this.clearHint();

    // 새 힌트 찾기
    const bestMove = this.gameLogic.suggestBestMove(this.getAllStacks());

    if (bestMove) {
      this.currentHint = bestMove;

      if (bestMove.type === "draw_stock") {
        // Stock 클릭 힌트
        const message = "💡 힌트: 카드 뭉치를 클릭해서 카드를 뽑아보세요!";
        console.log("힌트: Stock을 클릭하여 카드를 뽑으세요.");

        if (this.toastUI) {
          this.toastUI.show(message, 5000);
        }

        // Stock 스택 하이라이트
        this.stockStack.onDropZoneEnter();
        setTimeout(() => {
          this.stockStack.onDropZoneLeave();
        }, 2000);
      } else if (bestMove.type === "recycle_waste") {
        // Waste 재활용 힌트
        const message =
          "💡 힌트: 카드 뭉치를 클릭해서 버린 카드들을 다시 사용해보세요!";
        console.log("힌트: Stock을 클릭하여 Waste를 재활용하세요.");

        if (this.toastUI) {
          this.toastUI.show(message, 5000);
        }

        // Stock 스택 하이라이트
        this.stockStack.onDropZoneEnter();
        setTimeout(() => {
          this.stockStack.onDropZoneLeave();
        }, 2000);
      } else if (bestMove.card) {
        // 카드 이동 힌트
        this.cardAnimation.animateHint(bestMove.card);

        // 친근한 메시지로 변환
        let targetName = "";
        if (bestMove.toStack?.type === "foundation") {
          targetName = "위쪽 정리 영역";
        } else if (bestMove.toStack?.type === "tableau") {
          targetName = "아래쪽 카드 줄";
        } else if (bestMove.toStack?.type === "waste") {
          targetName = "버린 카드 영역";
        }

        const message = `💡 힌트: ${bestMove.card.toString()}를 ${targetName}으로 옮겨보세요!`;
        console.log(message);

        if (this.toastUI) {
          this.toastUI.show(message, 5000);
        }
      }
    } else {
      // 힌트가 없을 때 (게임 막힘)
      const message =
        "💡 지금은 할 수 있는 이동이 없어요. 카드 뭉치를 클릭해보세요!";
      console.log("사용 가능한 힌트가 없습니다.");

      if (this.toastUI) {
        this.toastUI.show(message, 5000);
      }
    }
  }

  // 힌트 제거
  private clearHint(): void {
    if (this.currentHint) {
      // 힌트 애니메이션 중지
      if (this.currentHint.card) {
        this.currentHint.card.container.tint = 0xffffff;
      }
      this.currentHint = null;
    }
  }

  // 자동 완성
  public autoComplete(): boolean {
    if (!this.gameState.settings.autoComplete || !this.gameState.isPlaying()) {
      return false;
    }

    const executed = this.gameLogic.executeAutoComplete(this.getAllStacks());

    if (executed) {
      console.log("자동 완성이 실행되었습니다.");
      this.dispatchGameStateChanged();
    }

    return executed;
  }

  // 더블클릭한 카드를 Foundation으로 이동
  public handleCardDoubleClick(card: Card): boolean {
    if (!this.gameState.isPlaying()) {
      return false;
    }

    console.log(`카드 ${card.toString()} 더블클릭 - Foundation으로 이동 시도`);

    const fromStack = card.currentStack;
    if (!fromStack) {
      console.log("카드가 스택에 없습니다.");
      return false;
    }

    // Foundation 스택 중에서 이동 가능한 곳 찾기
    for (const foundationStack of this.foundationStacks) {
      if (this.gameLogic.validateMove(card, fromStack, foundationStack)) {
        console.log(`Foundation ${foundationStack.index}로 이동 시도`);
        const success = this.handleCardMove(card, fromStack, foundationStack);
        if (success) {
          console.log(`카드 ${card.toString()}가 Foundation으로 이동됨`);
          return true;
        }
      }
    }

    console.log(`카드 ${card.toString()}를 Foundation으로 이동할 수 없습니다.`);
    return false;
  }

  // 게임 일시정지/재개
  public togglePause(): void {
    this.gameState.togglePause();

    if (this.gameState.isPaused) {
      this.scoreUI.showPauseOverlay();
      this.inputHandler.setEnabled(false);
    } else {
      this.scoreUI.hidePauseOverlay();
      this.inputHandler.setEnabled(true);
    }

    this.dispatchGameStateChanged();
  }

  // 게임 재시작 (같은 덱으로)
  public restartGame(): void {
    if (this.deck) {
      // 덱을 원래 순서로 리셋
      this.deck.reset();

      // 기존 게임 정리
      this.clearGame();

      // 같은 덱으로 다시 딜링
      this.deck.shuffle(); // 같은 패턴을 원하면 이 라인 제거
      const dealResult = this.deck.dealForSolitaire();
      this.dealCards(dealResult);

      // 게임 상태 초기화
      this.gameState.reset();
      this.gameState.startGame();

      this.dispatchGameStateChanged();
    }
  }

  // 게임 상태 변경 이벤트 발생
  private dispatchGameStateChanged(): void {
    const event = new CustomEvent("gameStateChanged", {
      detail: this.gameState.getGameInfo(),
    } as CustomEventInit<GameStateEventDetail>);
    document.dispatchEvent(event);
  }

  // 게임 정보 반환
  public getGameInfo(): {
    gameState: any;
    stats: any;
    stacks: any[];
    hints: number;
  } {
    return {
      gameState: this.gameState.getGameInfo(),
      stats: this.gameState.getDetailedStats(),
      stacks: this.getAllStacks().map((stack) => stack.getInfo()),
      hints: this.gameLogic.findHints(this.getAllStacks()).length,
    };
  }

  // 디버그 정보
  public debug(): void {
    console.log("=== 게임 컨트롤러 상태 ===");
    console.log("초기화됨:", this.isInitialized);
    this.gameState.debug();

    console.log("스택 정보:");
    this.getAllStacks().forEach((stack) => {
      console.log(`${stack.type}:`, stack.getInfo());
    });

    const analysis = this.gameLogic.analyzeGame(this.getAllStacks());
    console.log("게임 분석:", analysis);
    console.log("======================");
  }

  // 메모리 정리
  public destroy(): void {
    // 게임 모니터링 중지
    this.stopGameMonitoring();

    if (this.inputHandler) {
      this.inputHandler.destroy();
    }

    if (this.cardAnimation) {
      this.cardAnimation.destroy();
    }

    if (this.uiAnimation) {
      this.uiAnimation.destroy();
    }

    if (this.scoreUI) {
      this.scoreUI.destroy();
    }

    if (this.menuUI) {
      this.menuUI.destroy();
    }

    // 게임 스택들 정리
    this.getAllStacks().forEach((stack) => {
      if (stack && stack.destroy) {
        stack.destroy();
      }
    });

    console.log("게임 컨트롤러 정리 완료");
  }

  // 토스트 UI 설정
  public setToastUI(toastUI: ToastUI): void {
    this.toastUI = toastUI;
  }

  // 카드 상태 저장
  public saveCardState(): SavedCardState | null {
    if (!this.gameState.isGameStarted || this.gameState.isGameCompleted)
      return null;

    const cardState: SavedCardState = {
      stock: this.stockStack.cards.map((card) => ({
        suit: card.suit,
        rank: card.rank,
        faceUp: card.faceUp,
      })),
      waste: this.wasteStack.cards.map((card) => ({
        suit: card.suit,
        rank: card.rank,
        faceUp: card.faceUp,
      })),
      foundations: this.foundationStacks.map((stack) =>
        stack.cards.map((card) => ({
          suit: card.suit,
          rank: card.rank,
          faceUp: card.faceUp,
        }))
      ),
      tableaus: this.tableauStacks.map((stack) =>
        stack.cards.map((card) => ({
          suit: card.suit,
          rank: card.rank,
          faceUp: card.faceUp,
        }))
      ),
    };

    try {
      localStorage.setItem("solitaire_card_state", JSON.stringify(cardState));
      console.log("카드 상태가 저장되었습니다.");
      return cardState;
    } catch (error) {
      console.error("카드 상태 저장 실패:", error);
      return null;
    }
  }

  // 카드 상태 복원
  public async restoreCardState(): Promise<boolean> {
    try {
      const savedCardState = localStorage.getItem("solitaire_card_state");
      if (!savedCardState) return false;

      const cardState: SavedCardState = JSON.parse(savedCardState);

      // 기존 카드들 정리
      this.clearGame();

      // 새 덱 생성
      this.deck = new Deck();

      // 저장된 카드 상태로 덱 재구성
      // Stock 카드들
      cardState.stock.forEach((cardInfo) => {
        const card = this.deck!.findCard(cardInfo.suit, cardInfo.rank);
        if (card) {
          card.faceUp = cardInfo.faceUp ?? false;
          this.stockStack.addCard(card);
        }
      });

      // Waste 카드들
      cardState.waste.forEach((cardInfo) => {
        const card = this.deck!.findCard(cardInfo.suit, cardInfo.rank);
        if (card) {
          card.faceUp = cardInfo.faceUp ?? false;
          this.wasteStack.addCard(card);
        }
      });

      // Foundation 카드들
      cardState.foundations.forEach((foundationCards, index) => {
        foundationCards.forEach((cardInfo) => {
          const card = this.deck!.findCard(cardInfo.suit, cardInfo.rank);
          if (card) {
            card.faceUp = cardInfo.faceUp ?? false;
            this.foundationStacks[index].addCard(card);
          }
        });
      });

      // Tableau 카드들
      cardState.tableaus.forEach((tableauCards, index) => {
        tableauCards.forEach((cardInfo) => {
          const card = this.deck!.findCard(cardInfo.suit, cardInfo.rank);
          if (card) {
            card.faceUp = cardInfo.faceUp ?? false;
            this.tableauStacks[index].addCard(card);
          }
        });
      });

      // 모든 스택의 카드 위치 업데이트
      this.getAllStacks().forEach((stack) => {
        if (stack && stack.updateAllCardPositions) {
          stack.updateAllCardPositions();
        }
      });

      console.log("카드 상태가 복원되었습니다.");
      return true;
    } catch (error) {
      console.error("카드 상태 복원 실패:", error);
      localStorage.removeItem("solitaire_card_state");
      return false;
    }
  }

  // 저장된 카드 상태 삭제
  private clearSavedCardState(): void {
    try {
      localStorage.removeItem("solitaire_card_state");
      console.log("저장된 카드 상태가 삭제되었습니다.");
    } catch (error) {
      console.error("카드 상태 삭제 실패:", error);
    }
  }

  // 주기적 게임 상태 확인 (게임 막힘 방지)
  private startGameMonitoring(): void {
    // 10초마다 게임 상태만 확인 (자동 해결 없음)
    this.gameMonitorInterval = window.setInterval(() => {
      if (this.gameState.isPlaying()) {
        // 게임 상태 확인만 (자동 해결 없음)
        const isBlocked = this.gameLogic.isGameBlocked(this.getAllStacks());
        if (isBlocked) {
          console.log("게임이 막혔습니다. 사용자가 직접 해결해야 합니다.");
        }
      }
    }, 10000);
  }

  // 게임 모니터링 중지
  private stopGameMonitoring(): void {
    if (this.gameMonitorInterval) {
      clearInterval(this.gameMonitorInterval);
      this.gameMonitorInterval = null;
    }
  }
}

// 저장된 카드 상태 인터페이스
interface SavedCardState {
  stock: CardData[];
  waste: CardData[];
  foundations: CardData[][];
  tableaus: CardData[][];
}
