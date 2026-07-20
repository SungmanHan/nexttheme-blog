# nexttheme-blog

NextTheme 종가베팅 알고리즘의 일일 분석 리포트를 게시하는 정적 사이트입니다.

- **사이트**: https://sungmanhan.github.io/nexttheme-blog/
- **빌드**: Jekyll 4.x (Ruby 3.2)
- **배포**: GitHub Actions → `gh-pages` 브랜치

## 콘텐츠 종류

| 카테고리 | 발행 시각 | 비고 |
|---|---|---|
| 브리핑 | 매일 06:10 | 평일·주말 모두 |
| 장중 스냅샷 | 평일 10:10 / 12:10 / 14:40 | 짧은 호흡 |
| 종가베팅 (최종) | 평일 15:30 | 전체 분석 |
| 주간리뷰 | 일 22:10 | 주간 회고·전망 |
| 종목 상세 | 이벤트 (`/detail` 호출 후) | 시점별 스냅샷 |
| 매매일지 | 이벤트 (`/buy`·`/sell` 후) | 평단·수량·손익 공개 |

## 동기화 흐름

```
[로컬 PC NextTheme]
  Spring cron → MD 생성 (outputs/blog/)
       ↓
  scripts/sync-blog.sh (cron)
       ↓
  scripts/convert-md.py (frontmatter 자동 주입)
       ↓
  git push (이 repo)
       ↓
[GitHub Actions]
  Jekyll build → gh-pages 배포
```

## 로컬 빌드

```bash
bundle install
bundle exec jekyll serve
# http://localhost:4000/nexttheme-blog/
```

## 라이선스

콘텐츠는 NextTheme 알고리즘 분석 결과로, 투자 권유가 아닌 정보 제공입니다.
