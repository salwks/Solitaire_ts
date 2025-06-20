// PixiJS 솔리테어 - UI 애니메이션 (TypeScript)

import * as PIXI from 'pixi.js';
import type { CardStack } from '@/entities/CardStack';

export class UIAnimation {
  private app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  // 점수 증가 애니메이션
  public animateScoreIncrease(
    element: HTMLElement,
    oldValue: number,
    newValue: number,
    duration: number = 1000
  ): void {
    const startTime = performance.now();
    const difference = newValue - oldValue;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutQuart(progress);

      const currentValue = Math.floor(oldValue + difference * easedProgress);
      element.textContent = currentValue.toLocaleString();

      // 시각적 효과
      if (progress < 1) {
        element.style.transform = `scale(${1 + Math.sin(progress * Math.PI) * 0.1})`;
        element.style.color = `hsl(${120 + progress * 60}, 70%, 50%)`;
        requestAnimationFrame(animate);
      } else {
        element.style.transform = 'scale(1)';
        element.style.color = '';
      }
    };

    requestAnimationFrame(animate);
  }

  // 승리 애니메이션
  public async animateVictory(foundationStacks: CardStack[]): Promise<void> {
    // 폭죽 효과
    this.createFireworks();

    // Foundation 스택들 축하 애니메이션
    const promises = foundationStacks.map((stack, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.animateStackCelebration(stack).then(resolve);
        }, index * 200);
      });
    });

    await Promise.all(promises);
  }

  // 폭죽 효과 생성
  private createFireworks(): void {
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b, 0xeb4d4b];
    const fireworkCount = 8;

    for (let i = 0; i < fireworkCount; i++) {
      setTimeout(() => {
        const x = Math.random() * this.app.screen.width;
        const y = Math.random() * this.app.screen.height * 0.6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.createSingleFirework(x, y, color);
      }, i * 300);
    }
  }

  // 개별 폭죽 생성
  private createSingleFirework(x: number, y: number, color: number): void {
    const particleCount = 30;
    const particles: PIXI.Graphics[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      particle.circle(0, 0, Math.random() * 4 + 2);
      particle.fill({ color });
      particle.position.set(x, y);
      
      this.app.stage.addChild(particle);
      particles.push(particle);

      // 방사형 속도
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };

      const gravity = 0.3;
      const lifetime = 2000 + Math.random() * 1000;
      const startTime = performance.now();

      const animateParticle = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / lifetime;

        if (progress >= 1) {
          this.app.stage.removeChild(particle);
          particle.destroy();
          return;
        }

        velocity.y += gravity;
        particle.x += velocity.x;
        particle.y += velocity.y;
        particle.alpha = 1 - progress;
        particle.scale.set(1 - progress * 0.5);

        requestAnimationFrame(animateParticle);
      };

      requestAnimationFrame(animateParticle);
    }
  }

  // 스택 축하 애니메이션
  private async animateStackCelebration(stack: CardStack): Promise<void> {
    return new Promise((resolve) => {
      const duration = 1000;
      const startTime = performance.now();
      const originalScale = stack.container.scale.x;

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 바운스 효과
        const bounce = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.1;
        stack.container.scale.set(originalScale + bounce);

        // 회전 효과
        stack.container.rotation = Math.sin(progress * Math.PI * 2) * 0.1 * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          stack.container.scale.set(originalScale);
          stack.container.rotation = 0;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 버튼 클릭 애니메이션
  public animateButtonClick(button: HTMLElement): void {
    button.style.transform = 'scale(0.95)';
    button.style.transition = 'transform 0.1s ease';

    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
  }

  // 모달 등장 애니메이션
  public animateModalIn(modal: HTMLElement): void {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.8) translateY(-20px)';
    modal.style.transition = 'all 0.3s ease';

    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1) translateY(0)';
    });
  }

  // 모달 사라짐 애니메이션
  public animateModalOut(modal: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      modal.style.transition = 'all 0.2s ease';
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.9) translateY(10px)';

      setTimeout(() => {
        resolve();
      }, 200);
    });
  }

  // 알림 메시지 애니메이션
  public animateNotification(notification: HTMLElement, type: 'slideIn' | 'fadeIn' = 'slideIn'): void {
    if (type === 'slideIn') {
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'transform 0.3s ease';

      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
      });
    } else {
      notification.style.opacity = '0';
      notification.style.transform = 'scale(0.8)';
      notification.style.transition = 'all 0.3s ease';

      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'scale(1)';
      });
    }
  }

  // 프로그레스 바 애니메이션
  public animateProgressBar(progressBar: HTMLElement, targetWidth: number, duration: number = 500): void {
    const startWidth = parseFloat(progressBar.style.width) || 0;
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);

      const currentWidth = startWidth + (targetWidth - startWidth) * easedProgress;
      progressBar.style.width = `${currentWidth}%`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 텍스트 타이핑 애니메이션
  public animateTextTyping(element: HTMLElement, text: string, speed: number = 50): Promise<void> {
    return new Promise((resolve) => {
      element.textContent = '';
      let index = 0;

      const typeChar = (): void => {
        if (index < text.length) {
          element.textContent += text[index];
          index++;
          setTimeout(typeChar, speed);
        } else {
          resolve();
        }
      };

      typeChar();
    });
  }

  // 카운터 애니메이션
  public animateCounter(
    element: HTMLElement,
    targetValue: number,
    duration: number = 1000,
    formatter?: (value: number) => string
  ): void {
    const startValue = parseInt(element.textContent || '0');
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutQuart(progress);

      const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
      element.textContent = formatter ? formatter(currentValue) : currentValue.toString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 요소 흔들기 애니메이션
  public animateShake(element: HTMLElement, intensity: number = 5, duration: number = 500): void {
    const startTime = performance.now();
    const originalTransform = element.style.transform;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        element.style.transform = originalTransform;
        return;
      }

      const shakeX = Math.sin(progress * Math.PI * 10) * intensity * (1 - progress);
      element.style.transform = `${originalTransform} translateX(${shakeX}px)`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // 펄스 애니메이션
  public animatePulse(element: HTMLElement, scale: number = 1.1, duration: number = 1000): void {
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = (elapsed / duration) % 1;

      const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * (scale - 1) * 0.5;
      element.style.transform = `scale(${pulseScale})`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // 이징 함수들
  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  // 메모리 정리
  public destroy(): void {
    // 진행 중인 애니메이션들은 자연스럽게 완료되도록 함
  }
}