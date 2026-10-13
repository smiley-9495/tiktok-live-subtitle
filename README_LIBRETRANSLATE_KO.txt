LibreTranslate 우선 번역 버전

이 버전은 API 키가 필요 없는 LibreTranslate 공개 인스턴스를 기본 번역기로 사용하도록 변경했습니다. 공개 인스턴스는 운영자 정책에 따라 속도 제한, 일시 장애, 접근 제한이 있을 수 있으며 무제한/상시 가용성을 보장하지 않습니다.

적용
1. ZIP 안의 파일을 GitHub 저장소 최상위 경로에 업로드해 기존 파일을 교체합니다. 특히 src/worker.js와 public/index.html을 교체하세요.
2. 변경 사항을 Commit하고 Cloudflare에서 다시 배포합니다.
3. API 키 없이 먼저 테스트할 수 있습니다.

기본 공개 인스턴스 순서
- https://translate.argosopentech.com
- https://libretranslate.de
- https://trans.zillyhuhn.com
- https://translate.mentality.rip

공개 인스턴스가 바뀌거나 차단될 수 있으므로, Cloudflare Worker의 환경 변수 LIBRETRANSLATE_URL에 다른 LibreTranslate 호스트를 지정할 수도 있습니다. 예: https://translate.argosopentech.com 또는 https://translate.argosopentech.com/translate

선택 설정
- LIBRETRANSLATE_URL: 사용할 인스턴스 URL (설정하면 해당 인스턴스 하나만 시도)
- LIBRETRANSLATE_API_KEY: 선택적 API 키 (선택한 인스턴스에서 요구할 경우)

번역 언어 코드
- 한국어 원문: ko
- 영어: en
- 중국어 간체: zh
- 일본어: ja

실패 시 대체 순서
1. 설정된 Google Cloud Translation API (GOOGLE_TRANSLATE_API_KEY)
2. 설정된 Microsoft Translator (MICROSOFT_TRANSLATOR_KEY, 필요 시 MICROSOFT_TRANSLATOR_REGION)
3. 설정된 DeepL API Free (DEEPL_API_KEY)
4. Google 비공식 공개 엔드포인트
5. MyMemory

캐시
- 성공한 번역을 Cloudflare Worker isolate 메모리에 30분간 저장합니다.
- 같은 isolate에 도착한 동일 문장 동시 요청을 하나로 합칩니다.
- 메모리 캐시는 모든 Cloudflare 인스턴스 사이에 공유되지 않습니다.

참고
- LibreTranslate는 Argos Translate 오픈소스 엔진 기반입니다. 번역 품질은 Google/DeepL/Papago와 다를 수 있습니다.
- 공개 서버는 사용자 수, 요청 속도, 운영 정책에 따라 429/403/5xx 오류를 반환할 수 있습니다.
- 사이트는 공개 인스턴스의 무제한 무료 사용이나 영구 가용성을 보장할 수 없습니다.
- Cloudflare Worker 배포는 GitHub 연동 빌드 방식으로 진행할 수 있으며, 로컬 PC에 Node.js를 설치할 필요는 없습니다.
