# 인생 도감 - 모바일 앱 (React Native / Expo)

## 설치 및 실행
```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript   # 최초 1회, 이미 파일이 있으면 생략
npm install
npm start
```

`src/api/client.ts`의 `API_BASE_URL`을 서버 주소로 맞춰주세요.
- 시뮬레이터/에뮬레이터: `http://localhost:4000`
- 실기기 테스트: 같은 네트워크의 컴퓨터 IP (예: `http://192.168.0.10:4000`)