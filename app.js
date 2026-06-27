(function () {
  const CITIES = [
    {
      id: 'seoul',
      name: '서울 남산과 강북 도심',
      shortName: '서울',
      landmark: 'N서울타워',
      longitude: 126.9882,
      latitude: 37.5512,
      targetHeight: 310,
      range: 1750,
      pitchDeg: -50,
      headingDeg: 36,
    },
    {
      id: 'paris',
      name: '파리 에펠탑과 세느강',
      shortName: '파리',
      landmark: '에펠탑',
      longitude: 2.2945,
      latitude: 48.8584,
      targetHeight: 80,
      range: 1450,
      pitchDeg: -51,
      headingDeg: 42,
    },
    {
      id: 'london',
      name: '런던 타워브리지와 템스강',
      shortName: '런던',
      landmark: '타워브리지',
      longitude: -0.0754,
      latitude: 51.5055,
      targetHeight: 45,
      range: 1500,
      pitchDeg: -49,
      headingDeg: 128,
    },
    {
      id: 'new-york',
      name: '뉴욕 센트럴파크',
      shortName: '뉴욕',
      landmark: '센트럴파크',
      longitude: -73.9665,
      latitude: 40.7767,
      targetHeight: 95,
      range: 3150,
      pitchDeg: -34,
      headingDeg: 186,
    },
    {
      id: 'tokyo',
      name: '도쿄타워와 미나토',
      shortName: '도쿄',
      landmark: '도쿄타워',
      longitude: 139.7454,
      latitude: 35.6586,
      targetHeight: 120,
      range: 1550,
      pitchDeg: -51,
      headingDeg: 305,
    },
    {
      id: 'singapore',
      name: '싱가포르 마리나베이',
      shortName: '싱가포르',
      landmark: '마리나베이 샌즈',
      longitude: 103.8607,
      latitude: 1.2834,
      targetHeight: 105,
      range: 1180,
      pitchDeg: -38,
      headingDeg: 188,
    },
    {
      id: 'sydney',
      name: '시드니 오페라하우스와 하버브리지',
      shortName: '시드니',
      landmark: '오페라하우스',
      longitude: 151.2153,
      latitude: -33.8568,
      targetHeight: 45,
      range: 1700,
      pitchDeg: -43,
      headingDeg: 242,
    },
    {
      id: 'taipei',
      name: '타이베이 101과 신이',
      shortName: '타이베이',
      landmark: '타이베이 101',
      longitude: 121.5645,
      latitude: 25.0339,
      targetHeight: 230,
      range: 2100,
      pitchDeg: -49,
      headingDeg: 238,
    },
    {
      id: 'hong-kong',
      name: '홍콩 빅토리아하버',
      shortName: '홍콩',
      landmark: '빅토리아하버',
      longitude: 114.1606,
      latitude: 22.2865,
      targetHeight: 180,
      range: 2600,
      pitchDeg: -34,
      headingDeg: 176,
    },
    {
      id: 'rio',
      name: '리우데자네이루 코르코바두',
      shortName: '리우',
      landmark: '구세주 그리스도상',
      longitude: -43.2078,
      latitude: -22.9492,
      targetHeight: 610,
      range: 2450,
      pitchDeg: -26,
      headingDeg: 304,
    },
    {
      id: 'grand-canyon',
      name: '그랜드캐니언 사우스림',
      shortName: '그랜드캐니언',
      landmark: '호피 포인트',
      longitude: -112.154,
      latitude: 36.058,
      targetHeight: 1950,
      range: 13200,
      pitchDeg: -21,
      headingDeg: 318,
    },
  ];

  const DEFAULT_PARAMS = {
    fov: 82,
    dofSigma: 1.05,
    saturation: 1.24,
    brightness: 1.12,
    contrast: 1.08,
    vignette: 1.05,
    toyLight: 0.22,
    postprocess: true,
    autoOrbit: false,
    orbitSpeed: 0.018,
    resolutionScale: 1,
  };

  let viewer;
  let currentCity = parseCity();
  let headingDeg = currentCity.headingDeg;
  let lastTime = performance.now();
  const params = { ...DEFAULT_PARAMS };

  function requireElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing element #${id}`);
    }
    return element;
  }

  function parseCity() {
    const id = new URLSearchParams(window.location.search).get('city');
    return CITIES.find((city) => city.id === id) || CITIES[0];
  }

  function setStatus(message) {
    requireElement('statusText').textContent = message;
  }

  async function loadConfig() {
    const fallback = window.MINIATURE_CITY_CONFIG || {};
    try {
      const response = await fetch('/api/config', { cache: 'no-store' });
      if (response.ok) {
        return { ...fallback, ...(await response.json()) };
      }
    } catch (error) {
      // Static hosts such as GitHub Pages do not have /api/config.
    }
    return fallback;
  }

  function applyCssMiniatureEffect() {
    const root = document.documentElement;
    root.style.setProperty('--scene-saturation', `${params.postprocess ? params.saturation : 1}`);
    root.style.setProperty('--scene-brightness', `${params.postprocess ? params.brightness : 1}`);
    root.style.setProperty('--scene-contrast', `${params.postprocess ? params.contrast : 1}`);
    root.style.setProperty('--tilt-blur', params.postprocess ? `${Math.max(0, params.dofSigma * 3.2)}px` : '0px');
    root.style.setProperty('--edge-blur-opacity', params.postprocess ? `${Math.min(0.92, 0.42 + params.dofSigma * 0.42)}` : '0');
    root.style.setProperty('--edge-vignette-opacity', params.postprocess ? `${Math.max(0, (params.vignette - 0.55) * 0.08)}` : '0');
    root.style.setProperty('--toy-light-opacity', params.postprocess ? `${params.toyLight}` : '0');
    document.body.classList.toggle('postprocess-off', !params.postprocess);
  }

  function setFov() {
    const frustum = viewer.camera.frustum;
    if (frustum instanceof Cesium.PerspectiveFrustum) {
      frustum.fov = Cesium.Math.toRadians(params.fov);
      frustum.near = 0.5;
      frustum.far = 90000;
    }
  }

  function lookAtCity(city, immediateHeading = headingDeg) {
    const center = Cesium.Cartesian3.fromDegrees(city.longitude, city.latitude, city.targetHeight);
    viewer.camera.lookAt(
      center,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(immediateHeading),
        Cesium.Math.toRadians(city.pitchDeg),
        city.range,
      ),
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }

  function setCity(city, immediate = false) {
    currentCity = city;
    headingDeg = city.headingDeg;
    requireElement('cityTitle').textContent = city.name;
    requireElement('citySelect').value = city.id;

    const url = new URL(window.location.href);
    url.searchParams.set('city', city.id);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);

    if (immediate) {
      setFov();
      lookAtCity(city);
      return;
    }

    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(
        Cesium.Cartesian3.fromDegrees(city.longitude, city.latitude, city.targetHeight),
        city.range * 0.55,
      ),
      {
        duration: 1.4,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(headingDeg),
          Cesium.Math.toRadians(city.pitchDeg),
          city.range,
        ),
      },
    );
  }

  function bindUi() {
    const citySelect = requireElement('citySelect');
    citySelect.replaceChildren(
      ...CITIES.map((city) => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = `${city.shortName} - ${city.landmark}`;
        option.selected = city.id === currentCity.id;
        return option;
      }),
    );

    citySelect.addEventListener('change', () => {
      const nextCity = CITIES.find((city) => city.id === citySelect.value) || CITIES[0];
      setCity(nextCity);
    });

    const controlMap = [
      ['fovControl', 'fov', Number],
      ['blurControl', 'dofSigma', Number],
      ['saturationControl', 'saturation', Number],
      ['brightnessControl', 'brightness', Number],
      ['toyLightControl', 'toyLight', Number],
      ['resolutionControl', 'resolutionScale', Number],
    ];
    for (const [id, key, cast] of controlMap) {
      const input = requireElement(id);
      input.value = params[key];
      input.addEventListener('input', () => {
        params[key] = cast(input.value);
        if (key === 'fov') {
          setFov();
        }
        if (key === 'resolutionScale') {
          viewer.resolutionScale = params.resolutionScale;
        }
        applyCssMiniatureEffect();
      });
    }

    const lensControl = requireElement('lensControl');
    lensControl.checked = params.postprocess;
    lensControl.addEventListener('change', () => {
      params.postprocess = lensControl.checked;
      applyCssMiniatureEffect();
    });

    const orbitControl = requireElement('orbitControl');
    orbitControl.checked = params.autoOrbit;
    orbitControl.addEventListener('change', () => {
      params.autoOrbit = orbitControl.checked;
    });

    const cleanButton = requireElement('cleanCaptureButton');
    const restoreButton = requireElement('restoreUiButton');
    const surface = requireElement('controlSurface');
    const setCleanCapture = (active) => {
      surface.classList.toggle('is-hidden', active);
      document.body.classList.toggle('clean-capture', active);
      cleanButton.setAttribute('aria-pressed', `${active}`);
      restoreButton.hidden = !active;
    };
    cleanButton.addEventListener('click', () => setCleanCapture(!document.body.classList.contains('clean-capture')));
    restoreButton.addEventListener('click', () => setCleanCapture(false));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setCleanCapture(false);
      }
    });
  }

  function bindInteractionClarity() {
    let clearTimer = 0;
    const showClearView = () => {
      window.clearTimeout(clearTimer);
      document.body.classList.add('is-interacting');
      params.autoOrbit = false;
      requireElement('orbitControl').checked = false;
      clearTimer = window.setTimeout(() => {
        document.body.classList.remove('is-interacting');
      }, 700);
    };
    const settleClearView = () => {
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        document.body.classList.remove('is-interacting');
      }, 180);
    };

    viewer.canvas.addEventListener('pointerdown', showClearView, { passive: true });
    viewer.canvas.addEventListener('pointermove', showClearView, { passive: true });
    viewer.canvas.addEventListener('wheel', showClearView, { passive: true });
    viewer.canvas.addEventListener('touchstart', showClearView, { passive: true });
    window.addEventListener('pointerup', settleClearView);
  }

  async function loadTileset() {
    try {
      const tileset = await Cesium.createGooglePhotorealistic3DTileset(
        { onlyUsingWithGoogleGeocoder: true },
        {
          maximumScreenSpaceError: 6,
          dynamicScreenSpaceError: false,
          skipLevelOfDetail: false,
          immediatelyLoadDesiredLevelOfDetail: true,
        },
      );
      tileset.maximumScreenSpaceError = 6;
      tileset.dynamicScreenSpaceError = false;
      tileset.skipLevelOfDetail = false;
      tileset.immediatelyLoadDesiredLevelOfDetail = true;
      viewer.scene.primitives.add(tileset);
      setStatus('Google Photorealistic 3D Tiles');
      setCity(currentCity, true);
    } catch (error) {
      console.error(error);
      setStatus('Google Photorealistic 3D Tiles 로딩 실패: Cesium Ion 토큰을 확인하세요.');
    }
  }

  function createViewer() {
    viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
      homeButton: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      requestRenderMode: true,
      globe: false,
    });

    viewer.scene.highDynamicRange = false;
    viewer.scene.postProcessStages.fxaa.enabled = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#aabed0');
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 80;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000;
    viewer.resolutionScale = params.resolutionScale;
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = false;
    }
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = false;
    }
  }

  function startOrbitClock() {
    viewer.clock.onTick.addEventListener(() => {
      const now = performance.now();
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      if (!params.autoOrbit) {
        return;
      }
      headingDeg = (headingDeg + Cesium.Math.toDegrees(params.orbitSpeed) * deltaSeconds) % 360;
      lookAtCity(currentCity, headingDeg);
    });
  }

  async function main() {
    const config = await loadConfig();
    if (config.cesiumIonToken && config.cesiumIonToken !== 'paste-your-cesium-ion-token-here') {
      Cesium.Ion.defaultAccessToken = config.cesiumIonToken;
    }
    if (config.googleMapsApiKey && config.googleMapsApiKey !== 'paste-your-google-maps-api-key-here') {
      Cesium.GoogleMaps.defaultApiKey = config.googleMapsApiKey;
    }

    bindUi();
    applyCssMiniatureEffect();
    createViewer();
    setFov();
    setCity(currentCity, true);
    bindInteractionClarity();
    startOrbitClock();
    await loadTileset();
  }

  main().catch((error) => {
    console.error(error);
    setStatus('앱 초기화 실패: 콘솔 로그를 확인하세요.');
  });
})();
