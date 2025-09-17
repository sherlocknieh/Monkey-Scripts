// ==UserScript==
// @name         IMDb剧集信息提取器
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  提取IMDb剧集页面的剧集信息
// @author       You
// @match        *://www.imdb.com/title/*/episodes*
// @grant        none
// ==/UserScript==

(function() {
    'use strict'; // 启用现代JS语法标准

    let episodes = [];  // 存储剧集信息的数组
    let extractButton = null;   // 提取按钮存在标志
    let downloadButton = null;  // 下载按钮存在标志

// 初始化按钮

    // 页面加载完成后添加提取按钮
    window.addEventListener('load', addExtractButton);

    // 添加提取按钮
    function addExtractButton() {

        if (extractButton) return;        // 避免重复创建按钮

        extractButton = document.createElement('button');  // 创建按钮
        extractButton.textContent = '提取剧集信息';        // 添加文本
        extractButton.style.cssText =                      // 设置样式
        `
            position: fixed;                /* 位置基于浏览器窗口 */
            top: 20px;                      /* 距离顶部 20px */
            right: 20px;                    /* 距离右侧 20px */
            z-index: 10000;                 /* 确保按钮在其他元素之上 */
            padding: 10px 20px;             /* 内边距: 10px 20px */
            background-color: #f5c518;    /* 背景颜色: 黄色 */
            color: #000;                    /* 文字颜色: 黑色 */
            border: none;                   /* 无边框 */
            border-radius: 5px;             /* 圆角: 5px */
            font-size: 14px;                /* 字体大小: 14px */
            font-weight: bold;              /* 字体加粗 */
            cursor: pointer;                /* 鼠标悬停时显示为指针 */
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);  /* 阴影: 0 2px 5px  rgba(0,0,0,0.2) */
        `;

        extractButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e6b800';  // 鼠标悬停时高亮颜色
        });

        extractButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f5c518';  // 鼠标移出时恢复颜色
        });

        extractButton.addEventListener('click', extractEpisodeInfo); // 鼠标点击时触发提取操作

        document.body.appendChild(extractButton);    // 添加按钮到 body 中
    }

