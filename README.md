# 인생 도감 (Life Book)

살면서 해본 경험을 도감처럼 수집/기록하는 앱.

- `server/` — Express + Prisma + MySQL API 서버 (400개 기본 도감 시드 포함)
- `mobile/` — React Native (Expo) 앱

각 폴더의 README.md를 참고해 순서대로 설치하세요:
1. `server/README.md` — DB 세팅, 시드, API 서버 실행
2. `mobile/README.md` — 앱 실행, API 주소 연결

## 아키텍처 한눈에 보기

```
User ──(JWT 인증)── /auth
                    │
                    ├─ /experiences        (도감 마스터 데이터 조회)
                    ├─ /me/experiences     (내 관심/완료 기록 CRUD)
                    ├─ /me/stats           (레벨, 카테고리별 진행률)
                    ├─ /me/recommendations (다음 경험 추천)
                    ├─ /achievements       (업적 목록/내 업적)
                    └─ /friends            (친구 요청/비교)
```

핵심 테이블은 `Experience`(마스터 데이터, 기본/시즌/유저생성 구분)와
`UserExperience`(유저별 관심·완료 상태, 사진, 별점, 메모)입니다.

테스트용
adb devices 
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8081 tcp:8081

ngrok http 4000

npx expo prebuild --clean
npx expo run:android

앞으로 추가 할 기능 
└─ 16. 실제 푸시 알림