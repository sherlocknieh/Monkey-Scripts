import { reactive } from 'vue';
import defaultEngines from '../data/engineList.js';
import rules from '../data/rules.js';
import { getValue, setValue } from '../core/storage.js';
import { XIAOHONGSHU, X_ICON, TIEBA } from '../data/favicons.js';

export const STORAGE_KEY = 'searchEngineJumpData';
export const SCRIPT_VERSION = '5.32.7';
export const SCRIPT_MESSAGE =
  '$相关说明$(status: 这个在将来或许很重要)...' +
  '(version: 若有新功能加入,靠这个版本号识别)...' +
  '(addSearchItems: 允许更新时,添加新的搜索网站到你的搜索列表)...' +
  '(modifySearchItems: 允许更新时,修改你的搜索列表中的项目)...' +
  '(closeBtn: 设置页面右上角的“关闭”按钮是否显示。true显示,false隐藏)...' +
  '(newtab: 新标签页打开。0为默认设置,1为新标签页打开)...' +
  '(foldlist: 折叠当前搜索分类列表。true为折叠,false为展开。)...' +
  '(setBtnOpacity: 设置按钮的透明度,值为0-1之间的数,0为透明,1为完全显示,中间值半透明。注：-1为直接关闭按钮,关闭之前请确定自己知道如何再次打开它)...' +
  '(debug: debug模式,开启后,控制台会输出一些信息,“关闭并保存”按钮将不会在刷新页面)...' +
  '(fixedTop: 将搜索栏固定到顶端。 true开启,false关闭)...' +
  '(fixedTopUpward: 固定顶端后，搜索栏下拉不会出现，只有上拉时才出现。 true开启,false关闭)...' +
  '(baiduOffset: 在百度页面鼠标划过的菜单会出现位移,若有使用其他的style样式,可以修改这个来修复二级菜单的偏移)...' +
  '(getIcon: 自己添加搜索后获取图标的方式。0为自动，能连接谷歌的情况下用谷歌获取，无法连接的情况下，域名加favicon.ico获取；1为域名加favicon获取，2为使用谷歌获取，3为使用dnspot的服务获取(不建议使用)。或者添加网址，关键字使用%s代替，未测试)...' +
  '(allOpen:一键搜索，点击相关分类后，打开该分类下的所有搜索)...' +
  '(HideTheSameLink:隐藏同站链接。默认开启,百度页面会隐藏百度搜索。如果想在同一个搜索网站,但是想通过不同语言来搜索, 可以选择false来实现)...' +
  '(center:是否居中显示，主要是为了兼容脚本 ac 百度  ： 0 不居中，强制在左。 1, 强制居中 。 2,自动判断)...' +
  '(icon: 图标的显示方式, 0 关闭文字, 只保留图标, 1 显示网站图标,2 显示抽象图标。当脚本中不存在抽象图标时,显示网站图标)...' +
  '(transtion: 是否有动画效果, true为开启所有动画效果,false关闭所有动画(包括模糊效果)。)' +
  '(selectSearch: 划词搜索功能, true为开启划词搜索,false关闭)' +
  '(engineDetails: 第一个值为分类列表标题名称,第二个值与enginelist相关联,必须匹配,第三个值true为显示列表,false为禁用列表。排列顺序与跳转栏上的显示顺序相同，可以用它将分类列表按自己喜欢排序)...' +
  '(engineList: 各个搜索的相关信息)' +
  '(rules: 已弃用--将搜索样式插入到目标网页,同脚本中的rules设置相同,优先级高于脚本中自带的规则。自带了360搜索,可仿写)...';

function createDefaultSettings() {
  return {
    status: 1,
    message: SCRIPT_MESSAGE,
    version: SCRIPT_VERSION,
    addSearchItems: true,
    modifySearchItems: true,
    closeBtn: true,
    newtab: 0,
    foldlist: true,
    setBtnOpacity: 0.7,
    debug: false,
    fixedTop: true,
    fixedTopUpward: false,
    baiduOffset: -120,
    getIcon: 0,
    allOpen: false,
    HideTheSameLink: true,
    center: 2,
    icon: 1,
    transtion: true,
    selectSearch: true,
    engineDetails: [
      ['网页', 'web', true],
      ['翻译', 'translate', true],
      ['知识', 'knowledge', true],
      ['图片', 'image', true],
      ['视频', 'video', true],
      ['音乐', 'music', true],
      ['学术', 'scholar', false],
      ['社交', 'sociality', true],
      ['购物', 'shopping', true],
      ['下载', 'download', false],
      ['新闻', 'news', false],
      ['常用', 'mine', false],
    ],
    engineList: defaultEngines,
  };
}

function isVersionOutdated(storedVersion, currentVersion) {
  const arr1 = storedVersion.toString().split('.');
  const arr2 = currentVersion.toString().split('.');
  const minlength = Math.min(arr1.length, arr2.length);
  let i = 0;

  for (; i < minlength; i++) {
    const a = parseInt(arr1[i]);
    const b = parseInt(arr2[i]);
    if (a > b) return false;
    if (a < b) return true;
  }

  if (arr1.length > arr2.length) {
    for (let j = i; j < arr1.length; j++) {
      if (parseInt(arr1[j]) != 0) return false;
    }
    return false;
  } else if (arr1.length < arr2.length) {
    for (let j = i; j < arr2.length; j++) {
      if (parseInt(arr2[j]) != 0) return true;
    }
    return false;
  }

  return false;
}

