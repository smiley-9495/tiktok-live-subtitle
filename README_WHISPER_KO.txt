Cloudflare Workers AI Whisper 적용 버전

이 버전은 기존 Web Speech API 음성인식을 제거하고, 브라우저 마이크 오디오를 Cloudflare Worker로 보내 Workers AI Whisper large-v3-turbo로 한국어 텍스트로 변환합니다. 인식 결과는 기존 Google 공개 번역 스크립트로 전달됩니다. Google 번역 외의 번역 서비스는 추가하지 않았습니다.

주요 파일
- public/index.html: 마이크 녹음, 약 6초 단위 오디오 전송, 번역 UI
- public/overlay.html: TikTok LIVE Studio용 오버레이
- src/worker.js: /api/transcribe Whisper 처리, /api/translate Google 공개 번역, Durable Object 멀티룸
- wrangler.toml: Workers AI binding 설정 포함

GitHub + Cloudflare 적용
1. ZIP을 풀고 파일 전체를 기존 GitHub 저장소 루트에 덮어씁니다. package.json, wrangler.toml, src, public가 저장소 루트에 있어야 합니다.
2. GitHub에 커밋합니다.
3. Cloudflare Worker가 해당 GitHub 저장소에서 배포되도록 연결되어 있다면 자동 배포를 기다리거나 Cloudflare 대시보드에서 재배포합니다.
4. wrangler.toml에 [ai] binding = "AI" 설정이 포함되어 있어야 합니다. 이 ZIP에는 포함되어 있습니다.
5. 배포한 HTTPS 주소를 Chrome/Edge에서 열고 마이크 권한을 허용한 뒤 자막 시작을 누릅니다.
6. 기존 방 코드와 오버레이 링크 사용 방식은 유지됩니다.

동작 및 한계
- Whisper는 약 6초 단위로 오디오를 처리하므로 브라우저 Web Speech API보다 지연이 발생할 수 있습니다. 네트워크와 모델 처리 시간에 따라 지연은 달라집니다.
- 처리 속도가 느릴 때 오디오가 무한히 쌓이지 않도록 대기 오디오는 최대 1개만 보관합니다. 이 때문에 처리 속도가 녹음보다 느리면 일부 구간이 생략될 수 있습니다.
- 마이크 오디오는 음성인식을 위해 Cloudflare로 전송됩니다. 이전 브라우저 내 음성인식 방식과 개인정보 처리 특성이 다릅니다.
- Workers AI 사용량에 따라 과금 또는 계정 한도가 적용될 수 있습니다. Cloudflare 대시보드에서 현재 가격과 사용량을 확인하세요.
- Google 번역은 공개 비공식 엔드포인트만 사용하므로 HTTP 429 등 제한이 발생할 수 있습니다. 이를 줄이기 위해 Worker 인스턴스 내 요청 간격을 1.5초로 늘리고, 번역 작업을 직렬화하며, 429 응답은 대기 후 최대 3회 시도하도록 조정했습니다. 브라우저 번역 요청 타임아웃도 40초로 늘렸습니다. 이는 제한을 우회하거나 완전히 없애는 방법은 아니며, 서로 다른 Worker 인스턴스 사이의 전역 제한도 아닙니다.
- 이 ZIP은 코드 문법과 압축 무결성만 검사했습니다. 실제 Cloudflare 배포, 마이크 녹음, Workers AI 실행 및 LIVE Studio 동작은 사용자의 계정에서 테스트해야 합니다.
