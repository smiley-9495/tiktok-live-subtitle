Google 번역 스크립트 단독 사용 버전

Cloudflare Worker에서 Google 번역 웹 공개 엔드포인트만 사용합니다. LibreTranslate, Google Cloud Translation, Microsoft Translator, DeepL, MyMemory 등 다른 번역 서비스로 대체하지 않습니다.

개선 사항: 같은 문장 캐시, 동일 문장 동시 요청 합치기, Worker 인스턴스 내 요청 간격 조절, HTTP 429 응답 시 Retry-After/지수형 대기 후 최대 2회 재시도를 적용했습니다.

장점: 별도 API 키 설정 없이 사용할 수 있습니다.
주의: 공식적으로 보장된 공개 API가 아니므로 Google이 요청을 제한하거나 동작을 변경할 수 있습니다. 요청 간격 조절과 재시도는 제한을 우회하거나 없애지 않습니다. 무료 공개 프록시를 통한 IP 회전은 사용하지 않습니다.

적용: ZIP의 파일을 GitHub 저장소 루트에 덮어쓰고 커밋한 뒤 Cloudflare Workers에서 재배포하세요.
