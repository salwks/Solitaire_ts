// PixiJS 솔리테어 - 메인 애플리케이션 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import { AssetLoader } from "@/core/AssetLoader";
import { GameBoard } from "@/UI/GameBoard";
import { GameController } from "@/game/GameController";
import { ToastUI } from "@/UI/ToastUI";

export class GameApplication {
  private app: PIXI.Application | null = null;
  private assetLoader: AssetLoader | null = null;
  private gameBoard: GameBoard | null = null;
  private gameController: GameController | null = null;
  private toastUI: ToastUI | null = null;
  private isLoaded: boolean = false;

  async init(): Promise<void> {
    try {
      console.log("PixiJS 솔리테어 게임 초기화 시작...");

      // 전역 에러 핸들러 설정
      this.setupGlobalErrorHandlers();

      // 화면 크기 가져오기
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // PixiJS 애플리케이션 생성
      this.app = new PIXI.Application();

      // v8 스타일 초기화 - fullscreen
      await this.app.init({
        width: screenWidth,
        height: screenHeight,
        backgroundColor: CONSTANTS.COLORS.BACKGROUND,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window, // 자동 resize 설정
      });

      // 전역 참조 설정
      window.PIXI_APP = this.app;

      // 캔버스를 DOM에 추가
      const gameContainer = document.getElementById("gameContainer");
      if (!gameContainer) {
        throw new Error("Game container not found");
      }

      gameContainer.appendChild(this.app.canvas);
      this.app.canvas.id = "gameCanvas";

      // 로딩 텍스트 업데이트
      this.updateLoadingText("에셋 로딩 중...");

      // 에셋 로더 초기화 및 로딩
      this.assetLoader = new AssetLoader(this.app);
      const assetsLoaded = await this.assetLoader.loadAssets();

      if (!assetsLoaded) {
        throw new Error("에셋 로딩 실패");
      }

      // 게임보드 초기화
      this.updateLoadingText("게임판 설정 중...");
      this.gameBoard = new GameBoard(this.app);
      await this.gameBoard.init();

      // 게임 컨트롤러 초기화
      this.updateLoadingText("게임 시스템 초기화 중...");
      this.gameController = new GameController(this.app, this.gameBoard);
      this.gameBoard.setGameController(this.gameController);

      // 토스트 UI 초기화
      this.toastUI = new ToastUI(this.app);
      this.gameController.setToastUI(this.toastUI);

      // UI 이벤트 설정
      this.setupUI();

      // Resize 이벤트 설정
      this.setupResizeHandler();

      // 로딩 완료
      this.hideLoading();

      this.isLoaded = true;
      console.log("PixiJS 솔리테어 게임이 성공적으로 로드되었습니다!");
    } catch (error) {
      console.error("게임 초기화 중 오류:", error);
      this.updateLoadingText(
        `로딩 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private updateLoadingText(text: string): void {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.textContent = text;
    }
  }

  private hideLoading(): void {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }

  private setupUI(): void {
    // 새 게임 버튼
    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => {
        if (this.gameController) {
          this.gameController.newGame();
        }
      });
    }

    // 되돌리기 버튼
    const undoBtn = document.getElementById("undoBtn");
    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        if (this.gameController) {
          this.gameController.undoLastMove();
        }
      });
    }

    // 힌트 버튼
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        if (this.gameController) {
          this.gameController.showHint();
        }
      });
    }
  }

  private setupResizeHandler(): void {
    let resizeTimeout: number;
    let isResizing = false;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    // 화면 크기 변경 시 게임보드와 카드 크기 조정
    window.addEventListener("resize", (): void => {
      try {
        if (!this.gameBoard || !this.gameController) {
          console.warn("게임 컴포넌트가 초기화되지 않았습니다.");
          return;
        }

        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        // 최소 크기 체크 (너무 작으면 무시)
        if (currentWidth < 800 || currentHeight < 600) {
          console.warn("화면 크기가 너무 작습니다. 리사이즈를 무시합니다.");
          return;
        }

        // 리사이즈 시작 시 게임 일시정지
        if (!isResizing) {
          isResizing = true;

          // 게임이 진행 중이면 일시정지
          if (this.gameController.gameState.isPlaying()) {
            this.gameController.gameState.isPaused = true;
            console.log("리사이즈 중: 게임 일시정지");
          }
        }

        // 기존 타이머 클리어
        clearTimeout(resizeTimeout);

        // 리사이즈 완료 후 실행할 작업
        resizeTimeout = window.setTimeout(() => {
          try {
            isResizing = false;

            // 크기 변화가 실제로 있는지 확인
            if (
              Math.abs(currentWidth - lastWidth) < 10 &&
              Math.abs(currentHeight - lastHeight) < 10
            ) {
              console.log("크기 변화가 미미하여 리사이즈를 건너뜁니다.");
              return;
            }

            lastWidth = currentWidth;
            lastHeight = currentHeight;

            console.log(`리사이즈 완료: ${currentWidth}x${currentHeight}`);

            // PixiJS 앱 리사이즈
            if (this.app && this.app.renderer) {
              this.app.renderer.resize(currentWidth, currentHeight);
            }

            // 게임보드 resize
            if (this.gameBoard && this.gameBoard.resize) {
              this.gameBoard.resize(currentWidth, currentHeight);
            }

            // 토스트 UI resize
            if (this.toastUI && this.toastUI.resize) {
              this.toastUI.resize(currentWidth, currentHeight);
            }

            // 게임 컨트롤러 복구
            if (this.gameController) {
              // 게임 무결성 검사
              if (!this.gameController.checkGameIntegrity()) {
                console.warn("게임 무결성 문제 발견, 복구 시도...");
                this.gameController.recoverGame();
              }

              // 게임 재개
              if (this.gameController.gameState.isPaused) {
                this.gameController.gameState.isPaused = false;
                console.log("리사이즈 완료: 게임 재개");
              }
            }
          } catch (error) {
            console.error("리사이즈 처리 중 오류:", error);
            // 에러 발생 시 게임 복구 시도
            if (this.gameController) {
              this.gameController.recoverGame();
            }
          }
        }, 500); // 500ms로 증가하여 더 안정적으로 처리
      } catch (error) {
        console.error("리사이즈 이벤트 처리 중 오류:", error);
        // 에러 발생 시 게임 재개
        if (this.gameController && this.gameController.gameState.isPaused) {
          this.gameController.gameState.isPaused = false;
        }
      }
    });

    // 페이지 가시성 변경 시 처리 (사이드바 등으로 인한 변화)
    document.addEventListener("visibilitychange", (): void => {
      if (
        !document.hidden &&
        this.gameController &&
        this.gameController.gameState.isPaused
      ) {
        // 페이지가 다시 보이면 게임 재개
        setTimeout(() => {
          if (this.gameController) {
            this.gameController.gameState.isPaused = false;
            console.log("페이지 가시성 복구: 게임 재개");
          }
        }, 100);
      }
    });

    // 윈도우 포커스 변경 시 처리
    window.addEventListener("focus", (): void => {
      if (this.gameController && this.gameController.gameState.isPaused) {
        setTimeout(() => {
          if (this.gameController) {
            this.gameController.gameState.isPaused = false;
            console.log("윈도우 포커스 복구: 게임 재개");
          }
        }, 100);
      }
    });
  }

  // 전역 에러 핸들러 설정
  private setupGlobalErrorHandlers(): void {
    // 전역 에러 핸들러
    window.addEventListener("error", (event: ErrorEvent): void => {
      console.error("전역 에러 발생:", event.error);
      this.handleGameError(event.error);
    });

    // Promise 에러 핸들러
    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent): void => {
        console.error("처리되지 않은 Promise 에러:", event.reason);
        this.handleGameError(event.reason);
      }
    );

    // PixiJS 에러 핸들러 - utils 제거
    // PIXI.utils.skipHello()는 최신 버전에서 더 이상 필요하지 않음
  }

  // 게임 에러 처리
  private handleGameError(error: any): void {
    try {
      console.error("게임 에러 처리 시작:", error);

      // 게임이 일시정지된 상태라면 재개
      if (this.gameController && this.gameController.gameState.isPaused) {
        this.gameController.gameState.isPaused = false;
        console.log("에러 복구: 게임 일시정지 해제");
      }

      // 게임 무결성 검사 및 복구
      if (this.gameController) {
        if (!this.gameController.checkGameIntegrity()) {
          console.warn("게임 무결성 문제 발견, 복구 시도...");
          this.gameController.recoverGame();
        }
      }

      // 토스트 메시지 표시
      if (this.toastUI) {
        this.toastUI.show(
          "게임 오류가 발생했습니다. 자동으로 복구를 시도합니다.",
          5000
        );
      }
    } catch (recoveryError) {
      console.error("에러 복구 중 추가 오류 발생:", recoveryError);
    }
  }

  // 게임 상태 확인
  public isReady(): boolean {
    return (
      this.isLoaded &&
      this.gameBoard !== null &&
      this.gameBoard.isInitialized() &&
      this.gameController !== null
    );
  }

  // 애플리케이션 정리
  public destroy(): void {
    if (this.gameController) {
      this.gameController.destroy();
    }
    if (this.app) {
      this.app.destroy(true, true);
    }
  }
}
