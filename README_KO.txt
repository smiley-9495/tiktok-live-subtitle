TikTok LIVE 자막 - Whisper 단독 다국어 인식 + 영어 번역

이 프로젝트는 Cloudflare Worker + Durable Object 실시간 전달 서버와 링크형 오버레이를 포함합니다. Google 번역 및 외부 번역 서비스는 호출하지 않습니다.

기능
- Whisper가 음성의 원어를 자동 감지해 원문 자막 생성
- Whisper의 내장 translate 작업으로 영어 자막 생성
- 원문/영어 자막 각각 ON/OFF
- 방 코드별 실시간 자막 분리 및 공유
- TikTok LIVE Studio 브라우저 소스용 오버레이 URL
- 오버레이 배경 투명도 조절

중요한 한계
Whisper는 다국어 음성을 인식하지만, 내장 translate 작업의 번역 출력은 영어입니다. Whisper만으로 한국어를 중국어/일본어 등 임의의 목표 언어로 번역할 수는 없습니다. 영어 외 목표 언어가 필요하면 별도의 다국어 번역 모델/API가 필요합니다.

배포 (내 PC에 Node.js 설치하지 않는 방식)
1. ZIP 압축을 풀고 package.json, wrangler.toml, src, public가 저장소 최상위에 있는지 확인합니다.
2. GitHub 저장소의 파일을 덮어쓰고 커밋합니다.
3. Cloudflare에서 해당 GitHub 저장소를 연결해 배포합니다. 빌드 설정은 프로젝트 구성에 맞게 `npm install` 및 `npm run deploy`를 사용합니다.
4. wrangler.toml의 [ai] binding = "AI" 설정과 Durable Object 설정을 유지합니다.
5. 배포된 HTTPS 주소를 Chrome/Edge에서 열고 마이크 권한을 허용합니다.
6. 자막 시작을 누르고 오버레이 URL을 TikTok LIVE Studio의 브라우저 소스에 넣습니다.

비용/개인정보
- 원문과 영어를 모두 선택하면 오디오 구간마다 Whisper 모델을 두 번 호출하므로 Workers AI 사용량이 증가합니다. 한 언어만 선택하면 해당 작업만 실행합니다.
- 마이크 오디오는 처리를 위해 Cloudflare로 전송됩니다. Workers AI 계정 사용량/한도/가격을 확인하세요.
- 오버레이 링크의 방 코드를 아는 사람은 해당 방의 자막을 볼 수 있으므로 링크를 공개 게시판에 올리지 마세요.

검증 안내
ZIP 무결성 및 코드 문법은 검사할 수 있지만, 실제 Cloudflare 계정 배포, Workers AI 모델 실행, 마이크 및 TikTok LIVE Studio 연동은 배포 후 직접 확인해야 합니다.
