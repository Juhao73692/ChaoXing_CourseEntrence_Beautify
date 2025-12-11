// ==UserScript==
// @name         学习通课程页面美化 + 搜索
// @namespace    https://example.com/
// @version      1.6 (深度性能优化)
// @description  采用 GPU 优化和非重排隐藏技术，彻底解决卡顿问题
// @match        *://*.chaoxing.com/*
// @match        *://*.ecust.edu.cn/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    function waitForList() {
        const list = document.querySelectorAll(
            "#hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc]"
        );
        if (list.length > 0) {
            beautifyPage();
            convertToBackground();
            addSearchBox();
        } else {
            setTimeout(waitForList, 500);
        }
    }
    waitForList();

    //---------------------------------------------------
    // 1. 页面美化（重点优化 GPU 渲染性能）
    //---------------------------------------------------
    function beautifyPage() {
        const css = `
            /* 使用 opacity/visibility 隐藏，避免重排 */
            .cx_visually_hidden {
                opacity: 0 !important;
                visibility: hidden !important;
                /* 使用 transform 来平滑过渡隐藏效果 */
                transform: scale(0.95);
                transition: opacity 0.25s, visibility 0.25s, transform 0.25s;
                /* 确保不占用点击空间，但仍然占用布局空间 */
                pointer-events: none;
            }

            #hlStudy #studyMenu .jwkc .wzy_couros ul {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                grid-gap: 12px !important;
                /* 减少页面加载和滚动时的重排 */
                align-items: stretch; 
            }

            #hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc] {
                position: relative;
                border-radius: 10px;
                padding: 14px !important;
                list-style: none;
                cursor: pointer;
                overflow: hidden;
                background: rgba(255,255,255,0.98); 
                transition: box-shadow .25s, transform .2s, opacity .25s, visibility .25s;
                
                /* ！！关键优化！！强制将卡片提升为独立渲染层，交由 GPU 处理 */
                transform: translateZ(0); 
                will-change: transform, box-shadow, opacity; 
            }
            
            #hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc]:hover {
                box-shadow: 0 6px 16px rgba(0,0,0,0.15); /* 稍微增大阴影，提高视觉效果 */
                transform: translateY(-2px) translateZ(0); /* 保持 translateZ(0) */
            }

            /* ... 其他保持不变或微调的样式 ... */
            .cx_bg_layer {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 0.15;
                z-index: 1;
            }

            .cx_text_layer {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                gap: 2px;
            }

            .wzy_couros_name {
                font-size: 17px !important;
                font-weight: bold;
                line-height: 1.3;
                color: #222;
            }

            .wzy_couros_xueyuan {
                font-size: 14px;
                color: #444;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .wzy_couros_keshi {
                font-size: 12px;
                color: #666;
            }

            .wkccj {
                display: none !important;
            }

            /* 搜索框固定右上角 */
            #chaoxing_search_box {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                width: 180px !important;
                padding: 8px 10px !important;
                background: white !important;
                border: 1px solid #aaa !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                z-index: 99999 !important;
                /* 确保搜索框自己也被提升到 GPU 层 */
                transform: translateZ(0); 
            }
        `;

        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    //---------------------------------------------------
    // 2. 保留背景图功能 (不变)
    //---------------------------------------------------
    function convertToBackground() {
        const items = document.querySelectorAll(
            "#hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc]"
        );

        items.forEach(li => {
            const img = li.querySelector(".wzy_couros_pic img");
            const url = img?.src || "";

            const bg = document.createElement("div");
            bg.className = "cx_bg_layer";
            if (url) bg.style.backgroundImage = `url("${url}")`;

            const textLayer = document.createElement("div");
            textLayer.className = "cx_text_layer";

            const name = li.querySelector(".wzy_couros_name");
            const teacher = li.querySelector(".wzy_couros_xueyuan");
            const xuefen = li.querySelector(".wzy_couros_keshi");

            if (name) textLayer.appendChild(name);
            if (teacher) textLayer.appendChild(teacher);
            if (xuefen) textLayer.appendChild(xuefen);

            li.innerHTML = "";
            li.appendChild(bg);
            li.appendChild(textLayer);
        });
    }

    //---------------------------------------------------
    // 3. 搜索框（使用 opacity/visibility 避免重排）
    //---------------------------------------------------
    function addSearchBox() {
        const box = document.createElement("input");
        box.id = "chaoxing_search_box";
        box.placeholder = "搜索标题或教师…";
        document.body.appendChild(box);

        let timer;
        box.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const key = box.value.trim().toLowerCase();
                const list = document.querySelectorAll(
                    "#hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc]"
                );

                list.forEach(li => {
                    const title = li.querySelector(".wzy_couros_name")?.innerText.toLowerCase() || "";
                    const teacher = li.querySelector(".wzy_couros_xueyuan")?.innerText.toLowerCase() || "";
                    
                    // 优化：使用 classList.toggle 切换 .cx_visually_hidden
                    const isHidden = !(key === "" || title.includes(key) || teacher.includes(key));
                    li.classList.toggle("cx_visually_hidden", isHidden);
                });
            }, 100); // 防抖时间缩短到 100ms
        });
    }
})();