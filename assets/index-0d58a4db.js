import 'https://cdn.jsdelivr.net/gh/aframevr/aframe@ef03254934395d6a0a3cd093a8d37bb90790d24e/dist/aframe-master.min.js';

const app = '';

/** @returns {void} */
function noop() {}

/**
 * @template T
 * @template S
 * @param {T} tar
 * @param {S} src
 * @returns {T & S}
 */
function assign(tar, src) {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return /** @type {T & S} */ (tar);
}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function not_equal(a, b) {
	return a != a ? b == b : a !== b;
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

/** @returns {{}} */
function exclude_internal_props(props) {
	const result = {};
	for (const k in props) if (k[0] !== '$') result[k] = props[k];
	return result;
}

/** @returns {{}} */
function compute_rest_props(props, keys) {
	const rest = {};
	keys = new Set(keys);
	for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
	return rest;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element$1(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
/**
 * List of attributes that should always be set through the attr method,
 * because updating them through the property setter doesn't work reliably.
 * In the example of `width`/`height`, the problem is that the setter only
 * accepts numeric values, but the attribute can also be set to a string like `50%`.
 * If this list becomes too big, rethink this approach.
 */
const always_set_through_set_attribute = ['width', 'height'];

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {{ [x: string]: string }} attributes
 * @returns {void}
 */
function set_attributes(node, attributes) {
	// @ts-ignore
	const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
	for (const key in attributes) {
		if (attributes[key] == null) {
			node.removeAttribute(key);
		} else if (key === 'style') {
			node.style.cssText = attributes[key];
		} else if (key === '__value') {
			/** @type {any} */ (node).value = node[key] = attributes[key];
		} else if (
			descriptors[key] &&
			descriptors[key].set &&
			always_set_through_set_attribute.indexOf(key) === -1
		) {
			node[key] = attributes[key];
		} else {
			attr(node, key, attributes[key]);
		}
	}
}

/**
 * @returns {void} */
function set_custom_element_data(node, prop, value) {
	if (prop in node) {
		node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
	} else {
		attr(node, prop, value);
	}
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {Promise<void>} */
function tick() {
	schedule_update();
	return resolved_promise;
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @type {Outro}
 */
let outros;

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} local
 * @param {0 | 1} [detach]
 * @param {() => void} [callback]
 * @returns {void}
 */
function transition_out(block, local, detach, callback) {
	if (block && block.o) {
		if (outroing.has(block)) return;
		outroing.add(block);
		outros.c.push(() => {
			outroing.delete(block);
			if (callback) {
				if (detach) block.d(1);
				callback();
			}
		});
		block.o(local);
	} else if (callback) {
		callback();
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

/** @returns {{}} */
function get_spread_update(levels, updates) {
	const update = {};
	const to_null_out = {};
	const accounted_for = { $$scope: 1 };
	let i = levels.length;
	while (i--) {
		const o = levels[i];
		const n = updates[i];
		if (n) {
			for (const key in o) {
				if (!(key in n)) to_null_out[key] = 1;
			}
			for (const key in n) {
				if (!accounted_for[key]) {
					update[key] = n[key];
					accounted_for[key] = 1;
				}
			}
			levels[i] = n;
		} else {
			for (const key in o) {
				accounted_for[key] = 1;
			}
		}
	}
	for (const key in to_null_out) {
		if (!(key in update)) update[key] = undefined;
	}
	return update;
}

/** @returns {void} */
function create_component(block) {
	block && block.c();
}

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

/** @returns {void} */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			const nodes = children(options.target);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

const element = (component2) => component2.el;
const object = (component2) => element(component2).object3D;
const position = (component2) => object(component2).position;
const data = (component2) => component2.data;
const component = (name, definition) => AFRAME.registerComponent(name, {
  ...definition,
  // @ts-expect-error Exists
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  init() {
    this.system?.register(this.el);
  },
  // @ts-expect-error Exists
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  remove() {
    this.system?.deregister(this.el);
  }
});

component("hover", {
  update() {
    const d = data(this);
    d.y = position(this).y;
    d.s = Math.random() * 1e3;
  },
  tick(time) {
    const d = data(this);
    position(this).y = Math.sin((d.s + time) / 1e3) / 10 + d.y;
  }
});

const shadows = (root) => root.traverse((child) => {
  const object = child;
  object.castShadow = object.isMesh || object.isLight && !object.isAmbientLight && !object.isRectAreaLight;
  object.receiveShadow = object.isMesh;
});

/* src/lib/components/lights.svelte generated by Svelte v4.2.0 */

function create_fragment$4(ctx) {
	let a_light0;
	let t;
	let a_light1;

	return {
		c() {
			a_light0 = element$1("a-light");
			t = space();
			a_light1 = element$1("a-light");
			set_custom_element_data(a_light0, "type", "ambient");
			set_custom_element_data(a_light0, "intensity", "10");
			set_custom_element_data(a_light0, "color", "#445451");
			set_custom_element_data(a_light1, "type", "directional");
			set_custom_element_data(a_light1, "intensity", "2");
			set_custom_element_data(a_light1, "position", "2 4 4");
		},
		m(target, anchor) {
			insert(target, a_light0, anchor);
			insert(target, t, anchor);
			insert(target, a_light1, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(a_light0);
				detach(t);
				detach(a_light1);
			}
		}
	};
}

class Lights extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$4, not_equal, {});
	}
}

const kellyGreen = "#18A558";
const skyBlue = "#7BD5F5";

/* src/lib/components/ground.svelte generated by Svelte v4.2.0 */

function create_fragment$3(ctx) {
	let a_cylinder;

	let a_cylinder_levels = [
		{ radius: /*radius*/ ctx[0] },
		{ height: /*height*/ ctx[1] },
		{ color: kellyGreen },
		/*$$restProps*/ ctx[2]
	];

	let a_cylinder_data = {};

	for (let i = 0; i < a_cylinder_levels.length; i += 1) {
		a_cylinder_data = assign(a_cylinder_data, a_cylinder_levels[i]);
	}

	return {
		c() {
			a_cylinder = element$1("a-cylinder");
			set_attributes(a_cylinder, a_cylinder_data);
		},
		m(target, anchor) {
			insert(target, a_cylinder, anchor);
		},
		p(ctx, [dirty]) {
			set_attributes(a_cylinder, a_cylinder_data = get_spread_update(a_cylinder_levels, [
				dirty & /*radius*/ 1 && { radius: /*radius*/ ctx[0] },
				dirty & /*height*/ 2 && { height: /*height*/ ctx[1] },
				{ color: kellyGreen },
				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2]
			]));
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(a_cylinder);
			}
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	const omit_props_names = ["radius","height"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { radius } = $$props;
	let { height } = $$props;

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('radius' in $$new_props) $$invalidate(0, radius = $$new_props.radius);
		if ('height' in $$new_props) $$invalidate(1, height = $$new_props.height);
	};

	return [radius, height, $$restProps];
}

class Ground extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$3, not_equal, { radius: 0, height: 1 });
	}
}

