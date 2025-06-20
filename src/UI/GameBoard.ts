// PixiJS 솔리테어 - 게임보드 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import type { GameController } from "@/game/GameController";

export class GameBoard {
  private app: PIXI.Application;
  public readonly container: PIXI.Container;

  // 게임 영역들
  private stockPile: PIXI.Container | null = null;
  private wastePile: PIXI.Container | null = null;
  private foundations: PIXI.Container[] = [];
  private tableaus: PIXI.Container[] = [];
  private initialized: boolean = false;

  // 게임 컨트롤러 참조
  private gameController: GameController | null = null;

  // 현재 화면 크기
  private screenWidth: number;
  private screenHeight: number;
  private scale: number;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // 현재 화면 크기
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.scale = Math.min(this.screenWidth / 1024, this.screenHeight / 720);
  }

  public async init(): Promise<void> {
    console.log("게임보드 초기화 시작...");

    this.setupBackground();
    this.setupGameAreas();
    this.setupCards();

    this.initialized = true;
    console.log("게임보드 초기화 완료");
  }

  private setupBackground(): void {
    // 기본 배경 - fullscreen
    const background = new PIXI.Graphics();
    background.rect(0, 0, this.screenWidth, this.screenHeight);
    background.fill({ color: CONSTANTS.COLORS.BACKGROUND });
    this.container.addChild(background);

    // 조명 효과 (그라데이션)
    this.addLightingGradient();

    // 테이블 질감 효과
    this.addTableTexture();

    // 카드 영역 표시를 위한 가이드라인
    this.drawCardSlots();
  }

  // 조명 그라데이션 효과 추가
  private addLightingGradient(): void {
    // 캔버스에 그라데이션 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("2D 컨텍스트를 생성할 수 없습니다.");
      return;
    }

    canvas.width = this.screenWidth;
    canvas.height = this.screenHeight;

    // 방사형 그라데이션 생성
    const gradient = ctx.createRadialGradient(
      this.screenWidth / 2,
      this.screenHeight / 2,
      0,
      this.screenWidth / 2,
      this.screenHeight / 2,
      Math.max(this.screenWidth, this.screenHeight) * 0.5
    );

    gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.08)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.03)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    // 그라데이션 그리기
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // 캔버스를 텍스처로 변환
    const texture = PIXI.Texture.from(canvas);
    const lighting = new PIXI.Sprite(texture);

    this.container.addChild(lighting);
  }

  // 테이블 질감 추가
  private addTableTexture(): void {
    const texture = new PIXI.Graphics();

    // 미세한 격자 패턴
    for (let x = 0; x < this.screenWidth; x += 20 * this.scale) {
      for (let y = 0; y < this.screenHeight; y += 20 * this.scale) {
        texture.circle(x, y, 0.5 * this.scale);
        texture.fill({ color: 0x1a6b54, alpha: 0.3 });
      }
    }

    // 나무 결 패턴
    for (let i = 0; i < 10; i++) {
      const y = (this.screenHeight / 10) * i;
      texture.moveTo(0, y);
      texture.lineTo(this.screenWidth, y + Math.sin(i) * 5 * this.scale);
      texture.stroke({ color: 0x0f4c3a, width: 1 * this.scale, alpha: 0.2 });
    }

    this.container.addChild(texture);
  }

  private drawCardSlots(): void {
    const margin = CONSTANTS.MARGIN * this.scale;
    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;
    const gap = 10 * this.scale;
    const cornerRadius = 8 * this.scale; // 카드와 동일한 모서리 둥글기

    // 패널을 그리는 함수
    const createSlot = (x: number, y: number): PIXI.Graphics => {
      const slot = new PIXI.Graphics();
      slot.roundRect(0, 0, cardWidth, cardHeight, cornerRadius);
      slot.fill({ color: CONSTANTS.COLORS.EMPTY_SLOT, alpha: 0.3 });
      slot.position.set(x, y);
      return slot;
    };

    // Stock Pile 위치 (좌하단)
    const stockSlot = createSlot(
      margin,
      this.screenHeight - margin - cardHeight
    );
    this.container.addChild(stockSlot);

    // Waste Pile 위치 (Stock 옆, 좌하단)
    const wasteSlot = createSlot(
      margin + cardWidth + gap,
      this.screenHeight - margin - cardHeight
    );
    this.container.addChild(wasteSlot);

    // Foundation 위치들 (우하단 4개)
    const foundationStartX = this.screenWidth - margin - (cardWidth + gap) * 4;
    for (let i = 0; i < CONSTANTS.GAME.FOUNDATION_PILES; i++) {
      const foundationSlot = createSlot(
        foundationStartX + i * (cardWidth + gap),
        this.screenHeight - margin - cardHeight
      );
      this.container.addChild(foundationSlot);
    }

    // Tableau 위치들 (상단 중앙 7개)
    const tableauTotalWidth = cardWidth * 7 + gap * 6;
    const tableauStartX = (this.screenWidth - tableauTotalWidth) / 2;
    const tableauStartY = margin;

    for (let i = 0; i < CONSTANTS.GAME.TABLEAU_COLUMNS; i++) {
      const tableauSlot = createSlot(
        tableauStartX + i * (cardWidth + gap),
        tableauStartY
      );
      this.container.addChild(tableauSlot);
    }
  }

  private setupGameAreas(): void {
    // 각 게임 영역 초기화 (나중에 CardStack 클래스로 대체)
    console.log("게임 영역 설정 완료");
  }

  private setupCards(): void {
    // 게임 컨트롤러가 카드를 관리하므로 더 이상 샘플 카드를 생성하지 않음
    console.log("게임보드 카드 영역 준비 완료");
  }

  // 게임 컨트롤러 설정
  public setGameController(gameController: GameController): void {
    this.gameController = gameController;
    console.log("게임 컨트롤러가 게임보드에 연결되었습니다.");
  }

  public newGame(): void {
    if (this.gameController) {
      this.gameController.newGame();
    } else {
      console.log("게임 컨트롤러가 연결되지 않았습니다.");
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  // 화면 크기 변경 시 호출
  public resize(width: number, height: number): void {
    try {
      // 유효한 크기인지 확인
      if (!width || !height || width < 800 || height < 600) {
        console.warn("유효하지 않은 화면 크기:", width, height);
        return;
      }

      console.log(`게임보드 리사이즈: ${width}x${height}`);

      this.screenWidth = width;
      this.screenHeight = height;
      this.scale = Math.min(width / 1024, height / 720);

      // 스케일이 너무 작거나 큰 경우 제한
      this.scale = Math.max(0.5, Math.min(this.scale, 2.0));

      // 기존 배경 제거
      if (this.container && this.container.children) {
        this.container.removeChildren();
      }

      // 새로운 배경 설정
      this.setupBackground();

      console.log(`게임보드 리사이즈 완료. 스케일: ${this.scale}`);
    } catch (error) {
      console.error("게임보드 리사이즈 중 오류:", error);
      // 에러 발생 시 기본값으로 복구
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      this.scale = Math.min(this.screenWidth / 1024, this.screenHeight / 720);
    }
  }

  // 현재 스케일 반환
  public getScale(): number {
    return this.scale;
  }

  // 화면 좌표를 게임보드 좌표로 변환
  public screenToBoard(screenPoint: PIXI.Point): PIXI.Point {
    return this.container.toLocal(screenPoint);
  }

  // 게임보드 좌표를 화면 좌표로 변환
  public boardToScreen(boardPoint: PIXI.Point): PIXI.Point {
    return this.container.toGlobal(boardPoint);
  }

  // 특정 영역이 화면에 보이는지 확인
  public isVisible(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    return !(
      x + width < 0 ||
      y + height < 0 ||
      x > this.screenWidth ||
      y > this.screenHeight
    );
  }

  // 게임보드 중앙 좌표 반환
  public getCenter(): PIXI.Point {
    return new PIXI.Point(this.screenWidth / 2, this.screenHeight / 2);
  }

  // 게임보드 경계 반환
  public getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(0, 0, this.screenWidth, this.screenHeight);
  }

  // 특정 위치에 시각적 효과 추가
  public addVisualEffect(
    x: number,
    y: number,
    type: "success" | "error" | "hint" = "success"
  ): void {
    const effect = new PIXI.Graphics();

    let color: number;
    switch (type) {
      case "success":
        color = 0x00ff00;
        break;
      case "error":
        color = 0xff0000;
        break;
      case "hint":
        color = 0xffff00;
        break;
    }

    effect.circle(0, 0, 20);
    effect.fill({ color, alpha: 0.7 });
    effect.position.set(x, y);

    this.container.addChild(effect);

    // 페이드 아웃 애니메이션
    let alpha = 0.7;
    let scale = 1;

    const animate = (): void => {
      alpha -= 0.02;
      scale += 0.05;

      effect.alpha = alpha;
      effect.scale.set(scale);

      if (alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(effect);
        effect.destroy();
      }
    };

    animate();
  }

  // 게임보드 스크린샷 생성
  public takeScreenshot(): string {
    try {
      const renderTexture = PIXI.RenderTexture.create({
        width: this.screenWidth,
        height: this.screenHeight,
      });

      this.app.renderer.render({
        container: this.container,
        target: renderTexture,
      });

      const canvas = this.app.renderer.extract.canvas(renderTexture);
      if (canvas && typeof canvas.toDataURL === "function") {
        const dataURL = canvas.toDataURL("image/png");
        renderTexture.destroy();
        return dataURL;
      }
      return "";
    } catch (error) {
      console.error("스크린샷 생성 실패:", error);
      return "";
    }
  }

  // 게임보드 정보 반환
  public getInfo(): {
    width: number;
    height: number;
    scale: number;
    initialized: boolean;
    childrenCount: number;
  } {
    return {
      width: this.screenWidth,
      height: this.screenHeight,
      scale: this.scale,
      initialized: this.initialized,
      childrenCount: this.container.children.length,
    };
  }

  // 디버그용 격자 표시
  public showDebugGrid(show: boolean = true): void {
    // 기존 디버그 격자 제거
    const existingGrid = this.container.getChildByName(
      "debugGrid"
    ) as PIXI.Graphics;
    if (existingGrid) {
      this.container.removeChild(existingGrid);
      existingGrid.destroy();
    }

    if (!show) return;

    const grid = new PIXI.Graphics();
    grid.name = "debugGrid";

    const gridSize = 50;
    const gridColor = 0xff0000;
    const gridAlpha = 0.3;

    // 세로선
    for (let x = 0; x <= this.screenWidth; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.screenHeight);
      grid.stroke({ color: gridColor, width: 1, alpha: gridAlpha });
    }

    // 가로선
    for (let y = 0; y <= this.screenHeight; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(this.screenWidth, y);
      grid.stroke({ color: gridColor, width: 1, alpha: gridAlpha });
    }

    this.container.addChild(grid);
  }

  // 메모리 정리
  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }

    this.container.destroy({ children: true });

    // 참조 정리
    this.stockPile = null;
    this.wastePile = null;
    this.foundations = [];
    this.tableaus = [];
    this.gameController = null;

    console.log("게임보드가 정리되었습니다.");
  }
}
