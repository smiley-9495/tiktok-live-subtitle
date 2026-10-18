# 한국어 실시간 자막 (Cloudflare Workers)

## 저장소 구조 (루트에 wrangler.jsonc 가 보여야 합니다)
```
wrangler.jsonc
package.json
src/worker.js
public/index.html     (컨트롤 페이지)
public/overlay.html   (오버레이)
```

## 배포
1. 이 파일들을 GitHub 저장소 루트에 올립니다 (폴더째 말고 내용물을 루트에).
2. Cloudflare 대시보드 → Workers & Pages → Create → **Workers** 탭 → Import a repository.
   (Pages 탭의 Connect to Git 은 Durable Objects 를 지원하지 않아 쓰면 안 됩니다.)
3. 프로젝트 이름은 `korean-live-caption` (wrangler.jsonc 의 name 과 같아야 함).
4. Build command: 비워 두기 / Deploy command: `npx wrangler deploy` / Root directory: `/`
5. 배포 후 Settings → Variables and Secrets → **Secret** 으로 `CONTROL_KEY` 추가 → 저장 후 Deploy.
6. `https://<이름>.<계정>.workers.dev/health` 가 `ok` 로 보이면 성공.