/* src/lib/components/environment.svelte generated by Svelte v4.2.0 */

function create_fragment$2(ctx) {
	let a_sky;
	let t0;
	let ground0;
	let t1;
	let ground1;
	let t2;
	let ground2;
	let current;

	ground0 = new Ground({
			props: {
				radius: 3,
				height: 0.01,
				position: "0 0.8 0"
			}
		});

	ground1 = new Ground({
			props: {
				radius: 1.5,
				height: 0.2,
				position: "0 1 0"
			}
		});

	ground2 = new Ground({
			props: {
				radius: 0.9,
				height: 0.2,
				position: "0 1.2 0"
			}
		});

	return {
		c() {
			a_sky = element$1("a-sky");
			t0 = space();
			create_component(ground0.$$.fragment);
			t1 = space();
			create_component(ground1.$$.fragment);
			t2 = space();
			create_component(ground2.$$.fragment);
			set_custom_element_data(a_sky, "color", skyBlue);
		},
		m(target, anchor) {
			insert(target, a_sky, anchor);
			insert(target, t0, anchor);
			mount_component(ground0, target, anchor);
			insert(target, t1, anchor);
			mount_component(ground1, target, anchor);
			insert(target, t2, anchor);
			mount_component(ground2, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(ground0.$$.fragment, local);
			transition_in(ground1.$$.fragment, local);
			transition_in(ground2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(ground0.$$.fragment, local);
			transition_out(ground1.$$.fragment, local);
			transition_out(ground2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(a_sky);
				detach(t0);
				detach(t1);
				detach(t2);
			}

			destroy_component(ground0, detaching);
			destroy_component(ground1, detaching);
			destroy_component(ground2, detaching);
		}
	};
}

class Environment extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$2, not_equal, {});
	}
}

/* src/lib/components/person.svelte generated by Svelte v4.2.0 */

