// ==UserScript==
// @namespace    Violentmonkey Scripts
// @name         TV评分提取器
// @grant        none
// @version      1.1
// @description  在 IMDb, Trakt.tv 剧集列表页提取各集信息
// @match        https://*.imdb.com/title/*/episodes*
// @match        https://trakt.tv/shows/*/seasons/*
// @exclude      https://trakt.tv/shows/*/seasons/*/episodes/*
// ==/UserScript==

(function() {
    'use strict';

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        addStyles();
        addButton();
    }

    // 添加样式
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            #extract-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                background: #f5c518;
                color: black;
                font-size: 16px;
                padding: 0.5em 1em;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            
            #extract-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            #extract-button .spinner {
                width: 1em;
                height: 1em;
                border: 2px solid rgba(255,255,255,0.6);
                border-top: 2px solid #fff;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                animation: spin 0.8s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    // 添加提取按钮
    function addButton() {
        const button = document.createElement('button');
        button.id = 'extract-button';
        button.textContent = '提取';
        button.addEventListener('click', handleExtract);
        document.body.appendChild(button);
    }

    // 提取操作
    function handleExtract() {
        console.log('开始提取剧集信息...');
        const button = document.getElementById('extract-button');
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span>提取中..';
        
        try {
            const episodes = [];
            const isTrakt = window.location.hostname.includes('trakt.tv');
            const episodeElements = findEpisodeElements(isTrakt);
            
            if (episodeElements.length === 0) {
                alert('未找到剧集信息。请刷新页面后重试,或在剧集列表完全显示后再点击提取按钮。');
                return;
            }
            
            // 提取所有剧集数据
            episodeElements.forEach((element, index) => {
                const episodeData = isTrakt ? 
                    extractTraktData(element, index) : 
                    extractImdbData(element, index);
                
                if (episodeData && (isTrakt || isValidEpisode(episodeData.title))) {
                    episodes.push(episodeData);
                }
            });
            
            if (episodes.length > 0) {
                console.log(`成功提取 ${episodes.length} 个剧集信息`);
                downloadData(episodes);
            } else {
                alert('未能提取到有效的剧集信息。请检查页面是否正确加载了剧集列表。');
            }
        } catch (error) {
            console.error('提取剧集信息时发生错误:', error);
            alert('提取过程中发生错误，请查看控制台了解详情。');
        } finally {
            // 恢复按钮状态
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // 查找剧集元素
    function findEpisodeElements(isTrakt) {
        if (isTrakt) {
            return document.querySelectorAll('.row.fanarts.sortable');
        }
        
        let elements = document.querySelectorAll('[data-testid="episodes-browse-episode"]');
        if (elements.length > 0) return elements;
        
        elements = document.querySelectorAll('.episode-item-wrapper, .titleColumn, .cli-episode-item, .episode, .episode-card, .episode-list-item');
        if (elements.length > 0) return elements;
        
        // 最后尝试通过文本匹配
        const allElements = document.querySelectorAll('div, article, section, li');
        return Array.from(allElements).filter(el => {
            const text = el.textContent || '';
            return /S\d+\.E\d+|Episode \d+|第\d+集/i.test(text) && el.children.length > 0;
        });
    }

    // 提取 Trakt.tv 数据
    function extractTraktData(element, index) {
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
                voteCount: `${formatNumber(votes)} votes`,
                link: link || '未知链接',
                airDate,
                runtime: runtime || '未知时长',
                watchers: formatNumber(element.getAttribute('data-watchers')),
                plays: formatNumber(element.getAttribute('data-plays')),
                collected: formatNumber(element.getAttribute('data-collected')),
                lists: formatNumber(element.getAttribute('data-lists'))
            };
        } catch (error) {
            console.error('提取Trakt.tv数据出错:', error);
            return null;
        }
    }

    // 提取 IMDb 数据
    function extractImdbData(element, index) {
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

    // 下载数据
    function downloadData(episodes) {
        try {
            const showTitle = getShowTitle();
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
            const format = 'csv';
            let fileContent, mimeType;
            
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
            mimeType = 'text/csv';
            
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`文件已下载: ${filename}.${format}`);
        } catch (error) {
            console.error('下载数据时发生错误:', error);
            alert('下载失败，请查看控制台了解详情。');
        }
    }

    // 工具函数
    function formatNumber(num) {
        const n = parseInt(num) || 0;
        return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' :
               n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
    }

    function isValidEpisode(title) {
        if (!title || typeof title !== 'string') return false;
        const titleLower = title.toLowerCase().trim();
        const excludeKeywords = ['contribute', 'see all', 'episode guide', 'imdb', 'browse episodes'];
        return titleLower.length > 2 && 
               !excludeKeywords.some(keyword => titleLower.includes(keyword)) &&
               !/^[\d\s\-\.\(\)]+$/.test(titleLower);
    }

    function getShowTitle() {
        const selectors = [
            'h1[data-testid="hero__pageTitle"] span',
            'h1.titleBar-title', 
            'h1 .itemprop', 
            'h1',
            '.titleBar-title', 
            '.hero__pageTitle'
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

})();
