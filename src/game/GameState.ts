// PixiJS 솔리테어 - 게임 상태 관리 (TypeScript)

import { CONSTANTS } from "@/core/Constants";
import { Utils } from "@/utils/Utils";
import type { MoveData, GameStats, GameSettings } from "@/types/global";
import type { Card } from "@/entities/Card";

export interface GameInfo {
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

export interface DetailedStats extends GameStats {
  winRate: string;
  averageTime: number;
  currentStreak: number;
}

export class GameState {
  // 게임 기본 정보
  public isGameStarted: boolean = false;
  public isGameCompleted: boolean = false;
  public isPaused: boolean = false;

  // 시간 관리
  public startTime: number | null = null;
  public currentTime: number = 0;
  private pausedTime: number = 0;
  private pauseStartTime: number | null = null;

  // 점수 시스템
  public score: number = 0;
  public moves: number = 0;
  public foundationCards: number = 0;

  // 이동 기록 (되돌리기용)
  private moveHistory: MoveData[] = [];
  private readonly maxHistorySize: number = 100;

  // 통계
  public stats: GameStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalTime: 0,
    totalMoves: 0,
    bestTime: null,
    bestScore: 0,
  };

  // 게임 설정
  public settings: GameSettings = {
    drawCount: 3, // Stock에서 한 번에 뽑는 카드 수 (1 or 3)
    allowUndo: true,
    showTimer: true,
    autoComplete: true,
    hintEnabled: true,
  };

  constructor() {
    this.reset();
  }

  public reset(): void {
    // 게임 기본 정보
    this.isGameStarted = false;
    this.isGameCompleted = false;
    this.isPaused = false;

    // 시간 관리
    this.startTime = null;
    this.currentTime = 0;
    this.pausedTime = 0;
    this.pauseStartTime = null;

    // 점수 시스템
    this.score = 0;
    this.moves = 0;
    this.foundationCards = 0;

    // 이동 기록 초기화
    this.moveHistory = [];

    console.log("게임 상태가 초기화되었습니다.");
  }

  // 게임 시작
  public startGame(): void {
    if (this.isGameStarted) return;

    this.isGameStarted = true;
    this.startTime = Date.now();
    this.currentTime = 0;
    this.pausedTime = 0;

    console.log("게임이 시작되었습니다.");
    this.updateUI();
  }

  // 게임 완료
  public completeGame(): void {
    if (this.isGameCompleted) return;

    this.isGameCompleted = true;
    this.isGameStarted = false;

    // 최종 점수 계산
    this.score = Utils.calculateScore(
      this.moves,
      this.currentTime,
      this.foundationCards
    );

    // 통계 업데이트
    this.updateStats(true);

    console.log(
      `게임 완료! 점수: ${this.score}, 시간: ${Utils.formatTime(
        this.currentTime
      )}, 이동: ${this.moves}`
    );
    this.updateUI();
  }

  // 게임 일시정지/재개
  public togglePause(): void {
    if (!this.isGameStarted || this.isGameCompleted) return;

    if (this.isPaused) {
      // 재개
      this.isPaused = false;
      if (this.pauseStartTime !== null) {
        this.pausedTime += Date.now() - this.pauseStartTime;
        this.pauseStartTime = null;
      }
      console.log("게임 재개");
    } else {
      // 일시정지
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      console.log("게임 일시정지");
    }

    this.updateUI();
  }

  // 시간 업데이트
  public updateTime(): void {
    if (
      !this.isGameStarted ||
      this.isPaused ||
      this.isGameCompleted ||
      !this.startTime
    )
      return;

    const now = Date.now();
    this.currentTime = Math.floor(
      (now - this.startTime - this.pausedTime) / 1000
    );
    this.updateUI();
  }

  // 이동 기록
  public recordMove(
    moveData: Omit<MoveData, "timestamp" | "moveNumber">
  ): void {
    if (!this.isGameStarted) return;

    this.moves++;

    // 이동 히스토리에 추가
    this.moveHistory.push({
      ...moveData,
      timestamp: Date.now(),
      moveNumber: this.moves,
    });

    // 히스토리 크기 제한
    if (this.moveHistory.length > this.maxHistorySize) {
      this.moveHistory.shift();
    }

    console.log(`이동 ${this.moves}: ${moveData.type}`);
    this.updateUI();
  }

  // 되돌리기
  public undoLastMove(): MoveData | null {
    if (!this.settings.allowUndo || this.moveHistory.length === 0) {
      console.log("되돌릴 수 있는 이동이 없습니다.");
      return null;
    }

    const lastMove = this.moveHistory.pop();
    if (lastMove) {
      this.moves = Math.max(0, this.moves - 1);
      console.log(`이동 되돌리기: ${lastMove.type}`);
      this.updateUI();
      return lastMove;
    }

    return null;
  }

