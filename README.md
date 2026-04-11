# 🥕 당근마켓 클론 (Carrot Market Clone) - Full Stack Implementation

![carrot_market_mockup](file:///Users/jusang/.gemini/antigravity/brain/419d3433-46a6-4463-abf9-1a281e17a6fc/carrot_market_mockup_1775803406798.png)

> **React Native 0.84 + FastAPI를 활용한 고성능 중고거래 플랫폼 구현 프로젝트**
> 
> "단순한 클론 프로젝트를 넘어, 실제 프로덕션 수준의 기술적 도전과 아키텍처적 고민을 담았습니다."

---

## 📝 프로젝트 소개 및 기획 의도
1년 차 개발자로서 **모바일 앱 아키텍처의 전반적인 흐름(Full-stack)**을 깊이 있게 이해하고, 특히 **React Native 0.84**의 새로운 아키텍처 환경에서 성능 최적화와 실시간 데이터 처리를 어떻게 구현하는지 증명하기 위해 기획되었습니다.

기능적으로는 중고거래의 핵심인 **실시간 채팅, 위치 기반 게시물 조회, 푸시 알림 시스템**을 실제 서비스 수준으로 구현하는 데 집중했습니다.

---

## 🛠 핵심 기술 스택

### Frontend
- **Core**: ![React Native](https://img.shields.io/badge/React_Native-0.84.1-61DAFB?logo=react&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) 
- **State**: ![Zustand](https://img.shields.io/badge/Zustand-5.0-orange?logo=react) (Global State) ![React Query](https://img.shields.io/badge/React_Query-v5-FF4154?logo=reactquery&logoColor=white) (Server State 캐싱)
- **Navigation**: ![React Navigation](https://img.shields.io/badge/React_Navigation-v7-9933FF?logo=reactnavigation&logoColor=white)
- **Push**: ![FCM](https://img.shields.io/badge/FCM-latest-FFCA28?logo=firebase&logoColor=white) ![Notifee](https://img.shields.io/badge/Notifee-v9-blue)

### Backend
- **Framework**: ![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
- **ORM/DB**: SQLAlchemy, MySQL
- **Real-time**: Cloudflare Workers, WebSockets

---

## 🏗 아키텍처 및 폴더 구조
관심사 분리(SoC)를 위해 **Layered Architecture**를 채택하였으며, 대규모 프로젝트로 확장 가능한 구조로 설계되었습니다.

```bash
src/
├── api/             # Axios Instance 및 API 엔드포인트 정의 (Network 계층)
├── components/      # 재사용 가능한 공통 UI 컴포넌트 (Atomic Design)
├── config/          # 환경 설정 및 상수 관리
├── hooks/           # 도메인 논리 및 사이드 이펙트 분리 (Custom Hooks)
├── navigation/      # Stack/Tab 내비게이션 구조 설계
├── screens/         # 도메인 단위의 화면 컴포넌트
├── stores/          # Zustand를 활용한 전역 상태 관리 (Auth)
├── theme/           # 일관된 브랜드 경험을 위한 Design Token (Colors, Typo)
├── types/           # TypeScript 인터페이스 정의
└── utils/           # 공통 헬퍼 함수 (Formatting, Geocoding)
```

---

## ✨ 주요 기능

| 실시간 채팅 (Chat) | 푸시 알림 (Push) | 위치 기반 (Location) | 상품 관리 (Product) |
| :---: | :---: | :---: | :---: |
| [ScreenShot] | [ScreenShot] | [ScreenShot] | [ScreenShot] |
| WebSockets 기반 메시징 | FCM + Notifee 딥링크 | 네이버 지도 API 연동 | Cloudinary 이미지 처리 |

---

## 💡 핵심 어필 포인트 (Technical Insights)

### 1. React Native 0.84 New Architecture의 선제적 도입
신규 아키텍처(Fabric, Bridgeless Mode) 환경에서 **React 19**의 `useTransition` 등을 고려한 렌더링 최적화를 염두에 두었습니다. 특히 구버전 라이브러리들과의 호환성 문제를 해결하며 최신 버전이 주는 성능 이점(부팅 속도 개선, 뷰 렌더링 효율)을 직접 체감하고 적용했습니다.

### 2. 효율적인 데이터 동기화 (Server State vs Global State)
무분별하게 전역 상태를 사용하는 대신, 서버 데이터는 **React Query**를 통해 캐싱 및 낙관적 업데이트(Optimistic Update)를 처리하고, 인증 정보나 테마 등 순수 전역 상태만 **Zustand**로 관리함으로써 데이터 무결성을 확보했습니다.

### 3. 고도화된 알림 시스템 (FCM + Notifee)
단순한 푸시 발송을 넘어, **앱의 3가지 상태(Foreground, Background, Quit)**를 모두 대응했습니다.
-   앱 사용 중에는 `Notifee`를 통해 커스텀 배너를 직접 띄워 UX를 강화함.
-   알림 클릭 시 데이터 페이로드를 분석하여 특정 채팅방으로 즉시 이동하는 **Deep Linking** 시스템 구축.

---

## 🚀 트러블 슈팅 (Problem Solving)

### ISSUE: 알림 클릭 시 특정 유저의 채팅방으로 이동하지 않고 홈 화면에 멈추는 문제
- **문제**: 백그라운드에서 푸시 알림을 클릭했을 때 앱은 열리지만, 채팅방 정보 로딩에 실패하거나 홈 화면으로 리다이렉트됨.
- **원인 분석**: `useNotifications` 훅에서 전달하는 파라미터 이름(`chatRoomId`)과 `ChatRoomScreen`이 기대하는 파라미터 이름(`id`)이 일치하지 않아 동적 라우팅이 실패함을 확인.
- **해결**: 내비게이션 파라미터 규격을 `id`로 단일화하고, `Notifee`와 `FCM` 각각의 다른 데이터 구조에서 `roomId`를 안전하게 추출할 수 있는 **전담 핸들러(`handleNotificationClick`)**를 구축하여 해결.

### ISSUE: iOS 시뮬레이터 푸시 인증 및 유료 계정 제약 극복
- **문제**: iOS 실기기 테스트를 위한 APNs 키 발급에 유료 개발자 계정이 필요하여 개발 환경에서의 실시간 테스트가 제한됨.
- **해결 전략**: 
    1.  서버 측 FCM 발송 로직에 **APNSConfig** 고도화 (사운드, 배지, `content_available` 설정).
    2.  개발 환경에서는 **WebSockets**과 연동된 로컬 알림 전송 로직을 브릿지로 활용하여, 유료 계정 없이도 실시간 알림 UI/UX를 시뮬레이션할 수 있는 환경 구축.

---

## 🛠 설치 및 실행 방법 (Getting Started)

### Frontend
```bash
# 의존성 설치
npm install

# iOS 실행 (CocoaPods 설치 후)
cd ios && pod install && cd ..
npx react-native run-ios

# Android 실행
npx react-native run-android
```

### Backend
```bash
# 가상환경 구축 및 앱 실행
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

**CONTACT**
- NAME: [사용자 이름]
- EMAIL: [이메일 주소]
- GITHUB: [GitHub 주소]
