Whisper 단독 다국어 음성인식 + 영어 번역 버전

이 버전은 Google 번역, MyMemory, LibreTranslate 등 모든 외부 번역 서비스를 제거했습니다. 음성인식과 영어 번역 모두 Cloudflare Workers AI Whisper 모델만 사용합니다.

지원 방식
- 원문 자막: Whisper가 입력 음성의 언어를 자동 감지해 해당 언어로 받아쓰기합니다. 한국어, 영어, 일본어, 중국어 등 여러 입력 언어를 인식할 수 있습니다.
- 영어 번역: Whisper의 task=translate 기능으로 입력 음성을 영어로 번역합니다.
- 한계: Whisper 내장 translate 작업은 영어 출력용입니다. Whisper만 사용하면서 한국어를 중국어/일본어 등 임의의 목표 언어로 번역하는 것은 지원되지 않습니다. 영어 이외의 목표 언어가 필요하면 별도 번역 모델/API가 필요합니다.

설치
1. ZIP 압축을 풉니다. package.json, wrangler.toml, src, public가 저장소 루트에 있어야 합니다.
2. 기존 GitHub 저장소 파일을 덮어쓰고 커밋합니다.
3. Cloudflare Workers에서 재배포합니다.
4. wrangler.toml의 [ai] binding = \"AI\" 설정을 유지합니다.
5. HTTPS 주소로 접속해 마이크 권한을 허용하고 자막 시작을 누릅니다.

기술 사항
- public/index.html은 마이크 오디오를 약 6초 구간으로 녹음해 /api/transcribe?mode=both로 보냅니다. 원문 또는 영어만 선택하면 해당 Whisper 작업만 실행해 사용량을 줄입니다.
- src/worker.js는 @cf/openai/whisper-large-v3-turbo를 호출합니다. source language를 강제로 ko로 지정하지 않아 자동 감지를 사용합니다.
- Whisper 원문 인식과 영어 번역을 동시에 선택하면 같은 오디오 구간에 대해 두 번의 Workers AI 모델 실행이 발생합니다. 따라서 사용량/비용이 증가할 수 있습니다.
- 마이크 오디오는 처리를 위해 Cloudflare로 전송됩니다. Workers AI 사용량과 계정 한도가 적용됩니다.
- 멀티룸, Durable Object 실시간 동기화, LIVE Studio 오버레이는 유지됩니다.
- 코드 문법 및 ZIP 무결성 확인은 별도 수행해야 하며, 실제 Cloudflare 배포 및 계정에서의 마이크/AI 작동 테스트는 사용자가 배포 후 확인해야 합니다.
