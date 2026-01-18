var _r = Object.defineProperty;
var wr = (i, t, a) => t in i ? _r(i, t, { enumerable: !0, configurable: !0, writable: !0, value: a }) : i[t] = a;
var V = (i, t, a) => wr(i, typeof t != "symbol" ? t + "" : t, a);
import { Vector3 as T, Quaternion as kr } from "three";
import Le, { useMemo as D, useRef as pe } from "react";
import { useFrame as he } from "@react-three/fiber";
import { Sphere as Tr } from "@react-three/drei";
let ee;
const Sr = new Uint8Array(16);
function Cr() {
  if (!ee && (ee = typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto), !ee))
    throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
  return ee(Sr);
}
const C = [];
for (let i = 0; i < 256; ++i)
  C.push((i + 256).toString(16).slice(1));
function xr(i, t = 0) {
  return C[i[t + 0]] + C[i[t + 1]] + C[i[t + 2]] + C[i[t + 3]] + "-" + C[i[t + 4]] + C[i[t + 5]] + "-" + C[i[t + 6]] + C[i[t + 7]] + "-" + C[i[t + 8]] + C[i[t + 9]] + "-" + C[i[t + 10]] + C[i[t + 11]] + C[i[t + 12]] + C[i[t + 13]] + C[i[t + 14]] + C[i[t + 15]];
}
const Or = typeof crypto < "u" && crypto.randomUUID && crypto.randomUUID.bind(crypto), De = {
  randomUUID: Or
};
function fe(i, t, a) {
  if (De.randomUUID && !i)
    return De.randomUUID();
  i = i || {};
  const o = i.random || (i.rng || Cr)();
  return o[6] = o[6] & 15 | 64, o[8] = o[8] & 63 | 128, xr(o);
}
class j {
  constructor(t, a, o) {
    V(this, "id");
    V(this, "name");
    V(this, "position");
    V(this, "children");
    this.id = o || fe(), this.name = t, this.position = a, this.children = [];
  }
  addChild(t) {
    this.children.push(t);
  }
  // Clone this node and its children recursively
  clone() {
    const t = new j(this.name, this.position.clone(), this.id);
    return t.children = this.children.map((a) => a.clone()), t;
  }
  // Find a node by ID in this subtree
  findNode(t) {
    if (this.id === t) return this;
    for (const a of this.children) {
      const o = a.findNode(t);
      if (o) return o;
    }
    return null;
  }
}
class re {
  // INCREASED DEFAULT SIZES to fix "too small/thin"
  constructor(t, a = 0.35, o = 0.1) {
    V(this, "root");
    V(this, "headRadius");
    V(this, "strokeWidth");
    t ? this.root = t : this.root = this.createDefaultSkeleton(), this.headRadius = a, this.strokeWidth = o;
  }
  get nodes() {
    const t = [], a = (o) => {
      t.push(o), o.children.forEach(a);
    };
    return a(this.root), t;
  }
  createDefaultSkeleton() {
    const t = new j("hip", new T(0, 1, 0)), a = new j("torso", new T(0, 1.5, 0)), o = new j("neck", new T(0, 1.8, 0)), p = new j("head", new T(0, 2.1, 0));
    t.addChild(a), a.addChild(o), o.addChild(p);
    const f = new j("leftElbow", new T(-0.4, 1.5, 0)), _ = new j("leftHand", new T(-0.6, 1.2, 0)), w = new j("rightElbow", new T(0.4, 1.5, 0)), y = new j("rightHand", new T(0.6, 1.2, 0));
    o.addChild(f), f.addChild(_), o.addChild(w), w.addChild(y);
    const g = new j("leftKnee", new T(-0.3, 0.5, 0)), v = new j("leftFoot", new T(-0.3, 0, 0)), l = new j("rightKnee", new T(0.3, 0.5, 0)), u = new j("rightFoot", new T(0.3, 0, 0));
    return t.addChild(g), g.addChild(v), t.addChild(l), l.addChild(u), t;
  }
  clone() {
    return new re(this.root.clone(), this.headRadius, this.strokeWidth);
  }
  lerp(t, a) {
    const o = this.clone();
    return o.headRadius = this.headRadius + (t.headRadius - this.headRadius) * a, o.strokeWidth = this.strokeWidth + (t.strokeWidth - this.strokeWidth) * a, this._lerpNode(o.root, t.root, a), o;
  }
  _lerpNode(t, a, o) {
    t.id === a.id && t.position.lerp(a.position, o);
    for (let p = 0; p < t.children.length; p++) {
      const f = t.children[p];
      p < a.children.length && this._lerpNode(f, a.children[p], o);
    }
  }
  getAllNodes() {
    return this.nodes;
  }
  updateNodePosition(t, a) {
    const o = this.root.findNode(t);
    o && o.position.copy(a);
  }
}
function Yr(i) {
  try {
    const t = JSON.parse(i), a = t.format === "sa3" || !!t.skin || !!t.polygons;
    let o = 1, p = 0;
    const f = a ? 1 : -1, _ = t.clips || (t.keyframes ? [t] : []);
    let w = new re();
    if (_.length === 0)
      return {
        clips: [],
        currentSkeleton: w,
        meta: {
          skin: t.skin,
          polygons: t.polygons,
          headRadius: t.headRadius,
          strokeWidth: t.strokeWidth
        }
      };
    if (!a && _.length > 0) {
      let l = 1 / 0, u = -1 / 0;
      const S = (x) => Array.isArray(x.pos) ? { y: x.pos[1] * f } : x.position ? { y: (x.position.y || 0) * f } : { y: 0 }, P = (_[0].keyframes || [])[0];
      if (P) {
        const x = P.pose || P.skeleton, F = x.root || x, E = (M) => {
          const { y: L } = S(M);
          L < l && (l = L), L > u && (u = L), M.children && M.children.forEach((te) => E(te));
        };
        E(F);
        const $ = u - l;
        $ > 0.01 ? (o = 2 / $, p = -(l * o)) : (o = 0.25, p = 0);
      } else
        o = 0.25;
    }
    const y = (l) => {
      const u = new T();
      Array.isArray(l.pos) ? u.set(
        l.pos[0] * o,
        l.pos[1] * f * o + p,
        l.pos[2] * o
      ) : l.position && u.set(
        (l.position.x || 0) * o,
        (l.position.y || 0) * f * o + p,
        (l.position.z || 0) * o
      );
      const S = new j(l.id || l.name, u, l.id);
      return l.children && l.children.forEach((R) => S.addChild(y(R))), S;
    }, g = _.map((l) => {
      const u = (l.keyframes || []).map((R) => {
        const P = R.pose || R.skeleton, x = new re(
          void 0,
          (P.headRadius || t.headRadius || 0.1) * o,
          (P.strokeWidth || t.strokeWidth || 0.02) * o
        );
        return x.root = y(P.root || P), {
          id: R.id || fe(),
          timestamp: R.timestamp || (R.frameIndex ? R.frameIndex / 30 : 0),
          skeleton: x
        };
      });
      let S = l.duration || 5;
      if (u.length > 0) {
        const R = Math.max(...u.map((P) => P.timestamp));
        S = R > 0 ? R : 5;
      }
      return {
        id: l.id || fe(),
        name: l.name || "Imported Animation",
        duration: S,
        keyframes: u
      };
    }), v = g[0];
    return v && v.keyframes.length > 0 && (w = v.keyframes[0].skeleton.clone()), {
      clips: g,
      currentSkeleton: w,
      meta: {
        skin: t.skin || null,
        polygons: t.polygons || null,
        headRadius: w.headRadius,
        strokeWidth: w.strokeWidth
      }
    };
  } catch (t) {
    throw console.error("Failed to parse project", t), new Error("Failed to parse stickman project JSON");
  }
}
var de = { exports: {} }, q = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var $e;
function jr() {
  if ($e) return q;
  $e = 1;
  var i = Le, t = Symbol.for("react.element"), a = Symbol.for("react.fragment"), o = Object.prototype.hasOwnProperty, p = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, f = { key: !0, ref: !0, __self: !0, __source: !0 };
  function _(w, y, g) {
    var v, l = {}, u = null, S = null;
    g !== void 0 && (u = "" + g), y.key !== void 0 && (u = "" + y.key), y.ref !== void 0 && (S = y.ref);
    for (v in y) o.call(y, v) && !f.hasOwnProperty(v) && (l[v] = y[v]);
    if (w && w.defaultProps) for (v in y = w.defaultProps, y) l[v] === void 0 && (l[v] = y[v]);
    return { $$typeof: t, type: w, key: u, ref: S, props: l, _owner: p.current };
  }
  return q.Fragment = a, q.jsx = _, q.jsxs = _, q;
}
var B = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Me;
function Pr() {
  return Me || (Me = 1, process.env.NODE_ENV !== "production" && function() {
    var i = Le, t = Symbol.for("react.element"), a = Symbol.for("react.portal"), o = Symbol.for("react.fragment"), p = Symbol.for("react.strict_mode"), f = Symbol.for("react.profiler"), _ = Symbol.for("react.provider"), w = Symbol.for("react.context"), y = Symbol.for("react.forward_ref"), g = Symbol.for("react.suspense"), v = Symbol.for("react.suspense_list"), l = Symbol.for("react.memo"), u = Symbol.for("react.lazy"), S = Symbol.for("react.offscreen"), R = Symbol.iterator, P = "@@iterator";
    function x(e) {
      if (e === null || typeof e != "object")
        return null;
      var r = R && e[R] || e[P];
      return typeof r == "function" ? r : null;
    }
    var F = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function E(e) {
      {
        for (var r = arguments.length, n = new Array(r > 1 ? r - 1 : 0), s = 1; s < r; s++)
          n[s - 1] = arguments[s];
        $("error", e, n);
      }
    }
    function $(e, r, n) {
      {
        var s = F.ReactDebugCurrentFrame, h = s.getStackAddendum();
        h !== "" && (r += "%s", n = n.concat([h]));
        var m = n.map(function(d) {
          return String(d);
        });
        m.unshift("Warning: " + r), Function.prototype.apply.call(console[e], console, m);
      }
    }
    var M = !1, L = !1, te = !1, He = !1, Je = !1, ve;
    ve = Symbol.for("react.module.reference");
    function Ge(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === o || e === f || Je || e === p || e === g || e === v || He || e === S || M || L || te || typeof e == "object" && e !== null && (e.$$typeof === u || e.$$typeof === l || e.$$typeof === _ || e.$$typeof === w || e.$$typeof === y || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === ve || e.getModuleId !== void 0));
    }
    function qe(e, r, n) {
      var s = e.displayName;
      if (s)
        return s;
      var h = r.displayName || r.name || "";
      return h !== "" ? n + "(" + h + ")" : n;
    }
    function me(e) {
      return e.displayName || "Context";
    }
    function N(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && E("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case o:
          return "Fragment";
        case a:
          return "Portal";
        case f:
          return "Profiler";
        case p:
          return "StrictMode";
        case g:
          return "Suspense";
        case v:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case w:
            var r = e;
            return me(r) + ".Consumer";
          case _:
            var n = e;
            return me(n._context) + ".Provider";
          case y:
            return qe(e, e.render, "ForwardRef");
          case l:
            var s = e.displayName || null;
            return s !== null ? s : N(e.type) || "Memo";
          case u: {
            var h = e, m = h._payload, d = h._init;
            try {
              return N(d(m));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var U = Object.assign, J = 0, ye, ge, Re, Ee, be, _e, we;
    function ke() {
    }
    ke.__reactDisabledLog = !0;
    function Be() {
      {
        if (J === 0) {
          ye = console.log, ge = console.info, Re = console.warn, Ee = console.error, be = console.group, _e = console.groupCollapsed, we = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: ke,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        J++;
      }
    }
    function ze() {
      {
        if (J--, J === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: U({}, e, {
              value: ye
            }),
            info: U({}, e, {
              value: ge
            }),
            warn: U({}, e, {
              value: Re
            }),
            error: U({}, e, {
              value: Ee
            }),
            group: U({}, e, {
              value: be
            }),
            groupCollapsed: U({}, e, {
              value: _e
            }),
            groupEnd: U({}, e, {
              value: we
            })
          });
        }
        J < 0 && E("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var ne = F.ReactCurrentDispatcher, oe;
    function z(e, r, n) {
      {
        if (oe === void 0)
          try {
            throw Error();
          } catch (h) {
            var s = h.stack.trim().match(/\n( *(at )?)/);
            oe = s && s[1] || "";
          }
        return `
` + oe + e;
      }
    }
    var ie = !1, X;
    {
      var Xe = typeof WeakMap == "function" ? WeakMap : Map;
      X = new Xe();
    }
    function Te(e, r) {
      if (!e || ie)
        return "";
      {
        var n = X.get(e);
        if (n !== void 0)
          return n;
      }
      var s;
      ie = !0;
      var h = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var m;
      m = ne.current, ne.current = null, Be();
      try {
        if (r) {
          var d = function() {
            throw Error();
          };
          if (Object.defineProperty(d.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(d, []);
            } catch (A) {
              s = A;
            }
            Reflect.construct(e, [], d);
          } else {
            try {
              d.call();
            } catch (A) {
              s = A;
            }
            e.call(d.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (A) {
            s = A;
          }
          e();
        }
      } catch (A) {
        if (A && s && typeof A.stack == "string") {
          for (var c = A.stack.split(`
`), O = s.stack.split(`
`), b = c.length - 1, k = O.length - 1; b >= 1 && k >= 0 && c[b] !== O[k]; )
            k--;
          for (; b >= 1 && k >= 0; b--, k--)
            if (c[b] !== O[k]) {
              if (b !== 1 || k !== 1)
                do
                  if (b--, k--, k < 0 || c[b] !== O[k]) {
                    var W = `
` + c[b].replace(" at new ", " at ");
                    return e.displayName && W.includes("<anonymous>") && (W = W.replace("<anonymous>", e.displayName)), typeof e == "function" && X.set(e, W), W;
                  }
                while (b >= 1 && k >= 0);
              break;
            }
        }
      } finally {
        ie = !1, ne.current = m, ze(), Error.prepareStackTrace = h;
      }
      var H = e ? e.displayName || e.name : "", Y = H ? z(H) : "";
      return typeof e == "function" && X.set(e, Y), Y;
    }
    function Qe(e, r, n) {
      return Te(e, !1);
    }
    function Ze(e) {
      var r = e.prototype;
      return !!(r && r.isReactComponent);
    }
    function Q(e, r, n) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return Te(e, Ze(e));
      if (typeof e == "string")
        return z(e);
      switch (e) {
        case g:
          return z("Suspense");
        case v:
          return z("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case y:
            return Qe(e.render);
          case l:
            return Q(e.type, r, n);
          case u: {
            var s = e, h = s._payload, m = s._init;
            try {
              return Q(m(h), r, n);
            } catch {
            }
          }
        }
      return "";
    }
    var G = Object.prototype.hasOwnProperty, Se = {}, Ce = F.ReactDebugCurrentFrame;
    function Z(e) {
      if (e) {
        var r = e._owner, n = Q(e.type, e._source, r ? r.type : null);
        Ce.setExtraStackFrame(n);
      } else
        Ce.setExtraStackFrame(null);
    }
    function er(e, r, n, s, h) {
      {
        var m = Function.call.bind(G);
        for (var d in e)
          if (m(e, d)) {
            var c = void 0;
            try {
              if (typeof e[d] != "function") {
                var O = Error((s || "React class") + ": " + n + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw O.name = "Invariant Violation", O;
              }
              c = e[d](r, d, s, n, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (b) {
              c = b;
            }
            c && !(c instanceof Error) && (Z(h), E("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", s || "React class", n, d, typeof c), Z(null)), c instanceof Error && !(c.message in Se) && (Se[c.message] = !0, Z(h), E("Failed %s type: %s", n, c.message), Z(null));
          }
      }
    }
    var rr = Array.isArray;
    function ae(e) {
      return rr(e);
    }
    function tr(e) {
      {
        var r = typeof Symbol == "function" && Symbol.toStringTag, n = r && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return n;
      }
    }
    function nr(e) {
      try {
        return xe(e), !1;
      } catch {
        return !0;
      }
    }
    function xe(e) {
      return "" + e;
    }
    function Oe(e) {
      if (nr(e))
        return E("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", tr(e)), xe(e);
    }
    var je = F.ReactCurrentOwner, or = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Pe, Ae;
    function ir(e) {
      if (G.call(e, "ref")) {
        var r = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function ar(e) {
      if (G.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function sr(e, r) {
      typeof e.ref == "string" && je.current;
    }
    function lr(e, r) {
      {
        var n = function() {
          Pe || (Pe = !0, E("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        n.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: n,
          configurable: !0
        });
      }
    }
    function ur(e, r) {
      {
        var n = function() {
          Ae || (Ae = !0, E("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        n.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: n,
          configurable: !0
        });
      }
    }
    var cr = function(e, r, n, s, h, m, d) {
      var c = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: t,
        // Built-in properties that belong on the element
        type: e,
        key: r,
        ref: n,
        props: d,
        // Record the component responsible for creating this element.
        _owner: m
      };
      return c._store = {}, Object.defineProperty(c._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(c, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: s
      }), Object.defineProperty(c, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: h
      }), Object.freeze && (Object.freeze(c.props), Object.freeze(c)), c;
    };
    function fr(e, r, n, s, h) {
      {
        var m, d = {}, c = null, O = null;
        n !== void 0 && (Oe(n), c = "" + n), ar(r) && (Oe(r.key), c = "" + r.key), ir(r) && (O = r.ref, sr(r, h));
        for (m in r)
          G.call(r, m) && !or.hasOwnProperty(m) && (d[m] = r[m]);
        if (e && e.defaultProps) {
          var b = e.defaultProps;
          for (m in b)
            d[m] === void 0 && (d[m] = b[m]);
        }
        if (c || O) {
          var k = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          c && lr(d, k), O && ur(d, k);
        }
        return cr(e, c, O, h, s, je.current, d);
      }
    }
    var se = F.ReactCurrentOwner, Fe = F.ReactDebugCurrentFrame;
    function K(e) {
      if (e) {
        var r = e._owner, n = Q(e.type, e._source, r ? r.type : null);
        Fe.setExtraStackFrame(n);
      } else
        Fe.setExtraStackFrame(null);
    }
    var le;
    le = !1;
    function ue(e) {
      return typeof e == "object" && e !== null && e.$$typeof === t;
    }
    function Ie() {
      {
        if (se.current) {
          var e = N(se.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function dr(e) {
      return "";
    }
    var We = {};
    function pr(e) {
      {
        var r = Ie();
        if (!r) {
          var n = typeof e == "string" ? e : e.displayName || e.name;
          n && (r = `

Check the top-level render call using <` + n + ">.");
        }
        return r;
      }
    }
    function Ne(e, r) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var n = pr(r);
        if (We[n])
          return;
        We[n] = !0;
        var s = "";
        e && e._owner && e._owner !== se.current && (s = " It was passed a child from " + N(e._owner.type) + "."), K(e), E('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', n, s), K(null);
      }
    }
    function Ve(e, r) {
      {
        if (typeof e != "object")
          return;
        if (ae(e))
          for (var n = 0; n < e.length; n++) {
            var s = e[n];
            ue(s) && Ne(s, r);
          }
        else if (ue(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var h = x(e);
          if (typeof h == "function" && h !== e.entries)
            for (var m = h.call(e), d; !(d = m.next()).done; )
              ue(d.value) && Ne(d.value, r);
        }
      }
    }
    function hr(e) {
      {
        var r = e.type;
        if (r == null || typeof r == "string")
          return;
        var n;
        if (typeof r == "function")
          n = r.propTypes;
        else if (typeof r == "object" && (r.$$typeof === y || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        r.$$typeof === l))
          n = r.propTypes;
        else
          return;
        if (n) {
          var s = N(r);
          er(n, e.props, "prop", s, e);
        } else if (r.PropTypes !== void 0 && !le) {
          le = !0;
          var h = N(r);
          E("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", h || "Unknown");
        }
        typeof r.getDefaultProps == "function" && !r.getDefaultProps.isReactClassApproved && E("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function vr(e) {
      {
        for (var r = Object.keys(e.props), n = 0; n < r.length; n++) {
          var s = r[n];
          if (s !== "children" && s !== "key") {
            K(e), E("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", s), K(null);
            break;
          }
        }
        e.ref !== null && (K(e), E("Invalid attribute `ref` supplied to `React.Fragment`."), K(null));
      }
    }
    var Ue = {};
    function Ye(e, r, n, s, h, m) {
      {
        var d = Ge(e);
        if (!d) {
          var c = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (c += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var O = dr();
          O ? c += O : c += Ie();
          var b;
          e === null ? b = "null" : ae(e) ? b = "array" : e !== void 0 && e.$$typeof === t ? (b = "<" + (N(e.type) || "Unknown") + " />", c = " Did you accidentally export a JSX literal instead of a component?") : b = typeof e, E("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", b, c);
        }
        var k = fr(e, r, n, h, m);
        if (k == null)
          return k;
        if (d) {
          var W = r.children;
          if (W !== void 0)
            if (s)
              if (ae(W)) {
                for (var H = 0; H < W.length; H++)
                  Ve(W[H], e);
                Object.freeze && Object.freeze(W);
              } else
                E("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              Ve(W, e);
        }
        if (G.call(r, "key")) {
          var Y = N(e), A = Object.keys(r).filter(function(br) {
            return br !== "key";
          }), ce = A.length > 0 ? "{key: someKey, " + A.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!Ue[Y + ce]) {
            var Er = A.length > 0 ? "{" + A.join(": ..., ") + ": ...}" : "{}";
            E(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, ce, Y, Er, Y), Ue[Y + ce] = !0;
          }
        }
        return e === o ? vr(k) : hr(k), k;
      }
    }
    function mr(e, r, n) {
      return Ye(e, r, n, !0);
    }
    function yr(e, r, n) {
      return Ye(e, r, n, !1);
    }
    var gr = yr, Rr = mr;
    B.Fragment = o, B.jsx = gr, B.jsxs = Rr;
  }()), B;
}
process.env.NODE_ENV === "production" ? de.exports = jr() : de.exports = Pr();
var I = de.exports;
const Ar = ({ node: i, radius: t }) => {
  const a = pe(null);
  return he(() => {
    a.current && a.current.position.copy(i.position);
  }), /* @__PURE__ */ I.jsx(
    Tr,
    {
      ref: a,
      position: i.position,
      args: [t, 32, 32],
      children: /* @__PURE__ */ I.jsx("meshStandardMaterial", { color: "white" })
    }
  );
}, Fr = ({ startNode: i, endNode: t, thickness: a }) => {
  const o = pe(null), p = D(() => new T(0, 1, 0), []), f = D(() => new T(), []), _ = D(() => new T(), []), w = D(() => new T(), []), y = D(() => new T(), []), g = D(() => new kr(), []);
  return he(() => {
    if (o.current) {
      f.copy(i.position), _.copy(t.position);
      const v = f.distanceTo(_);
      y.addVectors(f, _).multiplyScalar(0.5), w.subVectors(_, f).normalize(), g.setFromUnitVectors(p, w), o.current.position.copy(y), o.current.quaternion.copy(g), o.current.scale.set(1, v, 1);
    }
  }), /* @__PURE__ */ I.jsxs("mesh", { ref: o, children: [
    /* @__PURE__ */ I.jsx("cylinderGeometry", { args: [a, a, 1, 16] }),
    /* @__PURE__ */ I.jsx("meshStandardMaterial", { color: "white" })
  ] });
}, Ke = ({ node: i, headRadius: t, strokeWidth: a }) => {
  const o = i.name === "head" ? t : a;
  return /* @__PURE__ */ I.jsxs(I.Fragment, { children: [
    /* @__PURE__ */ I.jsx(
      Ar,
      {
        node: i,
        radius: o
      }
    ),
    i.children.map((p) => /* @__PURE__ */ I.jsxs("group", { children: [
      /* @__PURE__ */ I.jsx(Fr, { startNode: i, endNode: p, thickness: a }),
      /* @__PURE__ */ I.jsx(Ke, { node: p, headRadius: t, strokeWidth: a })
    ] }, p.id))
  ] });
}, Dr = ({
  projectData: i,
  isPlaying: t,
  scale: a = 1,
  loop: o = !0
}) => {
  const p = D(() => i.currentSkeleton.clone(), [i]), f = i.clips.length > 0 ? i.clips[0] : null, _ = pe(0);
  return he((w, y) => {
    if (t && f && f.keyframes.length > 0) {
      let g = _.current + y;
      if (g > f.duration && (o ? g = 0 : g = f.duration), _.current = g, f.keyframes.length >= 2) {
        let v = f.keyframes[0], l = f.keyframes[f.keyframes.length - 1];
        for (let u = 0; u < f.keyframes.length - 1; u++)
          if (f.keyframes[u].timestamp <= g && f.keyframes[u + 1].timestamp >= g) {
            v = f.keyframes[u], l = f.keyframes[u + 1];
            break;
          }
        if (v && l) {
          const u = l.timestamp - v.timestamp, S = u > 1e-4 ? (g - v.timestamp) / u : 0, R = v.skeleton.lerp(l.skeleton, S), P = R.getAllNodes(), x = p.getAllNodes();
          for (let F = 0; F < x.length; F++) {
            const E = P.find(($) => $.id === x[F].id);
            E && x[F].position.copy(E.position);
          }
          p.headRadius = R.headRadius, p.strokeWidth = R.strokeWidth;
        }
      } else if (f.keyframes.length === 1) {
        const v = f.keyframes[0].skeleton.getAllNodes(), l = p.getAllNodes();
        for (let u = 0; u < l.length; u++) {
          const S = v.find((R) => R.id === l[u].id);
          S && l[u].position.copy(S.position);
        }
      }
    }
  }), /* @__PURE__ */ I.jsx("group", { scale: a, children: /* @__PURE__ */ I.jsx(
    Ke,
    {
      node: p.root,
      headRadius: p.headRadius,
      strokeWidth: p.strokeWidth
    }
  ) });
};
export {
  Dr as StickmanPlayer,
  Yr as parseStickmanProject
};
