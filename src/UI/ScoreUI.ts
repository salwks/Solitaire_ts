// PixiJS 솔리테어 - 점수 UI 관리 (TypeScript)

import { Utils } from "@/utils/Utils";
import type { GameState, GameInfo, DetailedStats } from "@/game/GameState";
import type { UIAnimation } from "@/utils/UIAnimation";
import type { GameStateEventDetail } from "@/types/global";

export interface UIElements {
  score: HTMLElement | null;
  timer: HTMLElement | null;
  gameInfo: HTMLElement | null;
}

export class ScoreUI {
  private gameState: GameState;
  private uiAnimation: UIAnimation | null;
  private elements: UIElements;
  private timerInterval: number | null = null;
  private lastScore: number = 0;

  constructor(gameState: GameState, uiAnimation: UIAnimation | null = null) {
    this.gameState = gameState;
    this.uiAnimation = uiAnimation;
    this.elements = this.getUIElements();

    this.setupEventListeners();
    this.startTimer();
  }

  private getUIElements(): UIElements {
    return {
      score: Utils.getElementById("score"),
      timer: Utils.getElementById("timer"),
      gameInfo: Utils.getElementById("gameInfo"),
    };
  }

  private setupEventListeners(): void {
    // 게임 상태 변경 시 UI 업데이트
    document.addEventListener("gameStateChanged", () => {
      this.updateAll();
    });
  }

