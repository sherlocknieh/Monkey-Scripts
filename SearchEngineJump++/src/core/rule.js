import { GM_addStyle } from '$';
import { addStyle } from './shadow.js';

export function getElementBySelector(selector) {
  if (!selector) return null;
  if (selector.startsWith('css;')) {
    return document.querySelector(selector.slice(4));
  }
  return document.evaluate(selector, document, null, 9, null).singleNodeValue;
}

export function getInputTarget(rule) {
  const keyword = rule?.insertIntoDoc?.keyword;
  return typeof keyword === 'function' ? keyword : getElementBySelector(keyword);
}

export function getInsertTarget(rule) {
  const target = rule?.insertIntoDoc?.target;
  return typeof target === 'function' ? target() : getElementBySelector(target);
}

export function getInsertPositionLabel(rule) {
  return rule?.insertIntoDoc?.where?.toLowerCase();
}

/**
 * 处理 AC-baidu / 知乎排版优化 等脚本对 rule 样式的覆盖，并注入到 Shadow DOM。
 * 返回最终生效的 rule 样式文本。
 */
export function resolveRuleStyle(rule, settingData) {
  if (!rule?.style) return '';
  let style = rule.style;

  if (settingData.center == 2) {
    if (document.querySelector('.AC-style-logo') && rule.style_ACBaidu) {
      style = rule.style_ACBaidu;
    }
  } else if (settingData.center == 1) {
    style = rule.style_ACBaidu ? rule.style_ACBaidu : rule.style;
  }

  const searchMain = document.getElementById('SearchMain');
  if (searchMain && searchMain.style.marginLeft == '150px') {
    style = rule.style_ZhihuChenglinz;
  }

  addStyle(`#sej-container { ${style} }`);
  return style;
}

export function applyStylish(rule) {
  if (!rule?.stylish) return;
  GM_addStyle(rule.stylish);

  const scriptElementStyles = rule.stylish.match(
    /#sej-container(-wrapper)?\s*\{[^}]+\}/g,
  );
  if (scriptElementStyles) {
    scriptElementStyles.forEach((ruleText) => addStyle(ruleText));
  }
}
