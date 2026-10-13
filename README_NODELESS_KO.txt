TikTok LIVE 번역 자막 - HTML 화면 + 링크형 오버레이 (내 PC에 Node.js 설치 불필요)

이 프로젝트는 웹 화면은 HTML/JavaScript이고, TikTok LIVE Studio의 브라우저 소스에 넣을 링크형 오버레이를 위해 Cloudflare Worker + Durable Object 실시간 중계가 포함되어 있습니다.

중요한 구분
- 내 컴퓨터에 Node.js를 설치할 필요가 없습니다.
- HTML 파일만 정적 호스팅에 올리는 것만으로는 별도 브라우저 소스에 자막을 실시간 전달할 수 없습니다. 그래서 Cloudflare 쪽에 WebSocket 중계 Worker를 배포합니다.
- 배포 후 사이트 주소는 https://프로젝트이름.workers.dev 형태가 됩니다.

포함 파일
- public/index.html: 사이트 본 화면, 한국어 음성 인식, 번역, 언어 ON/OFF, 투명도, 오버레이 링크 복사
- public/overlay.html: TikTok LIVE Studio 브라우저 소스용 자막 화면
- src/worker.js: WebSocket 실시간 자막 중계와 방(room) 상태 저장
- wrangler.toml: Cloudflare 배포 설정
- package.json: Cloudflare 원격 빌드/배포용 스크립트

배포 순서 (Node.js는 Cloudflare 서버에서 사용되며, 내 PC에 설치하지 않음)

1. GitHub 저장소 만들기
- https://github.com 에 로그인하고 New repository를 선택합니다.
- 저장소를 예: tiktok-live-subtitle 로 만듭니다.
- 이 ZIP의 압축을 풉니다.
- 압축 푼 폴더 안의 파일/폴더를 저장소 최상위에 업로드합니다. 저장소 최상위에 package.json, wrangler.toml, src/worker.js, public/index.html, public/overlay.html 이 보여야 합니다.
- Commit changes를 누릅니다.

2. Cloudflare에서 Git 저장소 연결
- https://dash.cloudflare.com/ 에 로그인합니다.
- Workers & Pages 또는 Workers Builds에서 Git 저장소 연결/Builds 설정을 선택합니다. 화면 명칭은 계정 UI에 따라 조금 다를 수 있습니다.
- GitHub를 연결하고 방금 만든 저장소를 선택합니다.
- Root directory는 저장소 루트로 둡니다.
- Build command: npm install
- Deploy command: npm run deploy
- 배포 환경에 Cloudflare API 토큰을 별도로 직접 입력하라고 나오면, 안내에 따라 Workers 배포 권한이 있는 인증을 설정합니다. 토큰을 코드 파일에 적거나 공개 저장소에 올리지 마세요.
- 배포를 시작합니다. 이 과정은 Cloudflare의 빌드 환경에서 실행되므로 내 PC에 Node.js가 필요하지 않습니다.

3. 사이트와 오버레이 사용
- 배포가 끝나면 표시되는 https://....workers.dev 주소를 Chrome/Edge에서 엽니다.
- 사이트에서 마이크 권한을 허용하고 '자막 시작'을 누릅니다.
- 사이트의 '오버레이 URL'에서 '링크 복사'를 누릅니다.
- TikTok LIVE Studio에서 브라우저 소스를 추가하고 URL 칸에 붙여넣습니다.
- 한국어/영어/중국어/일본어 ON/OFF와 배경 투명도는 사이트 본 화면에서 설정합니다.

문제 해결
- 오버레이가 연결되지 않으면 사이트 본 화면의 오버레이 URL이 https://로 시작하는지, 링크의 room 코드가 있는지 확인하세요.
- Cloudflare Worker 빌드 로그에 배포 권한 오류가 나오면 저장소 코드를 바꾸기보다 Cloudflare Git 연동/배포 인증 설정을 확인하세요.
- 마이크 음성 인식은 Chrome/Edge의 Web Speech API 지원과 권한, 인터넷 상태에 따라 달라집니다.
- 번역은 무료 Google 번역 공개 엔드포인트 API를 사용하므로 요청 제한/지연/서비스 장애가 있을 수 있습니다.
- 무료 호스팅의 사용량/요금 정책은 변경될 수 있습니다. 트래픽이 늘면 Cloudflare의 현재 사용량과 요금 정책을 확인하세요.

개인정보/공유 주의
- 자막 내용은 해당 room의 오버레이 링크를 통해 실시간 공유됩니다. 링크를 아는 사람은 그 방의 자막을 볼 수 있으므로 공개 게시판 등에 올리지 마세요.
- 사이트 본 화면은 브라우저 음성 인식을 사용하며, 브라우저/음성 인식 제공자의 처리 정책이 적용됩니다.

검증 안내
- 실제 Cloudflare 계정에 배포하거나 TikTok LIVE Studio에서 실시간 동작을 확인한 것은 아닙니다. 처음 배포한 뒤 자막 시작, 번역, 오버레이 URL 표시를 순서대로 테스트하세요. 어떤 외부 서비스 조합도 오류가 절대 없다고 보장할 수는 없습니다.


Microsoft Translator 우선 설정은 README_MICROSOFT_TRANSLATOR_KO.txt를 확인하세요. Microsoft API 키는 GitHub에 넣지 말고 Cloudflare Secret MICROSOFT_TRANSLATOR_KEY로 설정하세요.
