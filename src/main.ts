// PixiJS 솔리테어 - 메인 진입점 (TypeScript)

import { GameApplication } from '@/core/Application';

// 전역 게임 인스턴스
let gameInstance: GameApplication | null = null;

// DOM 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  try {
    console.log('DOM 로드 완료, 게임 시작...');

    // 게임 인스턴스 생성 및 초기화
    gameInstance = new GameApplication();
    await gameInstance.init();

    console.log('게임이 성공적으로 시작되었습니다!');
  } catch (error) {
    console.error('게임 시작 중 오류:', error);
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = `게임 시작 실패: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', (): void => {
  if (gameInstance) {
    gameInstance.destroy();
  }
});

// 전역 접근을 위한 export (개발/디버깅용)
window.solitaireGame = gameInstance;