  // Foundation에 카드 추가
  public addToFoundation(card: { toString(): string }): boolean {
    this.foundationCards++;

    // Foundation 완성 체크 (13장)
    if (this.foundationCards === CONSTANTS.GAME.TOTAL_CARDS) {
      this.completeGame();
      return true; // 게임 완료
    }

    this.updateScore();
    return false; // 게임 계속
  }

  // Foundation에서 카드 제거
  public removeFromFoundation(card: { toString(): string }): void {
    this.foundationCards = Math.max(0, this.foundationCards - 1);
    this.updateScore();
  }

  // 점수 업데이트
  public updateScore(): void {
    if (!this.isGameStarted) return;

    this.score = Utils.calculateScore(
      this.moves,
      this.currentTime,
      this.foundationCards
    );
    this.updateUI();
  }

  // 통계 업데이트
  private updateStats(gameWon: boolean = false): void {
    this.stats.gamesPlayed++;
    this.stats.totalTime += this.currentTime;
    this.stats.totalMoves += this.moves;

    if (gameWon) {
      this.stats.gamesWon++;

      // 최고 기록 업데이트
      if (!this.stats.bestTime || this.currentTime < this.stats.bestTime) {
        this.stats.bestTime = this.currentTime;
      }

      if (this.score > this.stats.bestScore) {
        this.stats.bestScore = this.score;
      }
    }

    // 로컬 스토리지에 저장
    this.saveStats();
  }

  // 통계 저장
  public saveStats(): void {
    try {
      Utils.saveToStorage("solitaire_stats", this.stats);
      Utils.saveToStorage("solitaire_settings", this.settings);
    } catch (error) {
      console.warn("통계 저장 실패:", error);
    }
  }

