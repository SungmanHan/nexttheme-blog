// app.js — 검색 모달 + 키보드 단축키 + Service Worker hook (P5에 추가)

(function () {
  'use strict';

  // === Search modal ===
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  if (modal && input && results) {
    // ESC 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
      // ⌘K / Ctrl+K — 검색 열기
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        modal.classList.add('open');
        setTimeout(function () { input.focus(); }, 50);
      }
    });

    // 외부 클릭 시 닫기
    document.addEventListener('click', function (e) {
      if (modal.classList.contains('open') &&
          !modal.contains(e.target) &&
          !e.target.closest('.search-btn')) {
        modal.classList.remove('open');
      }
    });

    // 단순 클라이언트 검색 (포스트 인덱스 — Phase 3에서 search.json 생성 시 활성화)
    let postsIndex = null;
    const indexUrl = (document.querySelector('base')?.href || '/') + 'search.json';

    input.addEventListener('input', function () {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ''; return; }

      if (!postsIndex) {
        fetch(indexUrl)
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (data) {
            postsIndex = data;
            render(q);
          })
          .catch(function () {
            results.innerHTML = '<p style="padding:12px;color:#9ca3af;font-size:12px;">검색 인덱스가 아직 생성되지 않았습니다.</p>';
          });
      } else {
        render(q);
      }
    });

    function render(q) {
      if (!postsIndex) return;
      const matches = postsIndex.filter(function (p) {
        return (p.title && p.title.toLowerCase().includes(q)) ||
               (p.summary && p.summary.toLowerCase().includes(q)) ||
               (p.stocks && p.stocks.toLowerCase().includes(q));
      }).slice(0, 10);

      if (matches.length === 0) {
        results.innerHTML = '<p style="padding:12px;color:#9ca3af;font-size:12px;">결과 없음</p>';
        return;
      }
      results.innerHTML = matches.map(function (p) {
        return '<a href="' + p.url + '" style="display:block;padding:10px 12px;border-bottom:1px solid var(--c-border);font-size:13px;">' +
               '<strong>' + escapeHtml(p.title) + '</strong>' +
               '<div style="color:var(--c-text-sub);font-size:11px;margin-top:2px;">' + escapeHtml(p.date) + '</div>' +
               '</a>';
      }).join('');
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  }

  // === Active scroll restore for tab navigation ===
  const tabsContainer = document.querySelector('.cat-tabs');
  if (tabsContainer) {
    const activeTab = tabsContainer.querySelector('.cat-tab.on');
    if (activeTab) {
      const offset = activeTab.offsetLeft - tabsContainer.offsetLeft - 16;
      tabsContainer.scrollLeft = Math.max(0, offset);
    }
  }

  // === 쿠팡 광고 본문 중간 자동 삽입 (post 페이지 전용) ===
  // post.html 의 .post-body[data-coupang-ad="true"] + #coupang-ad-template 가 있을 때만 동작
  // <template> 안의 <script> 는 cloneNode 후 자동 실행 안 됨 (HTML5 명세) → 새 element 로 재생성
  const postBody = document.querySelector('.post-body[data-coupang-ad="true"]');
  const adTemplate = document.getElementById('coupang-ad-template');
  if (postBody && adTemplate) {
    const blocks = postBody.querySelectorAll('p, h2, h3, table, ul, ol, blockquote');
    if (blocks.length >= 4) {
      const middleIdx = Math.floor(blocks.length / 2);
      const insertBefore = blocks[middleIdx];
      const adFragment = adTemplate.content.cloneNode(true);

      // <script> 들을 새 element 로 재생성하여 실행 가능하게 (cloneNode 한계)
      // 동적 createElement script 는 기본 async=true → DOM 순서 무시 → g.js 와 inline 의
      // 실행 순서가 어그러져 PartnersCoupang is not defined 로 광고 노출 실패.
      // async=false 로 직렬 실행 보장.
      adFragment.querySelectorAll('script').forEach(function (oldScript) {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(function (attr) {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        newScript.async = false;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      insertBefore.parentNode.insertBefore(adFragment, insertBefore);
    }
  }

  // === 주도테마 캘린더 — 월 이동 ===
  const calMonths = Array.from(document.querySelectorAll('.cal-month'));
  if (calMonths.length > 0) {
    const title = document.getElementById('cal-title');
    const prev = document.getElementById('cal-prev');
    const next = document.getElementById('cal-next');

    // 해시(#2026-08)가 유효하면 그 달, 아니면 최신 달
    const hash = (location.hash || '').replace('#', '');
    let idx = calMonths.findIndex(function (m) { return m.dataset.ym === hash; });
    if (idx < 0) idx = calMonths.length - 1;

    function show(i) {
      idx = Math.min(Math.max(i, 0), calMonths.length - 1);
      calMonths.forEach(function (m, n) { m.hidden = (n !== idx); });
      title.textContent = calMonths[idx].dataset.label;
      prev.disabled = (idx === 0);
      next.disabled = (idx === calMonths.length - 1);
      history.replaceState(null, '', '#' + calMonths[idx].dataset.ym);
    }

    prev.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    document.addEventListener('keydown', function (e) {
      // D12: 검색 입력 중에는 좌우 키를 가로채지 않는다 (app.js:38 의 #search-input 과 공존)
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    show(idx);
  }
})();
