# Miniature City

CesiumJS CDN과 Google Photorealistic 3D Tiles로 만든 미니어처 도시 감상 페이지입니다. Vite나 빌드 과정 없이 `web/` 폴더만 정적 호스팅에 올릴 수 있습니다.

## 구성

- `index.html`: CDN 기반 실행 페이지
- `styles.css`: 미니어처 UI와 주변부 아웃포커스 렌즈 효과
- `app.js`: 도시 프리셋, Cesium Viewer, 카메라/오빗/렌즈 제어
- `config.js`: GitHub Pages 같은 정적 호스팅용 토큰 설정 파일
- `api/config.js`: Vercel용 환경변수 전달 API
- `vercel.json`: Vercel 배포 설정

## 로컬 실행

`web/config.js`에 Cesium Ion 토큰을 입력합니다.

```js
window.MINIATURE_CITY_CONFIG = {
  cesiumIonToken: 'paste-your-cesium-ion-token-here',
  googleMapsApiKey: '',
};
```

그 다음 간단한 정적 서버로 실행합니다.

```bash
npx serve web
```

## GitHub Pages 배포

1. `web/` 폴더만 새 저장소 또는 기존 저장소에 올립니다.
2. `config.js`에 실제 Cesium Ion 토큰을 입력합니다.
3. GitHub Pages의 배포 루트를 `web/` 또는 저장소 루트로 맞춥니다.

공개 저장소에 토큰을 넣으면 외부에 노출됩니다. 운영용으로는 Cesium Ion에서 도메인 제한이 걸린 공개 클라이언트 토큰을 따로 만들어 쓰는 편이 좋습니다.

## Vercel Hobby 배포

Vercel은 `api/config.js`가 환경변수에서 토큰을 읽어 브라우저에 전달합니다. Vercel 프로젝트 환경변수에 아래 값을 추가합니다.

```text
CESIUM_ION_TOKEN=your-token
GOOGLE_MAPS_API_KEY=optional-google-key
```

CLI로 배포할 때는 `web/` 폴더에서 실행합니다.

```bash
npx vercel --prod
```

## 도시 프리셋

서울, 파리, 런던, 뉴욕 센트럴파크, 도쿄, 싱가포르, 시드니, 타이베이, 홍콩, 리우데자네이루, 그랜드캐니언 프리셋을 포함합니다.

## 미니어처 효과

WebGL 후처리 대신 CSS `filter`, `backdrop-filter`, radial mask를 사용합니다. 중앙부의 Google mesh는 선명하게 유지하고, 화면 주변부만 흐리게 처리해 tilt-shift 렌즈 느낌을 냅니다. 지도를 드래그하거나 줌하는 동안에는 blur 강도가 자동으로 줄어 조작 피로를 낮춥니다.

색감은 캔버스에 `saturate`, `brightness`, `contrast`를 적용해 장난감 같은 고채도 텍스처로 보정합니다. 별도의 `screen` 블렌드 오버레이를 얹어 인공 조명처럼 쨍한 하이라이트도 추가합니다. 실제 Google mesh 텍스처 파일을 수정하는 것은 아니며, 브라우저 화면 합성 단계에서만 적용됩니다.
