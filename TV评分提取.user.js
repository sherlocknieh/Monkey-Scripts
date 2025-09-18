// ==UserScript==
// @namespace    http://tampermonkey.net/
// @name         剧集信息提取器
// @grant        none
// @version      2.0
// @match        *://www.imdb.com/title/*/episodes*
// @match        https://trakt.tv/shows/*/seasons/*
// @description  提取 IMDb, Trakt.tv 剧集页面的剧集信息
// ==/UserScript==

(function() {
    'use strict';

    let episodes = [];
    let extractButton = null;
    let downloadButton = null;

    // 公共样式配置
    const STYLES = {
        button: {
            base: `
                position: fixed;
                z-index: 10000;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `,
            extract: `
                bottom: 20px;
                right: 20px;
                background-color: #f5c518;
                color: #000;
                display: inline-flex;
                align-items: center;
            `,
            download: `
                background-color: #4CAF50;
                color: white;
            `,
            tsv: `
                background-color: #2196F3;
                color: white;
            `
        },
        spinner: `
            .spinner {
                width: 1em; height: 1em; 
                border: 2px solid rgba(0,0,0,0.3);
                border-top: 2px solid #000;
                border-radius: 50%;
                display: inline-block;
                vertical-align: baseline;
                margin-right: 6px;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed !important;
            }
        `
    };

    // 创建样式表
    function addStyles() {
        if (!document.getElementById('episode-extractor-styles')) {
            const style = document.createElement('style');
            style.id = 'episode-extractor-styles';
            style.textContent = STYLES.spinner;
            document.head.appendChild(style);
        }
    }

    // 创建按钮的通用函数
    function createButton(text, styles, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = STYLES.button.base + styles;
        button.addEventListener('click', onClick);
        
        // 添加悬停效果
        const originalBg = button.style.backgroundColor;
        const hoverBg = originalBg === '#f5c518' ? '#e6b800' : 
                       originalBg === '#4CAF50' ? '#45a049' : '#1976D2';
        
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) button.style.backgroundColor = hoverBg;
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) button.style.backgroundColor = originalBg;
        });
        
        return button;
    }

    // 工具函数
    const utils = {
        formatNumber: (num) => {
            const n = parseInt(num) || 0;
            return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' :
                   n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
        },
        
        isValidEpisode: (title) => {
            if (!title || typeof title !== 'string') return false;
            const titleLower = title.toLowerCase().trim();
            const excludeKeywords = ['contribute', 'see all', 'episode guide', 'imdb', 'browse episodes'];
            return titleLower.length > 2 && 
                   !excludeKeywords.some(keyword => titleLower.includes(keyword)) &&
                   !/^[\d\s\-\.\(\)]+$/.test(titleLower);
        },
        
        extractShowTitle: () => {
            const selectors = [
                'h1[data-testid="hero__pageTitle"] span',
                'h1.titleBar-title', 'h1 .itemprop', 'h1',
                '.titleBar-title', '.hero__pageTitle'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element?.textContent?.trim()) {
                    return element.textContent.trim();
                }
            }
            
            const urlMatch = window.location.pathname.match(/\/title\/[^\/]+/);
            return urlMatch ? `Show_${urlMatch[0].split('/')[2]}` : '剧集数据';
        }
    };

    // 数据提取器
    const extractors = {
        trakt: (element, index) => {
            try {
                const episodeNumber = element.getAttribute('data-number') || (index + 1);
                const seasonNumber = element.getAttribute('data-season-number') || '0';
                const percentage = element.getAttribute('data-percentage') || '0';
                const votes = element.getAttribute('data-votes') || '0';
                
                const title = element.querySelector('.main-title, .titles-link h3 .main-title')?.textContent?.trim() || '未知标题';
                
                const episodeNumberStr = seasonNumber === '0' ? 
                    `Special ${episodeNumber}` : 
                    `S${seasonNumber}E${episodeNumber.toString().padStart(2, '0')}`;
                
                let link = element.querySelector('a[href*="/shows/"]')?.href || '';
                if (link.startsWith('/')) link = 'https://trakt.tv' + link;
                
                const dateElement = element.querySelector('.convert-date');
                const airDate = dateElement ? new Date(dateElement.getAttribute('data-date')).toLocaleDateString('zh-CN') : '未知日期';
                
                let runtime = element.querySelector('.humanized-minutes')?.textContent?.trim() || '';
                if (!runtime) {
                    const runtimeData = element.getAttribute('data-runtime');
                    if (runtimeData) {
                        const minutes = parseInt(runtimeData);
                        runtime = minutes >= 60 ? 
                            `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 
                            `${minutes}m`;
                    }
                }
                
                return {
                    episodeNumber: episodeNumberStr,
                    title,
                    rating: `${percentage}%`,
                    voteCount: `${utils.formatNumber(votes)} votes`,
                    link: link || '未知链接',
                    airDate,
                    runtime: runtime || '未知时长',
                    watchers: utils.formatNumber(element.getAttribute('data-watchers')),
                    plays: utils.formatNumber(element.getAttribute('data-plays')),
                    collected: utils.formatNumber(element.getAttribute('data-collected')),
                    lists: utils.formatNumber(element.getAttribute('data-lists'))
                };
            } catch (error) {
                console.error('提取Trakt.tv数据出错:', error);
                return null;
            }
        },
        
        imdb: (element, index) => {
            try {
                const titleElement = element.querySelector('.ipc-title__text--reduced, h4 a, .titleColumn h4 a');
                const ratingElement = element.querySelector('.ipc-rating-star--rating');
                const voteElement = element.querySelector('.ipc-rating-star--voteCount');
                const linkElement = element.querySelector('a[href*="/title/"], .ipc-title-link-wrapper, .ipc-lockup-overlay');
                
                let title = titleElement?.textContent?.trim() || '';
                let episodeNumber = '';
                
                const episodeMatch = title.match(/S(\d+)\.E(\d+)\s*∙\s*(.+)|(.+)/);
                if (episodeMatch) {
                    if (episodeMatch[1] && episodeMatch[2]) {
                        episodeNumber = `S${episodeMatch[1]}.E${episodeMatch[2]}`;
                        title = episodeMatch[3] || '';
                    } else {
                        title = episodeMatch[4] || title;
                        episodeNumber = `第${index + 1}集`;
                    }
                }
                
                let link = linkElement?.href || '';
                if (link.startsWith('/title/')) link = 'https://www.imdb.com' + link;
                link = link.split('?')[0];
                
                return {
                    episodeNumber: episodeNumber || `第${index + 1}集`,
                    title: title || '未知标题',
                    rating: ratingElement?.textContent?.trim() || '未知评分',
                    voteCount: voteElement?.textContent?.replace(/[()]/g, '').trim() || '未知',
                    link: link || '未知链接'
                };
            } catch (error) {
                console.error('提取IMDB数据出错:', error);
                return null;
            }
        }
    };

    // 主要功能函数
    function addExtractButton() {
        if (extractButton) return;
        
        addStyles();
        extractButton = createButton('提取剧集信息', STYLES.button.extract, extractEpisodeInfo);
        document.body.appendChild(extractButton);
    }

    function extractEpisodeInfo() {
        console.log('开始提取剧集信息...');
        
        extractButton.disabled = true;
        const originalText = extractButton.innerHTML;
        extractButton.innerHTML = '提取中..<span class="spinner"></span>';
        extractButton.style.backgroundColor = '#ccc';
        
        setTimeout(() => {
            try {
                episodes = [];
                const isTrakt = window.location.hostname.includes('trakt.tv');
                
                let episodeElements = [];
                if (isTrakt) {
                    episodeElements = document.querySelectorAll('.row.fanarts.sortable');
                } else {
                    episodeElements = document.querySelectorAll('[data-testid="episodes-browse-episode"]');
                    if (episodeElements.length === 0) {
                        episodeElements = document.querySelectorAll('.episode-item-wrapper, .titleColumn, .cli-episode-item, .episode, .episode-card, .episode-list-item');
                    }
                    if (episodeElements.length === 0) {
                        const allElements = document.querySelectorAll('div, article, section, li');
                        episodeElements = Array.from(allElements).filter(el => {
                            const text = el.textContent || '';
                            return /S\d+\.E\d+|Episode \d+|第\d+集/i.test(text) && el.children.length > 0;
                        });
                    }
                }
                
                if (episodeElements.length === 0) {
                    alert('未找到剧集信息。请刷新页面后重试，或在剧集列表完全显示后再点击提取按钮。');
                    return;
                }
                
                episodeElements.forEach((element, index) => {
                    try {
                        const episodeData = isTrakt ? 
                            extractors.trakt(element, index) : 
                            extractors.imdb(element, index);
                        
                        if (episodeData && (isTrakt || utils.isValidEpisode(episodeData.title))) {
                            episodes.push(episodeData);
                        }
                    } catch (error) {
                        console.error(`处理第 ${index + 1} 个剧集元素时出错:`, error);
                    }
                });
                
                if (episodes.length > 0) {
                    console.log(`成功提取 ${episodes.length} 个剧集信息`);
                    createDownloadButton();
                    downloadEpisodeData('csv');
                } else {
                    alert('未能提取到有效的剧集信息。请检查页面是否正确加载了剧集列表。');
                }
                
            } catch (error) {
                console.error('提取剧集信息时发生错误:', error);
                alert('提取过程中发生错误，请查看控制台了解详情。');
            } finally {
                extractButton.innerHTML = originalText;
                extractButton.disabled = false;
                extractButton.style.backgroundColor = '#f5c518';
            }
        }, 2000);
    }

    function createDownloadButton() {
        if (downloadButton) downloadButton.remove();

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed; top: 70px; right: 20px; z-index: 10000;
            display: flex; flex-direction: column; gap: 5px;
        `;

        const jsonButton = createButton(`下载JSON (${episodes.length}条)`, STYLES.button.download, () => downloadEpisodeData('json'));
        const tsvButton = createButton(`下载TSV (${episodes.length}条)`, STYLES.button.tsv, () => downloadEpisodeData('csv'));

        buttonContainer.appendChild(jsonButton);
        buttonContainer.appendChild(tsvButton);
        document.body.appendChild(buttonContainer);
        
        downloadButton = buttonContainer;
    }

    function downloadEpisodeData(format = 'json') {
        try {
            const showTitle = utils.extractShowTitle();
            const cleanTitle = showTitle.replace(/[<>:"/\\|?*]/g, '_');
            
            let seasonInfo = 'S1', episodeRange = 'E1';
            
            if (episodes.length > 0) {
                const firstEpisode = episodes[0].episodeNumber;
                const lastEpisode = episodes[episodes.length - 1].episodeNumber;
                
                const seasonMatch = firstEpisode.match(/S(\d+)/i);
                seasonInfo = seasonMatch ? `S${seasonMatch[1]}` : 
                           firstEpisode.includes('Special') ? 'Specials' : 'S1';
                
                const firstEpMatch = firstEpisode.match(/E(\d+)/i);
                const lastEpMatch = lastEpisode.match(/E(\d+)/i);
                
                if (firstEpMatch && lastEpMatch) {
                    const firstEpNum = firstEpMatch[1];
                    const lastEpNum = lastEpMatch[1];
                    episodeRange = firstEpNum === lastEpNum ? `E${firstEpNum}` : `E${firstEpNum}-E${lastEpNum}`;
                } else if (firstEpisode.includes('Special')) {
                    episodeRange = `Special1-Special${episodes.length}`;
                } else {
                    episodeRange = `E1-E${episodes.length}`;
                }
            }
            
            const filename = `${cleanTitle}-${seasonInfo}-${episodeRange}`;
            let fileContent, mimeType;
            
            if (format === 'csv') {
                const isTrakt = episodes.length > 0 && episodes[0].hasOwnProperty('watchers');
                const headers = isTrakt ? 
                    ['集数', '标题', '评分', '投票数', '观看者', '播放次数', '收藏数', '列表数', '播出日期', '时长', '链接'] :
                    ['集数', '标题', '评分', '打分人数', '链接'];
                
                const tsvContent = [headers.join('\t')];
                
                episodes.forEach(episode => {
                    const row = isTrakt ? [
                        episode.episodeNumber, episode.title, episode.rating, episode.voteCount,
                        episode.watchers, episode.plays, episode.collected, episode.lists,
                        episode.airDate, episode.runtime, episode.link
                    ] : [
                        episode.episodeNumber, episode.title, episode.rating, episode.voteCount, episode.link
                    ];
                    
                    const cleanRow = row.map(field => 
                        String(field || '').replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '')
                    );
                    tsvContent.push(cleanRow.join('\t'));
                });
                
                fileContent = tsvContent.join('\n');
                mimeType = 'text/tab-separated-values';
            } else {
                fileContent = JSON.stringify(episodes, null, 2);
                mimeType = 'application/json';
            }
            
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`${format.toUpperCase()}文件已下载: ${filename}.${format}`);
        } catch (error) {
            console.error('下载数据时发生错误:', error);
            alert('下载失败，请查看控制台了解详情。');
        }
    }

    // 初始化
    window.addEventListener('load', addExtractButton);

})();
