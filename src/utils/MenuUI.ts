// PixiJS 솔리테어 - 메뉴 UI 관리 (TypeScript)

import type { GameController } from '@/game/GameController';
import { Utils } from '@/utils/Utils';
import type { GameSettings } from '@/types/global';

export interface ButtonElements {
  newGame: HTMLButtonElement | null;
  undo: HTMLButtonElement | null;
  hint: HTMLButtonElement | null;
}

export class MenuUI {
  private gameController: GameController;
  private buttons: ButtonElements;

  constructor(gameController: GameController) {
    this.gameController = gameController;
    this.buttons = this.getButtonElements();

    this.setupEventListeners();
    this.updateButtonStates();
  }

  private getButtonElements(): ButtonElements {
    return {
      newGame: document.getElementById('newGameBtn') as HTMLButtonElement | null,
      undo: document.getElementById('undoBtn') as HTMLButtonElement | null,
      hint: document.getElementById('hintBtn') as HTMLButtonElement | null,
    };
  }

  private setupEventListeners(): void {
    // 새 게임 버튼
    if (this.buttons.newGame) {
      this.buttons.newGame.addEventListener('click', () => {
        this.handleNewGame();
      });
    }

    // 되돌리기 버튼
    if (this.buttons.undo) {
      this.buttons.undo.addEventListener('click', () => {
        this.handleUndo();
      });
    }

    // 힌트 버튼
    if (this.buttons.hint) {
      this.buttons.hint.addEventListener('click', () => {
        this.handleHint();
      });
    }

    // 키보드 단축키
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyboard(e);
    });

    // 게임 상태 변경 이벤트
    document.addEventListener('gameStateChanged', () => {
      this.updateButtonStates();
    });
  }

  // 새 게임 처리
  private handleNewGame(): void {
    if (this.gameController.gameState.isPlaying()) {
      // 진행 중인 게임이 있으면 확인
      if (confirm('진행 중인 게임이 있습니다. 새 게임을 시작하시겠습니까?')) {
        this.gameController.newGame();
      }
    } else {
      this.gameController.newGame();
    }

    if (this.buttons.newGame) {
      this.animateButton(this.buttons.newGame);
    }
  }

  // 되돌리기 처리
  private handleUndo(): void {
    if (this.gameController.gameState.canUndo()) {
      this.gameController.undoLastMove();
      if (this.buttons.undo) {
        this.animateButton(this.buttons.undo);
      }
    }
  }

  // 힌트 처리
  private handleHint(): void {
    if (this.gameController.gameState.isPlaying()) {
      this.gameController.showHint();
      if (this.buttons.hint) {
        this.animateButton(this.buttons.hint);
      }
    }
  }

  // 키보드 단축키 처리
  private handleKeyboard(event: KeyboardEvent): void {
    // Ctrl/Cmd 키 조합
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          this.handleNewGame();
          break;
        case 'z':
          event.preventDefault();
          this.handleUndo();
          break;
        case 'h':
          event.preventDefault();
          this.handleHint();
          break;
      }
    }

    // 일반 키
    switch (event.key) {
      case 'F1':
        event.preventDefault();
        this.handleHint();
        break;
      case 'F2':
        event.preventDefault();
        this.handleNewGame();
        break;
      case 'Escape':
        this.gameController.togglePause();
        break;
    }
  }

  // 버튼 상태 업데이트
  public updateButtonStates(): void {
    const gameState = this.gameController.gameState;

    // 되돌리기 버튼
    if (this.buttons.undo) {
      this.buttons.undo.disabled = !gameState.canUndo();
    }

    // 힌트 버튼
    if (this.buttons.hint) {
      this.buttons.hint.disabled =
        !gameState.isPlaying() || !gameState.settings.hintEnabled;
    }

    // 새 게임 버튼은 항상 활성화
    if (this.buttons.newGame) {
      this.buttons.newGame.disabled = false;
    }
  }

  // 버튼 애니메이션
  private animateButton(button: HTMLButtonElement): void {
    if (!button) return;

    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
  }

  // 확장 메뉴 생성
  private createExtendedMenu(): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'extended-menu';
    menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 200px;
            display: none;
        `;

    const menuItems = [
      { text: '통계 보기', action: () => this.showStats() },
      { text: '설정', action: () => this.showSettings() },
      { text: '게임 규칙', action: () => this.showRules() },
      { text: '자동 완성', action: () => this.autoComplete() },
      { text: '게임 재시작', action: () => this.restartGame() },
    ];

    menuItems.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                color: #333;
                font-size: 14px;
            `;
      menuItem.textContent = item.text;

      menuItem.addEventListener('click', () => {
        item.action();
        this.hideExtendedMenu();
      });

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      menu.appendChild(menuItem);
    });

    return menu;
  }

  // 확장 메뉴 표시/숨기기
  public toggleExtendedMenu(): void {
    let menu = document.querySelector('.extended-menu') as HTMLDivElement;

    if (!menu) {
      menu = this.createExtendedMenu();
      const controls = document.querySelector('.controls');
      if (controls) {
        controls.appendChild(menu);
      }
    }

    if (menu.style.display === 'none' || !menu.style.display) {
      menu.style.display = 'block';

      // 외부 클릭 시 메뉴 닫기
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick.bind(this));
      }, 100);
    } else {
      this.hideExtendedMenu();
    }
  }

  private hideExtendedMenu(): void {
    const menu = document.querySelector('.extended-menu') as HTMLDivElement;
    if (menu) {
      menu.style.display = 'none';
    }
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }

  private handleOutsideClick(event: Event): void {
    const menu = document.querySelector('.extended-menu');
    const controls = document.querySelector('.controls');

    if (menu && controls && !controls.contains(event.target as Node)) {
      this.hideExtendedMenu();
    }
  }

  // 통계 표시
  private showStats(): void {
    // ScoreUI의 showStatsModal 호출은 별도 구현 필요
    console.log('통계 표시 기능');
  }

  // 설정 모달 표시
  private showSettings(): void {
    const modal = this.createModal('settings');
    const settings = this.gameController.gameState.settings;

    modal.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px;">⚙️ 게임 설정</h2>
            <div style="color: #34495e;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">카드 뽑기 개수:</label>
                    <select id="drawCount" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="1" ${settings.drawCount === 1 ? 'selected' : ''}>1장</option>
                        <option value="3" ${settings.drawCount === 3 ? 'selected' : ''}>3장</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="allowUndo" ${settings.allowUndo ? 'checked' : ''} style="margin-right: 8px;">
                        되돌리기 허용
                    </label>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="showTimer" ${settings.showTimer ? 'checked' : ''} style="margin-right: 8px;">
                        타이머 표시
                    </label>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="autoComplete" ${settings.autoComplete ? 'checked' : ''} style="margin-right: 8px;">
                        자동 완성 허용
                    </label>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" id="hintEnabled" ${settings.hintEnabled ? 'checked' : ''} style="margin-right: 8px;">
                        힌트 기능 사용
                    </label>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="saveSettings" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">저장</button>
                <button id="cancelSettings" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">취소</button>
            </div>
        `;

    document.body.appendChild(modal);

    // 저장 버튼
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveSettings();
        modal.remove();
      });
    }

    // 취소 버튼
    const cancelButton = document.getElementById('cancelSettings');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        modal.remove();
      });
    }

    // 외부 클릭 시 닫기
    modal.addEventListener('click', (e: Event) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 설정 저장
  private saveSettings(): void {
    const drawCountSelect = document.getElementById('drawCount') as HTMLSelectElement;
    const allowUndoCheckbox = document.getElementById('allowUndo') as HTMLInputElement;
    const showTimerCheckbox = document.getElementById('showTimer') as HTMLInputElement;
    const autoCompleteCheckbox = document.getElementById('autoComplete') as HTMLInputElement;
    const hintEnabledCheckbox = document.getElementById('hintEnabled') as HTMLInputElement;

    if (drawCountSelect) {
      this.gameController.gameState.updateSetting('drawCount', parseInt(drawCountSelect.value) as 1 | 3);
    }
    if (allowUndoCheckbox) {
      this.gameController.gameState.updateSetting('allowUndo', allowUndoCheckbox.checked);
    }
    if (showTimerCheckbox) {
      this.gameController.gameState.updateSetting('showTimer', showTimerCheckbox.checked);
    }
    if (autoCompleteCheckbox) {
      this.gameController.gameState.updateSetting('autoComplete', autoCompleteCheckbox.checked);
    }
    if (hintEnabledCheckbox) {
      this.gameController.gameState.updateSetting('hintEnabled', hintEnabledCheckbox.checked);
    }

    this.updateButtonStates();
    console.log('설정이 저장되었습니다.');
  }

  // 게임 규칙 표시
  private showRules(): void {
    const modal = this.createModal('rules');

    modal.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px;">📖 솔리테어 게임 규칙</h2>
            <div style="color: #34495e; line-height: 1.6;">
                <h3>목표</h3>
                <p>모든 카드를 수트별로 A부터 K까지 순서대로 Foundation에 배치하는 것입니다.</p>
                
                <h3>게임 구성</h3>
                <ul>
                    <li><strong>Stock Pile:</strong> 뒤집어진 카드들 (좌상단)</li>
                    <li><strong>Waste Pile:</strong> Stock에서 뽑은 카드들 (Stock 옆)</li>
                    <li><strong>Foundation:</strong> 완성된 카드 더미 4개 (우상단)</li>
                    <li><strong>Tableau:</strong> 작업 공간 7개 컬럼 (하단)</li>
                </ul>
                
                <h3>게임 방법</h3>
                <ol>
                    <li>Stock을 클릭하여 카드를 Waste로 뽑습니다</li>
                    <li>카드를 드래그하여 다른 위치로 이동시킵니다</li>
                    <li>Tableau에서는 다른 색깔의 연속된 카드만 올릴 수 있습니다</li>
                    <li>Foundation에는 같은 수트의 연속된 카드만 올릴 수 있습니다</li>
                    <li>뒷면 카드를 클릭하여 뒤집을 수 있습니다</li>
                </ol>
                
                <h3>점수</h3>
                <p>Foundation에 올린 카드, 게임 시간, 이동 횟수에 따라 점수가 계산됩니다.</p>
                
                <h3>단축키</h3>
                <ul>
                    <li><strong>Ctrl+N:</strong> 새 게임</li>
                    <li><strong>Ctrl+Z:</strong> 되돌리기</li>
                    <li><strong>Ctrl+H 또는 F1:</strong> 힌트</li>
                    <li><strong>ESC:</strong> 일시정지</li>
                </ul>
            </div>
            <button id="closeRules" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                width: 100%;
            ">닫기</button>
        `;

    document.body.appendChild(modal);

    // 닫기 이벤트
    const closeButton = document.getElementById('closeRules');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.remove();
      });
    }

    modal.addEventListener('click', (e: Event) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 모달 생성 헬퍼
  private createModal(className: string): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = `${className}-modal`;
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

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: ${className === 'rules' ? '600px' : '400px'};
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;

    modal.appendChild(modalContent);
    modal.innerHTML = modalContent.outerHTML;

    return modal;
  }

  // 자동 완성
  private autoComplete(): void {
    if (
      this.gameController.gameState.settings.autoComplete &&
      this.gameController.gameState.isPlaying()
    ) {
      this.gameController.autoComplete();
    }
  }

  // 게임 재시작
  private restartGame(): void {
    if (confirm('현재 게임을 재시작하시겠습니까?')) {
      this.gameController.restartGame();
    }
  }

  // 메뉴 버튼 추가 (필요시)
  public addMenuButton(): void {
    const menuButton = document.createElement('button');
    menuButton.className = 'btn';
    menuButton.textContent = '메뉴';
    menuButton.addEventListener('click', () => {
      this.toggleExtendedMenu();
    });

    const controls = document.querySelector('.controls');
    if (controls) {
      controls.appendChild(menuButton);
    }
  }

  // 버튼 툴팁 추가
  private addTooltips(): void {
    const tooltips: Record<string, string> = {
      newGameBtn: '새 게임 시작 (Ctrl+N)',
      undoBtn: '마지막 이동 되돌리기 (Ctrl+Z)',
      hintBtn: '다음 이동 힌트 (Ctrl+H)',
    };

    Object.keys(tooltips).forEach((id) => {
      const button = document.getElementById(id);
      if (button) {
        button.title = tooltips[id];
      }
    });
  }

  // 초기화
  public init(): void {
    this.addTooltips();
    this.updateButtonStates();

    // 메뉴 버튼 추가 (선택사항)
    // this.addMenuButton();
  }

  // 메모리 정리
  public destroy(): void {
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', this.handleKeyboard.bind(this));
    document.removeEventListener('gameStateChanged', this.updateButtonStates.bind(this));

    // 확장 메뉴 제거
    this.hideExtendedMenu();

    // 모든 모달 제거
    document.querySelectorAll('.settings-modal, .rules-modal').forEach((modal) => {
      modal.remove();
    });

    // 버튼 참조 정리
    this.buttons = {
      newGame: null,
      undo: null,
      hint: null,
    };
  }
}