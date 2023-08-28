import { writable } from 'svelte/store'


export let state = writable<'screen' | 'intro' | 'tutorial' | 'game'>(localStorage.getItem('state') ?? 'screen')