// 提取

    // 添加创建加载动画的函数
    function createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.id = 'imdb-loading-spinner';
        spinner.style.cssText = `
            position: fixed;
            top: 20px;
            right: 200px;
            z-index: 10001;
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #f5c518;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        // 添加CSS动画
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(spinner);
        return spinner;
    }

    // 移除加载动画
    function removeLoadingSpinner() {
        const spinner = document.getElementById('imdb-loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    // 修改提取剧集信息函数
    function extractEpisodeInfo() {
        console.log('开始提取剧集信息...');
        
        // 显示加载动画
        const spinner = createLoadingSpinner();
        
        // 禁用按钮并更改文本
        extractButton.disabled = true;
        extractButton.textContent = '提取中...';
        extractButton.style.backgroundColor = '#ccc';
        extractButton.style.cursor = 'not-allowed';
        
        setTimeout(() => {
            try {
                episodes = [];
                
                let episodeElements = document.querySelectorAll('[data-testid="episodes-browse-episode"]');
                
                if (episodeElements.length === 0) {
                    console.log('未找到主要选择器，尝试备用选择器...');
                    episodeElements = document.querySelectorAll('.episode-item-wrapper, .titleColumn, .cli-episode-item, .episode, .episode-card, .episode-list-item');
                }
                
                if (episodeElements.length === 0) {
                    console.log('未找到剧集元素，尝试更广泛的搜索...');
                    const allElements = document.querySelectorAll('div, article, section, li');
                    episodeElements = Array.from(allElements).filter(el => {
                        const text = el.textContent || '';
                        return /S\d+\.E\d+|Episode \d+|第\d+集/i.test(text) && el.children.length > 0;
                    });
                }
                
                console.log(`找到 ${episodeElements.length} 个潜在的剧集元素`);
                
                if (episodeElements.length === 0) {
                    alert('未找到剧集信息。可能原因：\n1. 页面内容尚未完全加载\n2. 页面结构已更改\n3. 需要登录或特殊权限\n\n请刷新页面后重试，或在剧集列表完全显示后再点击提取按钮。');
                    return;
                }
                
                episodeElements.forEach((element, index) => {
                    try {
                        const episodeNumber = extractEpisodeNumber(element);
                        const title = extractTitle(element);
                        const rating = extractRating(element);
                        const voteCount = extractVoteCount(element);
                        const link = extractLink(element);
                        
                        if (isValidEpisode(title, episodeNumber)) {
                            const episode = {
                                episodeNumber: episodeNumber || `第${index + 1}集`,
                                title: title || '未知标题',
                                rating: rating || '未知评分',
                                voteCount: voteCount || '未知',
                                link: link || '未知链接'
                            };
                            
                            episodes.push(episode);
                            
                            console.log(`剧集 ${episode.episodeNumber}:`);
                            console.log(`标题: ${episode.title}`);
                            console.log(`评分: ${episode.rating}`);
                            console.log(`打分人数: ${episode.voteCount}`);
                            console.log(`链接: ${episode.link}`);
                            console.log('---');
                        }
                    } catch (error) {
                        console.error(`处理第 ${index + 1} 个剧集元素时出错:`, error);
                    }
                });
                
                if (episodes.length > 0) {
                    console.log(`成功提取 ${episodes.length} 个剧集信息`);
                    createDownloadButton();
                    downloadEpisodeData('csv'); // 自动下载CSV文件
                } else {
                    alert('未能提取到有效的剧集信息。请检查页面是否正确加载了剧集列表。');
                }
                
            } catch (error) {
                console.error('提取剧集信息时发生错误:', error);
                alert('提取过程中发生错误，请查看控制台了解详情。');
            } finally {
                // 无论成功还是失败都要移除动画并恢复按钮
                removeLoadingSpinner();
                extractButton.disabled = false;
                extractButton.textContent = '提取剧集信息';
                extractButton.style.backgroundColor = '#f5c518';
                extractButton.style.cursor = 'pointer';
            }
        }, 2000);
    }

    // 验证是否为有效剧集的函数
    function isValidEpisode(title, episodeNumber) {
        if (!title || typeof title !== 'string') return false;

        const titleLower = title.toLowerCase().trim();

        // 排除的关键词
        const excludeKeywords = [
            'contribute to this page',
            'more from this title',
            'see all episodes',
            'episode guide',
            'season',
            'series',
            'show',
            'cast',
            'crew',
            'imdb',
            'rating',
            'review',
            'photo',
            'video',
            'news',
            'trivia',
            'goofs',
            'quotes',
            'connections',
            'soundtracks',
            'technical specs',
            'browse episodes',
            'add episode',
            'edit page'
        ];

        // 检查是否包含排除关键词
        if (excludeKeywords.some(keyword => titleLower.includes(keyword))) {
            return false;
        }

        // 检查标题长度（太短的可能不是真正的剧集标题）
        if (titleLower.length < 2) return false;

        // 检查是否只包含特殊字符或数字
        if (/^[\d\s\-\.\(\)]+$/.test(titleLower)) return false;

        return true;
    }

    // 提取剧集编号
    function extractEpisodeNumber(element) {
        let episodeNumber = '';

        // 从标题中提取剧集编号
        const titleSelectors = [
            'h4 a',
            'h3 a',
            '.titleColumn h4 a',
            '[data-testid="episode-title"]',
            '.episode-title',
            '.cli-title a'
        ];

        for (const selector of titleSelectors) {
            try {
                const titleElement = element.querySelector(selector);
                if (titleElement) {
                    const titleText = titleElement.textContent?.trim() || '';
                    const episodeMatch = titleText.match(/S(\d+)\.E(\d+)|Season\s+(\d+).*Episode\s+(\d+)|第(\d+)集|E(\d+)/i);
                    if (episodeMatch) {
                        if (episodeMatch[1] && episodeMatch[2]) {
                            episodeNumber = `S${episodeMatch[1]}.E${episodeMatch[2]}`;
                        } else if (episodeMatch[3] && episodeMatch[4]) {
                            episodeNumber = `S${episodeMatch[3]}.E${episodeMatch[4]}`;
                        } else if (episodeMatch[5]) {
                            episodeNumber = `第${episodeMatch[5]}集`;
                        } else if (episodeMatch[6]) {
                            episodeNumber = `E${episodeMatch[6]}`;
                        }
                        break;
                    }
                }
            } catch (error) {
                console.warn(`剧集编号提取出错 (${selector}):`, error);
            }
        }

        return episodeNumber;
    }

    // 提取标题
    function extractTitle(element) {
        let title = '';
        const titleSelectors = [
            'h4 a',
            'h3 a',
            '.titleColumn h4',
            '.titleColumn h4 a',
            '[data-testid="episode-title"]',
            '.episode-title',
            '.cli-title a'
        ];

        for (const selector of titleSelectors) {
            try {
                const titleElement = element.querySelector(selector);
                if (titleElement) {
                    title = titleElement.textContent?.trim() || '';
                    if (title) {
                        // 清理标题，移除剧集编号前缀
                        title = title.replace(/^S\d+\.E\d+\s*[\-:]?\s*/i, '')
                                    .replace(/^Season\s+\d+.*Episode\s+\d+\s*[\-:]?\s*/i, '')
                                    .replace(/^第\d+集\s*[\-:]?\s*/i, '')
                                    .replace(/^E\d+\s*[\-:]?\s*/i, '')
                                    .trim();
                        break;
                    }
                }
            } catch (error) {
                console.warn(`标题提取出错 (${selector}):`, error);
            }
        }

        return title;
    }

    // 提取评分
    function extractRating(element) {
        let rating = '';
        
        // 评分选择器
        const ratingSelectors = [
            '.ipc-rating-star--rating',
            '.ratingColumn strong',
            '[data-testid="episode-rating"]',
            '.titleColumn .ipl-rating-star__rating',
            '.cli-rating-with-count'
        ];

        for (const selector of ratingSelectors) {
            const ratingElement = element.querySelector(selector);
            if (ratingElement) {
                rating = ratingElement.textContent.trim();
                if (rating) break;
            }
        }

        return rating;
    }

    // 提取打分人数
    function extractVoteCount(element) {
        let voteCount = '';
        const voteSelectors = [
            '.ipc-rating-star--voteCount',
            '.ratingColumn span[title]',
            '[data-testid="episode-vote-count"]',
            '.titleColumn .ipl-rating-star__total-votes',
            '.cli-rating-with-count .cli-vote-count'
        ];

        for (const selector of voteSelectors) {
            const voteElement = element.querySelector(selector);
            if (voteElement) {
                let voteText = voteElement.textContent.trim();
                // 提取数字，支持K、M等单位
                const voteMatch = voteText.match(/([\d,]+(?:\.\d+)?[KM]?)/i);
                if (voteMatch) {
                    voteCount = voteMatch[1];
                    break;
                }
                // 也尝试从title属性获取
                const titleAttr = voteElement.getAttribute('title');
                if (titleAttr) {
                    const titleMatch = titleAttr.match(/([\d,]+)/);
                    if (titleMatch) {
                        voteCount = titleMatch[1];
                        break;
                    }
                }
            }
        }

        // 如果在评分元素的父级或兄弟元素中查找打分人数
        if (!voteCount) {
            const ratingParent = element.querySelector('.ipc-rating-star, .ratingColumn, .cli-rating-with-count');
            if (ratingParent) {
                const voteText = ratingParent.textContent;
                const voteMatch = voteText.match(/\(([\d,]+(?:\.\d+)?[KM]?)\s*votes?\)|([\d,]+(?:\.\d+)?[KM]?)\s*votes?/i);
                if (voteMatch) {
                    voteCount = voteMatch[1] || voteMatch[2];
                }
            }
        }

        return voteCount;
    }

    // 提取链接
    function extractLink(element) {
        let link = '';
        const linkSelectors = [
            'a[href^="/title/"]',  // 添加相对路径支持
            '.ipc-title-link-wrapper',  // 添加新的选择器
            '.ipc-lockup-overlay'  // 添加图片链接选择器
        ];

        for (const selector of linkSelectors) {
            const linkElement = element.querySelector(selector);
            if (linkElement) {
                link = linkElement.href;
                // 如果是相对路径，转换为完整URL
                if (link.startsWith('/title/')) {
                    link = 'https://www.imdb.com' + link;
                }
                // 去掉链接末尾的查询参数（如 ?ref_=ttep_ep_1 等）
                if (link.includes('?')) {
                    link = link.split('?')[0];
                }
                break;
            }
        }

        return link;
    }

//下载

    // 创建下载按钮
    function createDownloadButton() {
        // 避免重复创建下载按钮
        if (downloadButton) {
            downloadButton.remove();
        }

        // 创建下载按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;

        // JSON下载按钮
        const jsonButton = document.createElement('button');
        jsonButton.textContent = `下载JSON (${episodes.length}条)`;
        jsonButton.style.cssText = `
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        jsonButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#45a049';
        });

        jsonButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#4CAF50';
        });

        jsonButton.addEventListener('click', () => downloadEpisodeData('json'));

        // TSV下载按钮
        const tsvButton = document.createElement('button');
        tsvButton.textContent = `下载TSV (${episodes.length}条)`;
        tsvButton.style.cssText = `
            padding: 10px 20px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        tsvButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#1976D2';
        });

        tsvButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#2196F3';
        });

        tsvButton.addEventListener('click', () => downloadEpisodeData('csv'));

        buttonContainer.appendChild(jsonButton);
        buttonContainer.appendChild(tsvButton);
        document.body.appendChild(buttonContainer);
        
        downloadButton = buttonContainer; // 保存引用以便后续移除
    }

    // 下载剧集数据
    function downloadEpisodeData(format = 'json') {
        try {
            // 增强的片名提取逻辑
            let showTitle = "IMDb剧集"; // 默认名称
            
            try {
                // 优先使用subtitle选择器（最准确）
                const subtitleElement = document.querySelector('h2[data-testid="subtitle"]');
                if (subtitleElement && subtitleElement.textContent.trim()) {
                    showTitle = subtitleElement.textContent.trim();
                    console.log('从subtitle提取片名:', showTitle);
                } else {
                    // 备选方案：从页面标题提取
                    const titleSelectors = [
                        'title',
                        'h1[data-testid="hero__pageTitle"]',
                        'h1.titleBar-title',
                        '.title_wrapper h1',
                        'h1',
                        'meta[property="og:title"]'
                    ];
                    
                    for (const selector of titleSelectors) {
                        try {
                            const element = document.querySelector(selector);
                            if (element) {
                                let text = '';
                                if (selector === 'meta[property="og:title"]') {
                                    text = element.getAttribute('content') || '';
                                } else {
                                    text = element.textContent || element.innerText || '';
                                }
                                
                                if (text.trim()) {
                                    // 清理标题文本
                                    showTitle = text.trim()
                                        .replace(/\s*\(TV Series.*?\).*$/i, '') // 移除 (TV Series 年份)
                                        .replace(/\s*-\s*Episode list.*$/i, '') // 移除 - Episode list
                                        .replace(/\s*-\s*IMDb.*$/i, '') // 移除 - IMDb
                                        .replace(/\s*\|.*$/i, '') // 移除 | 后面的内容
                                        .trim();
                                    
                                    if (showTitle && showTitle !== 'IMDb') {
                                        console.log(`从${selector}提取片名:`, showTitle);
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(`选择器 ${selector} 提取失败:`, e);
                        }
                    }
                }
            } catch (error) {
                console.error('片名提取过程出错:', error);
            }
            
            // 清理文件名中的非法字符
            const cleanTitle = showTitle.replace(/[<>:"/\\|?*]/g, '_');
            
            let seasonInfo = '';
            let episodeRange = '';
            
            if (episodes.length > 0) {
                // 从第一个和最后一个剧集中提取季数信息
                const firstEpisode = episodes[0].episodeNumber;
                const lastEpisode = episodes[episodes.length - 1].episodeNumber;
                
                // 提取季数
                const seasonMatch = firstEpisode.match(/S(\d+)/i);
                if (seasonMatch) {
                    seasonInfo = `S${seasonMatch[1]}`;
                } else {
                    seasonInfo = 'S1'; // 默认第一季
                }
                
                // 确定集数范围
                const firstEpMatch = firstEpisode.match(/E(\d+)/i);
                const lastEpMatch = lastEpisode.match(/E(\d+)/i);
                
                if (firstEpMatch && lastEpMatch) {
                    const firstEpNum = firstEpMatch[1];
                    const lastEpNum = lastEpMatch[1];
                    
                    if (firstEpNum === lastEpNum) {
                        episodeRange = `E${firstEpNum}`;
                    } else {
                        episodeRange = `E${firstEpNum}-E${lastEpNum}`;
                    }
                } else {
                    episodeRange = `E1-E${episodes.length}`;
                }
            } else {
                seasonInfo = 'S1';
                episodeRange = 'E1';
            }
            
            // 生成文件名：片名-季-集
            const filename = `${cleanTitle}-${seasonInfo}-${episodeRange}`;
            
            let fileContent, mimeType;
            
            if (format === 'csv') {
                // 生成TSV格式
                const headers = ['集数', '标题', '评分', '打分人数', '链接'];
                const tsvContent = [headers.join('\t')];
                
                episodes.forEach(episode => {
                    const row = [
                        episode.episodeNumber || '',
                        episode.title || '',
                        episode.rating || '',
                        episode.voteCount || '',
                        episode.link || ''
                    ];
                    // 处理包含制表符或换行符的字段
                    const cleanRow = row.map(field => 
                        String(field).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '')
                    );
                    tsvContent.push(cleanRow.join('\t'));
                });
                
                fileContent = tsvContent.join('\n');
                mimeType = 'text/tab-separated-values';
            } else {
                // 生成JSON格式
                fileContent = JSON.stringify(episodes, null, 2);
                mimeType = 'application/json';
            }
            
            // 创建下载链接
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

})();
