import { vec3 } from './math'

export let paths = (scene: THREE.Scene, dir: 1 | -1 = 1) => {
  let points = []
  let numSegments = 10

  let x = 0.4 * dir, z = 0
  points.push(vec3.set(x, 0, z).clone())

  x += (0.5 * dir)

  points.push(vec3.set(x, 0, z).clone())

  for (let i = 0; i < numSegments; i++) {
    x += (Math.random() * dir)
    z = ((Math.random() - 0.5) * 2)
    points.push(vec3.set(x, 0, z).clone())
  }

  let path = new THREE.CatmullRomCurve3(points)
  let path2 = new THREE.CatmullRomCurve3(path.getPoints(numSegments * 10))
  let tubeGeometry = new THREE.TubeGeometry(path2, numSegments * 10, 0.02, 8, false)
  let material = new THREE.MeshBasicMaterial({ color: '#B0BEC5' })
  let tubeMesh = new THREE.Mesh(tubeGeometry, material)
  scene.add(tubeMesh)
}
