import type { ComponentDefinition, SystemDefinition } from 'aframe';

type Element = Required<ComponentDefinition>['el']

export const element = <T = Element>(component: ComponentDefinition) =>
  component.el as T

export const object = <T = THREE.Object3D>(component: ComponentDefinition) =>
  element(component).object3D as T

export const position = (component: ComponentDefinition) =>
  object(component).position

export const data = <T = unknown>(component: ComponentDefinition) =>
  component.data as T

export const component = (name: string, definition: ComponentDefinition) =>
  AFRAME.registerComponent(name, {
    ...definition,
    // @ts-expect-error Exists
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    init() { this.system?.register(this.el) },
    // @ts-expect-error Exists
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    remove() { this.system?.deregister(this.el) },
  })

export const system = (name: string, definition: SystemDefinition) =>
  AFRAME.registerSystem(name, {
    ...definition,
    entities: [] as Element[],
    register(element: Element) { this.entities.push(element) },
    deregister(element: Element) { this.entities.splice(this.entities.indexOf(element), 1) }
  })
