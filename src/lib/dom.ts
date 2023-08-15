export const html = (content: string, parent = document.body) =>
  parent.innerHTML += content

export const query = (selector: string) =>
  document.querySelector(selector)

export const append = (element: HTMLElement, parent: HTMLElement = query('a-scene')) => {
  parent.append(element)
  return element
}
  
export const create = (type: string, attribs?: Record<string, unknown>, html = '') => {
  let element = document.createElement(type)
  if (attribs) attributes(element, attribs)
  element.innerHTML = html
  return element
}

export const on = <T>(element: HTMLElement, event: string, fn: (event: T) => void) => {
  element.addEventListener(event, fn)
  return element
}

export const attributes = (element: HTMLElement, attributes: Record<string, unknown>) =>
  Object.entries(attributes).map(([key, value]) => element.setAttribute(key, value))
