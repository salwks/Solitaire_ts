// PixiJS 솔리테어 - 카드 애니메이션 (TypeScript)

import * as PIXI from "pixi.js";
import { CONSTANTS } from "@/core/Constants";
import type { Card } from "@/entities/Card";

export class CardAnimation {
  private app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  // 카드 이동 애니메이션
  public async animateCardMove(
    card: Card,
    targetX: number,
    targetY: number,
    duration: number = CONSTANTS.ANIMATION.DURATION
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!card.container) {
        resolve();
        return;
      }

      const startX = card.container.x;
      const startY = card.container.y;
      const startTime = performance.now();

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const easedProgress = this.easeOutQuart(progress);

        if (card.container) {
          card.container.x = this.lerp(startX, targetX, easedProgress);
          card.container.y = this.lerp(startY, targetY, easedProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 카드 뒤집기 애니메이션
  public async animateCardFlip(card: Card): Promise<void> {
    return new Promise((resolve) => {
      if (!card.container) {
        resolve();
        return;
      }

      const duration = CONSTANTS.ANIMATION.FLIP_DURATION * 1000;
      const startTime = performance.now();

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (card.container) {
          if (progress < 0.5) {
            // 첫 번째 절반: 축소
            card.container.scale.x = 1 - progress * 2;
          } else {
            // 두 번째 절반: 확대 (뒤집힌 상태)
            card.container.scale.x = (progress - 0.5) * 2;

            // 중간 지점에서 카드 뒤집기
            if (progress >= 0.5 && card.container.scale.x < 0.1) {
              card.flip();
            }
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (card.container) {
            card.container.scale.x = 1;
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 무효한 이동 애니메이션 (카드가 원래 위치로 돌아감)
  public async animateInvalidMove(card: Card): Promise<void> {
    return new Promise((resolve) => {
      if (!card.container) {
        resolve();
        return;
      }

      const originalTint = card.container.tint;
      card.container.tint = 0xff6b6b; // 빨간색 틴트

      // 흔들기 애니메이션
      const shakeAmount = 5;
      const shakeDuration = 300;
      const startTime = performance.now();
      const originalX = card.container.x;

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / shakeDuration, 1);

        if (card.container) {
          const shakeOffset =
            Math.sin(progress * Math.PI * 6) * shakeAmount * (1 - progress);
          card.container.x = originalX + shakeOffset;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (card.container) {
            card.container.x = originalX;
            card.container.tint = originalTint;
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 힌트 애니메이션
  public animateHint(card: Card): void {
    if (!card.container) return;

    let iteration = 0;
    const maxIterations = 6;

    const pulse = (): void => {
      if (iteration >= maxIterations || !card.container) return;

      const isHighlight = iteration % 2 === 0;
      card.container.tint = isHighlight ? 0xffff00 : 0xffffff;

      iteration++;
      setTimeout(pulse, 500);
    };

    pulse();
  }

  // 승리 애니메이션
  public async animateVictory(cards: Card[]): Promise<void> {
    const promises = cards.map((card, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.animateCardCelebration(card).then(resolve);
        }, index * 100);
      });
    });

    await Promise.all(promises);
  }

  // 개별 카드 축하 애니메이션
  private async animateCardCelebration(card: Card): Promise<void> {
    return new Promise((resolve) => {
      if (!card.container) {
        resolve();
        return;
      }

      const duration = 1000;
      const startTime = performance.now();
      const originalScale = card.container.scale.x;

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (card.container) {
          // 바운스 효과
          const bounce = Math.abs(Math.sin(progress * Math.PI * 3));
          card.container.scale.set(originalScale + bounce * 0.2);

          // 색상 변화
          const hue = (progress * 360) % 360;
          card.container.tint = this.hslToHex(hue, 100, 50);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (card.container) {
            card.container.scale.set(originalScale);
            card.container.tint = 0xffffff;
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 이징 함수들
  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  // 선형 보간
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  // HSL을 HEX로 변환
  private hslToHex(h: number, s: number, l: number): number {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number): number => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    return (f(0) << 16) | (f(8) << 8) | f(4);
  }

  // 리소스 정리
  public destroy(): void {
    // 애니메이션 관련 리소스 정리
    this.app = null as any;
  }
}
