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

