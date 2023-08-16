export const shadows = (root: THREE.Object3D) => root.traverse((child) => {
  const object = child as THREE.Mesh & THREE.Light & THREE.AmbientLight & THREE.RectAreaLight
  object.castShadow = object.isMesh || (object.isLight && !object.isAmbientLight && !object.isRectAreaLight)
  object.receiveShadow = object.isMesh
})

export const setShadowMapSize = (light: THREE.Light, mapSize = 2048, bias = 0.000001) => {
  light.shadow.bias = bias
  light.shadow.mapSize.set(mapSize, mapSize)
  light.shadow.dispose()
  light.shadow.map = null
  light.shadow.needsUpdate = true
}
