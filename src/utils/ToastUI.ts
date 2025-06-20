// PixiJS 솔리테어 - 토스트 UI (TypeScript)

import * as PIXI from 'pixi.js';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  duration?: number;
  type?: ToastType;
  position?: 'top' | 'center' | 'bottom';
}

export class ToastUI {
  private app: PIXI.Application;
  private container: PIXI.Container;

  // 토스트 상태
  private isVisible: boolean = false;
  private currentToast: PIXI.Container | null = null;
  private hideTimeout: number | null = null;

  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  // 토스트 스타일
  private readonly styles = {
    info: { backgroundColor: 0x3498db, textColor: 0xffffff },
    success: { backgroundColor: 0x27ae60, textColor: 0xffffff },
    warning: { backgroundColor: 0xf39c12, textColor: 0xffffff },
    error: { backgroundColor: 0xe74c3c, textColor: 0xffffff },
  };

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // 화면 크기
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    // 최상위 레이어로 설정
    this.container.zIndex = 9999;
  }

  // 토스트 메시지 표시
  public show(message: string, duration: number = 3000, options: ToastOptions = {}): void {
    const { type = 'info', position = 'bottom' } = options;

    // 기존 토스트가 있으면 제거
    this.hide();

    // 토스트 컨테이너 생성
    const toastContainer = this.createToastContainer(message, type, position);

    // 애니메이션으로 표시
    this.showWithAnimation(toastContainer, position);

    // 자동 숨김 타이머 설정
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, duration);

    this.currentToast = toastContainer;
    this.isVisible = true;
  }

  // 토스트 컨테이너 생성
  private createToastContainer(message: string, type: ToastType, position: 'top' | 'center' | 'bottom'): PIXI.Container {
    const toastContainer = new PIXI.Container();

    // 텍스트 먼저 생성하여 크기 측정
    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fill: this.styles[type].textColor,
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: Math.min(400, this.screenWidth - 80),
      }
    });

    // 텍스트 크기에 맞춰 배경 크기 계산 (여백 포함)
    const padding = 20;
    const minWidth = 200;
    const backgroundWidth = Math.max(minWidth, text.width + padding * 2);
    const backgroundHeight = text.height + padding * 2;

    // 배경 (둥근 모서리와 그림자 효과)
    const background = this.createToastBackground(backgroundWidth, backgroundHeight, type);
    toastContainer.addChild(background);

    // 텍스트를 배경 중앙에 배치
    text.anchor.set(0.5, 0.5);
    text.x = backgroundWidth / 2;
    text.y = backgroundHeight / 2;
    toastContainer.addChild(text);

    // 위치 설정
    this.positionToast(toastContainer, backgroundWidth, backgroundHeight, position);

    return toastContainer;
  }

  // 토스트 배경 생성
  private createToastBackground(width: number, height: number, type: ToastType): PIXI.Graphics {
    const background = new PIXI.Graphics();

    // 그림자 효과
    background.roundRect(4, 4, width, height, 12);
    background.fill({ color: 0x000000, alpha: 0.3 });

    // 메인 배경
    background.roundRect(0, 0, width, height, 12);
    background.fill({ color: this.styles[type].backgroundColor, alpha: 0.95 });

    // 테두리
    background.roundRect(0, 0, width, height, 12);
    background.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });

    // 내부 하이라이트
    background.roundRect(2, 2, width - 4, height - 4, 10);
    background.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });

    return background;
  }

  // 토스트 위치 설정
  private positionToast(toast: PIXI.Container, width: number, height: number, position: 'top' | 'center' | 'bottom'): void {
    const margin = 20;

    // 수평 중앙 정렬
    toast.x = (this.screenWidth - width) / 2;

    // 수직 위치 설정
    switch (position) {
      case 'top':
        toast.y = margin;
        break;
      case 'center':
        toast.y = (this.screenHeight - height) / 2;
        break;
      case 'bottom':
      default:
        toast.y = this.screenHeight - height - margin;
        break;
    }
  }

  // 애니메이션과 함께 토스트 표시
  private showWithAnimation(toast: PIXI.Container, position: 'top' | 'center' | 'bottom'): void {
    // 초기 상태 설정
    const originalY = toast.y;
    
    switch (position) {
      case 'top':
        toast.y = -toast.height;
        break;
      case 'bottom':
        toast.y = this.screenHeight;
        break;
      case 'center':
        toast.alpha = 0;
        toast.scale.set(0.5);
        break;
    }

    this.container.addChild(toast);

    // 슬라이드/페이드 인 애니메이션
    this.animateIn(toast, originalY, position);
  }

  // 인 애니메이션
  private animateIn(toast: PIXI.Container, targetY: number, position: 'top' | 'center' | 'bottom'): void {
    const duration = 300; // 300ms
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutBack(progress);

      switch (position) {
        case 'top':
        case 'bottom':
          toast.y = this.lerp(position === 'top' ? -toast.height : this.screenHeight, targetY, easedProgress);
          toast.alpha = progress;
          break;
        case 'center':
          toast.alpha = progress;
          toast.scale.set(this.lerp(0.5, 1, easedProgress));
          break;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 토스트 숨기기
  public hide(): void {
    if (!this.currentToast || !this.isVisible) return;

    // 타이머 클리어
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // 아웃 애니메이션
    this.animateOut(this.currentToast);

    this.currentToast = null;
    this.isVisible = false;
  }

  // 아웃 애니메이션
  private animateOut(toast: PIXI.Container): void {
    const duration = 250; // 250ms
    const startTime = performance.now();
    const startY = toast.y;
    const startAlpha = toast.alpha;
    const startScale = toast.scale.x;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeInBack(progress);

      // 아래로 슬라이드하면서 페이드 아웃
      toast.y = this.lerp(startY, this.screenHeight, easedProgress);
      toast.alpha = this.lerp(startAlpha, 0, progress);
      toast.scale.set(this.lerp(startScale, 0.8, easedProgress));

      if (progress >= 1) {
        if (toast.parent) {
          this.container.removeChild(toast);
        }
        toast.destroy({ children: true });
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 빠른 메시지 표시 메서드들
  public showInfo(message: string, duration?: number): void {
    this.show(message, duration, { type: 'info' });
  }

  public showSuccess(message: string, duration?: number): void {
    this.show(message, duration, { type: 'success' });
  }

  public showWarning(message: string, duration?: number): void {
    this.show(message, duration, { type: 'warning' });
  }

  public showError(message: string, duration?: number): void {
    this.show(message, duration, { type: 'error' });
  }

  // 게임 관련 특수 메시지들
  public showGameMessage(message: string, type: 'hint' | 'move' | 'win' | 'block' = 'hint'): void {
    const messageMap = {
      hint: { type: 'info' as ToastType, duration: 5000 },
      move: { type: 'success' as ToastType, duration: 2000 },
      win: { type: 'success' as ToastType, duration: 6000 },
      block: { type: 'warning' as ToastType, duration: 4000 },
    };

    const config = messageMap[type];
    this.show(message, config.duration, { type: config.type });
  }

  // 화면 크기 변경 시 호출
  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // 현재 토스트 위치 업데이트
    if (this.currentToast) {
      const background = this.currentToast.children[0] as PIXI.Graphics;
      if (background && background.width) {
        this.positionToast(this.currentToast, background.width, background.height, 'bottom');
      }
    }
  }

  // 현재 토스트가 표시되고 있는지 확인
  public isShowing(): boolean {
    return this.isVisible;
  }

  // 모든 토스트 강제 숨김
  public hideAll(): void {
    this.hide();
  }

  // 이징 함수들
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  // 선형 보간
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  // 토스트 큐 시스템 (여러 메시지 대기열)
  private messageQueue: Array<{
    message: string;
    duration: number;
    options: ToastOptions;
  }> = [];

  public queueMessage(message: string, duration: number = 3000, options: ToastOptions = {}): void {
    this.messageQueue.push({ message, duration, options });
    
    if (!this.isVisible) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.messageQueue.length === 0 || this.isVisible) return;

    const next = this.messageQueue.shift();
    if (next) {
      this.show(next.message, next.duration, next.options);
      
      // 현재 토스트가 끝나면 다음 처리
      setTimeout(() => {
        this.processQueue();
      }, next.duration + 300); // 애니메이션 시간 고려
    }
  }

  // 큐 비우기
  public clearQueue(): void {
    this.messageQueue = [];
  }

  // 디버그 정보
  public getInfo(): {
    isVisible: boolean;
    queueLength: number;
    currentMessage: string | null;
    screenSize: { width: number; height: number };
  } {
    return {
      isVisible: this.isVisible,
      queueLength: this.messageQueue.length,
      currentMessage: this.currentToast ? 'active' : null,
      screenSize: { width: this.screenWidth, height: this.screenHeight },
    };
  }

  // 정리
  public destroy(): void {
    this.hide();
    this.clearQueue();
    
    if (this.container) {
      this.app.stage.removeChild(this.container);
      this.container.destroy({ children: true });
    }
  }
}