export class Settings {
  constructor() {
    this.storedSettingData = getValue(STORAGE_KEY, null);
    this.scriptSettingData = createDefaultSettings();
    this.settingData = null;
    this.initSettings();
  }

  checkSettingDataIntegrity() {
    for (const value in this.scriptSettingData) {
      if (!Object.prototype.hasOwnProperty.call(this.settingData, value)) {
        console.warn(`[SEJ] 属性不存在：${value}`);
        this.settingData[value] = this.scriptSettingData[value];
        setValue(STORAGE_KEY, this.settingData);
      }
    }
  }

  checkUpdate() {
    if (
      !isVersionOutdated(
        this.storedSettingData.version,
        this.scriptSettingData.version,
      )
    ) {
      return;
    }

    this.settingData.version = this.scriptSettingData.version;
    this.settingData.message = this.scriptSettingData.message;

    if (
      this.settingData.setBtnOpacity === '0.2' &&
      isVersionOutdated(this.storedSettingData.version, '5.29.9')
    ) {
      this.settingData.setBtnOpacity = '0.7';
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.30.2')) {
      this.deleteOutdatedSearchItems(['https://so.letv.com/s?wd=%s']);
      this.modifyOutdatedSearchItems(
        'https://s.weibo.com/weibo/%s',
        'https://s.weibo.com/weibo/?q=%s',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.30.4')) {
      this.modifyOutdatedSearchItems(
        'https://www.startpage.com/do/asearch$post$query',
        'https://www.startpage.com/sp/search$post$query',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.31.1')) {
      this.modifyOutdatedSearchItemsTarget('https://zh.moegirl.org/%s');
      this.modifyOutdatedSearchItemsTarget(
        'https://tieba.baidu.com/f?kw=%s&ie=utf-8',
      );
      this.modifyOutdatedSearchItemsTarget(
        'https://github.com/search?utf8=✓&q=%s',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.31.8')) {
      this.modifyOutdatedSearchItems(
        'https://cn.bing.com/search?q=%s',
        'https://www.bing.com/search?q=%s',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.31.11')) {
      this.addSearchItem(
        {
          name: '小红书',
          url: 'https://www.xiaohongshu.com/search_result/?keyword=%s',
          favicon: XIAOHONGSHU,
        },
        'sociality',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.31.16')) {
      this.deleteOutdatedSearchItems(['https://twitter.com/search/%s']);
      this.addSearchItem(
        {
          name: 'X',
          url: 'https://x.com/search?q=%s',
          favicon: X_ICON,
        },
        'sociality',
      );
    }

    if (isVersionOutdated(this.storedSettingData.version, '5.31.17')) {
      this.modifyOutdatedSearchItemsIcon(
        'https://tieba.baidu.com/f?kw=%s&ie=utf-8',
        TIEBA,
      );
    }

    setValue(STORAGE_KEY, this.settingData);
  }

  initSettings() {
    if (this.storedSettingData) {
      this.settingData = Object.assign({}, this.storedSettingData);
      this.checkSettingDataIntegrity();
      this.checkUpdate();
    } else {
      this.settingData = this.scriptSettingData;
      setValue(STORAGE_KEY, this.settingData);
    }

    this.initEngineCategories();
  }

  initEngineCategories() {
    this.settingData.engineList.engineCategories = [];
    for (let i = 0; i < this.settingData.engineDetails.length; i++) {
      if (this.settingData.engineDetails[i][2]) {
        this.settingData.engineList.engineCategories[i] =
          this.settingData.engineDetails[i];
      } else {
        this.settingData.engineList.engineCategories[-i] =
          this.settingData.engineDetails[i];
      }
    }
  }

  getMatchedRule() {
    for (const rule of [...rules]) {
      if (rule.url.test(location.href)) return rule;
    }
    return null;
  }

  addSearchItem(newItem, category) {
    this.settingData.engineList[category].push(newItem);
  }

  modifyOutdatedSearchItems(oldURL, newURL) {
    for (const value in this.settingData.engineList) {
      const item = this.settingData.engineList[value];
      for (let i = 0; i < item.length; i++) {
        if (item[i].url === oldURL) item[i].url = newURL;
      }
    }
  }

  modifyOutdatedSearchItemsTarget(url) {
    for (const value in this.settingData.engineList) {
      const item = this.settingData.engineList[value];
      for (let i = 0; i < item.length; i++) {
        if (item[i].url === url) delete item[i].blank;
      }
    }
  }

  deleteOutdatedSearchItems(urlList) {
    for (const value in this.settingData.engineList) {
      const item = this.settingData.engineList[value];
      for (let i = 0; i < item.length; i++) {
        if (urlList.includes(item[i].url)) {
          console.warn('[SEJ] 删除搜索引擎：' + item[i].name);
          item.splice(i, 1);
        }
      }
    }
  }

  modifyOutdatedSearchItemsIcon(url, newIcon) {
    for (const value in this.settingData.engineList) {
      const item = this.settingData.engineList[value];
      for (let i = 0; i < item.length; i++) {
        if (item[i].url === url) item[i].favicon = newIcon;
      }
    }
  }

  modifyOutdatedSearchItemsRule(name, value) {
    const oldRule = this.settingData.rules;
    for (const item in oldRule) {
      if (oldRule[item].name == name) oldRule[item] = value;
    }
  }
}

let instance = null;

export function useSettings() {
  if (!instance) {
    instance = reactive(new Settings());
  }
  return instance;
}

export function getMatchedRule() {
  return useSettings().getMatchedRule();
}
