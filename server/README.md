# 인생 도감 - 서버 (Express + Prisma + MySQL)

## 1\. 준비물

* Node.js 18+
* 로컬 또는 원격 MySQL 8.x

## 2\. 설치

```bash
cd server
npm install
cp .env.example .env
# .env에서 DATABASE\_URL, JWT\_SECRET을 실제 값으로 수정
```

## 3\. DB 마이그레이션 + 시드

```bash
npx prisma migrate dev --name init
npm run prisma:seed   # 400개 기본 도감 + 업적 데이터 삽입
```

## 4\. 개발 서버 실행

```bash
npm run dev
# http://localhost:4000/health 로 확인
```

## 5\. 주요 API

|Method|Path|설명|
|-|-|-|
|POST|/auth/register|회원가입|
|POST|/auth/login|로그인 (JWT 발급)|
|GET|/experiences|도감 목록 (category, scope, source 쿼리 필터)|
|GET|/experiences/random|오늘의 발견 (미완료 중 랜덤 1개)|
|GET|/me/experiences|내 기록 목록 (status 필터: INTERESTED/COMPLETED)|
|POST|/me/experiences|관심/완료 등록·수정|
|DELETE|/me/experiences/:id|기록 삭제|
|GET|/me/stats|레벨, 카테고리별 완료 수, 희귀도 보유 현황|
|GET|/me/recommendations|다음 경험 추천|
|GET|/achievements|전체 업적 목록|
|GET|/achievements/me|내가 획득한 업적|
|GET|/friends|친구 목록|
|POST|/friends/requests|친구 요청 (이메일 기준)|
|PATCH|/friends/requests/:id/accept|친구 요청 수락|
|GET|/friends/:id/compare|친구와 경험 비교|



## 