  // 통계 로드
  public loadStats(): void {
    try {
      const savedStats = Utils.loadFromStorage<GameStats>("solitaire_stats");
      if (savedStats) {
        this.stats = { ...this.stats, ...savedStats };
      }

      const savedSettings =
        Utils.loadFromStorage<GameSettings>("solitaire_settings");
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }

      console.log("저장된 통계를 불러왔습니다.");
    } catch (error) {
      console.warn("통계 로드 실패:", error);
    }
  }

  // UI 업데이트
  private updateUI(): void {
    // 점수 업데이트
    const scoreElement = Utils.getElementById("score");
    if (scoreElement) {
      scoreElement.textContent = this.score.toString();
    }

    // 시간 업데이트
    const timerElement = Utils.getElementById("timer");
    if (timerElement && this.settings.showTimer) {
      timerElement.textContent = Utils.formatTime(this.currentTime);
    }

    // 되돌리기 버튼 상태
    const undoButton = Utils.getElementById("undoBtn") as HTMLButtonElement;
    if (undoButton) {
      undoButton.disabled = !this.canUndo();
    }
  }

  // 게임 상태 확인 메서드들
  public canUndo(): boolean {
    return (
      this.settings.allowUndo &&
      this.moveHistory.length > 0 &&
      this.isGameStarted &&
      !this.isGameCompleted
    );
  }

  public isPlaying(): boolean {
    return this.isGameStarted && !this.isPaused && !this.isGameCompleted;
  }

  public getProgress(): number {
    return this.foundationCards / CONSTANTS.GAME.TOTAL_CARDS;
  }

  public getWinRate(): string {
    return this.stats.gamesPlayed > 0
      ? ((this.stats.gamesWon / this.stats.gamesPlayed) * 100).toFixed(1)
      : "0";
  }

  public getAverageTime(): number {
    return this.stats.gamesWon > 0
      ? Math.floor(this.stats.totalTime / this.stats.gamesWon)
      : 0;
  }

  // 설정 변경
  public updateSetting<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ): void {
    this.settings[key] = value;
    this.saveStats();
    console.log(`설정 변경: ${key} = ${value}`);
  }

  // 게임 상태 정보 반환
  public getGameInfo(): GameInfo {
    return {
      isStarted: this.isGameStarted,
      isCompleted: this.isGameCompleted,
      isPaused: this.isPaused,
      score: this.score,
      moves: this.moves,
      time: this.currentTime,
      foundationCards: this.foundationCards,
      progress: this.getProgress(),
      canUndo: this.canUndo(),
    };
  }

  // 상세 통계 반환
  public getDetailedStats(): DetailedStats {
    return {
      ...this.stats,
      winRate: this.getWinRate(),
      averageTime: this.getAverageTime(),
      currentStreak: this.calculateCurrentStreak(),
    };
  }

  // 현재 연승 계산
  private calculateCurrentStreak(): number {
    // TODO: 연승 기록 구현
    return 0;
  }

  // 디버그 정보
  public debug(): void {
    console.log("=== 게임 상태 ===");
    console.log("진행중:", this.isPlaying());
    console.log("점수:", this.score);
    console.log("이동:", this.moves);
    console.log("시간:", Utils.formatTime(this.currentTime));
    console.log("Foundation 카드:", this.foundationCards);
    console.log("진행률:", (this.getProgress() * 100).toFixed(1) + "%");
    console.log("================");
  }

  // 게임 상태 저장
  public saveGameState(): SavedGameState | null {
    if (!this.isGameStarted || this.isGameCompleted) return null;

    const gameState: SavedGameState = {
      // 기본 게임 정보
      isGameStarted: this.isGameStarted,
      isGameCompleted: this.isGameCompleted,
      isPaused: this.isPaused,

      // 시간 정보
      startTime: this.startTime,
      currentTime: this.currentTime,
      pausedTime: this.pausedTime,
      pauseStartTime: this.pauseStartTime,

      // 게임 진행 정보
      score: this.score,
      moves: this.moves,
      foundationCards: this.foundationCards,

      // 이동 기록
      moveHistory: [...this.moveHistory],

      // 설정
      settings: { ...this.settings },

      // 저장 시간
      savedAt: Date.now(),
    };

    try {
      Utils.saveToStorage("solitaire_game_state", gameState);
      console.log("게임 상태가 저장되었습니다.");
      return gameState;
    } catch (error) {
      console.error("게임 상태 저장 실패:", error);
      return null;
    }
  }

  // 게임 상태 복원
  public loadGameState(): boolean {
    try {
      const savedState = Utils.loadFromStorage<SavedGameState>(
        "solitaire_game_state"
      );
      if (!savedState) return false;

      // 저장된 상태가 너무 오래된 경우 (24시간) 무시
      const now = Date.now();
      const savedAt = savedState.savedAt || 0;
      if (now - savedAt > 24 * 60 * 60 * 1000) {
        Utils.removeFromStorage("solitaire_game_state");
        return false;
      }

      // 상태 복원
      this.isGameStarted = savedState.isGameStarted;
      this.isGameCompleted = savedState.isGameCompleted;
      this.isPaused = savedState.isPaused;

      this.startTime = savedState.startTime;
      this.currentTime = savedState.currentTime;
      this.pausedTime = savedState.pausedTime;
      this.pauseStartTime = savedState.pauseStartTime;

      this.score = savedState.score;
      this.moves = savedState.moves;
      this.foundationCards = savedState.foundationCards;

      this.moveHistory = savedState.moveHistory || [];
      this.settings = { ...this.settings, ...savedState.settings };

      console.log("게임 상태가 복원되었습니다.");
      this.updateUI();
      return true;
    } catch (error) {
      console.error("게임 상태 복원 실패:", error);
      Utils.removeFromStorage("solitaire_game_state");
      return false;
    }
  }

  // 저장된 게임 상태 삭제
  public clearSavedGameState(): void {
    try {
      Utils.removeFromStorage("solitaire_game_state");
      console.log("저장된 게임 상태가 삭제되었습니다.");
    } catch (error) {
      console.error("게임 상태 삭제 실패:", error);
    }
  }

  // 저장된 게임이 있는지 확인
  public hasSavedGame(): boolean {
    try {
      const savedState = Utils.loadFromStorage<SavedGameState>(
        "solitaire_game_state"
      );
      if (!savedState) return false;

      const now = Date.now();
      const savedAt = savedState.savedAt || 0;

      // 24시간 이내의 저장된 게임만 유효
      return (
        now - savedAt <= 24 * 60 * 60 * 1000 &&
        savedState.isGameStarted &&
        !savedState.isGameCompleted
      );
    } catch (error) {
      return false;
    }
  }
}

// 저장된 게임 상태 인터페이스
interface SavedGameState {
  // 기본 게임 정보
  isGameStarted: boolean;
  isGameCompleted: boolean;
  isPaused: boolean;

  // 시간 정보
  startTime: number | null;
  currentTime: number;
  pausedTime: number;
  pauseStartTime: number | null;

  // 게임 진행 정보
  score: number;
  moves: number;
  foundationCards: number;

  // 이동 기록
  moveHistory: MoveData[];

  // 설정
  settings: GameSettings;

  // 저장 시간
  savedAt: number;
}
