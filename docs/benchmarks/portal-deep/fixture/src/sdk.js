// Poki SDK wrapper.
export function initSdk() {
  return PokiSDK.init();
}

export function showAd() {
  return PokiSDK.commercialBreak();
}
