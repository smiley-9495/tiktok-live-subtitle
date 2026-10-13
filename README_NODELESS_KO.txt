TikTok LIVE 자막 - GitHub + Cloudflare 원격 배포 (내 PC Node.js 불필요)

내 PC에 Node.js를 설치하지 않고 GitHub 저장소와 Cloudflare의 빌드/배포 기능을 사용합니다.

포함 파일
- public/index.html: 마이크 녹음, Whisper 원문 인식/영어 번역 설정
- public/overlay.html: LIVE Studio 브라우저 소스용 오버레이
- src/worker.js: Workers AI Whisper 호출, WebSocket/Durable Object 멀티룸
- wrangler.toml: AI binding 및 Durable Object 설정

배포
1. GitHub에서 저장소를 만들고 ZIP 안의 파일/폴더를 저장소 최상위에 올립니다.
2. Cloudflare 대시보드에서 GitHub 저장소를 연결하고 Root directory는 저장소 루트로 둡니다.
3. 빌드/배포 명령은 프로젝트 환경에 맞게 `npm install`과 `npm run deploy`로 설정합니다.
4. 배포 후 HTTPS 주소를 열고 마이크 권한을 허용합니다.
5. 사이트에서 자막 시작을 누른 뒤 오버레이 링크를 복사해 LIVE Studio 브라우저 소스에 입력합니다.

지원/한계
- Whisper는 다양한 언어를 자동 인식해 원문으로 표시할 수 있습니다.
- Whisper의 내장 음성 번역 작업은 영어를 출력합니다. 중국어·일본어 등 임의의 목표 언어 번역은 Whisper만으로 지원되지 않습니다.
- Google 번역 및 다른 외부 번역 서비스는 이 버전에서 호출하지 않습니다.
- 원문과 영어를 모두 선택하면 Whisper를 두 번 실행하므로 사용량이 증가합니다.
- 마이크 오디오는 음성 처리를 위해 Cloudflare로 전송됩니다. Workers AI 사용량/비용을 확인하세요.
- 실제 Cloudflare 배포와 LIVE Studio 연동은 배포 후 테스트가 필요합니다.
