Google Cloud Translation + 캐시 설정 안내

이 ZIP은 기존 Cloudflare Worker + Durable Object 프로젝트에 Google Cloud Translation API(v2)를 주 번역기로 추가한 버전입니다.

설정 순서
1. Google Cloud Console에서 프로젝트를 선택하거나 생성합니다.
2. Cloud Translation API를 활성화합니다.
3. 결제 계정을 연결합니다. 무료 사용량이 적용되더라도 API 사용을 위해 결제 계정이 요구될 수 있습니다.
4. API 키를 만들고, API 제한에서 Cloud Translation API만 허용하도록 설정합니다. 키를 웹페이지나 GitHub에 직접 적지 마세요.
5. Cloudflare Dashboard → Workers & Pages → 해당 Worker → Settings → Variables and Secrets에서 Secret을 추가합니다.
   이름: GOOGLE_TRANSLATE_API_KEY
   값: Google Cloud API key
6. GitHub 저장소의 기존 파일을 이 ZIP 안의 파일로 교체하고 Commit한 뒤 Cloudflare에서 재배포합니다.

요청 동작
- Google Cloud Translation Basic(v2) API를 우선 사용합니다.
- 실패하면 설정된 Microsoft Translator, DeepL, 비공식 Google 공개 엔드포인트, MyMemory 순서로 대체합니다.
- 동일한 문장/언어 요청은 Worker 인스턴스의 메모리에 최대 30분 저장되며, 동일 인스턴스에서 반복 번역 요청을 줄입니다.
- 캐시는 Cloudflare Worker isolate별 임시 메모리 캐시입니다. 모든 isolate 사이에서 공유되거나 재배포 후 유지된다고 보장되지 않습니다.
- 동시 동일 요청은 가능한 경우 하나의 요청으로 합칩니다.
- 성공한 번역만 캐시합니다.

비용 및 한도
- Google Cloud Translation 사용에는 Google Cloud 프로젝트와 결제 설정이 필요할 수 있습니다.
- 무료 제공량과 가격은 계정, API 버전, Google 정책에 따라 달라질 수 있으므로 실제 적용 전 요금표를 확인하세요: https://cloud.google.com/translate/pricing
- 공식 문서: https://cloud.google.com/translate/docs/basic/translating-text
- 캐시는 중복 요청을 줄일 뿐, 새 문장마다 발생하는 번역 사용량을 없애거나 무제한 사용을 제공하지 않습니다.

중요
- GOOGLE_TRANSLATE_API_KEY는 Cloudflare Secret으로만 등록하세요. GitHub에 올리지 마세요.
- 브라우저의 Web Speech API 음성 인식은 번역 API와 별도입니다.
- ZIP은 코드 수정본이며 실제 Cloudflare/Azure/Google 계정으로 배포·연결 테스트를 수행한 것은 아닙니다.
