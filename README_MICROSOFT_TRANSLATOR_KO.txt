TikTok LIVE 자막 - Microsoft Translator API 연동 버전

이 버전은 Microsoft Azure AI Translator를 우선 번역기로 사용합니다. 키가 없거나 Microsoft API 요청이 실패하면 설정된 DeepL 키, Google 공개 번역 엔드포인트, MyMemory 순서로 대체를 시도합니다.

포함 파일
- public/index.html : 한국어 음성 인식, 번역, 언어 선택, 자막 설정
- public/overlay.html : TikTok LIVE Studio 브라우저 소스 오버레이
- src/worker.js : Microsoft Translator API 프록시 + 대체 번역 + WebSocket/Durable Object
- wrangler.toml : Cloudflare 배포 설정
- package.json : Cloudflare 배포 스크립트

Microsoft Translator 설정 (필수: Microsoft API를 주 번역기로 사용하려는 경우)
1. Azure Portal(https://portal.azure.com/)에서 Azure AI Translator 리소스를 만듭니다. 사용 가능한 요금제와 지역을 확인하세요.
2. 리소스의 Keys and Endpoint 페이지에서 Key와 Region을 확인합니다.
3. Cloudflare Dashboard > Workers & Pages > 해당 Worker > Settings > Variables and Secrets로 이동합니다.
4. Secret으로 MICROSOFT_TRANSLATOR_KEY 를 추가하고 Value에 Azure 키를 입력합니다.
5. 변수 MICROSOFT_TRANSLATOR_REGION 을 추가하고 Azure 리소스의 지역 문자열을 입력합니다(예: koreacentral). 해당 리소스 유형이 지역 헤더를 요구하지 않는 경우 빈 값으로 둘 수 있습니다.
6. 저장 후 재배포하고 사이트에서 영어, 중국어 간체, 일본어를 각각 테스트합니다.

중요
- API 키는 GitHub 코드나 HTML에 절대 넣지 마세요. Cloudflare Secret에만 저장하세요.
- MICROSOFT_TRANSLATOR_REGION은 Azure 리소스의 실제 Region 값과 정확히 일치해야 합니다.
- 번역 대상 코드는 en, zh-Hans(중국어 간체), ja 입니다.
- Azure 무료 등급의 제공량/요금/자격 조건은 계정, 지역, 시점에 따라 바뀔 수 있습니다. Azure 포털에서 현재 F0 등급과 사용 한도를 확인하세요. 무료 사용량 초과, 키/지역 오류, API 장애 시 대체 번역 서비스가 시도될 수 있습니다.
- 대체 Google 공개 엔드포인트와 MyMemory는 보장된 SLA가 있는 정식 운영용 API가 아니며 제한/장애가 발생할 수 있습니다. DeepL 대체는 DEEPL_API_KEY Secret을 설정한 경우에만 사용합니다.

GitHub/Cloudflare 배포
- 압축을 풀고 파일/폴더 내용을 GitHub 저장소 최상위에 업로드합니다. package.json, wrangler.toml, src/, public/이 저장소 루트에 직접 보여야 합니다.
- Cloudflare Build command: npm install
- Deploy command: npm run deploy
- Root directory: 저장소 루트
- PC에 Node.js를 설치할 필요는 없습니다. GitHub 저장소에 올린 뒤 Cloudflare에서 빌드/배포하세요.

사용 및 보안
- 배포한 사이트에서 마이크 권한을 허용하고 자막 시작을 누릅니다.
- 오버레이 URL을 TikTok LIVE Studio 브라우저 소스에 붙여넣습니다.
- room URL을 아는 사람은 해당 자막을 볼 수 있으므로 링크를 공개하지 마세요.
- 음성 인식은 Chrome/Edge Web Speech API에 의존하며 번역 API와 별개입니다. 실제 방송 환경에서 음성 인식/번역 지연을 테스트하세요.
- ZIP 및 소스 구문은 점검했지만 실제 Azure 계정 인증, Cloudflare 배포, LIVE Studio 연결은 여기서 실행 검증하지 않았습니다.
