Google 번역 스크립트 단독 사용 버전

Cloudflare Worker에서 Google 번역 웹 공개 엔드포인트만 사용합니다. LibreTranslate, Google Cloud Translation, Microsoft Translator, DeepL, MyMemory 등 다른 번역 서비스로 대체하지 않습니다.

장점: 별도 API 키 설정 없이 사용할 수 있습니다.
주의: 공식적으로 보장된 공개 API가 아니므로 Google이 요청을 제한하거나 동작을 변경할 수 있습니다. 연결이 실패하면 자동 대체 없이 번역 요청이 실패합니다.

적용: ZIP의 파일을 GitHub 저장소 루트에 덮어쓰고 커밋한 뒤 Cloudflare Workers에서 재배포하세요.
