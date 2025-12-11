// ==UserScript==
// @name         学习通课程页面美化 + 搜索
// @namespace    https://example.com/
// @version      2.0 (性能优化与搜索功能修复)
// @description  整合 v1.6 优秀性能，修复搜索过滤导致的滚动距离问题。
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
    // 1. 页面美化（保留 GPU 优化，修复过滤 CSS）
    //---------------------------------------------------
    function beautifyPage() {
        const css = `
            /* 修正：使用 display: none 确保元素不占用空间，修复滚动高度 */
            .cx_hidden_display {
                display: none !important;
            }

            #hlStudy #studyMenu .jwkc .wzy_couros ul {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                grid-gap: 12px !important;
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

                /* ！！关键修正！！ 移除与 opacity/visibility 相关的过渡，只保留 hover 效果过渡 */
                transition: box-shadow .25s, transform .2s;

                /* 保留 v1.6 的 GPU 优化 */
                transform: translateZ(0);
                will-change: transform, box-shadow;
            }

            #hlStudy #studyMenu .jwkc .wzy_couros ul li[kcenc]:hover {
                box-shadow: 0 6px 16px rgba(0,0,0,0.15);
                transform: translateY(-2px) translateZ(0);
            }

            /* 背景图层 */
            .cx_bg_layer {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 0.15;
                z-index: 1;
            }

            /* 文字层 */
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
    // 3. 搜索框（修复过滤逻辑，使用 display: none）
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

                    const isHidden = !(key === "" || title.includes(key) || teacher.includes(key));

                    // 修正：使用 cx_hidden_display 类 (display: none)
                    li.classList.toggle("cx_hidden_display", isHidden);

                });
            }, 100); // 100ms 防抖
        });
    }
})();