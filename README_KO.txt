TikTok LIVE 번역 자막 - 링크형 오버레이 버전

이 버전은 방송 프로그램의 브라우저 소스에 오버레이 URL을 직접 붙여넣을 수 있도록, Cloudflare Worker + Durable Object 실시간 전달 서버를 포함합니다. 정적 Pages에 HTML만 올리는 기존 방식과 달리 Worker 배포가 필요합니다.

파일
- public/index.html : 자막 설정/음성 인식/번역 페이지
- public/overlay.html : 브라우저 소스용 오버레이 페이지
- src/worker.js : WebSocket 실시간 자막 중계 + Durable Object 방(room)
- wrangler.toml : Cloudflare 배포 설정

배포 방법 (무료 사용량 내에서 우선 운영)
1. Node.js LTS를 설치합니다: https://nodejs.org/
2. 이 폴더에서 터미널/명령 프롬프트를 엽니다.
3. `npm install` 을 실행합니다.
4. `npx wrangler login` 을 실행하고 Cloudflare 계정에 로그인합니다.
5. `npx wrangler deploy` 를 실행합니다.
6. 배포 완료 메시지에 표시된 https://...workers.dev 주소를 엽니다.
7. 사이트 본 화면에서 `자막 시작`을 누르고 마이크 권한을 허용합니다.
8. `오버레이 URL` 항목의 `링크 복사`를 누릅니다.
9. TikTok LIVE Studio에서 브라우저 소스를 추가하고 URL 칸에 붙여넣습니다.

실시간 연결 방식
- 본 화면과 오버레이 URL은 같은 room ID를 사용합니다.
- 자막/설정은 WebSocket으로 Cloudflare Worker Durable Object에 전달됩니다.
- 브라우저 소스는 별도 브라우저 프로필이어도 같은 링크의 room에 접속해 자막을 받습니다.
- room ID는 URL에 포함되므로, 링크를 아는 사람은 그 방의 자막을 볼 수 있습니다. 방송에 쓰는 동안만 공유하세요.

주의
- 실제 배포와 TikTok LIVE Studio 내 동작은 계정/환경에 따라 확인이 필요합니다. 오류가 절대 발생하지 않는다고 보장할 수는 없습니다.
- 음성 인식은 Chrome/Edge Web Speech API를 사용합니다. 브라우저 지원/마이크 권한/인터넷에 따라 달라질 수 있고 일부 브라우저는 외부 음성 인식 서비스를 사용할 수 있습니다.
- 번역은 무료 MyMemory API에 의존하므로 요청 제한, 지연, 장애가 발생할 수 있습니다.
- Cloudflare 무료 사용량 한도/상품 정책은 변경될 수 있습니다. 이용자가 많아지면 요금과 사용량을 확인하세요.
- 링크를 알고 있는 다른 사람이 같은 room으로 메시지를 보낼 수 있으므로 민감한 내용을 자막 처리하지 마세요.
