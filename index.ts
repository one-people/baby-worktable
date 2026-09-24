import { registerRootComponent } from 'expo';
import { Alert, Platform } from 'react-native';

import App from './App';

const ALERT_STYLE_ID = 'web-alert-polyfill-style';

if (Platform.OS === 'web') {
  installWebAlertPolyfill();
}

registerRootComponent(App);

/**
 * react-native-web 的 Alert.alert 是空实现；Web 预览时以居中模态弹窗兜底
 * （纯 DOM、不阻塞 JS，奶油马卡龙风格），原生平台仍走系统弹窗，行为不变。
 */
function installWebAlertPolyfill(): void {
  injectStyles();
  Alert.alert = (title, message, buttons) => {
    // 同一时间只保留一个弹窗
    document.querySelectorAll('[data-web-alert-root]').forEach((el) => el.remove());

    const actionList =
      buttons && buttons.length > 0
        ? buttons
        : [{ text: '知道了', style: 'default' as const, onPress: undefined }];

    const root = document.createElement('div');
    root.setAttribute('data-web-alert-root', '');
    root.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(74,55,40,0.35);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);' +
      'animation:bwa-fade .18s ease-out';

    const card = document.createElement('div');
    card.setAttribute('data-web-alert', '');
    card.style.cssText =
      'width:min(320px,calc(100vw - 48px));background:#FFFFFF;border-radius:24px;' +
      'padding:24px 20px 18px;text-align:center;box-shadow:0 16px 40px rgba(232,112,63,0.28);' +
      'animation:bwa-pop .26s cubic-bezier(.34,1.56,.64,1)';

    const bubble = document.createElement('div');
    bubble.style.cssText =
      'width:48px;height:48px;margin:0 auto 12px;border-radius:16px;background:#FFE4D4;' +
      'display:flex;align-items:center;justify-content:center';
    bubble.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF6C3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3.5 21 19.5H3Z"/><path d="M12 10v4.2"/><circle cx="12" cy="17.1" r="0.4" fill="#EF6C3C"/></svg>';

    const titleEl = document.createElement('div');
    titleEl.textContent = title || '提示';
    titleEl.style.cssText = 'font-size:17px;font-weight:800;color:#4A3728;margin-bottom:6px';

    const msgEl = document.createElement('div');
    msgEl.textContent = message ?? '';
    msgEl.style.cssText =
      'font-size:14px;color:#8A7264;line-height:1.65;white-space:pre-line;margin-bottom:18px';

    const actions = document.createElement('div');
    actions.style.cssText = `display:flex;gap:10px;${
      actionList.length > 1 ? '' : 'justify-content:center;'
    }`;

    const close = (action: (typeof actionList)[number] | undefined) => {
      root.remove();
      document.removeEventListener('keydown', onKeydown);
      action?.onPress?.();
    };
    const onCancel = () => {
      const cancel = actionList.find((b) => b.style === 'cancel');
      close(cancel);
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeydown);
    root.addEventListener('click', (e) => {
      if (e.target === root) onCancel();
    });

    let firstButton: HTMLButtonElement | null = null;
    for (const btn of actionList) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = btn.text ?? '确定';
      const destructive = btn.style === 'destructive';
      const isPrimary = actionList.length === 1 || (btn.style !== 'cancel' && !destructive);
      el.style.cssText =
        'flex:1;border:none;border-radius:999px;padding:12px 16px;cursor:pointer;font-size:15px;' +
        'font-weight:700;transition:transform .12s ease;white-space:nowrap' +
        (destructive
          ? ';background:#F76D6D;color:#FFFFFF'
          : btn.style === 'cancel'
            ? ';background:#FBEEE1;color:#4A3728'
            : isPrimary
              ? ';background:#FF8A5E;color:#FFFFFF'
              : ';background:#FBEEE1;color:#4A3728');
      el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.03)'));
      el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));
      el.addEventListener('click', () => close(btn));
      if (firstButton === null) firstButton = el;
      actions.appendChild(el);
    }

    card.append(bubble, titleEl, msgEl, actions);
    root.appendChild(card);
    document.body.appendChild(root);
    // 焦点移入弹窗首选按钮（非取消项），回车即可确认
    const cancelText = actionList.find((a) => a.style === 'cancel')?.text;
    const focusTarget =
      [...actions.querySelectorAll('button')].find((b) => b.textContent !== cancelText) ?? firstButton;
    focusTarget?.focus({ preventScroll: true });
  };
}

/** 弹窗进出场动画（一次性注入） */
function injectStyles(): void {
  if (document.getElementById(ALERT_STYLE_ID) != null) return;
  const style = document.createElement('style');
  style.id = ALERT_STYLE_ID;
  style.textContent = [
    '@keyframes bwa-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes bwa-pop{from{opacity:0;transform:scale(.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}',
    '[data-web-alert-root] button:focus-visible{outline:2px solid #EF6C3C;outline-offset:2px}',
  ].join('\n');
  document.head.appendChild(style);
}