  // 타이머 시작
  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = window.setInterval(() => {
      if (this.gameState.isPlaying()) {
        this.gameState.updateTime();
        this.updateTimer();
      }
    }, 1000);
  }

  // 타이머 중지
  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // 점수 업데이트
  public updateScore(): void {
    if (this.elements.score) {
      const newScore = this.gameState.score;

      // UI 애니메이션이 있으면 사용
      if (this.uiAnimation && newScore > this.lastScore) {
        this.uiAnimation.animateScoreIncrease(
          this.elements.score,
          this.lastScore,
          newScore
        );
      } else {
        this.elements.score.textContent = newScore.toLocaleString();
        this.animateScoreChange();
      }

      this.lastScore = newScore;
    }
  }

  // 타이머 업데이트
  public updateTimer(): void {
    if (this.elements.timer) {
      const formattedTime = Utils.formatTime(this.gameState.currentTime);
      this.elements.timer.textContent = formattedTime;

      // 게임이 너무 오래 걸리면 색상 변경
      if (this.gameState.currentTime > 600) {
        // 10분
        this.elements.timer.style.color = "#ff6b6b";
      } else if (this.gameState.currentTime > 300) {
        // 5분
        this.elements.timer.style.color = "#ffa726";
      } else {
        this.elements.timer.style.color = "white";
      }
    }
  }

  // 게임 정보 업데이트
  public updateGameInfo(): void {
    if (!this.elements.gameInfo) return;

    const info = this.gameState.getGameInfo();
    const stats = this.gameState.getDetailedStats();

    // 추가 정보 표시 (필요시)
    const additionalInfo = document.querySelector(
      ".additional-info"
    ) as HTMLElement;
    if (additionalInfo) {
      additionalInfo.innerHTML = `
                <div>이동: ${info.moves}</div>
                <div>진행률: ${(info.progress * 100).toFixed(1)}%</div>
            `;
    }
  }

  // 모든 UI 요소 업데이트
  public updateAll(): void {
    this.updateScore();
    this.updateTimer();
    this.updateGameInfo();
  }

  // 점수 변화 애니메이션
  private animateScoreChange(): void {
    if (!this.elements.score) return;

    this.elements.score.style.transform = "scale(1.2)";
    this.elements.score.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      if (this.elements.score) {
        this.elements.score.style.transform = "scale(1)";
      }
    }, 200);
  }

  // 게임 완료 UI 표시
  public showGameComplete(): void {
    const info = this.gameState.getGameInfo();
    const stats = this.gameState.getDetailedStats();

    // 게임 완료 모달 생성
    this.createGameCompleteModal(info, stats);

    // 점수 하이라이트
    this.highlightFinalScore();
  }

  // 게임 완료 모달 생성
  private createGameCompleteModal(info: GameInfo, stats: DetailedStats): void {
    // 기존 모달 제거
    const existingModal = document.querySelector(".game-complete-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "game-complete-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
        `;

    modalContent.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px;">🎉 축하합니다!</h2>
            <div style="color: #34495e; font-size: 18px; margin-bottom: 20px;">
                <div>최종 점수: <strong>${info.score.toLocaleString()}</strong></div>
                <div>소요 시간: <strong>${Utils.formatTime(
                  info.time
                )}</strong></div>
                <div>이동 횟수: <strong>${info.moves}</strong></div>
            </div>
            <div style="color: #7f8c8d; font-size: 14px; margin-bottom: 20px;">
                <div>승률: ${stats.winRate}%</div>
                <div>최고 점수: ${stats.bestScore.toLocaleString()}</div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="newGameFromModal" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">새 게임</button>
                <button id="showStats" style="
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">통계 보기</button>
                <button id="closeModal" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">닫기</button>
            </div>
        `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 버튼 이벤트 리스너
    const newGameBtn = document.getElementById("newGameFromModal");
    const showStatsBtn = document.getElementById("showStats");
    const closeBtn = document.getElementById("closeModal");

    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => {
        modal.remove();
        window.location.reload(); // 새 게임 시작
      });
    }

    if (showStatsBtn) {
      showStatsBtn.addEventListener("click", () => {
        modal.remove();
        this.showStatsModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.remove();
      });
    }

    // 외부 클릭 시 닫기
    modal.addEventListener("click", (e: Event) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // 모달 애니메이션
    modalContent.style.transform = "scale(0.8)";
    modalContent.style.opacity = "0";

    setTimeout(() => {
      modalContent.style.transition = "all 0.3s ease";
      modalContent.style.transform = "scale(1)";
      modalContent.style.opacity = "1";
    }, 100);
  }

  // 최종 점수 하이라이트
  private highlightFinalScore(): void {
    if (!this.elements.score) return;

    let iteration = 0;
    const maxIterations = 6;

    const highlight = (): void => {
      if (iteration >= maxIterations) return;

      const isEven = iteration % 2 === 0;
      if (this.elements.score) {
        this.elements.score.style.background = isEven
          ? "#f1c40f"
          : "transparent";
        this.elements.score.style.color = isEven ? "#2c3e50" : "white";
        this.elements.score.style.padding = isEven ? "5px 10px" : "0";
        this.elements.score.style.borderRadius = isEven ? "6px" : "0";
        this.elements.score.style.transition = "all 0.3s ease";
      }

      iteration++;
      setTimeout(highlight, 500);
    };

    highlight();
  }

  // 통계 모달 표시
  public showStatsModal(): void {
    const stats = this.gameState.getDetailedStats();

    const modal = document.createElement("div");
    modal.className = "stats-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;

    modalContent.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">📊 게임 통계</h2>
            <div style="color: #34495e;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 15px; background: #ecf0f1; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">${
                          stats.gamesPlayed
                        }</div>
                        <div>총 게임 수</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #ecf0f1; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${
                          stats.gamesWon
                        }</div>
                        <div>승리한 게임</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #ecf0f1; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${
                          stats.winRate
                        }%</div>
                        <div>승률</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #ecf0f1; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${stats.bestScore.toLocaleString()}</div>
                        <div>최고 점수</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px;">⏱️ 시간 기록</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div>총 플레이 시간: <strong>${Utils.formatTime(
                          stats.totalTime
                        )}</strong></div>
                        <div>평균 플레이 시간: <strong>${Utils.formatTime(
                          stats.averageTime
                        )}</strong></div>
                        ${
                          stats.bestTime
                            ? `<div>최단 완주 시간: <strong>${Utils.formatTime(
                                stats.bestTime
                              )}</strong></div>`
                            : ""
                        }
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px;">🎯 게임 동작</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div>총 이동 횟수: <strong>${stats.totalMoves.toLocaleString()}</strong></div>
                        <div>평균 이동 횟수: <strong>${
                          stats.gamesPlayed > 0
                            ? Math.round(stats.totalMoves / stats.gamesPlayed)
                            : 0
                        }</strong></div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button id="resetStats" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">통계 초기화</button>
                <button id="closeStats" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">닫기</button>
            </div>
        `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 버튼 이벤트
    const resetBtn = document.getElementById("resetStats");
    const closeBtn = document.getElementById("closeStats");

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("정말로 모든 통계를 초기화하시겠습니까?")) {
          this.resetStats();
          modal.remove();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.remove();
      });
    }

    // 외부 클릭 시 닫기
    modal.addEventListener("click", (e: Event) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 통계 초기화
  private resetStats(): void {
    this.gameState.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalTime: 0,
      totalMoves: 0,
      bestTime: null,
      bestScore: 0,
    };

    this.gameState.saveStats();
    this.updateAll();
    console.log("통계가 초기화되었습니다.");
  }

  // 일시정지 오버레이 표시
  public showPauseOverlay(): void {
    let overlay = document.getElementById("pauseOverlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "pauseOverlay";
      overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 500;
                color: white;
                font-size: 24px;
                font-weight: bold;
            `;
      overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⏸️</div>
                    <div>게임 일시정지</div>
                    <div style="font-size: 16px; margin-top: 10px; opacity: 0.8;">
                        ESC를 누르거나 화면을 클릭하여 재개
                    </div>
                </div>
            `;

      overlay.addEventListener("click", () => {
        // 게임 재개는 GameController에서 처리
        document.dispatchEvent(
          new CustomEvent<GameStateEventDetail>("resumeGame", {
            detail: {
              isStarted: false,
              isCompleted: false,
              isPaused: false,
              score: 0,
              moves: 0,
              time: 0,
              foundationCards: 0,
              progress: 0,
              canUndo: false,
            },
          })
        );
      });

      document.body.appendChild(overlay);
    }

    overlay.style.display = "flex";
  }

  // 일시정지 오버레이 숨기기
  public hidePauseOverlay(): void {
    const overlay = document.getElementById("pauseOverlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  // 프로그레스 바 업데이트 (필요시)
  public updateProgressBar(): void {
    const progressBar = document.getElementById("progressBar") as HTMLElement;
    if (progressBar) {
      const progress = this.gameState.getProgress() * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  // 점수 증가 애니메이션 (UIAnimation이 없을 때)
  public animateScoreIncrease(
    element: HTMLElement,
    oldValue: number,
    newValue: number
  ): void {
    const duration = 1000; // 1초
    const startTime = performance.now();
    const difference = newValue - oldValue;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(oldValue + difference * progress);
      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 실시간 통계 업데이트
  public updateLiveStats(): void {
    const liveStatsElement = document.getElementById("liveStats");
    if (liveStatsElement) {
      const info = this.gameState.getGameInfo();
      liveStatsElement.innerHTML = `
                <div>이동: ${info.moves}</div>
                <div>Foundation: ${info.foundationCards}/52</div>
                <div>진행률: ${(info.progress * 100).toFixed(1)}%</div>
            `;
    }
  }

  // 기록 달성 알림
  public showRecord(type: "bestScore" | "bestTime"): void {
    const messages = {
      bestScore: "🎉 새로운 최고 점수 달성!",
      bestTime: "⚡ 새로운 최단 시간 기록!",
    };

    // 간단한 알림 표시
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
    notification.textContent = messages[type];

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 메모리 정리
  public destroy(): void {
    this.stopTimer();

    // 이벤트 리스너 제거
    document.removeEventListener("gameStateChanged", this.updateAll.bind(this));

    // 모달들 제거
    document
      .querySelectorAll(".game-complete-modal, .stats-modal")
      .forEach((modal) => {
        modal.remove();
      });

    // 오버레이 제거
    this.hidePauseOverlay();

    // 참조 정리
    this.elements = {
      score: null,
      timer: null,
      gameInfo: null,
    };
  }
}