function create_fragment$1(ctx) {
	let a_cylinder;
	let a_sphere;
	let a_sphere_radius_value;

	let a_cylinder_levels = [
		/*$$restProps*/ ctx[3],
		{ color: /*color*/ ctx[0] },
		{ height: /*height*/ ctx[1] },
		{ radius: /*radius*/ ctx[2] }
	];

	let a_cylinder_data = {};

	for (let i = 0; i < a_cylinder_levels.length; i += 1) {
		a_cylinder_data = assign(a_cylinder_data, a_cylinder_levels[i]);
	}

	return {
		c() {
			a_cylinder = element$1("a-cylinder");
			a_sphere = element$1("a-sphere");
			set_custom_element_data(a_sphere, "color", /*color*/ ctx[0]);
			set_custom_element_data(a_sphere, "radius", a_sphere_radius_value = /*radius*/ ctx[2] * 2.5);
			set_custom_element_data(a_sphere, "position", "0 0.05 0");
			set_attributes(a_cylinder, a_cylinder_data);
		},
		m(target, anchor) {
			insert(target, a_cylinder, anchor);
			append(a_cylinder, a_sphere);
		},
		p(ctx, [dirty]) {
			if (dirty & /*color*/ 1) {
				set_custom_element_data(a_sphere, "color", /*color*/ ctx[0]);
			}

			if (dirty & /*radius*/ 4 && a_sphere_radius_value !== (a_sphere_radius_value = /*radius*/ ctx[2] * 2.5)) {
				set_custom_element_data(a_sphere, "radius", a_sphere_radius_value);
			}

			set_attributes(a_cylinder, a_cylinder_data = get_spread_update(a_cylinder_levels, [
				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
				dirty & /*color*/ 1 && { color: /*color*/ ctx[0] },
				dirty & /*height*/ 2 && { height: /*height*/ ctx[1] },
				dirty & /*radius*/ 4 && { radius: /*radius*/ ctx[2] }
			]));
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(a_cylinder);
			}
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	const omit_props_names = ["color","height","radius"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { color } = $$props;
	let { height = 0.1 } = $$props;
	let { radius = 0.01 } = $$props;

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('color' in $$new_props) $$invalidate(0, color = $$new_props.color);
		if ('height' in $$new_props) $$invalidate(1, height = $$new_props.height);
		if ('radius' in $$new_props) $$invalidate(2, radius = $$new_props.radius);
	};

	return [color, height, radius, $$restProps];
}

class Person extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, not_equal, { color: 0, height: 1, radius: 2 });
	}
}

/* src/app.svelte generated by Svelte v4.2.0 */

function create_fragment(ctx) {
	let a_scene;
	let lights;
	let t0;
	let environment;
	let t1;
	let person;
	let t2;
	let a_entity;
	let a_camera;
	let t3;
	let a;
	let current;
	let mounted;
	let dispose;
	lights = new Lights({});
	environment = new Environment({});

	person = new Person({
			props: { position: "0 1.05 0", color: "red" }
		});

	return {
		c() {
			a_scene = element$1("a-scene");
			create_component(lights.$$.fragment);
			t0 = space();
			create_component(environment.$$.fragment);
			t1 = space();
			create_component(person.$$.fragment);
			t2 = space();
			a_entity = element$1("a-entity");
			a_camera = element$1("a-camera");
			t3 = space();
			a = element$1("a");
			a.textContent = "Start";
			set_custom_element_data(a_camera, "look-controls-enabled", "false");
			set_custom_element_data(a_camera, "look-at", "0 0 0");
			set_custom_element_data(a_entity, "position", "0 3 0");
			set_custom_element_data(a_scene, "vr-mode-ui", "enterVRButton:#vr-btn");
			set_custom_element_data(a_scene, "renderer", "antialias:true;colorManagement:true;highRefreshRate:true;physicallyCorrectLights:true;toneMapping:ACESFilmic");
			attr(a, "id", "vr-btn");
			attr(a, "class", "bg-black z-10 bg-opacity-50 border border-white text-white px-8 py-3 cursor-pointer text-lg");
		},
		m(target, anchor) {
			insert(target, a_scene, anchor);
			mount_component(lights, a_scene, null);
			append(a_scene, t0);
			mount_component(environment, a_scene, null);
			append(a_scene, t1);
			mount_component(person, a_scene, null);
			append(a_scene, t2);
			append(a_scene, a_entity);
			append(a_entity, a_camera);
			insert(target, t3, anchor);
			insert(target, a, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(a_camera, "loaded", /*handleCameraLoad*/ ctx[1]),
					listen(a_scene, "loaded", /*handleLoad*/ ctx[0])
				];

				mounted = true;
			}
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(lights.$$.fragment, local);
			transition_in(environment.$$.fragment, local);
			transition_in(person.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(lights.$$.fragment, local);
			transition_out(environment.$$.fragment, local);
			transition_out(person.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(a_scene);
				detach(t3);
				detach(a);
			}

			destroy_component(lights);
			destroy_component(environment);
			destroy_component(person);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self) {
	const handleLoad = async event => {
		await tick();
		shadows(event.target.object3D);
	};

	const handleCameraLoad = event => {
		const [camera] = event.target.object3D.children;
		camera.lookAt(0, 0, 0);
	};

	return [handleLoad, handleCameraLoad];
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, not_equal, {});
	}
}

new App({ target: document.body });
