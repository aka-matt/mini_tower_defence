// Internationalization - zh-CN and en string maps
// Object.freeze() applied to all values

export const LOCALE_EN = 'en';
export const LOCALE_ZH_CN = 'zh-CN';

const en = Object.freeze({
  lives: 'Lives',
  gold: 'Gold',
  wave: 'Wave',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  restart: 'Restart',
  victory: 'Victory!',
  defeat: 'Defeat',
  buildArcher: 'Archer Tower',
  buildMage: 'Mage Tower',
  sell: 'Sell',
  insufficientGold: 'Not enough gold!',
});

const zhCN = Object.freeze({
  lives: '生命',
  gold: '金币',
  wave: '波次',
  start: '开始',
  pause: '暂停',
  resume: '继续',
  restart: '重新开始',
  victory: '胜利！',
  defeat: '失败',
  buildArcher: '弓箭塔',
  buildMage: '法师塔',
  sell: '出售',
  insufficientGold: '金币不足！',
});

export const I18N = Object.freeze({
  [LOCALE_EN]: en,
  [LOCALE_ZH_CN]: zhCN,
});

export function getI18n(locale) {
  return I18N[locale] || I18N[LOCALE_EN];
}
