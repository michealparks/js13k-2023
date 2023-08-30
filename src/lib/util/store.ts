
export let writable = <T>(initial: T) => {
  let fns: ((update: T) => void)[] = []

  return {
    current: initial,
    set(value: T) {
      this.current = value
      for (let fn of fns) fn(value)
    },
    subscribe(fn: (update: T) => void) {
      fns.push(fn)
      fn(this.current)
    }
  }
}
