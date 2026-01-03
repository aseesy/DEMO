import {
  r as Hg,
  a as _g,
  g as Bg,
  R as Xl,
  b as xt,
  L as Ug,
  c as qg,
  d as xe,
  B as Ig,
} from './vendor-BMhbIJ5c.js';
(function () {
  const f = document.createElement('link').relList;
  if (f && f.supports && f.supports('modulepreload')) return;
  for (const k of document.querySelectorAll('link[rel="modulepreload"]')) u(k);
  new MutationObserver(k => {
    for (const z of k)
      if (z.type === 'childList')
        for (const q of z.addedNodes) q.tagName === 'LINK' && q.rel === 'modulepreload' && u(q);
  }).observe(document, { childList: !0, subtree: !0 });
  function x(k) {
    const z = {};
    return (
      k.integrity && (z.integrity = k.integrity),
      k.referrerPolicy && (z.referrerPolicy = k.referrerPolicy),
      k.crossOrigin === 'use-credentials'
        ? (z.credentials = 'include')
        : k.crossOrigin === 'anonymous'
          ? (z.credentials = 'omit')
          : (z.credentials = 'same-origin'),
      z
    );
  }
  function u(k) {
    if (k.ep) return;
    k.ep = !0;
    const z = x(k);
    fetch(k.href, z);
  }
})();
var sc = { exports: {} },
  fi = {};
var im;
function Wg() {
  if (im) return fi;
  im = 1;
  var d = Symbol.for('react.transitional.element'),
    f = Symbol.for('react.fragment');
  function x(u, k, z) {
    var q = null;
    if ((z !== void 0 && (q = '' + z), k.key !== void 0 && (q = '' + k.key), 'key' in k)) {
      z = {};
      for (var $ in k) $ !== 'key' && (z[$] = k[$]);
    } else z = k;
    return ((k = z.ref), { $$typeof: d, type: u, key: q, ref: k !== void 0 ? k : null, props: z });
  }
  return ((fi.Fragment = f), (fi.jsx = x), (fi.jsxs = x), fi);
}
var lm;
function Gg() {
  return (lm || ((lm = 1), (sc.exports = Wg())), sc.exports);
}
var t = Gg(),
  ic = { exports: {} },
  gi = {},
  lc = { exports: {} },
  rc = {};
var rm;
function Zg() {
  return (
    rm ||
      ((rm = 1),
      (function (d) {
        function f(N, A) {
          var O = N.length;
          N.push(A);
          e: for (; 0 < O; ) {
            var fe = (O - 1) >>> 1,
              ce = N[fe];
            if (0 < k(ce, A)) ((N[fe] = A), (N[O] = ce), (O = fe));
            else break e;
          }
        }
        function x(N) {
          return N.length === 0 ? null : N[0];
        }
        function u(N) {
          if (N.length === 0) return null;
          var A = N[0],
            O = N.pop();
          if (O !== A) {
            N[0] = O;
            e: for (var fe = 0, ce = N.length, J = ce >>> 1; fe < J; ) {
              var ye = 2 * (fe + 1) - 1,
                H = N[ye],
                Ae = ye + 1,
                P = N[Ae];
              if (0 > k(H, O))
                Ae < ce && 0 > k(P, H)
                  ? ((N[fe] = P), (N[Ae] = O), (fe = Ae))
                  : ((N[fe] = H), (N[ye] = O), (fe = ye));
              else if (Ae < ce && 0 > k(P, O)) ((N[fe] = P), (N[Ae] = O), (fe = Ae));
              else break e;
            }
          }
          return A;
        }
        function k(N, A) {
          var O = N.sortIndex - A.sortIndex;
          return O !== 0 ? O : N.id - A.id;
        }
        if (
          ((d.unstable_now = void 0),
          typeof performance == 'object' && typeof performance.now == 'function')
        ) {
          var z = performance;
          d.unstable_now = function () {
            return z.now();
          };
        } else {
          var q = Date,
            $ = q.now();
          d.unstable_now = function () {
            return q.now() - $;
          };
        }
        var pe = [],
          me = [],
          pt = 1,
          L = null,
          ie = 3,
          Pe = !1,
          Me = !1,
          ne = !1,
          F = !1,
          oe = typeof setTimeout == 'function' ? setTimeout : null,
          tt = typeof clearTimeout == 'function' ? clearTimeout : null,
          Z = typeof setImmediate < 'u' ? setImmediate : null;
        function K(N) {
          for (var A = x(me); A !== null; ) {
            if (A.callback === null) u(me);
            else if (A.startTime <= N) (u(me), (A.sortIndex = A.expirationTime), f(pe, A));
            else break;
            A = x(me);
          }
        }
        function Ue(N) {
          if (((ne = !1), K(N), !Me))
            if (x(pe) !== null) ((Me = !0), De || ((De = !0), et()));
            else {
              var A = x(me);
              A !== null && It(Ue, A.startTime - N);
            }
        }
        var De = !1,
          lt = -1,
          yt = 5,
          za = -1;
        function Cn() {
          return F ? !0 : !(d.unstable_now() - za < yt);
        }
        function Te() {
          if (((F = !1), De)) {
            var N = d.unstable_now();
            za = N;
            var A = !0;
            try {
              e: {
                ((Me = !1), ne && ((ne = !1), tt(lt), (lt = -1)), (Pe = !0));
                var O = ie;
                try {
                  t: {
                    for (K(N), L = x(pe); L !== null && !(L.expirationTime > N && Cn()); ) {
                      var fe = L.callback;
                      if (typeof fe == 'function') {
                        ((L.callback = null), (ie = L.priorityLevel));
                        var ce = fe(L.expirationTime <= N);
                        if (((N = d.unstable_now()), typeof ce == 'function')) {
                          ((L.callback = ce), K(N), (A = !0));
                          break t;
                        }
                        (L === x(pe) && u(pe), K(N));
                      } else u(pe);
                      L = x(pe);
                    }
                    if (L !== null) A = !0;
                    else {
                      var J = x(me);
                      (J !== null && It(Ue, J.startTime - N), (A = !1));
                    }
                  }
                  break e;
                } finally {
                  ((L = null), (ie = O), (Pe = !1));
                }
                A = void 0;
              }
            } finally {
              A ? et() : (De = !1);
            }
          }
        }
        var et;
        if (typeof Z == 'function')
          et = function () {
            Z(Te);
          };
        else if (typeof MessageChannel < 'u') {
          var Ma = new MessageChannel(),
            na = Ma.port2;
          ((Ma.port1.onmessage = Te),
            (et = function () {
              na.postMessage(null);
            }));
        } else
          et = function () {
            oe(Te, 0);
          };
        function It(N, A) {
          lt = oe(function () {
            N(d.unstable_now());
          }, A);
        }
        ((d.unstable_IdlePriority = 5),
          (d.unstable_ImmediatePriority = 1),
          (d.unstable_LowPriority = 4),
          (d.unstable_NormalPriority = 3),
          (d.unstable_Profiling = null),
          (d.unstable_UserBlockingPriority = 2),
          (d.unstable_cancelCallback = function (N) {
            N.callback = null;
          }),
          (d.unstable_forceFrameRate = function (N) {
            0 > N || 125 < N
              ? console.error(
                  'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported'
                )
              : (yt = 0 < N ? Math.floor(1e3 / N) : 5);
          }),
          (d.unstable_getCurrentPriorityLevel = function () {
            return ie;
          }),
          (d.unstable_next = function (N) {
            switch (ie) {
              case 1:
              case 2:
              case 3:
                var A = 3;
                break;
              default:
                A = ie;
            }
            var O = ie;
            ie = A;
            try {
              return N();
            } finally {
              ie = O;
            }
          }),
          (d.unstable_requestPaint = function () {
            F = !0;
          }),
          (d.unstable_runWithPriority = function (N, A) {
            switch (N) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                N = 3;
            }
            var O = ie;
            ie = N;
            try {
              return A();
            } finally {
              ie = O;
            }
          }),
          (d.unstable_scheduleCallback = function (N, A, O) {
            var fe = d.unstable_now();
            switch (
              (typeof O == 'object' && O !== null
                ? ((O = O.delay), (O = typeof O == 'number' && 0 < O ? fe + O : fe))
                : (O = fe),
              N)
            ) {
              case 1:
                var ce = -1;
                break;
              case 2:
                ce = 250;
                break;
              case 5:
                ce = 1073741823;
                break;
              case 4:
                ce = 1e4;
                break;
              default:
                ce = 5e3;
            }
            return (
              (ce = O + ce),
              (N = {
                id: pt++,
                callback: A,
                priorityLevel: N,
                startTime: O,
                expirationTime: ce,
                sortIndex: -1,
              }),
              O > fe
                ? ((N.sortIndex = O),
                  f(me, N),
                  x(pe) === null &&
                    N === x(me) &&
                    (ne ? (tt(lt), (lt = -1)) : (ne = !0), It(Ue, O - fe)))
                : ((N.sortIndex = ce), f(pe, N), Me || Pe || ((Me = !0), De || ((De = !0), et()))),
              N
            );
          }),
          (d.unstable_shouldYield = Cn),
          (d.unstable_wrapCallback = function (N) {
            var A = ie;
            return function () {
              var O = ie;
              ie = A;
              try {
                return N.apply(this, arguments);
              } finally {
                ie = O;
              }
            };
          }));
      })(rc)),
    rc
  );
}
var om;
function Qg() {
  return (om || ((om = 1), (lc.exports = Zg())), lc.exports);
}
var cm;
function Xg() {
  if (cm) return gi;
  cm = 1;
  var d = Qg(),
    f = Hg(),
    x = _g();
  function u(e) {
    var a = 'https://react.dev/errors/' + e;
    if (1 < arguments.length) {
      a += '?args[]=' + encodeURIComponent(arguments[1]);
      for (var n = 2; n < arguments.length; n++) a += '&args[]=' + encodeURIComponent(arguments[n]);
    }
    return (
      'Minified React error #' +
      e +
      '; visit ' +
      a +
      ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
    );
  }
  function k(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
  }
  function z(e) {
    var a = e,
      n = e;
    if (e.alternate) for (; a.return; ) a = a.return;
    else {
      e = a;
      do ((a = e), (a.flags & 4098) !== 0 && (n = a.return), (e = a.return));
      while (e);
    }
    return a.tag === 3 ? n : null;
  }
  function q(e) {
    if (e.tag === 13) {
      var a = e.memoizedState;
      if ((a === null && ((e = e.alternate), e !== null && (a = e.memoizedState)), a !== null))
        return a.dehydrated;
    }
    return null;
  }
  function $(e) {
    if (e.tag === 31) {
      var a = e.memoizedState;
      if ((a === null && ((e = e.alternate), e !== null && (a = e.memoizedState)), a !== null))
        return a.dehydrated;
    }
    return null;
  }
  function pe(e) {
    if (z(e) !== e) throw Error(u(188));
  }
  function me(e) {
    var a = e.alternate;
    if (!a) {
      if (((a = z(e)), a === null)) throw Error(u(188));
      return a !== e ? null : e;
    }
    for (var n = e, s = a; ; ) {
      var i = n.return;
      if (i === null) break;
      var l = i.alternate;
      if (l === null) {
        if (((s = i.return), s !== null)) {
          n = s;
          continue;
        }
        break;
      }
      if (i.child === l.child) {
        for (l = i.child; l; ) {
          if (l === n) return (pe(i), e);
          if (l === s) return (pe(i), a);
          l = l.sibling;
        }
        throw Error(u(188));
      }
      if (n.return !== s.return) ((n = i), (s = l));
      else {
        for (var r = !1, o = i.child; o; ) {
          if (o === n) {
            ((r = !0), (n = i), (s = l));
            break;
          }
          if (o === s) {
            ((r = !0), (s = i), (n = l));
            break;
          }
          o = o.sibling;
        }
        if (!r) {
          for (o = l.child; o; ) {
            if (o === n) {
              ((r = !0), (n = l), (s = i));
              break;
            }
            if (o === s) {
              ((r = !0), (s = l), (n = i));
              break;
            }
            o = o.sibling;
          }
          if (!r) throw Error(u(189));
        }
      }
      if (n.alternate !== s) throw Error(u(190));
    }
    if (n.tag !== 3) throw Error(u(188));
    return n.stateNode.current === n ? e : a;
  }
  function pt(e) {
    var a = e.tag;
    if (a === 5 || a === 26 || a === 27 || a === 6) return e;
    for (e = e.child; e !== null; ) {
      if (((a = pt(e)), a !== null)) return a;
      e = e.sibling;
    }
    return null;
  }
  var L = Object.assign,
    ie = Symbol.for('react.element'),
    Pe = Symbol.for('react.transitional.element'),
    Me = Symbol.for('react.portal'),
    ne = Symbol.for('react.fragment'),
    F = Symbol.for('react.strict_mode'),
    oe = Symbol.for('react.profiler'),
    tt = Symbol.for('react.consumer'),
    Z = Symbol.for('react.context'),
    K = Symbol.for('react.forward_ref'),
    Ue = Symbol.for('react.suspense'),
    De = Symbol.for('react.suspense_list'),
    lt = Symbol.for('react.memo'),
    yt = Symbol.for('react.lazy'),
    za = Symbol.for('react.activity'),
    Cn = Symbol.for('react.memo_cache_sentinel'),
    Te = Symbol.iterator;
  function et(e) {
    return e === null || typeof e != 'object'
      ? null
      : ((e = (Te && e[Te]) || e['@@iterator']), typeof e == 'function' ? e : null);
  }
  var Ma = Symbol.for('react.client.reference');
  function na(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.$$typeof === Ma ? null : e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
      case ne:
        return 'Fragment';
      case oe:
        return 'Profiler';
      case F:
        return 'StrictMode';
      case Ue:
        return 'Suspense';
      case De:
        return 'SuspenseList';
      case za:
        return 'Activity';
    }
    if (typeof e == 'object')
      switch (e.$$typeof) {
        case Me:
          return 'Portal';
        case Z:
          return e.displayName || 'Context';
        case tt:
          return (e._context.displayName || 'Context') + '.Consumer';
        case K:
          var a = e.render;
          return (
            (e = e.displayName),
            e ||
              ((e = a.displayName || a.name || ''),
              (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
            e
          );
        case lt:
          return ((a = e.displayName || null), a !== null ? a : na(e.type) || 'Memo');
        case yt:
          ((a = e._payload), (e = e._init));
          try {
            return na(e(a));
          } catch {}
      }
    return null;
  }
  var It = Array.isArray,
    N = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    A = x.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    O = { pending: !1, data: null, method: null, action: null },
    fe = [],
    ce = -1;
  function J(e) {
    return { current: e };
  }
  function ye(e) {
    0 > ce || ((e.current = fe[ce]), (fe[ce] = null), ce--);
  }
  function H(e, a) {
    (ce++, (fe[ce] = e.current), (e.current = a));
  }
  var Ae = J(null),
    P = J(null),
    rt = J(null),
    Da = J(null);
  function Wt(e, a) {
    switch ((H(rt, a), H(P, e), H(Ae, null), a.nodeType)) {
      case 9:
      case 11:
        e = (e = a.documentElement) && (e = e.namespaceURI) ? Eu(e) : 0;
        break;
      default:
        if (((e = a.tagName), (a = a.namespaceURI))) ((a = Eu(a)), (e = Cu(a, e)));
        else
          switch (e) {
            case 'svg':
              e = 1;
              break;
            case 'math':
              e = 2;
              break;
            default:
              e = 0;
          }
    }
    (ye(Ae), H(Ae, e));
  }
  function sa() {
    (ye(Ae), ye(P), ye(rt));
  }
  function on(e) {
    e.memoizedState !== null && H(Da, e);
    var a = Ae.current,
      n = Cu(a, e.type);
    a !== n && (H(P, e), H(Ae, n));
  }
  function cn(e) {
    (P.current === e && (ye(Ae), ye(P)), Da.current === e && (ye(Da), (di._currentValue = O)));
  }
  var zn, ia;
  function Et(e) {
    if (zn === void 0)
      try {
        throw Error();
      } catch (n) {
        var a = n.stack.trim().match(/\n( *(at )?)/);
        ((zn = (a && a[1]) || ''),
          (ia =
            -1 <
            n.stack.indexOf(`
    at`)
              ? ' (<anonymous>)'
              : -1 < n.stack.indexOf('@')
                ? '@unknown:0:0'
                : ''));
      }
    return (
      `
` +
      zn +
      e +
      ia
    );
  }
  var Gt = !1;
  function dn(e, a) {
    if (!e || Gt) return '';
    Gt = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var s = {
        DetermineComponentFrameRoot: function () {
          try {
            if (a) {
              var T = function () {
                throw Error();
              };
              if (
                (Object.defineProperty(T.prototype, 'props', {
                  set: function () {
                    throw Error();
                  },
                }),
                typeof Reflect == 'object' && Reflect.construct)
              ) {
                try {
                  Reflect.construct(T, []);
                } catch (j) {
                  var b = j;
                }
                Reflect.construct(e, [], T);
              } else {
                try {
                  T.call();
                } catch (j) {
                  b = j;
                }
                e.call(T.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (j) {
                b = j;
              }
              (T = e()) && typeof T.catch == 'function' && T.catch(function () {});
            }
          } catch (j) {
            if (j && b && typeof j.stack == 'string') return [j.stack, b.stack];
          }
          return [null, null];
        },
      };
      s.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot';
      var i = Object.getOwnPropertyDescriptor(s.DetermineComponentFrameRoot, 'name');
      i &&
        i.configurable &&
        Object.defineProperty(s.DetermineComponentFrameRoot, 'name', {
          value: 'DetermineComponentFrameRoot',
        });
      var l = s.DetermineComponentFrameRoot(),
        r = l[0],
        o = l[1];
      if (r && o) {
        var c = r.split(`
`),
          y = o.split(`
`);
        for (i = s = 0; s < c.length && !c[s].includes('DetermineComponentFrameRoot'); ) s++;
        for (; i < y.length && !y[i].includes('DetermineComponentFrameRoot'); ) i++;
        if (s === c.length || i === y.length)
          for (s = c.length - 1, i = y.length - 1; 1 <= s && 0 <= i && c[s] !== y[i]; ) i--;
        for (; 1 <= s && 0 <= i; s--, i--)
          if (c[s] !== y[i]) {
            if (s !== 1 || i !== 1)
              do
                if ((s--, i--, 0 > i || c[s] !== y[i])) {
                  var v =
                    `
` + c[s].replace(' at new ', ' at ');
                  return (
                    e.displayName &&
                      v.includes('<anonymous>') &&
                      (v = v.replace('<anonymous>', e.displayName)),
                    v
                  );
                }
              while (1 <= s && 0 <= i);
            break;
          }
      }
    } finally {
      ((Gt = !1), (Error.prepareStackTrace = n));
    }
    return (n = e ? e.displayName || e.name : '') ? Et(n) : '';
  }
  function fs(e, a) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return Et(e.type);
      case 16:
        return Et('Lazy');
      case 13:
        return e.child !== a && a !== null ? Et('Suspense Fallback') : Et('Suspense');
      case 19:
        return Et('SuspenseList');
      case 0:
      case 15:
        return dn(e.type, !1);
      case 11:
        return dn(e.type.render, !1);
      case 1:
        return dn(e.type, !0);
      case 31:
        return Et('Activity');
      default:
        return '';
    }
  }
  function la(e) {
    try {
      var a = '',
        n = null;
      do ((a += fs(e, n)), (n = e), (e = e.return));
      while (e);
      return a;
    } catch (s) {
      return (
        `
Error generating stack: ` +
        s.message +
        `
` +
        s.stack
      );
    }
  }
  var Ya = Object.prototype.hasOwnProperty,
    Ra = d.unstable_scheduleCallback,
    Mn = d.unstable_cancelCallback,
    Ni = d.unstable_shouldYield,
    Vl = d.unstable_requestPaint,
    Xe = d.unstable_now,
    hn = d.unstable_getCurrentPriorityLevel,
    ra = d.unstable_ImmediatePriority,
    bt = d.unstable_UserBlockingPriority,
    La = d.unstable_NormalPriority,
    Ti = d.unstable_LowPriority,
    gs = d.unstable_IdlePriority,
    xs = d.log,
    Si = d.unstable_setDisableYieldValue,
    Jt = null,
    We = null;
  function Ge(e) {
    if ((typeof xs == 'function' && Si(e), We && typeof We.setStrictMode == 'function'))
      try {
        We.setStrictMode(Jt, e);
      } catch {}
  }
  var Ye = Math.clz32 ? Math.clz32 : Kl,
    ps = Math.log,
    ys = Math.LN2;
  function Kl(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((ps(e) / ys) | 0)) | 0);
  }
  var oa = 256,
    ca = 262144,
    Dn = 4194304;
  function jt(e) {
    var a = e & 42;
    if (a !== 0) return a;
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return e & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return e & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return e;
    }
  }
  function Yn(e, a, n) {
    var s = e.pendingLanes;
    if (s === 0) return 0;
    var i = 0,
      l = e.suspendedLanes,
      r = e.pingedLanes;
    e = e.warmLanes;
    var o = s & 134217727;
    return (
      o !== 0
        ? ((s = o & ~l),
          s !== 0
            ? (i = jt(s))
            : ((r &= o), r !== 0 ? (i = jt(r)) : n || ((n = o & ~e), n !== 0 && (i = jt(n)))))
        : ((o = s & ~l),
          o !== 0
            ? (i = jt(o))
            : r !== 0
              ? (i = jt(r))
              : n || ((n = s & ~e), n !== 0 && (i = jt(n)))),
      i === 0
        ? 0
        : a !== 0 &&
            a !== i &&
            (a & l) === 0 &&
            ((l = i & -i), (n = a & -a), l >= n || (l === 32 && (n & 4194048) !== 0))
          ? a
          : i
    );
  }
  function un(e, a) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & a) === 0;
  }
  function Ee(e, a) {
    switch (e) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return a + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return a + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function da() {
    var e = Dn;
    return ((Dn <<= 1), (Dn & 62914560) === 0 && (Dn = 4194304), e);
  }
  function bs(e) {
    for (var a = [], n = 0; 31 > n; n++) a.push(e);
    return a;
  }
  function Oa(e, a) {
    ((e.pendingLanes |= a),
      a !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
  }
  function js(e, a, n, s, i, l) {
    var r = e.pendingLanes;
    ((e.pendingLanes = n),
      (e.suspendedLanes = 0),
      (e.pingedLanes = 0),
      (e.warmLanes = 0),
      (e.expiredLanes &= n),
      (e.entangledLanes &= n),
      (e.errorRecoveryDisabledLanes &= n),
      (e.shellSuspendCounter = 0));
    var o = e.entanglements,
      c = e.expirationTimes,
      y = e.hiddenUpdates;
    for (n = r & ~n; 0 < n; ) {
      var v = 31 - Ye(n),
        T = 1 << v;
      ((o[v] = 0), (c[v] = -1));
      var b = y[v];
      if (b !== null)
        for (y[v] = null, v = 0; v < b.length; v++) {
          var j = b[v];
          j !== null && (j.lane &= -536870913);
        }
      n &= ~T;
    }
    (s !== 0 && vs(e, s, 0),
      l !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= l & ~(r & ~a)));
  }
  function vs(e, a, n) {
    ((e.pendingLanes |= a), (e.suspendedLanes &= ~a));
    var s = 31 - Ye(a);
    ((e.entangledLanes |= a),
      (e.entanglements[s] = e.entanglements[s] | 1073741824 | (n & 261930)));
  }
  function ws(e, a) {
    var n = (e.entangledLanes |= a);
    for (e = e.entanglements; n; ) {
      var s = 31 - Ye(n),
        i = 1 << s;
      ((i & a) | (e[s] & a) && (e[s] |= a), (n &= ~i));
    }
  }
  function ki(e, a) {
    var n = a & -a;
    return ((n = (n & 42) !== 0 ? 1 : ot(n)), (n & (e.suspendedLanes | a)) !== 0 ? 0 : n);
  }
  function ot(e) {
    switch (e) {
      case 2:
        e = 1;
        break;
      case 8:
        e = 4;
        break;
      case 32:
        e = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        e = 128;
        break;
      case 268435456:
        e = 134217728;
        break;
      default:
        e = 0;
    }
    return e;
  }
  function Zt(e) {
    return ((e &= -e), 2 < e ? (8 < e ? ((e & 134217727) !== 0 ? 32 : 268435456) : 8) : 2);
  }
  function Ns() {
    var e = A.p;
    return e !== 0 ? e : ((e = window.event), e === void 0 ? 32 : $u(e.type));
  }
  function Ts(e, a) {
    var n = A.p;
    try {
      return ((A.p = e), a());
    } finally {
      A.p = n;
    }
  }
  var Ct = Math.random().toString(36).slice(2),
    Re = '__reactFiber$' + Ct,
    ve = '__reactProps$' + Ct,
    ha = '__reactContainer$' + Ct,
    Rn = '__reactEvents$' + Ct,
    Ai = '__reactListeners$' + Ct,
    Ei = '__reactHandles$' + Ct,
    Ci = '__reactResources$' + Ct,
    M = '__reactMarker$' + Ct;
  function h(e) {
    (delete e[Re], delete e[ve], delete e[Rn], delete e[Ai], delete e[Ei]);
  }
  function S(e) {
    var a = e[Re];
    if (a) return a;
    for (var n = e.parentNode; n; ) {
      if ((a = n[ha] || n[Re])) {
        if (((n = a.alternate), a.child !== null || (n !== null && n.child !== null)))
          for (e = Ou(e); e !== null; ) {
            if ((n = e[Re])) return n;
            e = Ou(e);
          }
        return a;
      }
      ((e = n), (n = e.parentNode));
    }
    return null;
  }
  function E(e) {
    if ((e = e[Re] || e[ha])) {
      var a = e.tag;
      if (a === 5 || a === 6 || a === 13 || a === 31 || a === 26 || a === 27 || a === 3) return e;
    }
    return null;
  }
  function se(e) {
    var a = e.tag;
    if (a === 5 || a === 26 || a === 27 || a === 6) return e.stateNode;
    throw Error(u(33));
  }
  function Ne(e) {
    var a = e[Ci];
    return (a || (a = e[Ci] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), a);
  }
  function U(e) {
    e[M] = !0;
  }
  var Ve = new Set(),
    zt = {};
  function ct(e, a) {
    (Ft(e, a), Ft(e + 'Capture', a));
  }
  function Ft(e, a) {
    for (zt[e] = a, e = 0; e < a.length; e++) Ve.add(a[e]);
  }
  var qe = RegExp(
      '^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$'
    ),
    Ss = {},
    ks = {};
  function Em(e) {
    return Ya.call(ks, e)
      ? !0
      : Ya.call(Ss, e)
        ? !1
        : qe.test(e)
          ? (ks[e] = !0)
          : ((Ss[e] = !0), !1);
  }
  function zi(e, a, n) {
    if (Em(a))
      if (n === null) e.removeAttribute(a);
      else {
        switch (typeof n) {
          case 'undefined':
          case 'function':
          case 'symbol':
            e.removeAttribute(a);
            return;
          case 'boolean':
            var s = a.toLowerCase().slice(0, 5);
            if (s !== 'data-' && s !== 'aria-') {
              e.removeAttribute(a);
              return;
            }
        }
        e.setAttribute(a, '' + n);
      }
  }
  function Mi(e, a, n) {
    if (n === null) e.removeAttribute(a);
    else {
      switch (typeof n) {
        case 'undefined':
        case 'function':
        case 'symbol':
        case 'boolean':
          e.removeAttribute(a);
          return;
      }
      e.setAttribute(a, '' + n);
    }
  }
  function ua(e, a, n, s) {
    if (s === null) e.removeAttribute(n);
    else {
      switch (typeof s) {
        case 'undefined':
        case 'function':
        case 'symbol':
        case 'boolean':
          e.removeAttribute(n);
          return;
      }
      e.setAttributeNS(a, n, '' + s);
    }
  }
  function Mt(e) {
    switch (typeof e) {
      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
      case 'undefined':
        return e;
      case 'object':
        return e;
      default:
        return '';
    }
  }
  function jc(e) {
    var a = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (a === 'checkbox' || a === 'radio');
  }
  function Cm(e, a, n) {
    var s = Object.getOwnPropertyDescriptor(e.constructor.prototype, a);
    if (
      !e.hasOwnProperty(a) &&
      typeof s < 'u' &&
      typeof s.get == 'function' &&
      typeof s.set == 'function'
    ) {
      var i = s.get,
        l = s.set;
      return (
        Object.defineProperty(e, a, {
          configurable: !0,
          get: function () {
            return i.call(this);
          },
          set: function (r) {
            ((n = '' + r), l.call(this, r));
          },
        }),
        Object.defineProperty(e, a, { enumerable: s.enumerable }),
        {
          getValue: function () {
            return n;
          },
          setValue: function (r) {
            n = '' + r;
          },
          stopTracking: function () {
            ((e._valueTracker = null), delete e[a]);
          },
        }
      );
    }
  }
  function Jl(e) {
    if (!e._valueTracker) {
      var a = jc(e) ? 'checked' : 'value';
      e._valueTracker = Cm(e, a, '' + e[a]);
    }
  }
  function vc(e) {
    if (!e) return !1;
    var a = e._valueTracker;
    if (!a) return !0;
    var n = a.getValue(),
      s = '';
    return (
      e && (s = jc(e) ? (e.checked ? 'true' : 'false') : e.value),
      (e = s),
      e !== n ? (a.setValue(e), !0) : !1
    );
  }
  function Di(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var zm = /[\n"\\]/g;
  function Dt(e) {
    return e.replace(zm, function (a) {
      return '\\' + a.charCodeAt(0).toString(16) + ' ';
    });
  }
  function Fl(e, a, n, s, i, l, r, o) {
    ((e.name = ''),
      r != null && typeof r != 'function' && typeof r != 'symbol' && typeof r != 'boolean'
        ? (e.type = r)
        : e.removeAttribute('type'),
      a != null
        ? r === 'number'
          ? ((a === 0 && e.value === '') || e.value != a) && (e.value = '' + Mt(a))
          : e.value !== '' + Mt(a) && (e.value = '' + Mt(a))
        : (r !== 'submit' && r !== 'reset') || e.removeAttribute('value'),
      a != null
        ? $l(e, r, Mt(a))
        : n != null
          ? $l(e, r, Mt(n))
          : s != null && e.removeAttribute('value'),
      i == null && l != null && (e.defaultChecked = !!l),
      i != null && (e.checked = i && typeof i != 'function' && typeof i != 'symbol'),
      o != null && typeof o != 'function' && typeof o != 'symbol' && typeof o != 'boolean'
        ? (e.name = '' + Mt(o))
        : e.removeAttribute('name'));
  }
  function wc(e, a, n, s, i, l, r, o) {
    if (
      (l != null &&
        typeof l != 'function' &&
        typeof l != 'symbol' &&
        typeof l != 'boolean' &&
        (e.type = l),
      a != null || n != null)
    ) {
      if (!((l !== 'submit' && l !== 'reset') || a != null)) {
        Jl(e);
        return;
      }
      ((n = n != null ? '' + Mt(n) : ''),
        (a = a != null ? '' + Mt(a) : n),
        o || a === e.value || (e.value = a),
        (e.defaultValue = a));
    }
    ((s = s ?? i),
      (s = typeof s != 'function' && typeof s != 'symbol' && !!s),
      (e.checked = o ? e.checked : !!s),
      (e.defaultChecked = !!s),
      r != null &&
        typeof r != 'function' &&
        typeof r != 'symbol' &&
        typeof r != 'boolean' &&
        (e.name = r),
      Jl(e));
  }
  function $l(e, a, n) {
    (a === 'number' && Di(e.ownerDocument) === e) ||
      e.defaultValue === '' + n ||
      (e.defaultValue = '' + n);
  }
  function Ln(e, a, n, s) {
    if (((e = e.options), a)) {
      a = {};
      for (var i = 0; i < n.length; i++) a['$' + n[i]] = !0;
      for (n = 0; n < e.length; n++)
        ((i = a.hasOwnProperty('$' + e[n].value)),
          e[n].selected !== i && (e[n].selected = i),
          i && s && (e[n].defaultSelected = !0));
    } else {
      for (n = '' + Mt(n), a = null, i = 0; i < e.length; i++) {
        if (e[i].value === n) {
          ((e[i].selected = !0), s && (e[i].defaultSelected = !0));
          return;
        }
        a !== null || e[i].disabled || (a = e[i]);
      }
      a !== null && (a.selected = !0);
    }
  }
  function Nc(e, a, n) {
    if (a != null && ((a = '' + Mt(a)), a !== e.value && (e.value = a), n == null)) {
      e.defaultValue !== a && (e.defaultValue = a);
      return;
    }
    e.defaultValue = n != null ? '' + Mt(n) : '';
  }
  function Tc(e, a, n, s) {
    if (a == null) {
      if (s != null) {
        if (n != null) throw Error(u(92));
        if (It(s)) {
          if (1 < s.length) throw Error(u(93));
          s = s[0];
        }
        n = s;
      }
      (n == null && (n = ''), (a = n));
    }
    ((n = Mt(a)),
      (e.defaultValue = n),
      (s = e.textContent),
      s === n && s !== '' && s !== null && (e.value = s),
      Jl(e));
  }
  function On(e, a) {
    if (a) {
      var n = e.firstChild;
      if (n && n === e.lastChild && n.nodeType === 3) {
        n.nodeValue = a;
        return;
      }
    }
    e.textContent = a;
  }
  var Mm = new Set(
    'animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp'.split(
      ' '
    )
  );
  function Sc(e, a, n) {
    var s = a.indexOf('--') === 0;
    n == null || typeof n == 'boolean' || n === ''
      ? s
        ? e.setProperty(a, '')
        : a === 'float'
          ? (e.cssFloat = '')
          : (e[a] = '')
      : s
        ? e.setProperty(a, n)
        : typeof n != 'number' || n === 0 || Mm.has(a)
          ? a === 'float'
            ? (e.cssFloat = n)
            : (e[a] = ('' + n).trim())
          : (e[a] = n + 'px');
  }
  function kc(e, a, n) {
    if (a != null && typeof a != 'object') throw Error(u(62));
    if (((e = e.style), n != null)) {
      for (var s in n)
        !n.hasOwnProperty(s) ||
          (a != null && a.hasOwnProperty(s)) ||
          (s.indexOf('--') === 0
            ? e.setProperty(s, '')
            : s === 'float'
              ? (e.cssFloat = '')
              : (e[s] = ''));
      for (var i in a) ((s = a[i]), a.hasOwnProperty(i) && n[i] !== s && Sc(e, i, s));
    } else for (var l in a) a.hasOwnProperty(l) && Sc(e, l, a[l]);
  }
  function Pl(e) {
    if (e.indexOf('-') === -1) return !1;
    switch (e) {
      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        return !1;
      default:
        return !0;
    }
  }
  var Dm = new Map([
      ['acceptCharset', 'accept-charset'],
      ['htmlFor', 'for'],
      ['httpEquiv', 'http-equiv'],
      ['crossOrigin', 'crossorigin'],
      ['accentHeight', 'accent-height'],
      ['alignmentBaseline', 'alignment-baseline'],
      ['arabicForm', 'arabic-form'],
      ['baselineShift', 'baseline-shift'],
      ['capHeight', 'cap-height'],
      ['clipPath', 'clip-path'],
      ['clipRule', 'clip-rule'],
      ['colorInterpolation', 'color-interpolation'],
      ['colorInterpolationFilters', 'color-interpolation-filters'],
      ['colorProfile', 'color-profile'],
      ['colorRendering', 'color-rendering'],
      ['dominantBaseline', 'dominant-baseline'],
      ['enableBackground', 'enable-background'],
      ['fillOpacity', 'fill-opacity'],
      ['fillRule', 'fill-rule'],
      ['floodColor', 'flood-color'],
      ['floodOpacity', 'flood-opacity'],
      ['fontFamily', 'font-family'],
      ['fontSize', 'font-size'],
      ['fontSizeAdjust', 'font-size-adjust'],
      ['fontStretch', 'font-stretch'],
      ['fontStyle', 'font-style'],
      ['fontVariant', 'font-variant'],
      ['fontWeight', 'font-weight'],
      ['glyphName', 'glyph-name'],
      ['glyphOrientationHorizontal', 'glyph-orientation-horizontal'],
      ['glyphOrientationVertical', 'glyph-orientation-vertical'],
      ['horizAdvX', 'horiz-adv-x'],
      ['horizOriginX', 'horiz-origin-x'],
      ['imageRendering', 'image-rendering'],
      ['letterSpacing', 'letter-spacing'],
      ['lightingColor', 'lighting-color'],
      ['markerEnd', 'marker-end'],
      ['markerMid', 'marker-mid'],
      ['markerStart', 'marker-start'],
      ['overlinePosition', 'overline-position'],
      ['overlineThickness', 'overline-thickness'],
      ['paintOrder', 'paint-order'],
      ['panose-1', 'panose-1'],
      ['pointerEvents', 'pointer-events'],
      ['renderingIntent', 'rendering-intent'],
      ['shapeRendering', 'shape-rendering'],
      ['stopColor', 'stop-color'],
      ['stopOpacity', 'stop-opacity'],
      ['strikethroughPosition', 'strikethrough-position'],
      ['strikethroughThickness', 'strikethrough-thickness'],
      ['strokeDasharray', 'stroke-dasharray'],
      ['strokeDashoffset', 'stroke-dashoffset'],
      ['strokeLinecap', 'stroke-linecap'],
      ['strokeLinejoin', 'stroke-linejoin'],
      ['strokeMiterlimit', 'stroke-miterlimit'],
      ['strokeOpacity', 'stroke-opacity'],
      ['strokeWidth', 'stroke-width'],
      ['textAnchor', 'text-anchor'],
      ['textDecoration', 'text-decoration'],
      ['textRendering', 'text-rendering'],
      ['transformOrigin', 'transform-origin'],
      ['underlinePosition', 'underline-position'],
      ['underlineThickness', 'underline-thickness'],
      ['unicodeBidi', 'unicode-bidi'],
      ['unicodeRange', 'unicode-range'],
      ['unitsPerEm', 'units-per-em'],
      ['vAlphabetic', 'v-alphabetic'],
      ['vHanging', 'v-hanging'],
      ['vIdeographic', 'v-ideographic'],
      ['vMathematical', 'v-mathematical'],
      ['vectorEffect', 'vector-effect'],
      ['vertAdvY', 'vert-adv-y'],
      ['vertOriginX', 'vert-origin-x'],
      ['vertOriginY', 'vert-origin-y'],
      ['wordSpacing', 'word-spacing'],
      ['writingMode', 'writing-mode'],
      ['xmlnsXlink', 'xmlns:xlink'],
      ['xHeight', 'x-height'],
    ]),
    Ym =
      /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Yi(e) {
    return Ym.test('' + e)
      ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
      : e;
  }
  function ma() {}
  var er = null;
  function tr(e) {
    return (
      (e = e.target || e.srcElement || window),
      e.correspondingUseElement && (e = e.correspondingUseElement),
      e.nodeType === 3 ? e.parentNode : e
    );
  }
  var Hn = null,
    _n = null;
  function Ac(e) {
    var a = E(e);
    if (a && (e = a.stateNode)) {
      var n = e[ve] || null;
      e: switch (((e = a.stateNode), a.type)) {
        case 'input':
          if (
            (Fl(
              e,
              n.value,
              n.defaultValue,
              n.defaultValue,
              n.checked,
              n.defaultChecked,
              n.type,
              n.name
            ),
            (a = n.name),
            n.type === 'radio' && a != null)
          ) {
            for (n = e; n.parentNode; ) n = n.parentNode;
            for (
              n = n.querySelectorAll('input[name="' + Dt('' + a) + '"][type="radio"]'), a = 0;
              a < n.length;
              a++
            ) {
              var s = n[a];
              if (s !== e && s.form === e.form) {
                var i = s[ve] || null;
                if (!i) throw Error(u(90));
                Fl(
                  s,
                  i.value,
                  i.defaultValue,
                  i.defaultValue,
                  i.checked,
                  i.defaultChecked,
                  i.type,
                  i.name
                );
              }
            }
            for (a = 0; a < n.length; a++) ((s = n[a]), s.form === e.form && vc(s));
          }
          break e;
        case 'textarea':
          Nc(e, n.value, n.defaultValue);
          break e;
        case 'select':
          ((a = n.value), a != null && Ln(e, !!n.multiple, a, !1));
      }
    }
  }
  var ar = !1;
  function Ec(e, a, n) {
    if (ar) return e(a, n);
    ar = !0;
    try {
      var s = e(a);
      return s;
    } finally {
      if (
        ((ar = !1),
        (Hn !== null || _n !== null) &&
          (jl(), Hn && ((a = Hn), (e = _n), (_n = Hn = null), Ac(a), e)))
      )
        for (a = 0; a < e.length; a++) Ac(e[a]);
    }
  }
  function As(e, a) {
    var n = e.stateNode;
    if (n === null) return null;
    var s = n[ve] || null;
    if (s === null) return null;
    n = s[a];
    e: switch (a) {
      case 'onClick':
      case 'onClickCapture':
      case 'onDoubleClick':
      case 'onDoubleClickCapture':
      case 'onMouseDown':
      case 'onMouseDownCapture':
      case 'onMouseMove':
      case 'onMouseMoveCapture':
      case 'onMouseUp':
      case 'onMouseUpCapture':
      case 'onMouseEnter':
        ((s = !s.disabled) ||
          ((e = e.type),
          (s = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
          (e = !s));
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (n && typeof n != 'function') throw Error(u(231, a, typeof n));
    return n;
  }
  var fa = !(
      typeof window > 'u' ||
      typeof window.document > 'u' ||
      typeof window.document.createElement > 'u'
    ),
    nr = !1;
  if (fa)
    try {
      var Es = {};
      (Object.defineProperty(Es, 'passive', {
        get: function () {
          nr = !0;
        },
      }),
        window.addEventListener('test', Es, Es),
        window.removeEventListener('test', Es, Es));
    } catch {
      nr = !1;
    }
  var Ha = null,
    sr = null,
    Ri = null;
  function Cc() {
    if (Ri) return Ri;
    var e,
      a = sr,
      n = a.length,
      s,
      i = 'value' in Ha ? Ha.value : Ha.textContent,
      l = i.length;
    for (e = 0; e < n && a[e] === i[e]; e++);
    var r = n - e;
    for (s = 1; s <= r && a[n - s] === i[l - s]; s++);
    return (Ri = i.slice(e, 1 < s ? 1 - s : void 0));
  }
  function Li(e) {
    var a = e.keyCode;
    return (
      'charCode' in e ? ((e = e.charCode), e === 0 && a === 13 && (e = 13)) : (e = a),
      e === 10 && (e = 13),
      32 <= e || e === 13 ? e : 0
    );
  }
  function Oi() {
    return !0;
  }
  function zc() {
    return !1;
  }
  function dt(e) {
    function a(n, s, i, l, r) {
      ((this._reactName = n),
        (this._targetInst = i),
        (this.type = s),
        (this.nativeEvent = l),
        (this.target = r),
        (this.currentTarget = null));
      for (var o in e) e.hasOwnProperty(o) && ((n = e[o]), (this[o] = n ? n(l) : l[o]));
      return (
        (this.isDefaultPrevented = (
          l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1
        )
          ? Oi
          : zc),
        (this.isPropagationStopped = zc),
        this
      );
    }
    return (
      L(a.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var n = this.nativeEvent;
          n &&
            (n.preventDefault
              ? n.preventDefault()
              : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
            (this.isDefaultPrevented = Oi));
        },
        stopPropagation: function () {
          var n = this.nativeEvent;
          n &&
            (n.stopPropagation
              ? n.stopPropagation()
              : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
            (this.isPropagationStopped = Oi));
        },
        persist: function () {},
        isPersistent: Oi,
      }),
      a
    );
  }
  var mn = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    Hi = dt(mn),
    Cs = L({}, mn, { view: 0, detail: 0 }),
    Rm = dt(Cs),
    ir,
    lr,
    zs,
    _i = L({}, Cs, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: or,
      button: 0,
      buttons: 0,
      relatedTarget: function (e) {
        return e.relatedTarget === void 0
          ? e.fromElement === e.srcElement
            ? e.toElement
            : e.fromElement
          : e.relatedTarget;
      },
      movementX: function (e) {
        return 'movementX' in e
          ? e.movementX
          : (e !== zs &&
              (zs && e.type === 'mousemove'
                ? ((ir = e.screenX - zs.screenX), (lr = e.screenY - zs.screenY))
                : (lr = ir = 0),
              (zs = e)),
            ir);
      },
      movementY: function (e) {
        return 'movementY' in e ? e.movementY : lr;
      },
    }),
    Mc = dt(_i),
    Lm = L({}, _i, { dataTransfer: 0 }),
    Om = dt(Lm),
    Hm = L({}, Cs, { relatedTarget: 0 }),
    rr = dt(Hm),
    _m = L({}, mn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Bm = dt(_m),
    Um = L({}, mn, {
      clipboardData: function (e) {
        return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
      },
    }),
    qm = dt(Um),
    Im = L({}, mn, { data: 0 }),
    Dc = dt(Im),
    Wm = {
      Esc: 'Escape',
      Spacebar: ' ',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Win: 'OS',
      Menu: 'ContextMenu',
      Apps: 'ContextMenu',
      Scroll: 'ScrollLock',
      MozPrintableKey: 'Unidentified',
    },
    Gm = {
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      45: 'Insert',
      46: 'Delete',
      112: 'F1',
      113: 'F2',
      114: 'F3',
      115: 'F4',
      116: 'F5',
      117: 'F6',
      118: 'F7',
      119: 'F8',
      120: 'F9',
      121: 'F10',
      122: 'F11',
      123: 'F12',
      144: 'NumLock',
      145: 'ScrollLock',
      224: 'Meta',
    },
    Zm = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
  function Qm(e) {
    var a = this.nativeEvent;
    return a.getModifierState ? a.getModifierState(e) : (e = Zm[e]) ? !!a[e] : !1;
  }
  function or() {
    return Qm;
  }
  var Xm = L({}, Cs, {
      key: function (e) {
        if (e.key) {
          var a = Wm[e.key] || e.key;
          if (a !== 'Unidentified') return a;
        }
        return e.type === 'keypress'
          ? ((e = Li(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
          : e.type === 'keydown' || e.type === 'keyup'
            ? Gm[e.keyCode] || 'Unidentified'
            : '';
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: or,
      charCode: function (e) {
        return e.type === 'keypress' ? Li(e) : 0;
      },
      keyCode: function (e) {
        return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
      },
      which: function (e) {
        return e.type === 'keypress'
          ? Li(e)
          : e.type === 'keydown' || e.type === 'keyup'
            ? e.keyCode
            : 0;
      },
    }),
    Vm = dt(Xm),
    Km = L({}, _i, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    Yc = dt(Km),
    Jm = L({}, Cs, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: or,
    }),
    Fm = dt(Jm),
    $m = L({}, mn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Pm = dt($m),
    ef = L({}, _i, {
      deltaX: function (e) {
        return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function (e) {
        return 'deltaY' in e
          ? e.deltaY
          : 'wheelDeltaY' in e
            ? -e.wheelDeltaY
            : 'wheelDelta' in e
              ? -e.wheelDelta
              : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    tf = dt(ef),
    af = L({}, mn, { newState: 0, oldState: 0 }),
    nf = dt(af),
    sf = [9, 13, 27, 32],
    cr = fa && 'CompositionEvent' in window,
    Ms = null;
  fa && 'documentMode' in document && (Ms = document.documentMode);
  var lf = fa && 'TextEvent' in window && !Ms,
    Rc = fa && (!cr || (Ms && 8 < Ms && 11 >= Ms)),
    Lc = ' ',
    Oc = !1;
  function Hc(e, a) {
    switch (e) {
      case 'keyup':
        return sf.indexOf(a.keyCode) !== -1;
      case 'keydown':
        return a.keyCode !== 229;
      case 'keypress':
      case 'mousedown':
      case 'focusout':
        return !0;
      default:
        return !1;
    }
  }
  function _c(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
  }
  var Bn = !1;
  function rf(e, a) {
    switch (e) {
      case 'compositionend':
        return _c(a);
      case 'keypress':
        return a.which !== 32 ? null : ((Oc = !0), Lc);
      case 'textInput':
        return ((e = a.data), e === Lc && Oc ? null : e);
      default:
        return null;
    }
  }
  function of(e, a) {
    if (Bn)
      return e === 'compositionend' || (!cr && Hc(e, a))
        ? ((e = Cc()), (Ri = sr = Ha = null), (Bn = !1), e)
        : null;
    switch (e) {
      case 'paste':
        return null;
      case 'keypress':
        if (!(a.ctrlKey || a.altKey || a.metaKey) || (a.ctrlKey && a.altKey)) {
          if (a.char && 1 < a.char.length) return a.char;
          if (a.which) return String.fromCharCode(a.which);
        }
        return null;
      case 'compositionend':
        return Rc && a.locale !== 'ko' ? null : a.data;
      default:
        return null;
    }
  }
  var cf = {
    color: !0,
    date: !0,
    datetime: !0,
    'datetime-local': !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function Bc(e) {
    var a = e && e.nodeName && e.nodeName.toLowerCase();
    return a === 'input' ? !!cf[e.type] : a === 'textarea';
  }
  function Uc(e, a, n, s) {
    (Hn ? (_n ? _n.push(s) : (_n = [s])) : (Hn = s),
      (a = Al(a, 'onChange')),
      0 < a.length &&
        ((n = new Hi('onChange', 'change', null, n, s)), e.push({ event: n, listeners: a })));
  }
  var Ds = null,
    Ys = null;
  function df(e) {
    wu(e, 0);
  }
  function Bi(e) {
    var a = se(e);
    if (vc(a)) return e;
  }
  function qc(e, a) {
    if (e === 'change') return a;
  }
  var Ic = !1;
  if (fa) {
    var dr;
    if (fa) {
      var hr = 'oninput' in document;
      if (!hr) {
        var Wc = document.createElement('div');
        (Wc.setAttribute('oninput', 'return;'), (hr = typeof Wc.oninput == 'function'));
      }
      dr = hr;
    } else dr = !1;
    Ic = dr && (!document.documentMode || 9 < document.documentMode);
  }
  function Gc() {
    Ds && (Ds.detachEvent('onpropertychange', Zc), (Ys = Ds = null));
  }
  function Zc(e) {
    if (e.propertyName === 'value' && Bi(Ys)) {
      var a = [];
      (Uc(a, Ys, e, tr(e)), Ec(df, a));
    }
  }
  function hf(e, a, n) {
    e === 'focusin'
      ? (Gc(), (Ds = a), (Ys = n), Ds.attachEvent('onpropertychange', Zc))
      : e === 'focusout' && Gc();
  }
  function uf(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Bi(Ys);
  }
  function mf(e, a) {
    if (e === 'click') return Bi(a);
  }
  function ff(e, a) {
    if (e === 'input' || e === 'change') return Bi(a);
  }
  function gf(e, a) {
    return (e === a && (e !== 0 || 1 / e === 1 / a)) || (e !== e && a !== a);
  }
  var vt = typeof Object.is == 'function' ? Object.is : gf;
  function Rs(e, a) {
    if (vt(e, a)) return !0;
    if (typeof e != 'object' || e === null || typeof a != 'object' || a === null) return !1;
    var n = Object.keys(e),
      s = Object.keys(a);
    if (n.length !== s.length) return !1;
    for (s = 0; s < n.length; s++) {
      var i = n[s];
      if (!Ya.call(a, i) || !vt(e[i], a[i])) return !1;
    }
    return !0;
  }
  function Qc(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Xc(e, a) {
    var n = Qc(e);
    e = 0;
    for (var s; n; ) {
      if (n.nodeType === 3) {
        if (((s = e + n.textContent.length), e <= a && s >= a)) return { node: n, offset: a - e };
        e = s;
      }
      e: {
        for (; n; ) {
          if (n.nextSibling) {
            n = n.nextSibling;
            break e;
          }
          n = n.parentNode;
        }
        n = void 0;
      }
      n = Qc(n);
    }
  }
  function Vc(e, a) {
    return e && a
      ? e === a
        ? !0
        : e && e.nodeType === 3
          ? !1
          : a && a.nodeType === 3
            ? Vc(e, a.parentNode)
            : 'contains' in e
              ? e.contains(a)
              : e.compareDocumentPosition
                ? !!(e.compareDocumentPosition(a) & 16)
                : !1
      : !1;
  }
  function Kc(e) {
    e =
      e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
        ? e.ownerDocument.defaultView
        : window;
    for (var a = Di(e.document); a instanceof e.HTMLIFrameElement; ) {
      try {
        var n = typeof a.contentWindow.location.href == 'string';
      } catch {
        n = !1;
      }
      if (n) e = a.contentWindow;
      else break;
      a = Di(e.document);
    }
    return a;
  }
  function ur(e) {
    var a = e && e.nodeName && e.nodeName.toLowerCase();
    return (
      a &&
      ((a === 'input' &&
        (e.type === 'text' ||
          e.type === 'search' ||
          e.type === 'tel' ||
          e.type === 'url' ||
          e.type === 'password')) ||
        a === 'textarea' ||
        e.contentEditable === 'true')
    );
  }
  var xf = fa && 'documentMode' in document && 11 >= document.documentMode,
    Un = null,
    mr = null,
    Ls = null,
    fr = !1;
  function Jc(e, a, n) {
    var s = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    fr ||
      Un == null ||
      Un !== Di(s) ||
      ((s = Un),
      'selectionStart' in s && ur(s)
        ? (s = { start: s.selectionStart, end: s.selectionEnd })
        : ((s = ((s.ownerDocument && s.ownerDocument.defaultView) || window).getSelection()),
          (s = {
            anchorNode: s.anchorNode,
            anchorOffset: s.anchorOffset,
            focusNode: s.focusNode,
            focusOffset: s.focusOffset,
          })),
      (Ls && Rs(Ls, s)) ||
        ((Ls = s),
        (s = Al(mr, 'onSelect')),
        0 < s.length &&
          ((a = new Hi('onSelect', 'select', null, a, n)),
          e.push({ event: a, listeners: s }),
          (a.target = Un))));
  }
  function fn(e, a) {
    var n = {};
    return (
      (n[e.toLowerCase()] = a.toLowerCase()),
      (n['Webkit' + e] = 'webkit' + a),
      (n['Moz' + e] = 'moz' + a),
      n
    );
  }
  var qn = {
      animationend: fn('Animation', 'AnimationEnd'),
      animationiteration: fn('Animation', 'AnimationIteration'),
      animationstart: fn('Animation', 'AnimationStart'),
      transitionrun: fn('Transition', 'TransitionRun'),
      transitionstart: fn('Transition', 'TransitionStart'),
      transitioncancel: fn('Transition', 'TransitionCancel'),
      transitionend: fn('Transition', 'TransitionEnd'),
    },
    gr = {},
    Fc = {};
  fa &&
    ((Fc = document.createElement('div').style),
    'AnimationEvent' in window ||
      (delete qn.animationend.animation,
      delete qn.animationiteration.animation,
      delete qn.animationstart.animation),
    'TransitionEvent' in window || delete qn.transitionend.transition);
  function gn(e) {
    if (gr[e]) return gr[e];
    if (!qn[e]) return e;
    var a = qn[e],
      n;
    for (n in a) if (a.hasOwnProperty(n) && n in Fc) return (gr[e] = a[n]);
    return e;
  }
  var $c = gn('animationend'),
    Pc = gn('animationiteration'),
    ed = gn('animationstart'),
    pf = gn('transitionrun'),
    yf = gn('transitionstart'),
    bf = gn('transitioncancel'),
    td = gn('transitionend'),
    ad = new Map(),
    xr =
      'abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
        ' '
      );
  xr.push('scrollEnd');
  function Qt(e, a) {
    (ad.set(e, a), ct(a, [e]));
  }
  var Ui =
      typeof reportError == 'function'
        ? reportError
        : function (e) {
            if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
              var a = new window.ErrorEvent('error', {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof e == 'object' && e !== null && typeof e.message == 'string'
                    ? String(e.message)
                    : String(e),
                error: e,
              });
              if (!window.dispatchEvent(a)) return;
            } else if (typeof process == 'object' && typeof process.emit == 'function') {
              process.emit('uncaughtException', e);
              return;
            }
            console.error(e);
          },
    Yt = [],
    In = 0,
    pr = 0;
  function qi() {
    for (var e = In, a = (pr = In = 0); a < e; ) {
      var n = Yt[a];
      Yt[a++] = null;
      var s = Yt[a];
      Yt[a++] = null;
      var i = Yt[a];
      Yt[a++] = null;
      var l = Yt[a];
      if (((Yt[a++] = null), s !== null && i !== null)) {
        var r = s.pending;
        (r === null ? (i.next = i) : ((i.next = r.next), (r.next = i)), (s.pending = i));
      }
      l !== 0 && nd(n, i, l);
    }
  }
  function Ii(e, a, n, s) {
    ((Yt[In++] = e),
      (Yt[In++] = a),
      (Yt[In++] = n),
      (Yt[In++] = s),
      (pr |= s),
      (e.lanes |= s),
      (e = e.alternate),
      e !== null && (e.lanes |= s));
  }
  function yr(e, a, n, s) {
    return (Ii(e, a, n, s), Wi(e));
  }
  function xn(e, a) {
    return (Ii(e, null, null, a), Wi(e));
  }
  function nd(e, a, n) {
    e.lanes |= n;
    var s = e.alternate;
    s !== null && (s.lanes |= n);
    for (var i = !1, l = e.return; l !== null; )
      ((l.childLanes |= n),
        (s = l.alternate),
        s !== null && (s.childLanes |= n),
        l.tag === 22 && ((e = l.stateNode), e === null || e._visibility & 1 || (i = !0)),
        (e = l),
        (l = l.return));
    return e.tag === 3
      ? ((l = e.stateNode),
        i &&
          a !== null &&
          ((i = 31 - Ye(n)),
          (e = l.hiddenUpdates),
          (s = e[i]),
          s === null ? (e[i] = [a]) : s.push(a),
          (a.lane = n | 536870912)),
        l)
      : null;
  }
  function Wi(e) {
    if (50 < ni) throw ((ni = 0), (Eo = null), Error(u(185)));
    for (var a = e.return; a !== null; ) ((e = a), (a = e.return));
    return e.tag === 3 ? e.stateNode : null;
  }
  var Wn = {};
  function jf(e, a, n, s) {
    ((this.tag = e),
      (this.key = n),
      (this.sibling =
        this.child =
        this.return =
        this.stateNode =
        this.type =
        this.elementType =
          null),
      (this.index = 0),
      (this.refCleanup = this.ref = null),
      (this.pendingProps = a),
      (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
      (this.mode = s),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null));
  }
  function wt(e, a, n, s) {
    return new jf(e, a, n, s);
  }
  function br(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
  }
  function ga(e, a) {
    var n = e.alternate;
    return (
      n === null
        ? ((n = wt(e.tag, a, e.key, e.mode)),
          (n.elementType = e.elementType),
          (n.type = e.type),
          (n.stateNode = e.stateNode),
          (n.alternate = e),
          (e.alternate = n))
        : ((n.pendingProps = a),
          (n.type = e.type),
          (n.flags = 0),
          (n.subtreeFlags = 0),
          (n.deletions = null)),
      (n.flags = e.flags & 65011712),
      (n.childLanes = e.childLanes),
      (n.lanes = e.lanes),
      (n.child = e.child),
      (n.memoizedProps = e.memoizedProps),
      (n.memoizedState = e.memoizedState),
      (n.updateQueue = e.updateQueue),
      (a = e.dependencies),
      (n.dependencies = a === null ? null : { lanes: a.lanes, firstContext: a.firstContext }),
      (n.sibling = e.sibling),
      (n.index = e.index),
      (n.ref = e.ref),
      (n.refCleanup = e.refCleanup),
      n
    );
  }
  function sd(e, a) {
    e.flags &= 65011714;
    var n = e.alternate;
    return (
      n === null
        ? ((e.childLanes = 0),
          (e.lanes = a),
          (e.child = null),
          (e.subtreeFlags = 0),
          (e.memoizedProps = null),
          (e.memoizedState = null),
          (e.updateQueue = null),
          (e.dependencies = null),
          (e.stateNode = null))
        : ((e.childLanes = n.childLanes),
          (e.lanes = n.lanes),
          (e.child = n.child),
          (e.subtreeFlags = 0),
          (e.deletions = null),
          (e.memoizedProps = n.memoizedProps),
          (e.memoizedState = n.memoizedState),
          (e.updateQueue = n.updateQueue),
          (e.type = n.type),
          (a = n.dependencies),
          (e.dependencies = a === null ? null : { lanes: a.lanes, firstContext: a.firstContext })),
      e
    );
  }
  function Gi(e, a, n, s, i, l) {
    var r = 0;
    if (((s = e), typeof e == 'function')) br(e) && (r = 1);
    else if (typeof e == 'string')
      r = Sg(e, n, Ae.current) ? 26 : e === 'html' || e === 'head' || e === 'body' ? 27 : 5;
    else
      e: switch (e) {
        case za:
          return ((e = wt(31, n, a, i)), (e.elementType = za), (e.lanes = l), e);
        case ne:
          return pn(n.children, i, l, a);
        case F:
          ((r = 8), (i |= 24));
          break;
        case oe:
          return ((e = wt(12, n, a, i | 2)), (e.elementType = oe), (e.lanes = l), e);
        case Ue:
          return ((e = wt(13, n, a, i)), (e.elementType = Ue), (e.lanes = l), e);
        case De:
          return ((e = wt(19, n, a, i)), (e.elementType = De), (e.lanes = l), e);
        default:
          if (typeof e == 'object' && e !== null)
            switch (e.$$typeof) {
              case Z:
                r = 10;
                break e;
              case tt:
                r = 9;
                break e;
              case K:
                r = 11;
                break e;
              case lt:
                r = 14;
                break e;
              case yt:
                ((r = 16), (s = null));
                break e;
            }
          ((r = 29), (n = Error(u(130, e === null ? 'null' : typeof e, ''))), (s = null));
      }
    return ((a = wt(r, n, a, i)), (a.elementType = e), (a.type = s), (a.lanes = l), a);
  }
  function pn(e, a, n, s) {
    return ((e = wt(7, e, s, a)), (e.lanes = n), e);
  }
  function jr(e, a, n) {
    return ((e = wt(6, e, null, a)), (e.lanes = n), e);
  }
  function id(e) {
    var a = wt(18, null, null, 0);
    return ((a.stateNode = e), a);
  }
  function vr(e, a, n) {
    return (
      (a = wt(4, e.children !== null ? e.children : [], e.key, a)),
      (a.lanes = n),
      (a.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation,
      }),
      a
    );
  }
  var ld = new WeakMap();
  function Rt(e, a) {
    if (typeof e == 'object' && e !== null) {
      var n = ld.get(e);
      return n !== void 0 ? n : ((a = { value: e, source: a, stack: la(a) }), ld.set(e, a), a);
    }
    return { value: e, source: a, stack: la(a) };
  }
  var Gn = [],
    Zn = 0,
    Zi = null,
    Os = 0,
    Lt = [],
    Ot = 0,
    _a = null,
    $t = 1,
    Pt = '';
  function xa(e, a) {
    ((Gn[Zn++] = Os), (Gn[Zn++] = Zi), (Zi = e), (Os = a));
  }
  function rd(e, a, n) {
    ((Lt[Ot++] = $t), (Lt[Ot++] = Pt), (Lt[Ot++] = _a), (_a = e));
    var s = $t;
    e = Pt;
    var i = 32 - Ye(s) - 1;
    ((s &= ~(1 << i)), (n += 1));
    var l = 32 - Ye(a) + i;
    if (30 < l) {
      var r = i - (i % 5);
      ((l = (s & ((1 << r) - 1)).toString(32)),
        (s >>= r),
        (i -= r),
        ($t = (1 << (32 - Ye(a) + i)) | (n << i) | s),
        (Pt = l + e));
    } else (($t = (1 << l) | (n << i) | s), (Pt = e));
  }
  function wr(e) {
    e.return !== null && (xa(e, 1), rd(e, 1, 0));
  }
  function Nr(e) {
    for (; e === Zi; ) ((Zi = Gn[--Zn]), (Gn[Zn] = null), (Os = Gn[--Zn]), (Gn[Zn] = null));
    for (; e === _a; )
      ((_a = Lt[--Ot]),
        (Lt[Ot] = null),
        (Pt = Lt[--Ot]),
        (Lt[Ot] = null),
        ($t = Lt[--Ot]),
        (Lt[Ot] = null));
  }
  function od(e, a) {
    ((Lt[Ot++] = $t), (Lt[Ot++] = Pt), (Lt[Ot++] = _a), ($t = a.id), (Pt = a.overflow), (_a = e));
  }
  var Ke = null,
    be = null,
    V = !1,
    Ba = null,
    Ht = !1,
    Tr = Error(u(519));
  function Ua(e) {
    var a = Error(
      u(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? 'text' : 'HTML', '')
    );
    throw (Hs(Rt(a, e)), Tr);
  }
  function cd(e) {
    var a = e.stateNode,
      n = e.type,
      s = e.memoizedProps;
    switch (((a[Re] = e), (a[ve] = s), n)) {
      case 'dialog':
        (G('cancel', a), G('close', a));
        break;
      case 'iframe':
      case 'object':
      case 'embed':
        G('load', a);
        break;
      case 'video':
      case 'audio':
        for (n = 0; n < ii.length; n++) G(ii[n], a);
        break;
      case 'source':
        G('error', a);
        break;
      case 'img':
      case 'image':
      case 'link':
        (G('error', a), G('load', a));
        break;
      case 'details':
        G('toggle', a);
        break;
      case 'input':
        (G('invalid', a),
          wc(a, s.value, s.defaultValue, s.checked, s.defaultChecked, s.type, s.name, !0));
        break;
      case 'select':
        G('invalid', a);
        break;
      case 'textarea':
        (G('invalid', a), Tc(a, s.value, s.defaultValue, s.children));
    }
    ((n = s.children),
      (typeof n != 'string' && typeof n != 'number' && typeof n != 'bigint') ||
      a.textContent === '' + n ||
      s.suppressHydrationWarning === !0 ||
      ku(a.textContent, n)
        ? (s.popover != null && (G('beforetoggle', a), G('toggle', a)),
          s.onScroll != null && G('scroll', a),
          s.onScrollEnd != null && G('scrollend', a),
          s.onClick != null && (a.onclick = ma),
          (a = !0))
        : (a = !1),
      a || Ua(e, !0));
  }
  function dd(e) {
    for (Ke = e.return; Ke; )
      switch (Ke.tag) {
        case 5:
        case 31:
        case 13:
          Ht = !1;
          return;
        case 27:
        case 3:
          Ht = !0;
          return;
        default:
          Ke = Ke.return;
      }
  }
  function Qn(e) {
    if (e !== Ke) return !1;
    if (!V) return (dd(e), (V = !0), !1);
    var a = e.tag,
      n;
    if (
      ((n = a !== 3 && a !== 27) &&
        ((n = a === 5) &&
          ((n = e.type), (n = !(n !== 'form' && n !== 'button') || Wo(e.type, e.memoizedProps))),
        (n = !n)),
      n && be && Ua(e),
      dd(e),
      a === 13)
    ) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(u(317));
      be = Lu(e);
    } else if (a === 31) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(u(317));
      be = Lu(e);
    } else
      a === 27
        ? ((a = be), en(e.type) ? ((e = Vo), (Vo = null), (be = e)) : (be = a))
        : (be = Ke ? Bt(e.stateNode.nextSibling) : null);
    return !0;
  }
  function yn() {
    ((be = Ke = null), (V = !1));
  }
  function Sr() {
    var e = Ba;
    return (e !== null && (ft === null ? (ft = e) : ft.push.apply(ft, e), (Ba = null)), e);
  }
  function Hs(e) {
    Ba === null ? (Ba = [e]) : Ba.push(e);
  }
  var kr = J(null),
    bn = null,
    pa = null;
  function qa(e, a, n) {
    (H(kr, a._currentValue), (a._currentValue = n));
  }
  function ya(e) {
    ((e._currentValue = kr.current), ye(kr));
  }
  function Ar(e, a, n) {
    for (; e !== null; ) {
      var s = e.alternate;
      if (
        ((e.childLanes & a) !== a
          ? ((e.childLanes |= a), s !== null && (s.childLanes |= a))
          : s !== null && (s.childLanes & a) !== a && (s.childLanes |= a),
        e === n)
      )
        break;
      e = e.return;
    }
  }
  function Er(e, a, n, s) {
    var i = e.child;
    for (i !== null && (i.return = e); i !== null; ) {
      var l = i.dependencies;
      if (l !== null) {
        var r = i.child;
        l = l.firstContext;
        e: for (; l !== null; ) {
          var o = l;
          l = i;
          for (var c = 0; c < a.length; c++)
            if (o.context === a[c]) {
              ((l.lanes |= n),
                (o = l.alternate),
                o !== null && (o.lanes |= n),
                Ar(l.return, n, e),
                s || (r = null));
              break e;
            }
          l = o.next;
        }
      } else if (i.tag === 18) {
        if (((r = i.return), r === null)) throw Error(u(341));
        ((r.lanes |= n), (l = r.alternate), l !== null && (l.lanes |= n), Ar(r, n, e), (r = null));
      } else r = i.child;
      if (r !== null) r.return = i;
      else
        for (r = i; r !== null; ) {
          if (r === e) {
            r = null;
            break;
          }
          if (((i = r.sibling), i !== null)) {
            ((i.return = r.return), (r = i));
            break;
          }
          r = r.return;
        }
      i = r;
    }
  }
  function Xn(e, a, n, s) {
    e = null;
    for (var i = a, l = !1; i !== null; ) {
      if (!l) {
        if ((i.flags & 524288) !== 0) l = !0;
        else if ((i.flags & 262144) !== 0) break;
      }
      if (i.tag === 10) {
        var r = i.alternate;
        if (r === null) throw Error(u(387));
        if (((r = r.memoizedProps), r !== null)) {
          var o = i.type;
          vt(i.pendingProps.value, r.value) || (e !== null ? e.push(o) : (e = [o]));
        }
      } else if (i === Da.current) {
        if (((r = i.alternate), r === null)) throw Error(u(387));
        r.memoizedState.memoizedState !== i.memoizedState.memoizedState &&
          (e !== null ? e.push(di) : (e = [di]));
      }
      i = i.return;
    }
    (e !== null && Er(a, e, n, s), (a.flags |= 262144));
  }
  function Qi(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!vt(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function jn(e) {
    ((bn = e), (pa = null), (e = e.dependencies), e !== null && (e.firstContext = null));
  }
  function Je(e) {
    return hd(bn, e);
  }
  function Xi(e, a) {
    return (bn === null && jn(e), hd(e, a));
  }
  function hd(e, a) {
    var n = a._currentValue;
    if (((a = { context: a, memoizedValue: n, next: null }), pa === null)) {
      if (e === null) throw Error(u(308));
      ((pa = a), (e.dependencies = { lanes: 0, firstContext: a }), (e.flags |= 524288));
    } else pa = pa.next = a;
    return n;
  }
  var vf =
      typeof AbortController < 'u'
        ? AbortController
        : function () {
            var e = [],
              a = (this.signal = {
                aborted: !1,
                addEventListener: function (n, s) {
                  e.push(s);
                },
              });
            this.abort = function () {
              ((a.aborted = !0),
                e.forEach(function (n) {
                  return n();
                }));
            };
          },
    wf = d.unstable_scheduleCallback,
    Nf = d.unstable_NormalPriority,
    Le = {
      $$typeof: Z,
      Consumer: null,
      Provider: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0,
    };
  function Cr() {
    return { controller: new vf(), data: new Map(), refCount: 0 };
  }
  function _s(e) {
    (e.refCount--,
      e.refCount === 0 &&
        wf(Nf, function () {
          e.controller.abort();
        }));
  }
  var Bs = null,
    zr = 0,
    Vn = 0,
    Kn = null;
  function Tf(e, a) {
    if (Bs === null) {
      var n = (Bs = []);
      ((zr = 0),
        (Vn = Ro()),
        (Kn = {
          status: 'pending',
          value: void 0,
          then: function (s) {
            n.push(s);
          },
        }));
    }
    return (zr++, a.then(ud, ud), a);
  }
  function ud() {
    if (--zr === 0 && Bs !== null) {
      Kn !== null && (Kn.status = 'fulfilled');
      var e = Bs;
      ((Bs = null), (Vn = 0), (Kn = null));
      for (var a = 0; a < e.length; a++) (0, e[a])();
    }
  }
  function Sf(e, a) {
    var n = [],
      s = {
        status: 'pending',
        value: null,
        reason: null,
        then: function (i) {
          n.push(i);
        },
      };
    return (
      e.then(
        function () {
          ((s.status = 'fulfilled'), (s.value = a));
          for (var i = 0; i < n.length; i++) (0, n[i])(a);
        },
        function (i) {
          for (s.status = 'rejected', s.reason = i, i = 0; i < n.length; i++) (0, n[i])(void 0);
        }
      ),
      s
    );
  }
  var md = N.S;
  N.S = function (e, a) {
    ((Jh = Xe()),
      typeof a == 'object' && a !== null && typeof a.then == 'function' && Tf(e, a),
      md !== null && md(e, a));
  };
  var vn = J(null);
  function Mr() {
    var e = vn.current;
    return e !== null ? e : ge.pooledCache;
  }
  function Vi(e, a) {
    a === null ? H(vn, vn.current) : H(vn, a.pool);
  }
  function fd() {
    var e = Mr();
    return e === null ? null : { parent: Le._currentValue, pool: e };
  }
  var Jn = Error(u(460)),
    Dr = Error(u(474)),
    Ki = Error(u(542)),
    Ji = { then: function () {} };
  function gd(e) {
    return ((e = e.status), e === 'fulfilled' || e === 'rejected');
  }
  function xd(e, a, n) {
    switch (
      ((n = e[n]), n === void 0 ? e.push(a) : n !== a && (a.then(ma, ma), (a = n)), a.status)
    ) {
      case 'fulfilled':
        return a.value;
      case 'rejected':
        throw ((e = a.reason), yd(e), e);
      default:
        if (typeof a.status == 'string') a.then(ma, ma);
        else {
          if (((e = ge), e !== null && 100 < e.shellSuspendCounter)) throw Error(u(482));
          ((e = a),
            (e.status = 'pending'),
            e.then(
              function (s) {
                if (a.status === 'pending') {
                  var i = a;
                  ((i.status = 'fulfilled'), (i.value = s));
                }
              },
              function (s) {
                if (a.status === 'pending') {
                  var i = a;
                  ((i.status = 'rejected'), (i.reason = s));
                }
              }
            ));
        }
        switch (a.status) {
          case 'fulfilled':
            return a.value;
          case 'rejected':
            throw ((e = a.reason), yd(e), e);
        }
        throw ((Nn = a), Jn);
    }
  }
  function wn(e) {
    try {
      var a = e._init;
      return a(e._payload);
    } catch (n) {
      throw n !== null && typeof n == 'object' && typeof n.then == 'function' ? ((Nn = n), Jn) : n;
    }
  }
  var Nn = null;
  function pd() {
    if (Nn === null) throw Error(u(459));
    var e = Nn;
    return ((Nn = null), e);
  }
  function yd(e) {
    if (e === Jn || e === Ki) throw Error(u(483));
  }
  var Fn = null,
    Us = 0;
  function Fi(e) {
    var a = Us;
    return ((Us += 1), Fn === null && (Fn = []), xd(Fn, e, a));
  }
  function qs(e, a) {
    ((a = a.props.ref), (e.ref = a !== void 0 ? a : null));
  }
  function $i(e, a) {
    throw a.$$typeof === ie
      ? Error(u(525))
      : ((e = Object.prototype.toString.call(a)),
        Error(
          u(
            31,
            e === '[object Object]' ? 'object with keys {' + Object.keys(a).join(', ') + '}' : e
          )
        ));
  }
  function bd(e) {
    function a(g, m) {
      if (e) {
        var p = g.deletions;
        p === null ? ((g.deletions = [m]), (g.flags |= 16)) : p.push(m);
      }
    }
    function n(g, m) {
      if (!e) return null;
      for (; m !== null; ) (a(g, m), (m = m.sibling));
      return null;
    }
    function s(g) {
      for (var m = new Map(); g !== null; )
        (g.key !== null ? m.set(g.key, g) : m.set(g.index, g), (g = g.sibling));
      return m;
    }
    function i(g, m) {
      return ((g = ga(g, m)), (g.index = 0), (g.sibling = null), g);
    }
    function l(g, m, p) {
      return (
        (g.index = p),
        e
          ? ((p = g.alternate),
            p !== null
              ? ((p = p.index), p < m ? ((g.flags |= 67108866), m) : p)
              : ((g.flags |= 67108866), m))
          : ((g.flags |= 1048576), m)
      );
    }
    function r(g) {
      return (e && g.alternate === null && (g.flags |= 67108866), g);
    }
    function o(g, m, p, w) {
      return m === null || m.tag !== 6
        ? ((m = jr(p, g.mode, w)), (m.return = g), m)
        : ((m = i(m, p)), (m.return = g), m);
    }
    function c(g, m, p, w) {
      var Y = p.type;
      return Y === ne
        ? v(g, m, p.props.children, w, p.key)
        : m !== null &&
            (m.elementType === Y ||
              (typeof Y == 'object' && Y !== null && Y.$$typeof === yt && wn(Y) === m.type))
          ? ((m = i(m, p.props)), qs(m, p), (m.return = g), m)
          : ((m = Gi(p.type, p.key, p.props, null, g.mode, w)), qs(m, p), (m.return = g), m);
    }
    function y(g, m, p, w) {
      return m === null ||
        m.tag !== 4 ||
        m.stateNode.containerInfo !== p.containerInfo ||
        m.stateNode.implementation !== p.implementation
        ? ((m = vr(p, g.mode, w)), (m.return = g), m)
        : ((m = i(m, p.children || [])), (m.return = g), m);
    }
    function v(g, m, p, w, Y) {
      return m === null || m.tag !== 7
        ? ((m = pn(p, g.mode, w, Y)), (m.return = g), m)
        : ((m = i(m, p)), (m.return = g), m);
    }
    function T(g, m, p) {
      if ((typeof m == 'string' && m !== '') || typeof m == 'number' || typeof m == 'bigint')
        return ((m = jr('' + m, g.mode, p)), (m.return = g), m);
      if (typeof m == 'object' && m !== null) {
        switch (m.$$typeof) {
          case Pe:
            return ((p = Gi(m.type, m.key, m.props, null, g.mode, p)), qs(p, m), (p.return = g), p);
          case Me:
            return ((m = vr(m, g.mode, p)), (m.return = g), m);
          case yt:
            return ((m = wn(m)), T(g, m, p));
        }
        if (It(m) || et(m)) return ((m = pn(m, g.mode, p, null)), (m.return = g), m);
        if (typeof m.then == 'function') return T(g, Fi(m), p);
        if (m.$$typeof === Z) return T(g, Xi(g, m), p);
        $i(g, m);
      }
      return null;
    }
    function b(g, m, p, w) {
      var Y = m !== null ? m.key : null;
      if ((typeof p == 'string' && p !== '') || typeof p == 'number' || typeof p == 'bigint')
        return Y !== null ? null : o(g, m, '' + p, w);
      if (typeof p == 'object' && p !== null) {
        switch (p.$$typeof) {
          case Pe:
            return p.key === Y ? c(g, m, p, w) : null;
          case Me:
            return p.key === Y ? y(g, m, p, w) : null;
          case yt:
            return ((p = wn(p)), b(g, m, p, w));
        }
        if (It(p) || et(p)) return Y !== null ? null : v(g, m, p, w, null);
        if (typeof p.then == 'function') return b(g, m, Fi(p), w);
        if (p.$$typeof === Z) return b(g, m, Xi(g, p), w);
        $i(g, p);
      }
      return null;
    }
    function j(g, m, p, w, Y) {
      if ((typeof w == 'string' && w !== '') || typeof w == 'number' || typeof w == 'bigint')
        return ((g = g.get(p) || null), o(m, g, '' + w, Y));
      if (typeof w == 'object' && w !== null) {
        switch (w.$$typeof) {
          case Pe:
            return ((g = g.get(w.key === null ? p : w.key) || null), c(m, g, w, Y));
          case Me:
            return ((g = g.get(w.key === null ? p : w.key) || null), y(m, g, w, Y));
          case yt:
            return ((w = wn(w)), j(g, m, p, w, Y));
        }
        if (It(w) || et(w)) return ((g = g.get(p) || null), v(m, g, w, Y, null));
        if (typeof w.then == 'function') return j(g, m, p, Fi(w), Y);
        if (w.$$typeof === Z) return j(g, m, p, Xi(m, w), Y);
        $i(m, w);
      }
      return null;
    }
    function C(g, m, p, w) {
      for (var Y = null, ee = null, D = m, B = (m = 0), X = null; D !== null && B < p.length; B++) {
        D.index > B ? ((X = D), (D = null)) : (X = D.sibling);
        var te = b(g, D, p[B], w);
        if (te === null) {
          D === null && (D = X);
          break;
        }
        (e && D && te.alternate === null && a(g, D),
          (m = l(te, m, B)),
          ee === null ? (Y = te) : (ee.sibling = te),
          (ee = te),
          (D = X));
      }
      if (B === p.length) return (n(g, D), V && xa(g, B), Y);
      if (D === null) {
        for (; B < p.length; B++)
          ((D = T(g, p[B], w)),
            D !== null && ((m = l(D, m, B)), ee === null ? (Y = D) : (ee.sibling = D), (ee = D)));
        return (V && xa(g, B), Y);
      }
      for (D = s(D); B < p.length; B++)
        ((X = j(D, g, B, p[B], w)),
          X !== null &&
            (e && X.alternate !== null && D.delete(X.key === null ? B : X.key),
            (m = l(X, m, B)),
            ee === null ? (Y = X) : (ee.sibling = X),
            (ee = X)));
      return (
        e &&
          D.forEach(function (ln) {
            return a(g, ln);
          }),
        V && xa(g, B),
        Y
      );
    }
    function R(g, m, p, w) {
      if (p == null) throw Error(u(151));
      for (
        var Y = null, ee = null, D = m, B = (m = 0), X = null, te = p.next();
        D !== null && !te.done;
        B++, te = p.next()
      ) {
        D.index > B ? ((X = D), (D = null)) : (X = D.sibling);
        var ln = b(g, D, te.value, w);
        if (ln === null) {
          D === null && (D = X);
          break;
        }
        (e && D && ln.alternate === null && a(g, D),
          (m = l(ln, m, B)),
          ee === null ? (Y = ln) : (ee.sibling = ln),
          (ee = ln),
          (D = X));
      }
      if (te.done) return (n(g, D), V && xa(g, B), Y);
      if (D === null) {
        for (; !te.done; B++, te = p.next())
          ((te = T(g, te.value, w)),
            te !== null &&
              ((m = l(te, m, B)), ee === null ? (Y = te) : (ee.sibling = te), (ee = te)));
        return (V && xa(g, B), Y);
      }
      for (D = s(D); !te.done; B++, te = p.next())
        ((te = j(D, g, B, te.value, w)),
          te !== null &&
            (e && te.alternate !== null && D.delete(te.key === null ? B : te.key),
            (m = l(te, m, B)),
            ee === null ? (Y = te) : (ee.sibling = te),
            (ee = te)));
      return (
        e &&
          D.forEach(function (Og) {
            return a(g, Og);
          }),
        V && xa(g, B),
        Y
      );
    }
    function ue(g, m, p, w) {
      if (
        (typeof p == 'object' &&
          p !== null &&
          p.type === ne &&
          p.key === null &&
          (p = p.props.children),
        typeof p == 'object' && p !== null)
      ) {
        switch (p.$$typeof) {
          case Pe:
            e: {
              for (var Y = p.key; m !== null; ) {
                if (m.key === Y) {
                  if (((Y = p.type), Y === ne)) {
                    if (m.tag === 7) {
                      (n(g, m.sibling), (w = i(m, p.props.children)), (w.return = g), (g = w));
                      break e;
                    }
                  } else if (
                    m.elementType === Y ||
                    (typeof Y == 'object' && Y !== null && Y.$$typeof === yt && wn(Y) === m.type)
                  ) {
                    (n(g, m.sibling), (w = i(m, p.props)), qs(w, p), (w.return = g), (g = w));
                    break e;
                  }
                  n(g, m);
                  break;
                } else a(g, m);
                m = m.sibling;
              }
              p.type === ne
                ? ((w = pn(p.props.children, g.mode, w, p.key)), (w.return = g), (g = w))
                : ((w = Gi(p.type, p.key, p.props, null, g.mode, w)),
                  qs(w, p),
                  (w.return = g),
                  (g = w));
            }
            return r(g);
          case Me:
            e: {
              for (Y = p.key; m !== null; ) {
                if (m.key === Y)
                  if (
                    m.tag === 4 &&
                    m.stateNode.containerInfo === p.containerInfo &&
                    m.stateNode.implementation === p.implementation
                  ) {
                    (n(g, m.sibling), (w = i(m, p.children || [])), (w.return = g), (g = w));
                    break e;
                  } else {
                    n(g, m);
                    break;
                  }
                else a(g, m);
                m = m.sibling;
              }
              ((w = vr(p, g.mode, w)), (w.return = g), (g = w));
            }
            return r(g);
          case yt:
            return ((p = wn(p)), ue(g, m, p, w));
        }
        if (It(p)) return C(g, m, p, w);
        if (et(p)) {
          if (((Y = et(p)), typeof Y != 'function')) throw Error(u(150));
          return ((p = Y.call(p)), R(g, m, p, w));
        }
        if (typeof p.then == 'function') return ue(g, m, Fi(p), w);
        if (p.$$typeof === Z) return ue(g, m, Xi(g, p), w);
        $i(g, p);
      }
      return (typeof p == 'string' && p !== '') || typeof p == 'number' || typeof p == 'bigint'
        ? ((p = '' + p),
          m !== null && m.tag === 6
            ? (n(g, m.sibling), (w = i(m, p)), (w.return = g), (g = w))
            : (n(g, m), (w = jr(p, g.mode, w)), (w.return = g), (g = w)),
          r(g))
        : n(g, m);
    }
    return function (g, m, p, w) {
      try {
        Us = 0;
        var Y = ue(g, m, p, w);
        return ((Fn = null), Y);
      } catch (D) {
        if (D === Jn || D === Ki) throw D;
        var ee = wt(29, D, null, g.mode);
        return ((ee.lanes = w), (ee.return = g), ee);
      }
    };
  }
  var Tn = bd(!0),
    jd = bd(!1),
    Ia = !1;
  function Yr(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null,
    };
  }
  function Rr(e, a) {
    ((e = e.updateQueue),
      a.updateQueue === e &&
        (a.updateQueue = {
          baseState: e.baseState,
          firstBaseUpdate: e.firstBaseUpdate,
          lastBaseUpdate: e.lastBaseUpdate,
          shared: e.shared,
          callbacks: null,
        }));
  }
  function Wa(e) {
    return { lane: e, tag: 0, payload: null, callback: null, next: null };
  }
  function Ga(e, a, n) {
    var s = e.updateQueue;
    if (s === null) return null;
    if (((s = s.shared), (ae & 2) !== 0)) {
      var i = s.pending;
      return (
        i === null ? (a.next = a) : ((a.next = i.next), (i.next = a)),
        (s.pending = a),
        (a = Wi(e)),
        nd(e, null, n),
        a
      );
    }
    return (Ii(e, s, a, n), Wi(e));
  }
  function Is(e, a, n) {
    if (((a = a.updateQueue), a !== null && ((a = a.shared), (n & 4194048) !== 0))) {
      var s = a.lanes;
      ((s &= e.pendingLanes), (n |= s), (a.lanes = n), ws(e, n));
    }
  }
  function Lr(e, a) {
    var n = e.updateQueue,
      s = e.alternate;
    if (s !== null && ((s = s.updateQueue), n === s)) {
      var i = null,
        l = null;
      if (((n = n.firstBaseUpdate), n !== null)) {
        do {
          var r = { lane: n.lane, tag: n.tag, payload: n.payload, callback: null, next: null };
          (l === null ? (i = l = r) : (l = l.next = r), (n = n.next));
        } while (n !== null);
        l === null ? (i = l = a) : (l = l.next = a);
      } else i = l = a;
      ((n = {
        baseState: s.baseState,
        firstBaseUpdate: i,
        lastBaseUpdate: l,
        shared: s.shared,
        callbacks: s.callbacks,
      }),
        (e.updateQueue = n));
      return;
    }
    ((e = n.lastBaseUpdate),
      e === null ? (n.firstBaseUpdate = a) : (e.next = a),
      (n.lastBaseUpdate = a));
  }
  var Or = !1;
  function Ws() {
    if (Or) {
      var e = Kn;
      if (e !== null) throw e;
    }
  }
  function Gs(e, a, n, s) {
    Or = !1;
    var i = e.updateQueue;
    Ia = !1;
    var l = i.firstBaseUpdate,
      r = i.lastBaseUpdate,
      o = i.shared.pending;
    if (o !== null) {
      i.shared.pending = null;
      var c = o,
        y = c.next;
      ((c.next = null), r === null ? (l = y) : (r.next = y), (r = c));
      var v = e.alternate;
      v !== null &&
        ((v = v.updateQueue),
        (o = v.lastBaseUpdate),
        o !== r && (o === null ? (v.firstBaseUpdate = y) : (o.next = y), (v.lastBaseUpdate = c)));
    }
    if (l !== null) {
      var T = i.baseState;
      ((r = 0), (v = y = c = null), (o = l));
      do {
        var b = o.lane & -536870913,
          j = b !== o.lane;
        if (j ? (Q & b) === b : (s & b) === b) {
          (b !== 0 && b === Vn && (Or = !0),
            v !== null &&
              (v = v.next =
                { lane: 0, tag: o.tag, payload: o.payload, callback: null, next: null }));
          e: {
            var C = e,
              R = o;
            b = a;
            var ue = n;
            switch (R.tag) {
              case 1:
                if (((C = R.payload), typeof C == 'function')) {
                  T = C.call(ue, T, b);
                  break e;
                }
                T = C;
                break e;
              case 3:
                C.flags = (C.flags & -65537) | 128;
              case 0:
                if (
                  ((C = R.payload), (b = typeof C == 'function' ? C.call(ue, T, b) : C), b == null)
                )
                  break e;
                T = L({}, T, b);
                break e;
              case 2:
                Ia = !0;
            }
          }
          ((b = o.callback),
            b !== null &&
              ((e.flags |= 64),
              j && (e.flags |= 8192),
              (j = i.callbacks),
              j === null ? (i.callbacks = [b]) : j.push(b)));
        } else
          ((j = { lane: b, tag: o.tag, payload: o.payload, callback: o.callback, next: null }),
            v === null ? ((y = v = j), (c = T)) : (v = v.next = j),
            (r |= b));
        if (((o = o.next), o === null)) {
          if (((o = i.shared.pending), o === null)) break;
          ((j = o),
            (o = j.next),
            (j.next = null),
            (i.lastBaseUpdate = j),
            (i.shared.pending = null));
        }
      } while (!0);
      (v === null && (c = T),
        (i.baseState = c),
        (i.firstBaseUpdate = y),
        (i.lastBaseUpdate = v),
        l === null && (i.shared.lanes = 0),
        (Ka |= r),
        (e.lanes = r),
        (e.memoizedState = T));
    }
  }
  function vd(e, a) {
    if (typeof e != 'function') throw Error(u(191, e));
    e.call(a);
  }
  function wd(e, a) {
    var n = e.callbacks;
    if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) vd(n[e], a);
  }
  var $n = J(null),
    Pi = J(0);
  function Nd(e, a) {
    ((e = Aa), H(Pi, e), H($n, a), (Aa = e | a.baseLanes));
  }
  function Hr() {
    (H(Pi, Aa), H($n, $n.current));
  }
  function _r() {
    ((Aa = Pi.current), ye($n), ye(Pi));
  }
  var Nt = J(null),
    _t = null;
  function Za(e) {
    var a = e.alternate;
    (H(Ce, Ce.current & 1),
      H(Nt, e),
      _t === null && (a === null || $n.current !== null || a.memoizedState !== null) && (_t = e));
  }
  function Br(e) {
    (H(Ce, Ce.current), H(Nt, e), _t === null && (_t = e));
  }
  function Td(e) {
    e.tag === 22 ? (H(Ce, Ce.current), H(Nt, e), _t === null && (_t = e)) : Qa();
  }
  function Qa() {
    (H(Ce, Ce.current), H(Nt, Nt.current));
  }
  function Tt(e) {
    (ye(Nt), _t === e && (_t = null), ye(Ce));
  }
  var Ce = J(0);
  function el(e) {
    for (var a = e; a !== null; ) {
      if (a.tag === 13) {
        var n = a.memoizedState;
        if (n !== null && ((n = n.dehydrated), n === null || Qo(n) || Xo(n))) return a;
      } else if (
        a.tag === 19 &&
        (a.memoizedProps.revealOrder === 'forwards' ||
          a.memoizedProps.revealOrder === 'backwards' ||
          a.memoizedProps.revealOrder === 'unstable_legacy-backwards' ||
          a.memoizedProps.revealOrder === 'together')
      ) {
        if ((a.flags & 128) !== 0) return a;
      } else if (a.child !== null) {
        ((a.child.return = a), (a = a.child));
        continue;
      }
      if (a === e) break;
      for (; a.sibling === null; ) {
        if (a.return === null || a.return === e) return null;
        a = a.return;
      }
      ((a.sibling.return = a.return), (a = a.sibling));
    }
    return null;
  }
  var ba = 0,
    _ = null,
    de = null,
    Oe = null,
    tl = !1,
    Pn = !1,
    Sn = !1,
    al = 0,
    Zs = 0,
    es = null,
    kf = 0;
  function Se() {
    throw Error(u(321));
  }
  function Ur(e, a) {
    if (a === null) return !1;
    for (var n = 0; n < a.length && n < e.length; n++) if (!vt(e[n], a[n])) return !1;
    return !0;
  }
  function qr(e, a, n, s, i, l) {
    return (
      (ba = l),
      (_ = a),
      (a.memoizedState = null),
      (a.updateQueue = null),
      (a.lanes = 0),
      (N.H = e === null || e.memoizedState === null ? rh : ao),
      (Sn = !1),
      (l = n(s, i)),
      (Sn = !1),
      Pn && (l = kd(a, n, s, i)),
      Sd(e),
      l
    );
  }
  function Sd(e) {
    N.H = Vs;
    var a = de !== null && de.next !== null;
    if (((ba = 0), (Oe = de = _ = null), (tl = !1), (Zs = 0), (es = null), a)) throw Error(u(300));
    e === null || He || ((e = e.dependencies), e !== null && Qi(e) && (He = !0));
  }
  function kd(e, a, n, s) {
    _ = e;
    var i = 0;
    do {
      if ((Pn && (es = null), (Zs = 0), (Pn = !1), 25 <= i)) throw Error(u(301));
      if (((i += 1), (Oe = de = null), e.updateQueue != null)) {
        var l = e.updateQueue;
        ((l.lastEffect = null),
          (l.events = null),
          (l.stores = null),
          l.memoCache != null && (l.memoCache.index = 0));
      }
      ((N.H = oh), (l = a(n, s)));
    } while (Pn);
    return l;
  }
  function Af() {
    var e = N.H,
      a = e.useState()[0];
    return (
      (a = typeof a.then == 'function' ? Qs(a) : a),
      (e = e.useState()[0]),
      (de !== null ? de.memoizedState : null) !== e && (_.flags |= 1024),
      a
    );
  }
  function Ir() {
    var e = al !== 0;
    return ((al = 0), e);
  }
  function Wr(e, a, n) {
    ((a.updateQueue = e.updateQueue), (a.flags &= -2053), (e.lanes &= ~n));
  }
  function Gr(e) {
    if (tl) {
      for (e = e.memoizedState; e !== null; ) {
        var a = e.queue;
        (a !== null && (a.pending = null), (e = e.next));
      }
      tl = !1;
    }
    ((ba = 0), (Oe = de = _ = null), (Pn = !1), (Zs = al = 0), (es = null));
  }
  function at() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (Oe === null ? (_.memoizedState = Oe = e) : (Oe = Oe.next = e), Oe);
  }
  function ze() {
    if (de === null) {
      var e = _.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = de.next;
    var a = Oe === null ? _.memoizedState : Oe.next;
    if (a !== null) ((Oe = a), (de = e));
    else {
      if (e === null) throw _.alternate === null ? Error(u(467)) : Error(u(310));
      ((de = e),
        (e = {
          memoizedState: de.memoizedState,
          baseState: de.baseState,
          baseQueue: de.baseQueue,
          queue: de.queue,
          next: null,
        }),
        Oe === null ? (_.memoizedState = Oe = e) : (Oe = Oe.next = e));
    }
    return Oe;
  }
  function nl() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function Qs(e) {
    var a = Zs;
    return (
      (Zs += 1),
      es === null && (es = []),
      (e = xd(es, e, a)),
      (a = _),
      (Oe === null ? a.memoizedState : Oe.next) === null &&
        ((a = a.alternate), (N.H = a === null || a.memoizedState === null ? rh : ao)),
      e
    );
  }
  function sl(e) {
    if (e !== null && typeof e == 'object') {
      if (typeof e.then == 'function') return Qs(e);
      if (e.$$typeof === Z) return Je(e);
    }
    throw Error(u(438, String(e)));
  }
  function Zr(e) {
    var a = null,
      n = _.updateQueue;
    if ((n !== null && (a = n.memoCache), a == null)) {
      var s = _.alternate;
      s !== null &&
        ((s = s.updateQueue),
        s !== null &&
          ((s = s.memoCache),
          s != null &&
            (a = {
              data: s.data.map(function (i) {
                return i.slice();
              }),
              index: 0,
            })));
    }
    if (
      (a == null && (a = { data: [], index: 0 }),
      n === null && ((n = nl()), (_.updateQueue = n)),
      (n.memoCache = a),
      (n = a.data[a.index]),
      n === void 0)
    )
      for (n = a.data[a.index] = Array(e), s = 0; s < e; s++) n[s] = Cn;
    return (a.index++, n);
  }
  function ja(e, a) {
    return typeof a == 'function' ? a(e) : a;
  }
  function il(e) {
    var a = ze();
    return Qr(a, de, e);
  }
  function Qr(e, a, n) {
    var s = e.queue;
    if (s === null) throw Error(u(311));
    s.lastRenderedReducer = n;
    var i = e.baseQueue,
      l = s.pending;
    if (l !== null) {
      if (i !== null) {
        var r = i.next;
        ((i.next = l.next), (l.next = r));
      }
      ((a.baseQueue = i = l), (s.pending = null));
    }
    if (((l = e.baseState), i === null)) e.memoizedState = l;
    else {
      a = i.next;
      var o = (r = null),
        c = null,
        y = a,
        v = !1;
      do {
        var T = y.lane & -536870913;
        if (T !== y.lane ? (Q & T) === T : (ba & T) === T) {
          var b = y.revertLane;
          if (b === 0)
            (c !== null &&
              (c = c.next =
                {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: y.action,
                  hasEagerState: y.hasEagerState,
                  eagerState: y.eagerState,
                  next: null,
                }),
              T === Vn && (v = !0));
          else if ((ba & b) === b) {
            ((y = y.next), b === Vn && (v = !0));
            continue;
          } else
            ((T = {
              lane: 0,
              revertLane: y.revertLane,
              gesture: null,
              action: y.action,
              hasEagerState: y.hasEagerState,
              eagerState: y.eagerState,
              next: null,
            }),
              c === null ? ((o = c = T), (r = l)) : (c = c.next = T),
              (_.lanes |= b),
              (Ka |= b));
          ((T = y.action), Sn && n(l, T), (l = y.hasEagerState ? y.eagerState : n(l, T)));
        } else
          ((b = {
            lane: T,
            revertLane: y.revertLane,
            gesture: y.gesture,
            action: y.action,
            hasEagerState: y.hasEagerState,
            eagerState: y.eagerState,
            next: null,
          }),
            c === null ? ((o = c = b), (r = l)) : (c = c.next = b),
            (_.lanes |= T),
            (Ka |= T));
        y = y.next;
      } while (y !== null && y !== a);
      if (
        (c === null ? (r = l) : (c.next = o),
        !vt(l, e.memoizedState) && ((He = !0), v && ((n = Kn), n !== null)))
      )
        throw n;
      ((e.memoizedState = l), (e.baseState = r), (e.baseQueue = c), (s.lastRenderedState = l));
    }
    return (i === null && (s.lanes = 0), [e.memoizedState, s.dispatch]);
  }
  function Xr(e) {
    var a = ze(),
      n = a.queue;
    if (n === null) throw Error(u(311));
    n.lastRenderedReducer = e;
    var s = n.dispatch,
      i = n.pending,
      l = a.memoizedState;
    if (i !== null) {
      n.pending = null;
      var r = (i = i.next);
      do ((l = e(l, r.action)), (r = r.next));
      while (r !== i);
      (vt(l, a.memoizedState) || (He = !0),
        (a.memoizedState = l),
        a.baseQueue === null && (a.baseState = l),
        (n.lastRenderedState = l));
    }
    return [l, s];
  }
  function Ad(e, a, n) {
    var s = _,
      i = ze(),
      l = V;
    if (l) {
      if (n === void 0) throw Error(u(407));
      n = n();
    } else n = a();
    var r = !vt((de || i).memoizedState, n);
    if (
      (r && ((i.memoizedState = n), (He = !0)),
      (i = i.queue),
      Jr(zd.bind(null, s, i, e), [e]),
      i.getSnapshot !== a || r || (Oe !== null && Oe.memoizedState.tag & 1))
    ) {
      if (
        ((s.flags |= 2048),
        ts(9, { destroy: void 0 }, Cd.bind(null, s, i, n, a), null),
        ge === null)
      )
        throw Error(u(349));
      l || (ba & 127) !== 0 || Ed(s, a, n);
    }
    return n;
  }
  function Ed(e, a, n) {
    ((e.flags |= 16384),
      (e = { getSnapshot: a, value: n }),
      (a = _.updateQueue),
      a === null
        ? ((a = nl()), (_.updateQueue = a), (a.stores = [e]))
        : ((n = a.stores), n === null ? (a.stores = [e]) : n.push(e)));
  }
  function Cd(e, a, n, s) {
    ((a.value = n), (a.getSnapshot = s), Md(a) && Dd(e));
  }
  function zd(e, a, n) {
    return n(function () {
      Md(a) && Dd(e);
    });
  }
  function Md(e) {
    var a = e.getSnapshot;
    e = e.value;
    try {
      var n = a();
      return !vt(e, n);
    } catch {
      return !0;
    }
  }
  function Dd(e) {
    var a = xn(e, 2);
    a !== null && gt(a, e, 2);
  }
  function Vr(e) {
    var a = at();
    if (typeof e == 'function') {
      var n = e;
      if (((e = n()), Sn)) {
        Ge(!0);
        try {
          n();
        } finally {
          Ge(!1);
        }
      }
    }
    return (
      (a.memoizedState = a.baseState = e),
      (a.queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ja,
        lastRenderedState: e,
      }),
      a
    );
  }
  function Yd(e, a, n, s) {
    return ((e.baseState = n), Qr(e, de, typeof s == 'function' ? s : ja));
  }
  function Ef(e, a, n, s, i) {
    if (ol(e)) throw Error(u(485));
    if (((e = a.action), e !== null)) {
      var l = {
        payload: i,
        action: e,
        next: null,
        isTransition: !0,
        status: 'pending',
        value: null,
        reason: null,
        listeners: [],
        then: function (r) {
          l.listeners.push(r);
        },
      };
      (N.T !== null ? n(!0) : (l.isTransition = !1),
        s(l),
        (n = a.pending),
        n === null
          ? ((l.next = a.pending = l), Rd(a, l))
          : ((l.next = n.next), (a.pending = n.next = l)));
    }
  }
  function Rd(e, a) {
    var n = a.action,
      s = a.payload,
      i = e.state;
    if (a.isTransition) {
      var l = N.T,
        r = {};
      N.T = r;
      try {
        var o = n(i, s),
          c = N.S;
        (c !== null && c(r, o), Ld(e, a, o));
      } catch (y) {
        Kr(e, a, y);
      } finally {
        (l !== null && r.types !== null && (l.types = r.types), (N.T = l));
      }
    } else
      try {
        ((l = n(i, s)), Ld(e, a, l));
      } catch (y) {
        Kr(e, a, y);
      }
  }
  function Ld(e, a, n) {
    n !== null && typeof n == 'object' && typeof n.then == 'function'
      ? n.then(
          function (s) {
            Od(e, a, s);
          },
          function (s) {
            return Kr(e, a, s);
          }
        )
      : Od(e, a, n);
  }
  function Od(e, a, n) {
    ((a.status = 'fulfilled'),
      (a.value = n),
      Hd(a),
      (e.state = n),
      (a = e.pending),
      a !== null &&
        ((n = a.next), n === a ? (e.pending = null) : ((n = n.next), (a.next = n), Rd(e, n))));
  }
  function Kr(e, a, n) {
    var s = e.pending;
    if (((e.pending = null), s !== null)) {
      s = s.next;
      do ((a.status = 'rejected'), (a.reason = n), Hd(a), (a = a.next));
      while (a !== s);
    }
    e.action = null;
  }
  function Hd(e) {
    e = e.listeners;
    for (var a = 0; a < e.length; a++) (0, e[a])();
  }
  function _d(e, a) {
    return a;
  }
  function Bd(e, a) {
    if (V) {
      var n = ge.formState;
      if (n !== null) {
        e: {
          var s = _;
          if (V) {
            if (be) {
              t: {
                for (var i = be, l = Ht; i.nodeType !== 8; ) {
                  if (!l) {
                    i = null;
                    break t;
                  }
                  if (((i = Bt(i.nextSibling)), i === null)) {
                    i = null;
                    break t;
                  }
                }
                ((l = i.data), (i = l === 'F!' || l === 'F' ? i : null));
              }
              if (i) {
                ((be = Bt(i.nextSibling)), (s = i.data === 'F!'));
                break e;
              }
            }
            Ua(s);
          }
          s = !1;
        }
        s && (a = n[0]);
      }
    }
    return (
      (n = at()),
      (n.memoizedState = n.baseState = a),
      (s = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: _d,
        lastRenderedState: a,
      }),
      (n.queue = s),
      (n = sh.bind(null, _, s)),
      (s.dispatch = n),
      (s = Vr(!1)),
      (l = to.bind(null, _, !1, s.queue)),
      (s = at()),
      (i = { state: a, dispatch: null, action: e, pending: null }),
      (s.queue = i),
      (n = Ef.bind(null, _, i, l, n)),
      (i.dispatch = n),
      (s.memoizedState = e),
      [a, n, !1]
    );
  }
  function Ud(e) {
    var a = ze();
    return qd(a, de, e);
  }
  function qd(e, a, n) {
    if (
      ((a = Qr(e, a, _d)[0]),
      (e = il(ja)[0]),
      typeof a == 'object' && a !== null && typeof a.then == 'function')
    )
      try {
        var s = Qs(a);
      } catch (r) {
        throw r === Jn ? Ki : r;
      }
    else s = a;
    a = ze();
    var i = a.queue,
      l = i.dispatch;
    return (
      n !== a.memoizedState &&
        ((_.flags |= 2048), ts(9, { destroy: void 0 }, Cf.bind(null, i, n), null)),
      [s, l, e]
    );
  }
  function Cf(e, a) {
    e.action = a;
  }
  function Id(e) {
    var a = ze(),
      n = de;
    if (n !== null) return qd(a, n, e);
    (ze(), (a = a.memoizedState), (n = ze()));
    var s = n.queue.dispatch;
    return ((n.memoizedState = e), [a, s, !1]);
  }
  function ts(e, a, n, s) {
    return (
      (e = { tag: e, create: n, deps: s, inst: a, next: null }),
      (a = _.updateQueue),
      a === null && ((a = nl()), (_.updateQueue = a)),
      (n = a.lastEffect),
      n === null
        ? (a.lastEffect = e.next = e)
        : ((s = n.next), (n.next = e), (e.next = s), (a.lastEffect = e)),
      e
    );
  }
  function Wd() {
    return ze().memoizedState;
  }
  function ll(e, a, n, s) {
    var i = at();
    ((_.flags |= e),
      (i.memoizedState = ts(1 | a, { destroy: void 0 }, n, s === void 0 ? null : s)));
  }
  function rl(e, a, n, s) {
    var i = ze();
    s = s === void 0 ? null : s;
    var l = i.memoizedState.inst;
    de !== null && s !== null && Ur(s, de.memoizedState.deps)
      ? (i.memoizedState = ts(a, l, n, s))
      : ((_.flags |= e), (i.memoizedState = ts(1 | a, l, n, s)));
  }
  function Gd(e, a) {
    ll(8390656, 8, e, a);
  }
  function Jr(e, a) {
    rl(2048, 8, e, a);
  }
  function zf(e) {
    _.flags |= 4;
    var a = _.updateQueue;
    if (a === null) ((a = nl()), (_.updateQueue = a), (a.events = [e]));
    else {
      var n = a.events;
      n === null ? (a.events = [e]) : n.push(e);
    }
  }
  function Zd(e) {
    var a = ze().memoizedState;
    return (
      zf({ ref: a, nextImpl: e }),
      function () {
        if ((ae & 2) !== 0) throw Error(u(440));
        return a.impl.apply(void 0, arguments);
      }
    );
  }
  function Qd(e, a) {
    return rl(4, 2, e, a);
  }
  function Xd(e, a) {
    return rl(4, 4, e, a);
  }
  function Vd(e, a) {
    if (typeof a == 'function') {
      e = e();
      var n = a(e);
      return function () {
        typeof n == 'function' ? n() : a(null);
      };
    }
    if (a != null)
      return (
        (e = e()),
        (a.current = e),
        function () {
          a.current = null;
        }
      );
  }
  function Kd(e, a, n) {
    ((n = n != null ? n.concat([e]) : null), rl(4, 4, Vd.bind(null, a, e), n));
  }
  function Fr() {}
  function Jd(e, a) {
    var n = ze();
    a = a === void 0 ? null : a;
    var s = n.memoizedState;
    return a !== null && Ur(a, s[1]) ? s[0] : ((n.memoizedState = [e, a]), e);
  }
  function Fd(e, a) {
    var n = ze();
    a = a === void 0 ? null : a;
    var s = n.memoizedState;
    if (a !== null && Ur(a, s[1])) return s[0];
    if (((s = e()), Sn)) {
      Ge(!0);
      try {
        e();
      } finally {
        Ge(!1);
      }
    }
    return ((n.memoizedState = [s, a]), s);
  }
  function $r(e, a, n) {
    return n === void 0 || ((ba & 1073741824) !== 0 && (Q & 261930) === 0)
      ? (e.memoizedState = a)
      : ((e.memoizedState = n), (e = $h()), (_.lanes |= e), (Ka |= e), n);
  }
  function $d(e, a, n, s) {
    return vt(n, a)
      ? n
      : $n.current !== null
        ? ((e = $r(e, n, s)), vt(e, a) || (He = !0), e)
        : (ba & 42) === 0 || ((ba & 1073741824) !== 0 && (Q & 261930) === 0)
          ? ((He = !0), (e.memoizedState = n))
          : ((e = $h()), (_.lanes |= e), (Ka |= e), a);
  }
  function Pd(e, a, n, s, i) {
    var l = A.p;
    A.p = l !== 0 && 8 > l ? l : 8;
    var r = N.T,
      o = {};
    ((N.T = o), to(e, !1, a, n));
    try {
      var c = i(),
        y = N.S;
      if (
        (y !== null && y(o, c), c !== null && typeof c == 'object' && typeof c.then == 'function')
      ) {
        var v = Sf(c, s);
        Xs(e, a, v, At(e));
      } else Xs(e, a, s, At(e));
    } catch (T) {
      Xs(e, a, { then: function () {}, status: 'rejected', reason: T }, At());
    } finally {
      ((A.p = l), r !== null && o.types !== null && (r.types = o.types), (N.T = r));
    }
  }
  function Mf() {}
  function Pr(e, a, n, s) {
    if (e.tag !== 5) throw Error(u(476));
    var i = eh(e).queue;
    Pd(
      e,
      i,
      a,
      O,
      n === null
        ? Mf
        : function () {
            return (th(e), n(s));
          }
    );
  }
  function eh(e) {
    var a = e.memoizedState;
    if (a !== null) return a;
    a = {
      memoizedState: O,
      baseState: O,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ja,
        lastRenderedState: O,
      },
      next: null,
    };
    var n = {};
    return (
      (a.next = {
        memoizedState: n,
        baseState: n,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: ja,
          lastRenderedState: n,
        },
        next: null,
      }),
      (e.memoizedState = a),
      (e = e.alternate),
      e !== null && (e.memoizedState = a),
      a
    );
  }
  function th(e) {
    var a = eh(e);
    (a.next === null && (a = e.alternate.memoizedState), Xs(e, a.next.queue, {}, At()));
  }
  function eo() {
    return Je(di);
  }
  function ah() {
    return ze().memoizedState;
  }
  function nh() {
    return ze().memoizedState;
  }
  function Df(e) {
    for (var a = e.return; a !== null; ) {
      switch (a.tag) {
        case 24:
        case 3:
          var n = At();
          e = Wa(n);
          var s = Ga(a, e, n);
          (s !== null && (gt(s, a, n), Is(s, a, n)), (a = { cache: Cr() }), (e.payload = a));
          return;
      }
      a = a.return;
    }
  }
  function Yf(e, a, n) {
    var s = At();
    ((n = {
      lane: s,
      revertLane: 0,
      gesture: null,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
      ol(e) ? ih(a, n) : ((n = yr(e, a, n, s)), n !== null && (gt(n, e, s), lh(n, a, s))));
  }
  function sh(e, a, n) {
    var s = At();
    Xs(e, a, n, s);
  }
  function Xs(e, a, n, s) {
    var i = {
      lane: s,
      revertLane: 0,
      gesture: null,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    };
    if (ol(e)) ih(a, i);
    else {
      var l = e.alternate;
      if (
        e.lanes === 0 &&
        (l === null || l.lanes === 0) &&
        ((l = a.lastRenderedReducer), l !== null)
      )
        try {
          var r = a.lastRenderedState,
            o = l(r, n);
          if (((i.hasEagerState = !0), (i.eagerState = o), vt(o, r)))
            return (Ii(e, a, i, 0), ge === null && qi(), !1);
        } catch {}
      if (((n = yr(e, a, i, s)), n !== null)) return (gt(n, e, s), lh(n, a, s), !0);
    }
    return !1;
  }
  function to(e, a, n, s) {
    if (
      ((s = {
        lane: 2,
        revertLane: Ro(),
        gesture: null,
        action: s,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
      ol(e))
    ) {
      if (a) throw Error(u(479));
    } else ((a = yr(e, n, s, 2)), a !== null && gt(a, e, 2));
  }
  function ol(e) {
    var a = e.alternate;
    return e === _ || (a !== null && a === _);
  }
  function ih(e, a) {
    Pn = tl = !0;
    var n = e.pending;
    (n === null ? (a.next = a) : ((a.next = n.next), (n.next = a)), (e.pending = a));
  }
  function lh(e, a, n) {
    if ((n & 4194048) !== 0) {
      var s = a.lanes;
      ((s &= e.pendingLanes), (n |= s), (a.lanes = n), ws(e, n));
    }
  }
  var Vs = {
    readContext: Je,
    use: sl,
    useCallback: Se,
    useContext: Se,
    useEffect: Se,
    useImperativeHandle: Se,
    useLayoutEffect: Se,
    useInsertionEffect: Se,
    useMemo: Se,
    useReducer: Se,
    useRef: Se,
    useState: Se,
    useDebugValue: Se,
    useDeferredValue: Se,
    useTransition: Se,
    useSyncExternalStore: Se,
    useId: Se,
    useHostTransitionStatus: Se,
    useFormState: Se,
    useActionState: Se,
    useOptimistic: Se,
    useMemoCache: Se,
    useCacheRefresh: Se,
  };
  Vs.useEffectEvent = Se;
  var rh = {
      readContext: Je,
      use: sl,
      useCallback: function (e, a) {
        return ((at().memoizedState = [e, a === void 0 ? null : a]), e);
      },
      useContext: Je,
      useEffect: Gd,
      useImperativeHandle: function (e, a, n) {
        ((n = n != null ? n.concat([e]) : null), ll(4194308, 4, Vd.bind(null, a, e), n));
      },
      useLayoutEffect: function (e, a) {
        return ll(4194308, 4, e, a);
      },
      useInsertionEffect: function (e, a) {
        ll(4, 2, e, a);
      },
      useMemo: function (e, a) {
        var n = at();
        a = a === void 0 ? null : a;
        var s = e();
        if (Sn) {
          Ge(!0);
          try {
            e();
          } finally {
            Ge(!1);
          }
        }
        return ((n.memoizedState = [s, a]), s);
      },
      useReducer: function (e, a, n) {
        var s = at();
        if (n !== void 0) {
          var i = n(a);
          if (Sn) {
            Ge(!0);
            try {
              n(a);
            } finally {
              Ge(!1);
            }
          }
        } else i = a;
        return (
          (s.memoizedState = s.baseState = i),
          (e = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: e,
            lastRenderedState: i,
          }),
          (s.queue = e),
          (e = e.dispatch = Yf.bind(null, _, e)),
          [s.memoizedState, e]
        );
      },
      useRef: function (e) {
        var a = at();
        return ((e = { current: e }), (a.memoizedState = e));
      },
      useState: function (e) {
        e = Vr(e);
        var a = e.queue,
          n = sh.bind(null, _, a);
        return ((a.dispatch = n), [e.memoizedState, n]);
      },
      useDebugValue: Fr,
      useDeferredValue: function (e, a) {
        var n = at();
        return $r(n, e, a);
      },
      useTransition: function () {
        var e = Vr(!1);
        return ((e = Pd.bind(null, _, e.queue, !0, !1)), (at().memoizedState = e), [!1, e]);
      },
      useSyncExternalStore: function (e, a, n) {
        var s = _,
          i = at();
        if (V) {
          if (n === void 0) throw Error(u(407));
          n = n();
        } else {
          if (((n = a()), ge === null)) throw Error(u(349));
          (Q & 127) !== 0 || Ed(s, a, n);
        }
        i.memoizedState = n;
        var l = { value: n, getSnapshot: a };
        return (
          (i.queue = l),
          Gd(zd.bind(null, s, l, e), [e]),
          (s.flags |= 2048),
          ts(9, { destroy: void 0 }, Cd.bind(null, s, l, n, a), null),
          n
        );
      },
      useId: function () {
        var e = at(),
          a = ge.identifierPrefix;
        if (V) {
          var n = Pt,
            s = $t;
          ((n = (s & ~(1 << (32 - Ye(s) - 1))).toString(32) + n),
            (a = '_' + a + 'R_' + n),
            (n = al++),
            0 < n && (a += 'H' + n.toString(32)),
            (a += '_'));
        } else ((n = kf++), (a = '_' + a + 'r_' + n.toString(32) + '_'));
        return (e.memoizedState = a);
      },
      useHostTransitionStatus: eo,
      useFormState: Bd,
      useActionState: Bd,
      useOptimistic: function (e) {
        var a = at();
        a.memoizedState = a.baseState = e;
        var n = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: null,
          lastRenderedState: null,
        };
        return ((a.queue = n), (a = to.bind(null, _, !0, n)), (n.dispatch = a), [e, a]);
      },
      useMemoCache: Zr,
      useCacheRefresh: function () {
        return (at().memoizedState = Df.bind(null, _));
      },
      useEffectEvent: function (e) {
        var a = at(),
          n = { impl: e };
        return (
          (a.memoizedState = n),
          function () {
            if ((ae & 2) !== 0) throw Error(u(440));
            return n.impl.apply(void 0, arguments);
          }
        );
      },
    },
    ao = {
      readContext: Je,
      use: sl,
      useCallback: Jd,
      useContext: Je,
      useEffect: Jr,
      useImperativeHandle: Kd,
      useInsertionEffect: Qd,
      useLayoutEffect: Xd,
      useMemo: Fd,
      useReducer: il,
      useRef: Wd,
      useState: function () {
        return il(ja);
      },
      useDebugValue: Fr,
      useDeferredValue: function (e, a) {
        var n = ze();
        return $d(n, de.memoizedState, e, a);
      },
      useTransition: function () {
        var e = il(ja)[0],
          a = ze().memoizedState;
        return [typeof e == 'boolean' ? e : Qs(e), a];
      },
      useSyncExternalStore: Ad,
      useId: ah,
      useHostTransitionStatus: eo,
      useFormState: Ud,
      useActionState: Ud,
      useOptimistic: function (e, a) {
        var n = ze();
        return Yd(n, de, e, a);
      },
      useMemoCache: Zr,
      useCacheRefresh: nh,
    };
  ao.useEffectEvent = Zd;
  var oh = {
    readContext: Je,
    use: sl,
    useCallback: Jd,
    useContext: Je,
    useEffect: Jr,
    useImperativeHandle: Kd,
    useInsertionEffect: Qd,
    useLayoutEffect: Xd,
    useMemo: Fd,
    useReducer: Xr,
    useRef: Wd,
    useState: function () {
      return Xr(ja);
    },
    useDebugValue: Fr,
    useDeferredValue: function (e, a) {
      var n = ze();
      return de === null ? $r(n, e, a) : $d(n, de.memoizedState, e, a);
    },
    useTransition: function () {
      var e = Xr(ja)[0],
        a = ze().memoizedState;
      return [typeof e == 'boolean' ? e : Qs(e), a];
    },
    useSyncExternalStore: Ad,
    useId: ah,
    useHostTransitionStatus: eo,
    useFormState: Id,
    useActionState: Id,
    useOptimistic: function (e, a) {
      var n = ze();
      return de !== null ? Yd(n, de, e, a) : ((n.baseState = e), [e, n.queue.dispatch]);
    },
    useMemoCache: Zr,
    useCacheRefresh: nh,
  };
  oh.useEffectEvent = Zd;
  function no(e, a, n, s) {
    ((a = e.memoizedState),
      (n = n(s, a)),
      (n = n == null ? a : L({}, a, n)),
      (e.memoizedState = n),
      e.lanes === 0 && (e.updateQueue.baseState = n));
  }
  var so = {
    enqueueSetState: function (e, a, n) {
      e = e._reactInternals;
      var s = At(),
        i = Wa(s);
      ((i.payload = a),
        n != null && (i.callback = n),
        (a = Ga(e, i, s)),
        a !== null && (gt(a, e, s), Is(a, e, s)));
    },
    enqueueReplaceState: function (e, a, n) {
      e = e._reactInternals;
      var s = At(),
        i = Wa(s);
      ((i.tag = 1),
        (i.payload = a),
        n != null && (i.callback = n),
        (a = Ga(e, i, s)),
        a !== null && (gt(a, e, s), Is(a, e, s)));
    },
    enqueueForceUpdate: function (e, a) {
      e = e._reactInternals;
      var n = At(),
        s = Wa(n);
      ((s.tag = 2),
        a != null && (s.callback = a),
        (a = Ga(e, s, n)),
        a !== null && (gt(a, e, n), Is(a, e, n)));
    },
  };
  function ch(e, a, n, s, i, l, r) {
    return (
      (e = e.stateNode),
      typeof e.shouldComponentUpdate == 'function'
        ? e.shouldComponentUpdate(s, l, r)
        : a.prototype && a.prototype.isPureReactComponent
          ? !Rs(n, s) || !Rs(i, l)
          : !0
    );
  }
  function dh(e, a, n, s) {
    ((e = a.state),
      typeof a.componentWillReceiveProps == 'function' && a.componentWillReceiveProps(n, s),
      typeof a.UNSAFE_componentWillReceiveProps == 'function' &&
        a.UNSAFE_componentWillReceiveProps(n, s),
      a.state !== e && so.enqueueReplaceState(a, a.state, null));
  }
  function kn(e, a) {
    var n = a;
    if ('ref' in a) {
      n = {};
      for (var s in a) s !== 'ref' && (n[s] = a[s]);
    }
    if ((e = e.defaultProps)) {
      n === a && (n = L({}, n));
      for (var i in e) n[i] === void 0 && (n[i] = e[i]);
    }
    return n;
  }
  function hh(e) {
    Ui(e);
  }
  function uh(e) {
    console.error(e);
  }
  function mh(e) {
    Ui(e);
  }
  function cl(e, a) {
    try {
      var n = e.onUncaughtError;
      n(a.value, { componentStack: a.stack });
    } catch (s) {
      setTimeout(function () {
        throw s;
      });
    }
  }
  function fh(e, a, n) {
    try {
      var s = e.onCaughtError;
      s(n.value, { componentStack: n.stack, errorBoundary: a.tag === 1 ? a.stateNode : null });
    } catch (i) {
      setTimeout(function () {
        throw i;
      });
    }
  }
  function io(e, a, n) {
    return (
      (n = Wa(n)),
      (n.tag = 3),
      (n.payload = { element: null }),
      (n.callback = function () {
        cl(e, a);
      }),
      n
    );
  }
  function gh(e) {
    return ((e = Wa(e)), (e.tag = 3), e);
  }
  function xh(e, a, n, s) {
    var i = n.type.getDerivedStateFromError;
    if (typeof i == 'function') {
      var l = s.value;
      ((e.payload = function () {
        return i(l);
      }),
        (e.callback = function () {
          fh(a, n, s);
        }));
    }
    var r = n.stateNode;
    r !== null &&
      typeof r.componentDidCatch == 'function' &&
      (e.callback = function () {
        (fh(a, n, s),
          typeof i != 'function' && (Ja === null ? (Ja = new Set([this])) : Ja.add(this)));
        var o = s.stack;
        this.componentDidCatch(s.value, { componentStack: o !== null ? o : '' });
      });
  }
  function Rf(e, a, n, s, i) {
    if (((n.flags |= 32768), s !== null && typeof s == 'object' && typeof s.then == 'function')) {
      if (((a = n.alternate), a !== null && Xn(a, n, i, !0), (n = Nt.current), n !== null)) {
        switch (n.tag) {
          case 31:
          case 13:
            return (
              _t === null ? vl() : n.alternate === null && ke === 0 && (ke = 3),
              (n.flags &= -257),
              (n.flags |= 65536),
              (n.lanes = i),
              s === Ji
                ? (n.flags |= 16384)
                : ((a = n.updateQueue),
                  a === null ? (n.updateQueue = new Set([s])) : a.add(s),
                  Mo(e, s, i)),
              !1
            );
          case 22:
            return (
              (n.flags |= 65536),
              s === Ji
                ? (n.flags |= 16384)
                : ((a = n.updateQueue),
                  a === null
                    ? ((a = { transitions: null, markerInstances: null, retryQueue: new Set([s]) }),
                      (n.updateQueue = a))
                    : ((n = a.retryQueue), n === null ? (a.retryQueue = new Set([s])) : n.add(s)),
                  Mo(e, s, i)),
              !1
            );
        }
        throw Error(u(435, n.tag));
      }
      return (Mo(e, s, i), vl(), !1);
    }
    if (V)
      return (
        (a = Nt.current),
        a !== null
          ? ((a.flags & 65536) === 0 && (a.flags |= 256),
            (a.flags |= 65536),
            (a.lanes = i),
            s !== Tr && ((e = Error(u(422), { cause: s })), Hs(Rt(e, n))))
          : (s !== Tr && ((a = Error(u(423), { cause: s })), Hs(Rt(a, n))),
            (e = e.current.alternate),
            (e.flags |= 65536),
            (i &= -i),
            (e.lanes |= i),
            (s = Rt(s, n)),
            (i = io(e.stateNode, s, i)),
            Lr(e, i),
            ke !== 4 && (ke = 2)),
        !1
      );
    var l = Error(u(520), { cause: s });
    if (((l = Rt(l, n)), ai === null ? (ai = [l]) : ai.push(l), ke !== 4 && (ke = 2), a === null))
      return !0;
    ((s = Rt(s, n)), (n = a));
    do {
      switch (n.tag) {
        case 3:
          return (
            (n.flags |= 65536),
            (e = i & -i),
            (n.lanes |= e),
            (e = io(n.stateNode, s, e)),
            Lr(n, e),
            !1
          );
        case 1:
          if (
            ((a = n.type),
            (l = n.stateNode),
            (n.flags & 128) === 0 &&
              (typeof a.getDerivedStateFromError == 'function' ||
                (l !== null &&
                  typeof l.componentDidCatch == 'function' &&
                  (Ja === null || !Ja.has(l)))))
          )
            return (
              (n.flags |= 65536),
              (i &= -i),
              (n.lanes |= i),
              (i = gh(i)),
              xh(i, e, n, s),
              Lr(n, i),
              !1
            );
      }
      n = n.return;
    } while (n !== null);
    return !1;
  }
  var lo = Error(u(461)),
    He = !1;
  function Fe(e, a, n, s) {
    a.child = e === null ? jd(a, null, n, s) : Tn(a, e.child, n, s);
  }
  function ph(e, a, n, s, i) {
    n = n.render;
    var l = a.ref;
    if ('ref' in s) {
      var r = {};
      for (var o in s) o !== 'ref' && (r[o] = s[o]);
    } else r = s;
    return (
      jn(a),
      (s = qr(e, a, n, r, l, i)),
      (o = Ir()),
      e !== null && !He
        ? (Wr(e, a, i), va(e, a, i))
        : (V && o && wr(a), (a.flags |= 1), Fe(e, a, s, i), a.child)
    );
  }
  function yh(e, a, n, s, i) {
    if (e === null) {
      var l = n.type;
      return typeof l == 'function' && !br(l) && l.defaultProps === void 0 && n.compare === null
        ? ((a.tag = 15), (a.type = l), bh(e, a, l, s, i))
        : ((e = Gi(n.type, null, s, a, a.mode, i)), (e.ref = a.ref), (e.return = a), (a.child = e));
    }
    if (((l = e.child), !go(e, i))) {
      var r = l.memoizedProps;
      if (((n = n.compare), (n = n !== null ? n : Rs), n(r, s) && e.ref === a.ref))
        return va(e, a, i);
    }
    return ((a.flags |= 1), (e = ga(l, s)), (e.ref = a.ref), (e.return = a), (a.child = e));
  }
  function bh(e, a, n, s, i) {
    if (e !== null) {
      var l = e.memoizedProps;
      if (Rs(l, s) && e.ref === a.ref)
        if (((He = !1), (a.pendingProps = s = l), go(e, i))) (e.flags & 131072) !== 0 && (He = !0);
        else return ((a.lanes = e.lanes), va(e, a, i));
    }
    return ro(e, a, n, s, i);
  }
  function jh(e, a, n, s) {
    var i = s.children,
      l = e !== null ? e.memoizedState : null;
    if (
      (e === null &&
        a.stateNode === null &&
        (a.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      s.mode === 'hidden')
    ) {
      if ((a.flags & 128) !== 0) {
        if (((l = l !== null ? l.baseLanes | n : n), e !== null)) {
          for (s = a.child = e.child, i = 0; s !== null; )
            ((i = i | s.lanes | s.childLanes), (s = s.sibling));
          s = i & ~l;
        } else ((s = 0), (a.child = null));
        return vh(e, a, l, n, s);
      }
      if ((n & 536870912) !== 0)
        ((a.memoizedState = { baseLanes: 0, cachePool: null }),
          e !== null && Vi(a, l !== null ? l.cachePool : null),
          l !== null ? Nd(a, l) : Hr(),
          Td(a));
      else return ((s = a.lanes = 536870912), vh(e, a, l !== null ? l.baseLanes | n : n, n, s));
    } else
      l !== null
        ? (Vi(a, l.cachePool), Nd(a, l), Qa(), (a.memoizedState = null))
        : (e !== null && Vi(a, null), Hr(), Qa());
    return (Fe(e, a, i, n), a.child);
  }
  function Ks(e, a) {
    return (
      (e !== null && e.tag === 22) ||
        a.stateNode !== null ||
        (a.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      a.sibling
    );
  }
  function vh(e, a, n, s, i) {
    var l = Mr();
    return (
      (l = l === null ? null : { parent: Le._currentValue, pool: l }),
      (a.memoizedState = { baseLanes: n, cachePool: l }),
      e !== null && Vi(a, null),
      Hr(),
      Td(a),
      e !== null && Xn(e, a, s, !0),
      (a.childLanes = i),
      null
    );
  }
  function dl(e, a) {
    return (
      (a = ul({ mode: a.mode, children: a.children }, e.mode)),
      (a.ref = e.ref),
      (e.child = a),
      (a.return = e),
      a
    );
  }
  function wh(e, a, n) {
    return (
      Tn(a, e.child, null, n),
      (e = dl(a, a.pendingProps)),
      (e.flags |= 2),
      Tt(a),
      (a.memoizedState = null),
      e
    );
  }
  function Lf(e, a, n) {
    var s = a.pendingProps,
      i = (a.flags & 128) !== 0;
    if (((a.flags &= -129), e === null)) {
      if (V) {
        if (s.mode === 'hidden') return ((e = dl(a, s)), (a.lanes = 536870912), Ks(null, e));
        if (
          (Br(a),
          (e = be)
            ? ((e = Ru(e, Ht)),
              (e = e !== null && e.data === '&' ? e : null),
              e !== null &&
                ((a.memoizedState = {
                  dehydrated: e,
                  treeContext: _a !== null ? { id: $t, overflow: Pt } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (n = id(e)),
                (n.return = a),
                (a.child = n),
                (Ke = a),
                (be = null)))
            : (e = null),
          e === null)
        )
          throw Ua(a);
        return ((a.lanes = 536870912), null);
      }
      return dl(a, s);
    }
    var l = e.memoizedState;
    if (l !== null) {
      var r = l.dehydrated;
      if ((Br(a), i))
        if (a.flags & 256) ((a.flags &= -257), (a = wh(e, a, n)));
        else if (a.memoizedState !== null) ((a.child = e.child), (a.flags |= 128), (a = null));
        else throw Error(u(558));
      else if ((He || Xn(e, a, n, !1), (i = (n & e.childLanes) !== 0), He || i)) {
        if (((s = ge), s !== null && ((r = ki(s, n)), r !== 0 && r !== l.retryLane)))
          throw ((l.retryLane = r), xn(e, r), gt(s, e, r), lo);
        (vl(), (a = wh(e, a, n)));
      } else
        ((e = l.treeContext),
          (be = Bt(r.nextSibling)),
          (Ke = a),
          (V = !0),
          (Ba = null),
          (Ht = !1),
          e !== null && od(a, e),
          (a = dl(a, s)),
          (a.flags |= 4096));
      return a;
    }
    return (
      (e = ga(e.child, { mode: s.mode, children: s.children })),
      (e.ref = a.ref),
      (a.child = e),
      (e.return = a),
      e
    );
  }
  function hl(e, a) {
    var n = a.ref;
    if (n === null) e !== null && e.ref !== null && (a.flags |= 4194816);
    else {
      if (typeof n != 'function' && typeof n != 'object') throw Error(u(284));
      (e === null || e.ref !== n) && (a.flags |= 4194816);
    }
  }
  function ro(e, a, n, s, i) {
    return (
      jn(a),
      (n = qr(e, a, n, s, void 0, i)),
      (s = Ir()),
      e !== null && !He
        ? (Wr(e, a, i), va(e, a, i))
        : (V && s && wr(a), (a.flags |= 1), Fe(e, a, n, i), a.child)
    );
  }
  function Nh(e, a, n, s, i, l) {
    return (
      jn(a),
      (a.updateQueue = null),
      (n = kd(a, s, n, i)),
      Sd(e),
      (s = Ir()),
      e !== null && !He
        ? (Wr(e, a, l), va(e, a, l))
        : (V && s && wr(a), (a.flags |= 1), Fe(e, a, n, l), a.child)
    );
  }
  function Th(e, a, n, s, i) {
    if ((jn(a), a.stateNode === null)) {
      var l = Wn,
        r = n.contextType;
      (typeof r == 'object' && r !== null && (l = Je(r)),
        (l = new n(s, l)),
        (a.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null),
        (l.updater = so),
        (a.stateNode = l),
        (l._reactInternals = a),
        (l = a.stateNode),
        (l.props = s),
        (l.state = a.memoizedState),
        (l.refs = {}),
        Yr(a),
        (r = n.contextType),
        (l.context = typeof r == 'object' && r !== null ? Je(r) : Wn),
        (l.state = a.memoizedState),
        (r = n.getDerivedStateFromProps),
        typeof r == 'function' && (no(a, n, r, s), (l.state = a.memoizedState)),
        typeof n.getDerivedStateFromProps == 'function' ||
          typeof l.getSnapshotBeforeUpdate == 'function' ||
          (typeof l.UNSAFE_componentWillMount != 'function' &&
            typeof l.componentWillMount != 'function') ||
          ((r = l.state),
          typeof l.componentWillMount == 'function' && l.componentWillMount(),
          typeof l.UNSAFE_componentWillMount == 'function' && l.UNSAFE_componentWillMount(),
          r !== l.state && so.enqueueReplaceState(l, l.state, null),
          Gs(a, s, l, i),
          Ws(),
          (l.state = a.memoizedState)),
        typeof l.componentDidMount == 'function' && (a.flags |= 4194308),
        (s = !0));
    } else if (e === null) {
      l = a.stateNode;
      var o = a.memoizedProps,
        c = kn(n, o);
      l.props = c;
      var y = l.context,
        v = n.contextType;
      ((r = Wn), typeof v == 'object' && v !== null && (r = Je(v)));
      var T = n.getDerivedStateFromProps;
      ((v = typeof T == 'function' || typeof l.getSnapshotBeforeUpdate == 'function'),
        (o = a.pendingProps !== o),
        v ||
          (typeof l.UNSAFE_componentWillReceiveProps != 'function' &&
            typeof l.componentWillReceiveProps != 'function') ||
          ((o || y !== r) && dh(a, l, s, r)),
        (Ia = !1));
      var b = a.memoizedState;
      ((l.state = b),
        Gs(a, s, l, i),
        Ws(),
        (y = a.memoizedState),
        o || b !== y || Ia
          ? (typeof T == 'function' && (no(a, n, T, s), (y = a.memoizedState)),
            (c = Ia || ch(a, n, c, s, b, y, r))
              ? (v ||
                  (typeof l.UNSAFE_componentWillMount != 'function' &&
                    typeof l.componentWillMount != 'function') ||
                  (typeof l.componentWillMount == 'function' && l.componentWillMount(),
                  typeof l.UNSAFE_componentWillMount == 'function' &&
                    l.UNSAFE_componentWillMount()),
                typeof l.componentDidMount == 'function' && (a.flags |= 4194308))
              : (typeof l.componentDidMount == 'function' && (a.flags |= 4194308),
                (a.memoizedProps = s),
                (a.memoizedState = y)),
            (l.props = s),
            (l.state = y),
            (l.context = r),
            (s = c))
          : (typeof l.componentDidMount == 'function' && (a.flags |= 4194308), (s = !1)));
    } else {
      ((l = a.stateNode),
        Rr(e, a),
        (r = a.memoizedProps),
        (v = kn(n, r)),
        (l.props = v),
        (T = a.pendingProps),
        (b = l.context),
        (y = n.contextType),
        (c = Wn),
        typeof y == 'object' && y !== null && (c = Je(y)),
        (o = n.getDerivedStateFromProps),
        (y = typeof o == 'function' || typeof l.getSnapshotBeforeUpdate == 'function') ||
          (typeof l.UNSAFE_componentWillReceiveProps != 'function' &&
            typeof l.componentWillReceiveProps != 'function') ||
          ((r !== T || b !== c) && dh(a, l, s, c)),
        (Ia = !1),
        (b = a.memoizedState),
        (l.state = b),
        Gs(a, s, l, i),
        Ws());
      var j = a.memoizedState;
      r !== T || b !== j || Ia || (e !== null && e.dependencies !== null && Qi(e.dependencies))
        ? (typeof o == 'function' && (no(a, n, o, s), (j = a.memoizedState)),
          (v =
            Ia ||
            ch(a, n, v, s, b, j, c) ||
            (e !== null && e.dependencies !== null && Qi(e.dependencies)))
            ? (y ||
                (typeof l.UNSAFE_componentWillUpdate != 'function' &&
                  typeof l.componentWillUpdate != 'function') ||
                (typeof l.componentWillUpdate == 'function' && l.componentWillUpdate(s, j, c),
                typeof l.UNSAFE_componentWillUpdate == 'function' &&
                  l.UNSAFE_componentWillUpdate(s, j, c)),
              typeof l.componentDidUpdate == 'function' && (a.flags |= 4),
              typeof l.getSnapshotBeforeUpdate == 'function' && (a.flags |= 1024))
            : (typeof l.componentDidUpdate != 'function' ||
                (r === e.memoizedProps && b === e.memoizedState) ||
                (a.flags |= 4),
              typeof l.getSnapshotBeforeUpdate != 'function' ||
                (r === e.memoizedProps && b === e.memoizedState) ||
                (a.flags |= 1024),
              (a.memoizedProps = s),
              (a.memoizedState = j)),
          (l.props = s),
          (l.state = j),
          (l.context = c),
          (s = v))
        : (typeof l.componentDidUpdate != 'function' ||
            (r === e.memoizedProps && b === e.memoizedState) ||
            (a.flags |= 4),
          typeof l.getSnapshotBeforeUpdate != 'function' ||
            (r === e.memoizedProps && b === e.memoizedState) ||
            (a.flags |= 1024),
          (s = !1));
    }
    return (
      (l = s),
      hl(e, a),
      (s = (a.flags & 128) !== 0),
      l || s
        ? ((l = a.stateNode),
          (n = s && typeof n.getDerivedStateFromError != 'function' ? null : l.render()),
          (a.flags |= 1),
          e !== null && s
            ? ((a.child = Tn(a, e.child, null, i)), (a.child = Tn(a, null, n, i)))
            : Fe(e, a, n, i),
          (a.memoizedState = l.state),
          (e = a.child))
        : (e = va(e, a, i)),
      e
    );
  }
  function Sh(e, a, n, s) {
    return (yn(), (a.flags |= 256), Fe(e, a, n, s), a.child);
  }
  var oo = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
  function co(e) {
    return { baseLanes: e, cachePool: fd() };
  }
  function ho(e, a, n) {
    return ((e = e !== null ? e.childLanes & ~n : 0), a && (e |= kt), e);
  }
  function kh(e, a, n) {
    var s = a.pendingProps,
      i = !1,
      l = (a.flags & 128) !== 0,
      r;
    if (
      ((r = l) || (r = e !== null && e.memoizedState === null ? !1 : (Ce.current & 2) !== 0),
      r && ((i = !0), (a.flags &= -129)),
      (r = (a.flags & 32) !== 0),
      (a.flags &= -33),
      e === null)
    ) {
      if (V) {
        if (
          (i ? Za(a) : Qa(),
          (e = be)
            ? ((e = Ru(e, Ht)),
              (e = e !== null && e.data !== '&' ? e : null),
              e !== null &&
                ((a.memoizedState = {
                  dehydrated: e,
                  treeContext: _a !== null ? { id: $t, overflow: Pt } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (n = id(e)),
                (n.return = a),
                (a.child = n),
                (Ke = a),
                (be = null)))
            : (e = null),
          e === null)
        )
          throw Ua(a);
        return (Xo(e) ? (a.lanes = 32) : (a.lanes = 536870912), null);
      }
      var o = s.children;
      return (
        (s = s.fallback),
        i
          ? (Qa(),
            (i = a.mode),
            (o = ul({ mode: 'hidden', children: o }, i)),
            (s = pn(s, i, n, null)),
            (o.return = a),
            (s.return = a),
            (o.sibling = s),
            (a.child = o),
            (s = a.child),
            (s.memoizedState = co(n)),
            (s.childLanes = ho(e, r, n)),
            (a.memoizedState = oo),
            Ks(null, s))
          : (Za(a), uo(a, o))
      );
    }
    var c = e.memoizedState;
    if (c !== null && ((o = c.dehydrated), o !== null)) {
      if (l)
        a.flags & 256
          ? (Za(a), (a.flags &= -257), (a = mo(e, a, n)))
          : a.memoizedState !== null
            ? (Qa(), (a.child = e.child), (a.flags |= 128), (a = null))
            : (Qa(),
              (o = s.fallback),
              (i = a.mode),
              (s = ul({ mode: 'visible', children: s.children }, i)),
              (o = pn(o, i, n, null)),
              (o.flags |= 2),
              (s.return = a),
              (o.return = a),
              (s.sibling = o),
              (a.child = s),
              Tn(a, e.child, null, n),
              (s = a.child),
              (s.memoizedState = co(n)),
              (s.childLanes = ho(e, r, n)),
              (a.memoizedState = oo),
              (a = Ks(null, s)));
      else if ((Za(a), Xo(o))) {
        if (((r = o.nextSibling && o.nextSibling.dataset), r)) var y = r.dgst;
        ((r = y),
          (s = Error(u(419))),
          (s.stack = ''),
          (s.digest = r),
          Hs({ value: s, source: null, stack: null }),
          (a = mo(e, a, n)));
      } else if ((He || Xn(e, a, n, !1), (r = (n & e.childLanes) !== 0), He || r)) {
        if (((r = ge), r !== null && ((s = ki(r, n)), s !== 0 && s !== c.retryLane)))
          throw ((c.retryLane = s), xn(e, s), gt(r, e, s), lo);
        (Qo(o) || vl(), (a = mo(e, a, n)));
      } else
        Qo(o)
          ? ((a.flags |= 192), (a.child = e.child), (a = null))
          : ((e = c.treeContext),
            (be = Bt(o.nextSibling)),
            (Ke = a),
            (V = !0),
            (Ba = null),
            (Ht = !1),
            e !== null && od(a, e),
            (a = uo(a, s.children)),
            (a.flags |= 4096));
      return a;
    }
    return i
      ? (Qa(),
        (o = s.fallback),
        (i = a.mode),
        (c = e.child),
        (y = c.sibling),
        (s = ga(c, { mode: 'hidden', children: s.children })),
        (s.subtreeFlags = c.subtreeFlags & 65011712),
        y !== null ? (o = ga(y, o)) : ((o = pn(o, i, n, null)), (o.flags |= 2)),
        (o.return = a),
        (s.return = a),
        (s.sibling = o),
        (a.child = s),
        Ks(null, s),
        (s = a.child),
        (o = e.child.memoizedState),
        o === null
          ? (o = co(n))
          : ((i = o.cachePool),
            i !== null
              ? ((c = Le._currentValue), (i = i.parent !== c ? { parent: c, pool: c } : i))
              : (i = fd()),
            (o = { baseLanes: o.baseLanes | n, cachePool: i })),
        (s.memoizedState = o),
        (s.childLanes = ho(e, r, n)),
        (a.memoizedState = oo),
        Ks(e.child, s))
      : (Za(a),
        (n = e.child),
        (e = n.sibling),
        (n = ga(n, { mode: 'visible', children: s.children })),
        (n.return = a),
        (n.sibling = null),
        e !== null &&
          ((r = a.deletions), r === null ? ((a.deletions = [e]), (a.flags |= 16)) : r.push(e)),
        (a.child = n),
        (a.memoizedState = null),
        n);
  }
  function uo(e, a) {
    return ((a = ul({ mode: 'visible', children: a }, e.mode)), (a.return = e), (e.child = a));
  }
  function ul(e, a) {
    return ((e = wt(22, e, null, a)), (e.lanes = 0), e);
  }
  function mo(e, a, n) {
    return (
      Tn(a, e.child, null, n),
      (e = uo(a, a.pendingProps.children)),
      (e.flags |= 2),
      (a.memoizedState = null),
      e
    );
  }
  function Ah(e, a, n) {
    e.lanes |= a;
    var s = e.alternate;
    (s !== null && (s.lanes |= a), Ar(e.return, a, n));
  }
  function fo(e, a, n, s, i, l) {
    var r = e.memoizedState;
    r === null
      ? (e.memoizedState = {
          isBackwards: a,
          rendering: null,
          renderingStartTime: 0,
          last: s,
          tail: n,
          tailMode: i,
          treeForkCount: l,
        })
      : ((r.isBackwards = a),
        (r.rendering = null),
        (r.renderingStartTime = 0),
        (r.last = s),
        (r.tail = n),
        (r.tailMode = i),
        (r.treeForkCount = l));
  }
  function Eh(e, a, n) {
    var s = a.pendingProps,
      i = s.revealOrder,
      l = s.tail;
    s = s.children;
    var r = Ce.current,
      o = (r & 2) !== 0;
    if (
      (o ? ((r = (r & 1) | 2), (a.flags |= 128)) : (r &= 1),
      H(Ce, r),
      Fe(e, a, s, n),
      (s = V ? Os : 0),
      !o && e !== null && (e.flags & 128) !== 0)
    )
      e: for (e = a.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Ah(e, n, a);
        else if (e.tag === 19) Ah(e, n, a);
        else if (e.child !== null) {
          ((e.child.return = e), (e = e.child));
          continue;
        }
        if (e === a) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === a) break e;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    switch (i) {
      case 'forwards':
        for (n = a.child, i = null; n !== null; )
          ((e = n.alternate), e !== null && el(e) === null && (i = n), (n = n.sibling));
        ((n = i),
          n === null ? ((i = a.child), (a.child = null)) : ((i = n.sibling), (n.sibling = null)),
          fo(a, !1, i, n, l, s));
        break;
      case 'backwards':
      case 'unstable_legacy-backwards':
        for (n = null, i = a.child, a.child = null; i !== null; ) {
          if (((e = i.alternate), e !== null && el(e) === null)) {
            a.child = i;
            break;
          }
          ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
        }
        fo(a, !0, n, null, l, s);
        break;
      case 'together':
        fo(a, !1, null, null, void 0, s);
        break;
      default:
        a.memoizedState = null;
    }
    return a.child;
  }
  function va(e, a, n) {
    if (
      (e !== null && (a.dependencies = e.dependencies), (Ka |= a.lanes), (n & a.childLanes) === 0)
    )
      if (e !== null) {
        if ((Xn(e, a, n, !1), (n & a.childLanes) === 0)) return null;
      } else return null;
    if (e !== null && a.child !== e.child) throw Error(u(153));
    if (a.child !== null) {
      for (e = a.child, n = ga(e, e.pendingProps), a.child = n, n.return = a; e.sibling !== null; )
        ((e = e.sibling), (n = n.sibling = ga(e, e.pendingProps)), (n.return = a));
      n.sibling = null;
    }
    return a.child;
  }
  function go(e, a) {
    return (e.lanes & a) !== 0 ? !0 : ((e = e.dependencies), !!(e !== null && Qi(e)));
  }
  function Of(e, a, n) {
    switch (a.tag) {
      case 3:
        (Wt(a, a.stateNode.containerInfo), qa(a, Le, e.memoizedState.cache), yn());
        break;
      case 27:
      case 5:
        on(a);
        break;
      case 4:
        Wt(a, a.stateNode.containerInfo);
        break;
      case 10:
        qa(a, a.type, a.memoizedProps.value);
        break;
      case 31:
        if (a.memoizedState !== null) return ((a.flags |= 128), Br(a), null);
        break;
      case 13:
        var s = a.memoizedState;
        if (s !== null)
          return s.dehydrated !== null
            ? (Za(a), (a.flags |= 128), null)
            : (n & a.child.childLanes) !== 0
              ? kh(e, a, n)
              : (Za(a), (e = va(e, a, n)), e !== null ? e.sibling : null);
        Za(a);
        break;
      case 19:
        var i = (e.flags & 128) !== 0;
        if (
          ((s = (n & a.childLanes) !== 0),
          s || (Xn(e, a, n, !1), (s = (n & a.childLanes) !== 0)),
          i)
        ) {
          if (s) return Eh(e, a, n);
          a.flags |= 128;
        }
        if (
          ((i = a.memoizedState),
          i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
          H(Ce, Ce.current),
          s)
        )
          break;
        return null;
      case 22:
        return ((a.lanes = 0), jh(e, a, n, a.pendingProps));
      case 24:
        qa(a, Le, e.memoizedState.cache);
    }
    return va(e, a, n);
  }
  function Ch(e, a, n) {
    if (e !== null)
      if (e.memoizedProps !== a.pendingProps) He = !0;
      else {
        if (!go(e, n) && (a.flags & 128) === 0) return ((He = !1), Of(e, a, n));
        He = (e.flags & 131072) !== 0;
      }
    else ((He = !1), V && (a.flags & 1048576) !== 0 && rd(a, Os, a.index));
    switch (((a.lanes = 0), a.tag)) {
      case 16:
        e: {
          var s = a.pendingProps;
          if (((e = wn(a.elementType)), (a.type = e), typeof e == 'function'))
            br(e)
              ? ((s = kn(e, s)), (a.tag = 1), (a = Th(null, a, e, s, n)))
              : ((a.tag = 0), (a = ro(null, a, e, s, n)));
          else {
            if (e != null) {
              var i = e.$$typeof;
              if (i === K) {
                ((a.tag = 11), (a = ph(null, a, e, s, n)));
                break e;
              } else if (i === lt) {
                ((a.tag = 14), (a = yh(null, a, e, s, n)));
                break e;
              }
            }
            throw ((a = na(e) || e), Error(u(306, a, '')));
          }
        }
        return a;
      case 0:
        return ro(e, a, a.type, a.pendingProps, n);
      case 1:
        return ((s = a.type), (i = kn(s, a.pendingProps)), Th(e, a, s, i, n));
      case 3:
        e: {
          if ((Wt(a, a.stateNode.containerInfo), e === null)) throw Error(u(387));
          s = a.pendingProps;
          var l = a.memoizedState;
          ((i = l.element), Rr(e, a), Gs(a, s, null, n));
          var r = a.memoizedState;
          if (
            ((s = r.cache),
            qa(a, Le, s),
            s !== l.cache && Er(a, [Le], n, !0),
            Ws(),
            (s = r.element),
            l.isDehydrated)
          )
            if (
              ((l = { element: s, isDehydrated: !1, cache: r.cache }),
              (a.updateQueue.baseState = l),
              (a.memoizedState = l),
              a.flags & 256)
            ) {
              a = Sh(e, a, s, n);
              break e;
            } else if (s !== i) {
              ((i = Rt(Error(u(424)), a)), Hs(i), (a = Sh(e, a, s, n)));
              break e;
            } else
              for (
                e = a.stateNode.containerInfo,
                  e.nodeType === 9
                    ? (e = e.body)
                    : (e = e.nodeName === 'HTML' ? e.ownerDocument.body : e),
                  be = Bt(e.firstChild),
                  Ke = a,
                  V = !0,
                  Ba = null,
                  Ht = !0,
                  n = jd(a, null, s, n),
                  a.child = n;
                n;
              )
                ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
          else {
            if ((yn(), s === i)) {
              a = va(e, a, n);
              break e;
            }
            Fe(e, a, s, n);
          }
          a = a.child;
        }
        return a;
      case 26:
        return (
          hl(e, a),
          e === null
            ? (n = Uu(a.type, null, a.pendingProps, null))
              ? (a.memoizedState = n)
              : V ||
                ((n = a.type),
                (e = a.pendingProps),
                (s = El(rt.current).createElement(n)),
                (s[Re] = a),
                (s[ve] = e),
                $e(s, n, e),
                U(s),
                (a.stateNode = s))
            : (a.memoizedState = Uu(a.type, e.memoizedProps, a.pendingProps, e.memoizedState)),
          null
        );
      case 27:
        return (
          on(a),
          e === null &&
            V &&
            ((s = a.stateNode = Hu(a.type, a.pendingProps, rt.current)),
            (Ke = a),
            (Ht = !0),
            (i = be),
            en(a.type) ? ((Vo = i), (be = Bt(s.firstChild))) : (be = i)),
          Fe(e, a, a.pendingProps.children, n),
          hl(e, a),
          e === null && (a.flags |= 4194304),
          a.child
        );
      case 5:
        return (
          e === null &&
            V &&
            ((i = s = be) &&
              ((s = ug(s, a.type, a.pendingProps, Ht)),
              s !== null
                ? ((a.stateNode = s), (Ke = a), (be = Bt(s.firstChild)), (Ht = !1), (i = !0))
                : (i = !1)),
            i || Ua(a)),
          on(a),
          (i = a.type),
          (l = a.pendingProps),
          (r = e !== null ? e.memoizedProps : null),
          (s = l.children),
          Wo(i, l) ? (s = null) : r !== null && Wo(i, r) && (a.flags |= 32),
          a.memoizedState !== null && ((i = qr(e, a, Af, null, null, n)), (di._currentValue = i)),
          hl(e, a),
          Fe(e, a, s, n),
          a.child
        );
      case 6:
        return (
          e === null &&
            V &&
            ((e = n = be) &&
              ((n = mg(n, a.pendingProps, Ht)),
              n !== null ? ((a.stateNode = n), (Ke = a), (be = null), (e = !0)) : (e = !1)),
            e || Ua(a)),
          null
        );
      case 13:
        return kh(e, a, n);
      case 4:
        return (
          Wt(a, a.stateNode.containerInfo),
          (s = a.pendingProps),
          e === null ? (a.child = Tn(a, null, s, n)) : Fe(e, a, s, n),
          a.child
        );
      case 11:
        return ph(e, a, a.type, a.pendingProps, n);
      case 7:
        return (Fe(e, a, a.pendingProps, n), a.child);
      case 8:
        return (Fe(e, a, a.pendingProps.children, n), a.child);
      case 12:
        return (Fe(e, a, a.pendingProps.children, n), a.child);
      case 10:
        return ((s = a.pendingProps), qa(a, a.type, s.value), Fe(e, a, s.children, n), a.child);
      case 9:
        return (
          (i = a.type._context),
          (s = a.pendingProps.children),
          jn(a),
          (i = Je(i)),
          (s = s(i)),
          (a.flags |= 1),
          Fe(e, a, s, n),
          a.child
        );
      case 14:
        return yh(e, a, a.type, a.pendingProps, n);
      case 15:
        return bh(e, a, a.type, a.pendingProps, n);
      case 19:
        return Eh(e, a, n);
      case 31:
        return Lf(e, a, n);
      case 22:
        return jh(e, a, n, a.pendingProps);
      case 24:
        return (
          jn(a),
          (s = Je(Le)),
          e === null
            ? ((i = Mr()),
              i === null &&
                ((i = ge),
                (l = Cr()),
                (i.pooledCache = l),
                l.refCount++,
                l !== null && (i.pooledCacheLanes |= n),
                (i = l)),
              (a.memoizedState = { parent: s, cache: i }),
              Yr(a),
              qa(a, Le, i))
            : ((e.lanes & n) !== 0 && (Rr(e, a), Gs(a, null, null, n), Ws()),
              (i = e.memoizedState),
              (l = a.memoizedState),
              i.parent !== s
                ? ((i = { parent: s, cache: s }),
                  (a.memoizedState = i),
                  a.lanes === 0 && (a.memoizedState = a.updateQueue.baseState = i),
                  qa(a, Le, s))
                : ((s = l.cache), qa(a, Le, s), s !== i.cache && Er(a, [Le], n, !0))),
          Fe(e, a, a.pendingProps.children, n),
          a.child
        );
      case 29:
        throw a.pendingProps;
    }
    throw Error(u(156, a.tag));
  }
  function wa(e) {
    e.flags |= 4;
  }
  function xo(e, a, n, s, i) {
    if (((a = (e.mode & 32) !== 0) && (a = !1), a)) {
      if (((e.flags |= 16777216), (i & 335544128) === i))
        if (e.stateNode.complete) e.flags |= 8192;
        else if (au()) e.flags |= 8192;
        else throw ((Nn = Ji), Dr);
    } else e.flags &= -16777217;
  }
  function zh(e, a) {
    if (a.type !== 'stylesheet' || (a.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (((e.flags |= 16777216), !Zu(a)))
      if (au()) e.flags |= 8192;
      else throw ((Nn = Ji), Dr);
  }
  function ml(e, a) {
    (a !== null && (e.flags |= 4),
      e.flags & 16384 && ((a = e.tag !== 22 ? da() : 536870912), (e.lanes |= a), (is |= a)));
  }
  function Js(e, a) {
    if (!V)
      switch (e.tailMode) {
        case 'hidden':
          a = e.tail;
          for (var n = null; a !== null; ) (a.alternate !== null && (n = a), (a = a.sibling));
          n === null ? (e.tail = null) : (n.sibling = null);
          break;
        case 'collapsed':
          n = e.tail;
          for (var s = null; n !== null; ) (n.alternate !== null && (s = n), (n = n.sibling));
          s === null
            ? a || e.tail === null
              ? (e.tail = null)
              : (e.tail.sibling = null)
            : (s.sibling = null);
      }
  }
  function je(e) {
    var a = e.alternate !== null && e.alternate.child === e.child,
      n = 0,
      s = 0;
    if (a)
      for (var i = e.child; i !== null; )
        ((n |= i.lanes | i.childLanes),
          (s |= i.subtreeFlags & 65011712),
          (s |= i.flags & 65011712),
          (i.return = e),
          (i = i.sibling));
    else
      for (i = e.child; i !== null; )
        ((n |= i.lanes | i.childLanes),
          (s |= i.subtreeFlags),
          (s |= i.flags),
          (i.return = e),
          (i = i.sibling));
    return ((e.subtreeFlags |= s), (e.childLanes = n), a);
  }
  function Hf(e, a, n) {
    var s = a.pendingProps;
    switch ((Nr(a), a.tag)) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return (je(a), null);
      case 1:
        return (je(a), null);
      case 3:
        return (
          (n = a.stateNode),
          (s = null),
          e !== null && (s = e.memoizedState.cache),
          a.memoizedState.cache !== s && (a.flags |= 2048),
          ya(Le),
          sa(),
          n.pendingContext && ((n.context = n.pendingContext), (n.pendingContext = null)),
          (e === null || e.child === null) &&
            (Qn(a)
              ? wa(a)
              : e === null ||
                (e.memoizedState.isDehydrated && (a.flags & 256) === 0) ||
                ((a.flags |= 1024), Sr())),
          je(a),
          null
        );
      case 26:
        var i = a.type,
          l = a.memoizedState;
        return (
          e === null
            ? (wa(a), l !== null ? (je(a), zh(a, l)) : (je(a), xo(a, i, null, s, n)))
            : l
              ? l !== e.memoizedState
                ? (wa(a), je(a), zh(a, l))
                : (je(a), (a.flags &= -16777217))
              : ((e = e.memoizedProps), e !== s && wa(a), je(a), xo(a, i, e, s, n)),
          null
        );
      case 27:
        if ((cn(a), (n = rt.current), (i = a.type), e !== null && a.stateNode != null))
          e.memoizedProps !== s && wa(a);
        else {
          if (!s) {
            if (a.stateNode === null) throw Error(u(166));
            return (je(a), null);
          }
          ((e = Ae.current), Qn(a) ? cd(a) : ((e = Hu(i, s, n)), (a.stateNode = e), wa(a)));
        }
        return (je(a), null);
      case 5:
        if ((cn(a), (i = a.type), e !== null && a.stateNode != null))
          e.memoizedProps !== s && wa(a);
        else {
          if (!s) {
            if (a.stateNode === null) throw Error(u(166));
            return (je(a), null);
          }
          if (((l = Ae.current), Qn(a))) cd(a);
          else {
            var r = El(rt.current);
            switch (l) {
              case 1:
                l = r.createElementNS('http://www.w3.org/2000/svg', i);
                break;
              case 2:
                l = r.createElementNS('http://www.w3.org/1998/Math/MathML', i);
                break;
              default:
                switch (i) {
                  case 'svg':
                    l = r.createElementNS('http://www.w3.org/2000/svg', i);
                    break;
                  case 'math':
                    l = r.createElementNS('http://www.w3.org/1998/Math/MathML', i);
                    break;
                  case 'script':
                    ((l = r.createElement('div')),
                      (l.innerHTML = '<script><\/script>'),
                      (l = l.removeChild(l.firstChild)));
                    break;
                  case 'select':
                    ((l =
                      typeof s.is == 'string'
                        ? r.createElement('select', { is: s.is })
                        : r.createElement('select')),
                      s.multiple ? (l.multiple = !0) : s.size && (l.size = s.size));
                    break;
                  default:
                    l =
                      typeof s.is == 'string'
                        ? r.createElement(i, { is: s.is })
                        : r.createElement(i);
                }
            }
            ((l[Re] = a), (l[ve] = s));
            e: for (r = a.child; r !== null; ) {
              if (r.tag === 5 || r.tag === 6) l.appendChild(r.stateNode);
              else if (r.tag !== 4 && r.tag !== 27 && r.child !== null) {
                ((r.child.return = r), (r = r.child));
                continue;
              }
              if (r === a) break e;
              for (; r.sibling === null; ) {
                if (r.return === null || r.return === a) break e;
                r = r.return;
              }
              ((r.sibling.return = r.return), (r = r.sibling));
            }
            a.stateNode = l;
            e: switch (($e(l, i, s), i)) {
              case 'button':
              case 'input':
              case 'select':
              case 'textarea':
                s = !!s.autoFocus;
                break e;
              case 'img':
                s = !0;
                break e;
              default:
                s = !1;
            }
            s && wa(a);
          }
        }
        return (je(a), xo(a, a.type, e === null ? null : e.memoizedProps, a.pendingProps, n), null);
      case 6:
        if (e && a.stateNode != null) e.memoizedProps !== s && wa(a);
        else {
          if (typeof s != 'string' && a.stateNode === null) throw Error(u(166));
          if (((e = rt.current), Qn(a))) {
            if (((e = a.stateNode), (n = a.memoizedProps), (s = null), (i = Ke), i !== null))
              switch (i.tag) {
                case 27:
                case 5:
                  s = i.memoizedProps;
              }
            ((e[Re] = a),
              (e = !!(
                e.nodeValue === n ||
                (s !== null && s.suppressHydrationWarning === !0) ||
                ku(e.nodeValue, n)
              )),
              e || Ua(a, !0));
          } else ((e = El(e).createTextNode(s)), (e[Re] = a), (a.stateNode = e));
        }
        return (je(a), null);
      case 31:
        if (((n = a.memoizedState), e === null || e.memoizedState !== null)) {
          if (((s = Qn(a)), n !== null)) {
            if (e === null) {
              if (!s) throw Error(u(318));
              if (((e = a.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
                throw Error(u(557));
              e[Re] = a;
            } else (yn(), (a.flags & 128) === 0 && (a.memoizedState = null), (a.flags |= 4));
            (je(a), (e = !1));
          } else
            ((n = Sr()),
              e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
              (e = !0));
          if (!e) return a.flags & 256 ? (Tt(a), a) : (Tt(a), null);
          if ((a.flags & 128) !== 0) throw Error(u(558));
        }
        return (je(a), null);
      case 13:
        if (
          ((s = a.memoizedState),
          e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
        ) {
          if (((i = Qn(a)), s !== null && s.dehydrated !== null)) {
            if (e === null) {
              if (!i) throw Error(u(318));
              if (((i = a.memoizedState), (i = i !== null ? i.dehydrated : null), !i))
                throw Error(u(317));
              i[Re] = a;
            } else (yn(), (a.flags & 128) === 0 && (a.memoizedState = null), (a.flags |= 4));
            (je(a), (i = !1));
          } else
            ((i = Sr()),
              e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i),
              (i = !0));
          if (!i) return a.flags & 256 ? (Tt(a), a) : (Tt(a), null);
        }
        return (
          Tt(a),
          (a.flags & 128) !== 0
            ? ((a.lanes = n), a)
            : ((n = s !== null),
              (e = e !== null && e.memoizedState !== null),
              n &&
                ((s = a.child),
                (i = null),
                s.alternate !== null &&
                  s.alternate.memoizedState !== null &&
                  s.alternate.memoizedState.cachePool !== null &&
                  (i = s.alternate.memoizedState.cachePool.pool),
                (l = null),
                s.memoizedState !== null &&
                  s.memoizedState.cachePool !== null &&
                  (l = s.memoizedState.cachePool.pool),
                l !== i && (s.flags |= 2048)),
              n !== e && n && (a.child.flags |= 8192),
              ml(a, a.updateQueue),
              je(a),
              null)
        );
      case 4:
        return (sa(), e === null && _o(a.stateNode.containerInfo), je(a), null);
      case 10:
        return (ya(a.type), je(a), null);
      case 19:
        if ((ye(Ce), (s = a.memoizedState), s === null)) return (je(a), null);
        if (((i = (a.flags & 128) !== 0), (l = s.rendering), l === null))
          if (i) Js(s, !1);
          else {
            if (ke !== 0 || (e !== null && (e.flags & 128) !== 0))
              for (e = a.child; e !== null; ) {
                if (((l = el(e)), l !== null)) {
                  for (
                    a.flags |= 128,
                      Js(s, !1),
                      e = l.updateQueue,
                      a.updateQueue = e,
                      ml(a, e),
                      a.subtreeFlags = 0,
                      e = n,
                      n = a.child;
                    n !== null;
                  )
                    (sd(n, e), (n = n.sibling));
                  return (H(Ce, (Ce.current & 1) | 2), V && xa(a, s.treeForkCount), a.child);
                }
                e = e.sibling;
              }
            s.tail !== null &&
              Xe() > yl &&
              ((a.flags |= 128), (i = !0), Js(s, !1), (a.lanes = 4194304));
          }
        else {
          if (!i)
            if (((e = el(l)), e !== null)) {
              if (
                ((a.flags |= 128),
                (i = !0),
                (e = e.updateQueue),
                (a.updateQueue = e),
                ml(a, e),
                Js(s, !0),
                s.tail === null && s.tailMode === 'hidden' && !l.alternate && !V)
              )
                return (je(a), null);
            } else
              2 * Xe() - s.renderingStartTime > yl &&
                n !== 536870912 &&
                ((a.flags |= 128), (i = !0), Js(s, !1), (a.lanes = 4194304));
          s.isBackwards
            ? ((l.sibling = a.child), (a.child = l))
            : ((e = s.last), e !== null ? (e.sibling = l) : (a.child = l), (s.last = l));
        }
        return s.tail !== null
          ? ((e = s.tail),
            (s.rendering = e),
            (s.tail = e.sibling),
            (s.renderingStartTime = Xe()),
            (e.sibling = null),
            (n = Ce.current),
            H(Ce, i ? (n & 1) | 2 : n & 1),
            V && xa(a, s.treeForkCount),
            e)
          : (je(a), null);
      case 22:
      case 23:
        return (
          Tt(a),
          _r(),
          (s = a.memoizedState !== null),
          e !== null
            ? (e.memoizedState !== null) !== s && (a.flags |= 8192)
            : s && (a.flags |= 8192),
          s
            ? (n & 536870912) !== 0 &&
              (a.flags & 128) === 0 &&
              (je(a), a.subtreeFlags & 6 && (a.flags |= 8192))
            : je(a),
          (n = a.updateQueue),
          n !== null && ml(a, n.retryQueue),
          (n = null),
          e !== null &&
            e.memoizedState !== null &&
            e.memoizedState.cachePool !== null &&
            (n = e.memoizedState.cachePool.pool),
          (s = null),
          a.memoizedState !== null &&
            a.memoizedState.cachePool !== null &&
            (s = a.memoizedState.cachePool.pool),
          s !== n && (a.flags |= 2048),
          e !== null && ye(vn),
          null
        );
      case 24:
        return (
          (n = null),
          e !== null && (n = e.memoizedState.cache),
          a.memoizedState.cache !== n && (a.flags |= 2048),
          ya(Le),
          je(a),
          null
        );
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(u(156, a.tag));
  }
  function _f(e, a) {
    switch ((Nr(a), a.tag)) {
      case 1:
        return ((e = a.flags), e & 65536 ? ((a.flags = (e & -65537) | 128), a) : null);
      case 3:
        return (
          ya(Le),
          sa(),
          (e = a.flags),
          (e & 65536) !== 0 && (e & 128) === 0 ? ((a.flags = (e & -65537) | 128), a) : null
        );
      case 26:
      case 27:
      case 5:
        return (cn(a), null);
      case 31:
        if (a.memoizedState !== null) {
          if ((Tt(a), a.alternate === null)) throw Error(u(340));
          yn();
        }
        return ((e = a.flags), e & 65536 ? ((a.flags = (e & -65537) | 128), a) : null);
      case 13:
        if ((Tt(a), (e = a.memoizedState), e !== null && e.dehydrated !== null)) {
          if (a.alternate === null) throw Error(u(340));
          yn();
        }
        return ((e = a.flags), e & 65536 ? ((a.flags = (e & -65537) | 128), a) : null);
      case 19:
        return (ye(Ce), null);
      case 4:
        return (sa(), null);
      case 10:
        return (ya(a.type), null);
      case 22:
      case 23:
        return (
          Tt(a),
          _r(),
          e !== null && ye(vn),
          (e = a.flags),
          e & 65536 ? ((a.flags = (e & -65537) | 128), a) : null
        );
      case 24:
        return (ya(Le), null);
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Mh(e, a) {
    switch ((Nr(a), a.tag)) {
      case 3:
        (ya(Le), sa());
        break;
      case 26:
      case 27:
      case 5:
        cn(a);
        break;
      case 4:
        sa();
        break;
      case 31:
        a.memoizedState !== null && Tt(a);
        break;
      case 13:
        Tt(a);
        break;
      case 19:
        ye(Ce);
        break;
      case 10:
        ya(a.type);
        break;
      case 22:
      case 23:
        (Tt(a), _r(), e !== null && ye(vn));
        break;
      case 24:
        ya(Le);
    }
  }
  function Fs(e, a) {
    try {
      var n = a.updateQueue,
        s = n !== null ? n.lastEffect : null;
      if (s !== null) {
        var i = s.next;
        n = i;
        do {
          if ((n.tag & e) === e) {
            s = void 0;
            var l = n.create,
              r = n.inst;
            ((s = l()), (r.destroy = s));
          }
          n = n.next;
        } while (n !== i);
      }
    } catch (o) {
      re(a, a.return, o);
    }
  }
  function Xa(e, a, n) {
    try {
      var s = a.updateQueue,
        i = s !== null ? s.lastEffect : null;
      if (i !== null) {
        var l = i.next;
        s = l;
        do {
          if ((s.tag & e) === e) {
            var r = s.inst,
              o = r.destroy;
            if (o !== void 0) {
              ((r.destroy = void 0), (i = a));
              var c = n,
                y = o;
              try {
                y();
              } catch (v) {
                re(i, c, v);
              }
            }
          }
          s = s.next;
        } while (s !== l);
      }
    } catch (v) {
      re(a, a.return, v);
    }
  }
  function Dh(e) {
    var a = e.updateQueue;
    if (a !== null) {
      var n = e.stateNode;
      try {
        wd(a, n);
      } catch (s) {
        re(e, e.return, s);
      }
    }
  }
  function Yh(e, a, n) {
    ((n.props = kn(e.type, e.memoizedProps)), (n.state = e.memoizedState));
    try {
      n.componentWillUnmount();
    } catch (s) {
      re(e, a, s);
    }
  }
  function $s(e, a) {
    try {
      var n = e.ref;
      if (n !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var s = e.stateNode;
            break;
          case 30:
            s = e.stateNode;
            break;
          default:
            s = e.stateNode;
        }
        typeof n == 'function' ? (e.refCleanup = n(s)) : (n.current = s);
      }
    } catch (i) {
      re(e, a, i);
    }
  }
  function ea(e, a) {
    var n = e.ref,
      s = e.refCleanup;
    if (n !== null)
      if (typeof s == 'function')
        try {
          s();
        } catch (i) {
          re(e, a, i);
        } finally {
          ((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null));
        }
      else if (typeof n == 'function')
        try {
          n(null);
        } catch (i) {
          re(e, a, i);
        }
      else n.current = null;
  }
  function Rh(e) {
    var a = e.type,
      n = e.memoizedProps,
      s = e.stateNode;
    try {
      e: switch (a) {
        case 'button':
        case 'input':
        case 'select':
        case 'textarea':
          n.autoFocus && s.focus();
          break e;
        case 'img':
          n.src ? (s.src = n.src) : n.srcSet && (s.srcset = n.srcSet);
      }
    } catch (i) {
      re(e, e.return, i);
    }
  }
  function po(e, a, n) {
    try {
      var s = e.stateNode;
      (lg(s, e.type, n, a), (s[ve] = a));
    } catch (i) {
      re(e, e.return, i);
    }
  }
  function Lh(e) {
    return (
      e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && en(e.type)) || e.tag === 4
    );
  }
  function yo(e) {
    e: for (;;) {
      for (; e.sibling === null; ) {
        if (e.return === null || Lh(e.return)) return null;
        e = e.return;
      }
      for (
        e.sibling.return = e.return, e = e.sibling;
        e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
      ) {
        if ((e.tag === 27 && en(e.type)) || e.flags & 2 || e.child === null || e.tag === 4)
          continue e;
        ((e.child.return = e), (e = e.child));
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function bo(e, a, n) {
    var s = e.tag;
    if (s === 5 || s === 6)
      ((e = e.stateNode),
        a
          ? (n.nodeType === 9
              ? n.body
              : n.nodeName === 'HTML'
                ? n.ownerDocument.body
                : n
            ).insertBefore(e, a)
          : ((a = n.nodeType === 9 ? n.body : n.nodeName === 'HTML' ? n.ownerDocument.body : n),
            a.appendChild(e),
            (n = n._reactRootContainer),
            n != null || a.onclick !== null || (a.onclick = ma)));
    else if (
      s !== 4 &&
      (s === 27 && en(e.type) && ((n = e.stateNode), (a = null)), (e = e.child), e !== null)
    )
      for (bo(e, a, n), e = e.sibling; e !== null; ) (bo(e, a, n), (e = e.sibling));
  }
  function fl(e, a, n) {
    var s = e.tag;
    if (s === 5 || s === 6) ((e = e.stateNode), a ? n.insertBefore(e, a) : n.appendChild(e));
    else if (s !== 4 && (s === 27 && en(e.type) && (n = e.stateNode), (e = e.child), e !== null))
      for (fl(e, a, n), e = e.sibling; e !== null; ) (fl(e, a, n), (e = e.sibling));
  }
  function Oh(e) {
    var a = e.stateNode,
      n = e.memoizedProps;
    try {
      for (var s = e.type, i = a.attributes; i.length; ) a.removeAttributeNode(i[0]);
      ($e(a, s, n), (a[Re] = e), (a[ve] = n));
    } catch (l) {
      re(e, e.return, l);
    }
  }
  var Na = !1,
    _e = !1,
    jo = !1,
    Hh = typeof WeakSet == 'function' ? WeakSet : Set,
    Ze = null;
  function Bf(e, a) {
    if (((e = e.containerInfo), (qo = Ll), (e = Kc(e)), ur(e))) {
      if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd };
      else
        e: {
          n = ((n = e.ownerDocument) && n.defaultView) || window;
          var s = n.getSelection && n.getSelection();
          if (s && s.rangeCount !== 0) {
            n = s.anchorNode;
            var i = s.anchorOffset,
              l = s.focusNode;
            s = s.focusOffset;
            try {
              (n.nodeType, l.nodeType);
            } catch {
              n = null;
              break e;
            }
            var r = 0,
              o = -1,
              c = -1,
              y = 0,
              v = 0,
              T = e,
              b = null;
            t: for (;;) {
              for (
                var j;
                T !== n || (i !== 0 && T.nodeType !== 3) || (o = r + i),
                  T !== l || (s !== 0 && T.nodeType !== 3) || (c = r + s),
                  T.nodeType === 3 && (r += T.nodeValue.length),
                  (j = T.firstChild) !== null;
              )
                ((b = T), (T = j));
              for (;;) {
                if (T === e) break t;
                if (
                  (b === n && ++y === i && (o = r),
                  b === l && ++v === s && (c = r),
                  (j = T.nextSibling) !== null)
                )
                  break;
                ((T = b), (b = T.parentNode));
              }
              T = j;
            }
            n = o === -1 || c === -1 ? null : { start: o, end: c };
          } else n = null;
        }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (Io = { focusedElem: e, selectionRange: n }, Ll = !1, Ze = a; Ze !== null; )
      if (((a = Ze), (e = a.child), (a.subtreeFlags & 1028) !== 0 && e !== null))
        ((e.return = a), (Ze = e));
      else
        for (; Ze !== null; ) {
          switch (((a = Ze), (l = a.alternate), (e = a.flags), a.tag)) {
            case 0:
              if (
                (e & 4) !== 0 &&
                ((e = a.updateQueue), (e = e !== null ? e.events : null), e !== null)
              )
                for (n = 0; n < e.length; n++) ((i = e[n]), (i.ref.impl = i.nextImpl));
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((e & 1024) !== 0 && l !== null) {
                ((e = void 0),
                  (n = a),
                  (i = l.memoizedProps),
                  (l = l.memoizedState),
                  (s = n.stateNode));
                try {
                  var C = kn(n.type, i);
                  ((e = s.getSnapshotBeforeUpdate(C, l)),
                    (s.__reactInternalSnapshotBeforeUpdate = e));
                } catch (R) {
                  re(n, n.return, R);
                }
              }
              break;
            case 3:
              if ((e & 1024) !== 0) {
                if (((e = a.stateNode.containerInfo), (n = e.nodeType), n === 9)) Zo(e);
                else if (n === 1)
                  switch (e.nodeName) {
                    case 'HEAD':
                    case 'HTML':
                    case 'BODY':
                      Zo(e);
                      break;
                    default:
                      e.textContent = '';
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((e & 1024) !== 0) throw Error(u(163));
          }
          if (((e = a.sibling), e !== null)) {
            ((e.return = a.return), (Ze = e));
            break;
          }
          Ze = a.return;
        }
  }
  function _h(e, a, n) {
    var s = n.flags;
    switch (n.tag) {
      case 0:
      case 11:
      case 15:
        (Sa(e, n), s & 4 && Fs(5, n));
        break;
      case 1:
        if ((Sa(e, n), s & 4))
          if (((e = n.stateNode), a === null))
            try {
              e.componentDidMount();
            } catch (r) {
              re(n, n.return, r);
            }
          else {
            var i = kn(n.type, a.memoizedProps);
            a = a.memoizedState;
            try {
              e.componentDidUpdate(i, a, e.__reactInternalSnapshotBeforeUpdate);
            } catch (r) {
              re(n, n.return, r);
            }
          }
        (s & 64 && Dh(n), s & 512 && $s(n, n.return));
        break;
      case 3:
        if ((Sa(e, n), s & 64 && ((e = n.updateQueue), e !== null))) {
          if (((a = null), n.child !== null))
            switch (n.child.tag) {
              case 27:
              case 5:
                a = n.child.stateNode;
                break;
              case 1:
                a = n.child.stateNode;
            }
          try {
            wd(e, a);
          } catch (r) {
            re(n, n.return, r);
          }
        }
        break;
      case 27:
        a === null && s & 4 && Oh(n);
      case 26:
      case 5:
        (Sa(e, n), a === null && s & 4 && Rh(n), s & 512 && $s(n, n.return));
        break;
      case 12:
        Sa(e, n);
        break;
      case 31:
        (Sa(e, n), s & 4 && qh(e, n));
        break;
      case 13:
        (Sa(e, n),
          s & 4 && Ih(e, n),
          s & 64 &&
            ((e = n.memoizedState),
            e !== null && ((e = e.dehydrated), e !== null && ((n = Vf.bind(null, n)), fg(e, n)))));
        break;
      case 22:
        if (((s = n.memoizedState !== null || Na), !s)) {
          ((a = (a !== null && a.memoizedState !== null) || _e), (i = Na));
          var l = _e;
          ((Na = s),
            (_e = a) && !l ? ka(e, n, (n.subtreeFlags & 8772) !== 0) : Sa(e, n),
            (Na = i),
            (_e = l));
        }
        break;
      case 30:
        break;
      default:
        Sa(e, n);
    }
  }
  function Bh(e) {
    var a = e.alternate;
    (a !== null && ((e.alternate = null), Bh(a)),
      (e.child = null),
      (e.deletions = null),
      (e.sibling = null),
      e.tag === 5 && ((a = e.stateNode), a !== null && h(a)),
      (e.stateNode = null),
      (e.return = null),
      (e.dependencies = null),
      (e.memoizedProps = null),
      (e.memoizedState = null),
      (e.pendingProps = null),
      (e.stateNode = null),
      (e.updateQueue = null));
  }
  var we = null,
    ht = !1;
  function Ta(e, a, n) {
    for (n = n.child; n !== null; ) (Uh(e, a, n), (n = n.sibling));
  }
  function Uh(e, a, n) {
    if (We && typeof We.onCommitFiberUnmount == 'function')
      try {
        We.onCommitFiberUnmount(Jt, n);
      } catch {}
    switch (n.tag) {
      case 26:
        (_e || ea(n, a),
          Ta(e, a, n),
          n.memoizedState
            ? n.memoizedState.count--
            : n.stateNode && ((n = n.stateNode), n.parentNode.removeChild(n)));
        break;
      case 27:
        _e || ea(n, a);
        var s = we,
          i = ht;
        (en(n.type) && ((we = n.stateNode), (ht = !1)),
          Ta(e, a, n),
          ri(n.stateNode),
          (we = s),
          (ht = i));
        break;
      case 5:
        _e || ea(n, a);
      case 6:
        if (((s = we), (i = ht), (we = null), Ta(e, a, n), (we = s), (ht = i), we !== null))
          if (ht)
            try {
              (we.nodeType === 9
                ? we.body
                : we.nodeName === 'HTML'
                  ? we.ownerDocument.body
                  : we
              ).removeChild(n.stateNode);
            } catch (l) {
              re(n, a, l);
            }
          else
            try {
              we.removeChild(n.stateNode);
            } catch (l) {
              re(n, a, l);
            }
        break;
      case 18:
        we !== null &&
          (ht
            ? ((e = we),
              Du(
                e.nodeType === 9 ? e.body : e.nodeName === 'HTML' ? e.ownerDocument.body : e,
                n.stateNode
              ),
              ms(e))
            : Du(we, n.stateNode));
        break;
      case 4:
        ((s = we),
          (i = ht),
          (we = n.stateNode.containerInfo),
          (ht = !0),
          Ta(e, a, n),
          (we = s),
          (ht = i));
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        (Xa(2, n, a), _e || Xa(4, n, a), Ta(e, a, n));
        break;
      case 1:
        (_e ||
          (ea(n, a), (s = n.stateNode), typeof s.componentWillUnmount == 'function' && Yh(n, a, s)),
          Ta(e, a, n));
        break;
      case 21:
        Ta(e, a, n);
        break;
      case 22:
        ((_e = (s = _e) || n.memoizedState !== null), Ta(e, a, n), (_e = s));
        break;
      default:
        Ta(e, a, n);
    }
  }
  function qh(e, a) {
    if (
      a.memoizedState === null &&
      ((e = a.alternate), e !== null && ((e = e.memoizedState), e !== null))
    ) {
      e = e.dehydrated;
      try {
        ms(e);
      } catch (n) {
        re(a, a.return, n);
      }
    }
  }
  function Ih(e, a) {
    if (
      a.memoizedState === null &&
      ((e = a.alternate),
      e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
    )
      try {
        ms(e);
      } catch (n) {
        re(a, a.return, n);
      }
  }
  function Uf(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var a = e.stateNode;
        return (a === null && (a = e.stateNode = new Hh()), a);
      case 22:
        return (
          (e = e.stateNode),
          (a = e._retryCache),
          a === null && (a = e._retryCache = new Hh()),
          a
        );
      default:
        throw Error(u(435, e.tag));
    }
  }
  function gl(e, a) {
    var n = Uf(e);
    a.forEach(function (s) {
      if (!n.has(s)) {
        n.add(s);
        var i = Kf.bind(null, e, s);
        s.then(i, i);
      }
    });
  }
  function ut(e, a) {
    var n = a.deletions;
    if (n !== null)
      for (var s = 0; s < n.length; s++) {
        var i = n[s],
          l = e,
          r = a,
          o = r;
        e: for (; o !== null; ) {
          switch (o.tag) {
            case 27:
              if (en(o.type)) {
                ((we = o.stateNode), (ht = !1));
                break e;
              }
              break;
            case 5:
              ((we = o.stateNode), (ht = !1));
              break e;
            case 3:
            case 4:
              ((we = o.stateNode.containerInfo), (ht = !0));
              break e;
          }
          o = o.return;
        }
        if (we === null) throw Error(u(160));
        (Uh(l, r, i),
          (we = null),
          (ht = !1),
          (l = i.alternate),
          l !== null && (l.return = null),
          (i.return = null));
      }
    if (a.subtreeFlags & 13886) for (a = a.child; a !== null; ) (Wh(a, e), (a = a.sibling));
  }
  var Xt = null;
  function Wh(e, a) {
    var n = e.alternate,
      s = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        (ut(a, e), mt(e), s & 4 && (Xa(3, e, e.return), Fs(3, e), Xa(5, e, e.return)));
        break;
      case 1:
        (ut(a, e),
          mt(e),
          s & 512 && (_e || n === null || ea(n, n.return)),
          s & 64 &&
            Na &&
            ((e = e.updateQueue),
            e !== null &&
              ((s = e.callbacks),
              s !== null &&
                ((n = e.shared.hiddenCallbacks),
                (e.shared.hiddenCallbacks = n === null ? s : n.concat(s))))));
        break;
      case 26:
        var i = Xt;
        if ((ut(a, e), mt(e), s & 512 && (_e || n === null || ea(n, n.return)), s & 4)) {
          var l = n !== null ? n.memoizedState : null;
          if (((s = e.memoizedState), n === null))
            if (s === null)
              if (e.stateNode === null) {
                e: {
                  ((s = e.type), (n = e.memoizedProps), (i = i.ownerDocument || i));
                  t: switch (s) {
                    case 'title':
                      ((l = i.getElementsByTagName('title')[0]),
                        (!l ||
                          l[M] ||
                          l[Re] ||
                          l.namespaceURI === 'http://www.w3.org/2000/svg' ||
                          l.hasAttribute('itemprop')) &&
                          ((l = i.createElement(s)),
                          i.head.insertBefore(l, i.querySelector('head > title'))),
                        $e(l, s, n),
                        (l[Re] = e),
                        U(l),
                        (s = l));
                      break e;
                    case 'link':
                      var r = Wu('link', 'href', i).get(s + (n.href || ''));
                      if (r) {
                        for (var o = 0; o < r.length; o++)
                          if (
                            ((l = r[o]),
                            l.getAttribute('href') ===
                              (n.href == null || n.href === '' ? null : n.href) &&
                              l.getAttribute('rel') === (n.rel == null ? null : n.rel) &&
                              l.getAttribute('title') === (n.title == null ? null : n.title) &&
                              l.getAttribute('crossorigin') ===
                                (n.crossOrigin == null ? null : n.crossOrigin))
                          ) {
                            r.splice(o, 1);
                            break t;
                          }
                      }
                      ((l = i.createElement(s)), $e(l, s, n), i.head.appendChild(l));
                      break;
                    case 'meta':
                      if ((r = Wu('meta', 'content', i).get(s + (n.content || '')))) {
                        for (o = 0; o < r.length; o++)
                          if (
                            ((l = r[o]),
                            l.getAttribute('content') ===
                              (n.content == null ? null : '' + n.content) &&
                              l.getAttribute('name') === (n.name == null ? null : n.name) &&
                              l.getAttribute('property') ===
                                (n.property == null ? null : n.property) &&
                              l.getAttribute('http-equiv') ===
                                (n.httpEquiv == null ? null : n.httpEquiv) &&
                              l.getAttribute('charset') === (n.charSet == null ? null : n.charSet))
                          ) {
                            r.splice(o, 1);
                            break t;
                          }
                      }
                      ((l = i.createElement(s)), $e(l, s, n), i.head.appendChild(l));
                      break;
                    default:
                      throw Error(u(468, s));
                  }
                  ((l[Re] = e), U(l), (s = l));
                }
                e.stateNode = s;
              } else Gu(i, e.type, e.stateNode);
            else e.stateNode = Iu(i, s, e.memoizedProps);
          else
            l !== s
              ? (l === null
                  ? n.stateNode !== null && ((n = n.stateNode), n.parentNode.removeChild(n))
                  : l.count--,
                s === null ? Gu(i, e.type, e.stateNode) : Iu(i, s, e.memoizedProps))
              : s === null && e.stateNode !== null && po(e, e.memoizedProps, n.memoizedProps);
        }
        break;
      case 27:
        (ut(a, e),
          mt(e),
          s & 512 && (_e || n === null || ea(n, n.return)),
          n !== null && s & 4 && po(e, e.memoizedProps, n.memoizedProps));
        break;
      case 5:
        if ((ut(a, e), mt(e), s & 512 && (_e || n === null || ea(n, n.return)), e.flags & 32)) {
          i = e.stateNode;
          try {
            On(i, '');
          } catch (C) {
            re(e, e.return, C);
          }
        }
        (s & 4 &&
          e.stateNode != null &&
          ((i = e.memoizedProps), po(e, i, n !== null ? n.memoizedProps : i)),
          s & 1024 && (jo = !0));
        break;
      case 6:
        if ((ut(a, e), mt(e), s & 4)) {
          if (e.stateNode === null) throw Error(u(162));
          ((s = e.memoizedProps), (n = e.stateNode));
          try {
            n.nodeValue = s;
          } catch (C) {
            re(e, e.return, C);
          }
        }
        break;
      case 3:
        if (
          ((Ml = null),
          (i = Xt),
          (Xt = Cl(a.containerInfo)),
          ut(a, e),
          (Xt = i),
          mt(e),
          s & 4 && n !== null && n.memoizedState.isDehydrated)
        )
          try {
            ms(a.containerInfo);
          } catch (C) {
            re(e, e.return, C);
          }
        jo && ((jo = !1), Gh(e));
        break;
      case 4:
        ((s = Xt), (Xt = Cl(e.stateNode.containerInfo)), ut(a, e), mt(e), (Xt = s));
        break;
      case 12:
        (ut(a, e), mt(e));
        break;
      case 31:
        (ut(a, e),
          mt(e),
          s & 4 && ((s = e.updateQueue), s !== null && ((e.updateQueue = null), gl(e, s))));
        break;
      case 13:
        (ut(a, e),
          mt(e),
          e.child.flags & 8192 &&
            (e.memoizedState !== null) != (n !== null && n.memoizedState !== null) &&
            (pl = Xe()),
          s & 4 && ((s = e.updateQueue), s !== null && ((e.updateQueue = null), gl(e, s))));
        break;
      case 22:
        i = e.memoizedState !== null;
        var c = n !== null && n.memoizedState !== null,
          y = Na,
          v = _e;
        if (((Na = y || i), (_e = v || c), ut(a, e), (_e = v), (Na = y), mt(e), s & 8192))
          e: for (
            a = e.stateNode,
              a._visibility = i ? a._visibility & -2 : a._visibility | 1,
              i && (n === null || c || Na || _e || An(e)),
              n = null,
              a = e;
            ;
          ) {
            if (a.tag === 5 || a.tag === 26) {
              if (n === null) {
                c = n = a;
                try {
                  if (((l = c.stateNode), i))
                    ((r = l.style),
                      typeof r.setProperty == 'function'
                        ? r.setProperty('display', 'none', 'important')
                        : (r.display = 'none'));
                  else {
                    o = c.stateNode;
                    var T = c.memoizedProps.style,
                      b = T != null && T.hasOwnProperty('display') ? T.display : null;
                    o.style.display = b == null || typeof b == 'boolean' ? '' : ('' + b).trim();
                  }
                } catch (C) {
                  re(c, c.return, C);
                }
              }
            } else if (a.tag === 6) {
              if (n === null) {
                c = a;
                try {
                  c.stateNode.nodeValue = i ? '' : c.memoizedProps;
                } catch (C) {
                  re(c, c.return, C);
                }
              }
            } else if (a.tag === 18) {
              if (n === null) {
                c = a;
                try {
                  var j = c.stateNode;
                  i ? Yu(j, !0) : Yu(c.stateNode, !1);
                } catch (C) {
                  re(c, c.return, C);
                }
              }
            } else if (
              ((a.tag !== 22 && a.tag !== 23) || a.memoizedState === null || a === e) &&
              a.child !== null
            ) {
              ((a.child.return = a), (a = a.child));
              continue;
            }
            if (a === e) break e;
            for (; a.sibling === null; ) {
              if (a.return === null || a.return === e) break e;
              (n === a && (n = null), (a = a.return));
            }
            (n === a && (n = null), (a.sibling.return = a.return), (a = a.sibling));
          }
        s & 4 &&
          ((s = e.updateQueue),
          s !== null && ((n = s.retryQueue), n !== null && ((s.retryQueue = null), gl(e, n))));
        break;
      case 19:
        (ut(a, e),
          mt(e),
          s & 4 && ((s = e.updateQueue), s !== null && ((e.updateQueue = null), gl(e, s))));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        (ut(a, e), mt(e));
    }
  }
  function mt(e) {
    var a = e.flags;
    if (a & 2) {
      try {
        for (var n, s = e.return; s !== null; ) {
          if (Lh(s)) {
            n = s;
            break;
          }
          s = s.return;
        }
        if (n == null) throw Error(u(160));
        switch (n.tag) {
          case 27:
            var i = n.stateNode,
              l = yo(e);
            fl(e, l, i);
            break;
          case 5:
            var r = n.stateNode;
            n.flags & 32 && (On(r, ''), (n.flags &= -33));
            var o = yo(e);
            fl(e, o, r);
            break;
          case 3:
          case 4:
            var c = n.stateNode.containerInfo,
              y = yo(e);
            bo(e, y, c);
            break;
          default:
            throw Error(u(161));
        }
      } catch (v) {
        re(e, e.return, v);
      }
      e.flags &= -3;
    }
    a & 4096 && (e.flags &= -4097);
  }
  function Gh(e) {
    if (e.subtreeFlags & 1024)
      for (e = e.child; e !== null; ) {
        var a = e;
        (Gh(a), a.tag === 5 && a.flags & 1024 && a.stateNode.reset(), (e = e.sibling));
      }
  }
  function Sa(e, a) {
    if (a.subtreeFlags & 8772)
      for (a = a.child; a !== null; ) (_h(e, a.alternate, a), (a = a.sibling));
  }
  function An(e) {
    for (e = e.child; e !== null; ) {
      var a = e;
      switch (a.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (Xa(4, a, a.return), An(a));
          break;
        case 1:
          ea(a, a.return);
          var n = a.stateNode;
          (typeof n.componentWillUnmount == 'function' && Yh(a, a.return, n), An(a));
          break;
        case 27:
          ri(a.stateNode);
        case 26:
        case 5:
          (ea(a, a.return), An(a));
          break;
        case 22:
          a.memoizedState === null && An(a);
          break;
        case 30:
          An(a);
          break;
        default:
          An(a);
      }
      e = e.sibling;
    }
  }
  function ka(e, a, n) {
    for (n = n && (a.subtreeFlags & 8772) !== 0, a = a.child; a !== null; ) {
      var s = a.alternate,
        i = e,
        l = a,
        r = l.flags;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          (ka(i, l, n), Fs(4, l));
          break;
        case 1:
          if ((ka(i, l, n), (s = l), (i = s.stateNode), typeof i.componentDidMount == 'function'))
            try {
              i.componentDidMount();
            } catch (y) {
              re(s, s.return, y);
            }
          if (((s = l), (i = s.updateQueue), i !== null)) {
            var o = s.stateNode;
            try {
              var c = i.shared.hiddenCallbacks;
              if (c !== null)
                for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) vd(c[i], o);
            } catch (y) {
              re(s, s.return, y);
            }
          }
          (n && r & 64 && Dh(l), $s(l, l.return));
          break;
        case 27:
          Oh(l);
        case 26:
        case 5:
          (ka(i, l, n), n && s === null && r & 4 && Rh(l), $s(l, l.return));
          break;
        case 12:
          ka(i, l, n);
          break;
        case 31:
          (ka(i, l, n), n && r & 4 && qh(i, l));
          break;
        case 13:
          (ka(i, l, n), n && r & 4 && Ih(i, l));
          break;
        case 22:
          (l.memoizedState === null && ka(i, l, n), $s(l, l.return));
          break;
        case 30:
          break;
        default:
          ka(i, l, n);
      }
      a = a.sibling;
    }
  }
  function vo(e, a) {
    var n = null;
    (e !== null &&
      e.memoizedState !== null &&
      e.memoizedState.cachePool !== null &&
      (n = e.memoizedState.cachePool.pool),
      (e = null),
      a.memoizedState !== null &&
        a.memoizedState.cachePool !== null &&
        (e = a.memoizedState.cachePool.pool),
      e !== n && (e != null && e.refCount++, n != null && _s(n)));
  }
  function wo(e, a) {
    ((e = null),
      a.alternate !== null && (e = a.alternate.memoizedState.cache),
      (a = a.memoizedState.cache),
      a !== e && (a.refCount++, e != null && _s(e)));
  }
  function Vt(e, a, n, s) {
    if (a.subtreeFlags & 10256) for (a = a.child; a !== null; ) (Zh(e, a, n, s), (a = a.sibling));
  }
  function Zh(e, a, n, s) {
    var i = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        (Vt(e, a, n, s), i & 2048 && Fs(9, a));
        break;
      case 1:
        Vt(e, a, n, s);
        break;
      case 3:
        (Vt(e, a, n, s),
          i & 2048 &&
            ((e = null),
            a.alternate !== null && (e = a.alternate.memoizedState.cache),
            (a = a.memoizedState.cache),
            a !== e && (a.refCount++, e != null && _s(e))));
        break;
      case 12:
        if (i & 2048) {
          (Vt(e, a, n, s), (e = a.stateNode));
          try {
            var l = a.memoizedProps,
              r = l.id,
              o = l.onPostCommit;
            typeof o == 'function' &&
              o(r, a.alternate === null ? 'mount' : 'update', e.passiveEffectDuration, -0);
          } catch (c) {
            re(a, a.return, c);
          }
        } else Vt(e, a, n, s);
        break;
      case 31:
        Vt(e, a, n, s);
        break;
      case 13:
        Vt(e, a, n, s);
        break;
      case 23:
        break;
      case 22:
        ((l = a.stateNode),
          (r = a.alternate),
          a.memoizedState !== null
            ? l._visibility & 2
              ? Vt(e, a, n, s)
              : Ps(e, a)
            : l._visibility & 2
              ? Vt(e, a, n, s)
              : ((l._visibility |= 2), as(e, a, n, s, (a.subtreeFlags & 10256) !== 0 || !1)),
          i & 2048 && vo(r, a));
        break;
      case 24:
        (Vt(e, a, n, s), i & 2048 && wo(a.alternate, a));
        break;
      default:
        Vt(e, a, n, s);
    }
  }
  function as(e, a, n, s, i) {
    for (i = i && ((a.subtreeFlags & 10256) !== 0 || !1), a = a.child; a !== null; ) {
      var l = e,
        r = a,
        o = n,
        c = s,
        y = r.flags;
      switch (r.tag) {
        case 0:
        case 11:
        case 15:
          (as(l, r, o, c, i), Fs(8, r));
          break;
        case 23:
          break;
        case 22:
          var v = r.stateNode;
          (r.memoizedState !== null
            ? v._visibility & 2
              ? as(l, r, o, c, i)
              : Ps(l, r)
            : ((v._visibility |= 2), as(l, r, o, c, i)),
            i && y & 2048 && vo(r.alternate, r));
          break;
        case 24:
          (as(l, r, o, c, i), i && y & 2048 && wo(r.alternate, r));
          break;
        default:
          as(l, r, o, c, i);
      }
      a = a.sibling;
    }
  }
  function Ps(e, a) {
    if (a.subtreeFlags & 10256)
      for (a = a.child; a !== null; ) {
        var n = e,
          s = a,
          i = s.flags;
        switch (s.tag) {
          case 22:
            (Ps(n, s), i & 2048 && vo(s.alternate, s));
            break;
          case 24:
            (Ps(n, s), i & 2048 && wo(s.alternate, s));
            break;
          default:
            Ps(n, s);
        }
        a = a.sibling;
      }
  }
  var ei = 8192;
  function ns(e, a, n) {
    if (e.subtreeFlags & ei) for (e = e.child; e !== null; ) (Qh(e, a, n), (e = e.sibling));
  }
  function Qh(e, a, n) {
    switch (e.tag) {
      case 26:
        (ns(e, a, n),
          e.flags & ei && e.memoizedState !== null && kg(n, Xt, e.memoizedState, e.memoizedProps));
        break;
      case 5:
        ns(e, a, n);
        break;
      case 3:
      case 4:
        var s = Xt;
        ((Xt = Cl(e.stateNode.containerInfo)), ns(e, a, n), (Xt = s));
        break;
      case 22:
        e.memoizedState === null &&
          ((s = e.alternate),
          s !== null && s.memoizedState !== null
            ? ((s = ei), (ei = 16777216), ns(e, a, n), (ei = s))
            : ns(e, a, n));
        break;
      default:
        ns(e, a, n);
    }
  }
  function Xh(e) {
    var a = e.alternate;
    if (a !== null && ((e = a.child), e !== null)) {
      a.child = null;
      do ((a = e.sibling), (e.sibling = null), (e = a));
      while (e !== null);
    }
  }
  function ti(e) {
    var a = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (a !== null)
        for (var n = 0; n < a.length; n++) {
          var s = a[n];
          ((Ze = s), Kh(s, e));
        }
      Xh(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) (Vh(e), (e = e.sibling));
  }
  function Vh(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        (ti(e), e.flags & 2048 && Xa(9, e, e.return));
        break;
      case 3:
        ti(e);
        break;
      case 12:
        ti(e);
        break;
      case 22:
        var a = e.stateNode;
        e.memoizedState !== null && a._visibility & 2 && (e.return === null || e.return.tag !== 13)
          ? ((a._visibility &= -3), xl(e))
          : ti(e);
        break;
      default:
        ti(e);
    }
  }
  function xl(e) {
    var a = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (a !== null)
        for (var n = 0; n < a.length; n++) {
          var s = a[n];
          ((Ze = s), Kh(s, e));
        }
      Xh(e);
    }
    for (e = e.child; e !== null; ) {
      switch (((a = e), a.tag)) {
        case 0:
        case 11:
        case 15:
          (Xa(8, a, a.return), xl(a));
          break;
        case 22:
          ((n = a.stateNode), n._visibility & 2 && ((n._visibility &= -3), xl(a)));
          break;
        default:
          xl(a);
      }
      e = e.sibling;
    }
  }
  function Kh(e, a) {
    for (; Ze !== null; ) {
      var n = Ze;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          Xa(8, n, a);
          break;
        case 23:
        case 22:
          if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
            var s = n.memoizedState.cachePool.pool;
            s != null && s.refCount++;
          }
          break;
        case 24:
          _s(n.memoizedState.cache);
      }
      if (((s = n.child), s !== null)) ((s.return = n), (Ze = s));
      else
        e: for (n = e; Ze !== null; ) {
          s = Ze;
          var i = s.sibling,
            l = s.return;
          if ((Bh(s), s === n)) {
            Ze = null;
            break e;
          }
          if (i !== null) {
            ((i.return = l), (Ze = i));
            break e;
          }
          Ze = l;
        }
    }
  }
  var qf = {
      getCacheForType: function (e) {
        var a = Je(Le),
          n = a.data.get(e);
        return (n === void 0 && ((n = e()), a.data.set(e, n)), n);
      },
      cacheSignal: function () {
        return Je(Le).controller.signal;
      },
    },
    If = typeof WeakMap == 'function' ? WeakMap : Map,
    ae = 0,
    ge = null,
    W = null,
    Q = 0,
    le = 0,
    St = null,
    Va = !1,
    ss = !1,
    No = !1,
    Aa = 0,
    ke = 0,
    Ka = 0,
    En = 0,
    To = 0,
    kt = 0,
    is = 0,
    ai = null,
    ft = null,
    So = !1,
    pl = 0,
    Jh = 0,
    yl = 1 / 0,
    bl = null,
    Ja = null,
    Ie = 0,
    Fa = null,
    ls = null,
    Ea = 0,
    ko = 0,
    Ao = null,
    Fh = null,
    ni = 0,
    Eo = null;
  function At() {
    return (ae & 2) !== 0 && Q !== 0 ? Q & -Q : N.T !== null ? Ro() : Ns();
  }
  function $h() {
    if (kt === 0)
      if ((Q & 536870912) === 0 || V) {
        var e = ca;
        ((ca <<= 1), (ca & 3932160) === 0 && (ca = 262144), (kt = e));
      } else kt = 536870912;
    return ((e = Nt.current), e !== null && (e.flags |= 32), kt);
  }
  function gt(e, a, n) {
    (((e === ge && (le === 2 || le === 9)) || e.cancelPendingCommit !== null) &&
      (rs(e, 0), $a(e, Q, kt, !1)),
      Oa(e, n),
      ((ae & 2) === 0 || e !== ge) &&
        (e === ge && ((ae & 2) === 0 && (En |= n), ke === 4 && $a(e, Q, kt, !1)), ta(e)));
  }
  function Ph(e, a, n) {
    if ((ae & 6) !== 0) throw Error(u(327));
    var s = (!n && (a & 127) === 0 && (a & e.expiredLanes) === 0) || un(e, a),
      i = s ? Zf(e, a) : zo(e, a, !0),
      l = s;
    do {
      if (i === 0) {
        ss && !s && $a(e, a, 0, !1);
        break;
      } else {
        if (((n = e.current.alternate), l && !Wf(n))) {
          ((i = zo(e, a, !1)), (l = !1));
          continue;
        }
        if (i === 2) {
          if (((l = a), e.errorRecoveryDisabledLanes & l)) var r = 0;
          else
            ((r = e.pendingLanes & -536870913), (r = r !== 0 ? r : r & 536870912 ? 536870912 : 0));
          if (r !== 0) {
            a = r;
            e: {
              var o = e;
              i = ai;
              var c = o.current.memoizedState.isDehydrated;
              if ((c && (rs(o, r).flags |= 256), (r = zo(o, r, !1)), r !== 2)) {
                if (No && !c) {
                  ((o.errorRecoveryDisabledLanes |= l), (En |= l), (i = 4));
                  break e;
                }
                ((l = ft), (ft = i), l !== null && (ft === null ? (ft = l) : ft.push.apply(ft, l)));
              }
              i = r;
            }
            if (((l = !1), i !== 2)) continue;
          }
        }
        if (i === 1) {
          (rs(e, 0), $a(e, a, 0, !0));
          break;
        }
        e: {
          switch (((s = e), (l = i), l)) {
            case 0:
            case 1:
              throw Error(u(345));
            case 4:
              if ((a & 4194048) !== a) break;
            case 6:
              $a(s, a, kt, !Va);
              break e;
            case 2:
              ft = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(u(329));
          }
          if ((a & 62914560) === a && ((i = pl + 300 - Xe()), 10 < i)) {
            if (($a(s, a, kt, !Va), Yn(s, 0, !0) !== 0)) break e;
            ((Ea = a),
              (s.timeoutHandle = zu(
                eu.bind(null, s, n, ft, bl, So, a, kt, En, is, Va, l, 'Throttled', -0, 0),
                i
              )));
            break e;
          }
          eu(s, n, ft, bl, So, a, kt, En, is, Va, l, null, -0, 0);
        }
      }
      break;
    } while (!0);
    ta(e);
  }
  function eu(e, a, n, s, i, l, r, o, c, y, v, T, b, j) {
    if (((e.timeoutHandle = -1), (T = a.subtreeFlags), T & 8192 || (T & 16785408) === 16785408)) {
      ((T = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: ma,
      }),
        Qh(a, l, T));
      var C = (l & 62914560) === l ? pl - Xe() : (l & 4194048) === l ? Jh - Xe() : 0;
      if (((C = Ag(T, C)), C !== null)) {
        ((Ea = l),
          (e.cancelPendingCommit = C(ou.bind(null, e, a, l, n, s, i, r, o, c, v, T, null, b, j))),
          $a(e, l, r, !y));
        return;
      }
    }
    ou(e, a, l, n, s, i, r, o, c);
  }
  function Wf(e) {
    for (var a = e; ; ) {
      var n = a.tag;
      if (
        (n === 0 || n === 11 || n === 15) &&
        a.flags & 16384 &&
        ((n = a.updateQueue), n !== null && ((n = n.stores), n !== null))
      )
        for (var s = 0; s < n.length; s++) {
          var i = n[s],
            l = i.getSnapshot;
          i = i.value;
          try {
            if (!vt(l(), i)) return !1;
          } catch {
            return !1;
          }
        }
      if (((n = a.child), a.subtreeFlags & 16384 && n !== null)) ((n.return = a), (a = n));
      else {
        if (a === e) break;
        for (; a.sibling === null; ) {
          if (a.return === null || a.return === e) return !0;
          a = a.return;
        }
        ((a.sibling.return = a.return), (a = a.sibling));
      }
    }
    return !0;
  }
  function $a(e, a, n, s) {
    ((a &= ~To),
      (a &= ~En),
      (e.suspendedLanes |= a),
      (e.pingedLanes &= ~a),
      s && (e.warmLanes |= a),
      (s = e.expirationTimes));
    for (var i = a; 0 < i; ) {
      var l = 31 - Ye(i),
        r = 1 << l;
      ((s[l] = -1), (i &= ~r));
    }
    n !== 0 && vs(e, n, a);
  }
  function jl() {
    return (ae & 6) === 0 ? (si(0), !1) : !0;
  }
  function Co() {
    if (W !== null) {
      if (le === 0) var e = W.return;
      else ((e = W), (pa = bn = null), Gr(e), (Fn = null), (Us = 0), (e = W));
      for (; e !== null; ) (Mh(e.alternate, e), (e = e.return));
      W = null;
    }
  }
  function rs(e, a) {
    var n = e.timeoutHandle;
    (n !== -1 && ((e.timeoutHandle = -1), cg(n)),
      (n = e.cancelPendingCommit),
      n !== null && ((e.cancelPendingCommit = null), n()),
      (Ea = 0),
      Co(),
      (ge = e),
      (W = n = ga(e.current, null)),
      (Q = a),
      (le = 0),
      (St = null),
      (Va = !1),
      (ss = un(e, a)),
      (No = !1),
      (is = kt = To = En = Ka = ke = 0),
      (ft = ai = null),
      (So = !1),
      (a & 8) !== 0 && (a |= a & 32));
    var s = e.entangledLanes;
    if (s !== 0)
      for (e = e.entanglements, s &= a; 0 < s; ) {
        var i = 31 - Ye(s),
          l = 1 << i;
        ((a |= e[i]), (s &= ~l));
      }
    return ((Aa = a), qi(), n);
  }
  function tu(e, a) {
    ((_ = null),
      (N.H = Vs),
      a === Jn || a === Ki
        ? ((a = pd()), (le = 3))
        : a === Dr
          ? ((a = pd()), (le = 4))
          : (le =
              a === lo
                ? 8
                : a !== null && typeof a == 'object' && typeof a.then == 'function'
                  ? 6
                  : 1),
      (St = a),
      W === null && ((ke = 1), cl(e, Rt(a, e.current))));
  }
  function au() {
    var e = Nt.current;
    return e === null
      ? !0
      : (Q & 4194048) === Q
        ? _t === null
        : (Q & 62914560) === Q || (Q & 536870912) !== 0
          ? e === _t
          : !1;
  }
  function nu() {
    var e = N.H;
    return ((N.H = Vs), e === null ? Vs : e);
  }
  function su() {
    var e = N.A;
    return ((N.A = qf), e);
  }
  function vl() {
    ((ke = 4),
      Va || ((Q & 4194048) !== Q && Nt.current !== null) || (ss = !0),
      ((Ka & 134217727) === 0 && (En & 134217727) === 0) || ge === null || $a(ge, Q, kt, !1));
  }
  function zo(e, a, n) {
    var s = ae;
    ae |= 2;
    var i = nu(),
      l = su();
    ((ge !== e || Q !== a) && ((bl = null), rs(e, a)), (a = !1));
    var r = ke;
    e: do
      try {
        if (le !== 0 && W !== null) {
          var o = W,
            c = St;
          switch (le) {
            case 8:
              (Co(), (r = 6));
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              Nt.current === null && (a = !0);
              var y = le;
              if (((le = 0), (St = null), os(e, o, c, y), n && ss)) {
                r = 0;
                break e;
              }
              break;
            default:
              ((y = le), (le = 0), (St = null), os(e, o, c, y));
          }
        }
        (Gf(), (r = ke));
        break;
      } catch (v) {
        tu(e, v);
      }
    while (!0);
    return (
      a && e.shellSuspendCounter++,
      (pa = bn = null),
      (ae = s),
      (N.H = i),
      (N.A = l),
      W === null && ((ge = null), (Q = 0), qi()),
      r
    );
  }
  function Gf() {
    for (; W !== null; ) iu(W);
  }
  function Zf(e, a) {
    var n = ae;
    ae |= 2;
    var s = nu(),
      i = su();
    ge !== e || Q !== a ? ((bl = null), (yl = Xe() + 500), rs(e, a)) : (ss = un(e, a));
    e: do
      try {
        if (le !== 0 && W !== null) {
          a = W;
          var l = St;
          t: switch (le) {
            case 1:
              ((le = 0), (St = null), os(e, a, l, 1));
              break;
            case 2:
            case 9:
              if (gd(l)) {
                ((le = 0), (St = null), lu(a));
                break;
              }
              ((a = function () {
                ((le !== 2 && le !== 9) || ge !== e || (le = 7), ta(e));
              }),
                l.then(a, a));
              break e;
            case 3:
              le = 7;
              break e;
            case 4:
              le = 5;
              break e;
            case 7:
              gd(l) ? ((le = 0), (St = null), lu(a)) : ((le = 0), (St = null), os(e, a, l, 7));
              break;
            case 5:
              var r = null;
              switch (W.tag) {
                case 26:
                  r = W.memoizedState;
                case 5:
                case 27:
                  var o = W;
                  if (r ? Zu(r) : o.stateNode.complete) {
                    ((le = 0), (St = null));
                    var c = o.sibling;
                    if (c !== null) W = c;
                    else {
                      var y = o.return;
                      y !== null ? ((W = y), wl(y)) : (W = null);
                    }
                    break t;
                  }
              }
              ((le = 0), (St = null), os(e, a, l, 5));
              break;
            case 6:
              ((le = 0), (St = null), os(e, a, l, 6));
              break;
            case 8:
              (Co(), (ke = 6));
              break e;
            default:
              throw Error(u(462));
          }
        }
        Qf();
        break;
      } catch (v) {
        tu(e, v);
      }
    while (!0);
    return (
      (pa = bn = null),
      (N.H = s),
      (N.A = i),
      (ae = n),
      W !== null ? 0 : ((ge = null), (Q = 0), qi(), ke)
    );
  }
  function Qf() {
    for (; W !== null && !Ni(); ) iu(W);
  }
  function iu(e) {
    var a = Ch(e.alternate, e, Aa);
    ((e.memoizedProps = e.pendingProps), a === null ? wl(e) : (W = a));
  }
  function lu(e) {
    var a = e,
      n = a.alternate;
    switch (a.tag) {
      case 15:
      case 0:
        a = Nh(n, a, a.pendingProps, a.type, void 0, Q);
        break;
      case 11:
        a = Nh(n, a, a.pendingProps, a.type.render, a.ref, Q);
        break;
      case 5:
        Gr(a);
      default:
        (Mh(n, a), (a = W = sd(a, Aa)), (a = Ch(n, a, Aa)));
    }
    ((e.memoizedProps = e.pendingProps), a === null ? wl(e) : (W = a));
  }
  function os(e, a, n, s) {
    ((pa = bn = null), Gr(a), (Fn = null), (Us = 0));
    var i = a.return;
    try {
      if (Rf(e, i, a, n, Q)) {
        ((ke = 1), cl(e, Rt(n, e.current)), (W = null));
        return;
      }
    } catch (l) {
      if (i !== null) throw ((W = i), l);
      ((ke = 1), cl(e, Rt(n, e.current)), (W = null));
      return;
    }
    a.flags & 32768
      ? (V || s === 1
          ? (e = !0)
          : ss || (Q & 536870912) !== 0
            ? (e = !1)
            : ((Va = e = !0),
              (s === 2 || s === 9 || s === 3 || s === 6) &&
                ((s = Nt.current), s !== null && s.tag === 13 && (s.flags |= 16384))),
        ru(a, e))
      : wl(a);
  }
  function wl(e) {
    var a = e;
    do {
      if ((a.flags & 32768) !== 0) {
        ru(a, Va);
        return;
      }
      e = a.return;
      var n = Hf(a.alternate, a, Aa);
      if (n !== null) {
        W = n;
        return;
      }
      if (((a = a.sibling), a !== null)) {
        W = a;
        return;
      }
      W = a = e;
    } while (a !== null);
    ke === 0 && (ke = 5);
  }
  function ru(e, a) {
    do {
      var n = _f(e.alternate, e);
      if (n !== null) {
        ((n.flags &= 32767), (W = n));
        return;
      }
      if (
        ((n = e.return),
        n !== null && ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
        !a && ((e = e.sibling), e !== null))
      ) {
        W = e;
        return;
      }
      W = e = n;
    } while (e !== null);
    ((ke = 6), (W = null));
  }
  function ou(e, a, n, s, i, l, r, o, c) {
    e.cancelPendingCommit = null;
    do Nl();
    while (Ie !== 0);
    if ((ae & 6) !== 0) throw Error(u(327));
    if (a !== null) {
      if (a === e.current) throw Error(u(177));
      if (
        ((l = a.lanes | a.childLanes),
        (l |= pr),
        js(e, n, l, r, o, c),
        e === ge && ((W = ge = null), (Q = 0)),
        (ls = a),
        (Fa = e),
        (Ea = n),
        (ko = l),
        (Ao = i),
        (Fh = s),
        (a.subtreeFlags & 10256) !== 0 || (a.flags & 10256) !== 0
          ? ((e.callbackNode = null),
            (e.callbackPriority = 0),
            Jf(La, function () {
              return (mu(), null);
            }))
          : ((e.callbackNode = null), (e.callbackPriority = 0)),
        (s = (a.flags & 13878) !== 0),
        (a.subtreeFlags & 13878) !== 0 || s)
      ) {
        ((s = N.T), (N.T = null), (i = A.p), (A.p = 2), (r = ae), (ae |= 4));
        try {
          Bf(e, a, n);
        } finally {
          ((ae = r), (A.p = i), (N.T = s));
        }
      }
      ((Ie = 1), cu(), du(), hu());
    }
  }
  function cu() {
    if (Ie === 1) {
      Ie = 0;
      var e = Fa,
        a = ls,
        n = (a.flags & 13878) !== 0;
      if ((a.subtreeFlags & 13878) !== 0 || n) {
        ((n = N.T), (N.T = null));
        var s = A.p;
        A.p = 2;
        var i = ae;
        ae |= 4;
        try {
          Wh(a, e);
          var l = Io,
            r = Kc(e.containerInfo),
            o = l.focusedElem,
            c = l.selectionRange;
          if (r !== o && o && o.ownerDocument && Vc(o.ownerDocument.documentElement, o)) {
            if (c !== null && ur(o)) {
              var y = c.start,
                v = c.end;
              if ((v === void 0 && (v = y), 'selectionStart' in o))
                ((o.selectionStart = y), (o.selectionEnd = Math.min(v, o.value.length)));
              else {
                var T = o.ownerDocument || document,
                  b = (T && T.defaultView) || window;
                if (b.getSelection) {
                  var j = b.getSelection(),
                    C = o.textContent.length,
                    R = Math.min(c.start, C),
                    ue = c.end === void 0 ? R : Math.min(c.end, C);
                  !j.extend && R > ue && ((r = ue), (ue = R), (R = r));
                  var g = Xc(o, R),
                    m = Xc(o, ue);
                  if (
                    g &&
                    m &&
                    (j.rangeCount !== 1 ||
                      j.anchorNode !== g.node ||
                      j.anchorOffset !== g.offset ||
                      j.focusNode !== m.node ||
                      j.focusOffset !== m.offset)
                  ) {
                    var p = T.createRange();
                    (p.setStart(g.node, g.offset),
                      j.removeAllRanges(),
                      R > ue
                        ? (j.addRange(p), j.extend(m.node, m.offset))
                        : (p.setEnd(m.node, m.offset), j.addRange(p)));
                  }
                }
              }
            }
            for (T = [], j = o; (j = j.parentNode); )
              j.nodeType === 1 && T.push({ element: j, left: j.scrollLeft, top: j.scrollTop });
            for (typeof o.focus == 'function' && o.focus(), o = 0; o < T.length; o++) {
              var w = T[o];
              ((w.element.scrollLeft = w.left), (w.element.scrollTop = w.top));
            }
          }
          ((Ll = !!qo), (Io = qo = null));
        } finally {
          ((ae = i), (A.p = s), (N.T = n));
        }
      }
      ((e.current = a), (Ie = 2));
    }
  }
  function du() {
    if (Ie === 2) {
      Ie = 0;
      var e = Fa,
        a = ls,
        n = (a.flags & 8772) !== 0;
      if ((a.subtreeFlags & 8772) !== 0 || n) {
        ((n = N.T), (N.T = null));
        var s = A.p;
        A.p = 2;
        var i = ae;
        ae |= 4;
        try {
          _h(e, a.alternate, a);
        } finally {
          ((ae = i), (A.p = s), (N.T = n));
        }
      }
      Ie = 3;
    }
  }
  function hu() {
    if (Ie === 4 || Ie === 3) {
      ((Ie = 0), Vl());
      var e = Fa,
        a = ls,
        n = Ea,
        s = Fh;
      (a.subtreeFlags & 10256) !== 0 || (a.flags & 10256) !== 0
        ? (Ie = 5)
        : ((Ie = 0), (ls = Fa = null), uu(e, e.pendingLanes));
      var i = e.pendingLanes;
      if (
        (i === 0 && (Ja = null),
        Zt(n),
        (a = a.stateNode),
        We && typeof We.onCommitFiberRoot == 'function')
      )
        try {
          We.onCommitFiberRoot(Jt, a, void 0, (a.current.flags & 128) === 128);
        } catch {}
      if (s !== null) {
        ((a = N.T), (i = A.p), (A.p = 2), (N.T = null));
        try {
          for (var l = e.onRecoverableError, r = 0; r < s.length; r++) {
            var o = s[r];
            l(o.value, { componentStack: o.stack });
          }
        } finally {
          ((N.T = a), (A.p = i));
        }
      }
      ((Ea & 3) !== 0 && Nl(),
        ta(e),
        (i = e.pendingLanes),
        (n & 261930) !== 0 && (i & 42) !== 0 ? (e === Eo ? ni++ : ((ni = 0), (Eo = e))) : (ni = 0),
        si(0));
    }
  }
  function uu(e, a) {
    (e.pooledCacheLanes &= a) === 0 &&
      ((a = e.pooledCache), a != null && ((e.pooledCache = null), _s(a)));
  }
  function Nl() {
    return (cu(), du(), hu(), mu());
  }
  function mu() {
    if (Ie !== 5) return !1;
    var e = Fa,
      a = ko;
    ko = 0;
    var n = Zt(Ea),
      s = N.T,
      i = A.p;
    try {
      ((A.p = 32 > n ? 32 : n), (N.T = null), (n = Ao), (Ao = null));
      var l = Fa,
        r = Ea;
      if (((Ie = 0), (ls = Fa = null), (Ea = 0), (ae & 6) !== 0)) throw Error(u(331));
      var o = ae;
      if (
        ((ae |= 4),
        Vh(l.current),
        Zh(l, l.current, r, n),
        (ae = o),
        si(0, !1),
        We && typeof We.onPostCommitFiberRoot == 'function')
      )
        try {
          We.onPostCommitFiberRoot(Jt, l);
        } catch {}
      return !0;
    } finally {
      ((A.p = i), (N.T = s), uu(e, a));
    }
  }
  function fu(e, a, n) {
    ((a = Rt(n, a)),
      (a = io(e.stateNode, a, 2)),
      (e = Ga(e, a, 2)),
      e !== null && (Oa(e, 2), ta(e)));
  }
  function re(e, a, n) {
    if (e.tag === 3) fu(e, e, n);
    else
      for (; a !== null; ) {
        if (a.tag === 3) {
          fu(a, e, n);
          break;
        } else if (a.tag === 1) {
          var s = a.stateNode;
          if (
            typeof a.type.getDerivedStateFromError == 'function' ||
            (typeof s.componentDidCatch == 'function' && (Ja === null || !Ja.has(s)))
          ) {
            ((e = Rt(n, e)),
              (n = gh(2)),
              (s = Ga(a, n, 2)),
              s !== null && (xh(n, s, a, e), Oa(s, 2), ta(s)));
            break;
          }
        }
        a = a.return;
      }
  }
  function Mo(e, a, n) {
    var s = e.pingCache;
    if (s === null) {
      s = e.pingCache = new If();
      var i = new Set();
      s.set(a, i);
    } else ((i = s.get(a)), i === void 0 && ((i = new Set()), s.set(a, i)));
    i.has(n) || ((No = !0), i.add(n), (e = Xf.bind(null, e, a, n)), a.then(e, e));
  }
  function Xf(e, a, n) {
    var s = e.pingCache;
    (s !== null && s.delete(a),
      (e.pingedLanes |= e.suspendedLanes & n),
      (e.warmLanes &= ~n),
      ge === e &&
        (Q & n) === n &&
        (ke === 4 || (ke === 3 && (Q & 62914560) === Q && 300 > Xe() - pl)
          ? (ae & 2) === 0 && rs(e, 0)
          : (To |= n),
        is === Q && (is = 0)),
      ta(e));
  }
  function gu(e, a) {
    (a === 0 && (a = da()), (e = xn(e, a)), e !== null && (Oa(e, a), ta(e)));
  }
  function Vf(e) {
    var a = e.memoizedState,
      n = 0;
    (a !== null && (n = a.retryLane), gu(e, n));
  }
  function Kf(e, a) {
    var n = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var s = e.stateNode,
          i = e.memoizedState;
        i !== null && (n = i.retryLane);
        break;
      case 19:
        s = e.stateNode;
        break;
      case 22:
        s = e.stateNode._retryCache;
        break;
      default:
        throw Error(u(314));
    }
    (s !== null && s.delete(a), gu(e, n));
  }
  function Jf(e, a) {
    return Ra(e, a);
  }
  var Tl = null,
    cs = null,
    Do = !1,
    Sl = !1,
    Yo = !1,
    Pa = 0;
  function ta(e) {
    (e !== cs && e.next === null && (cs === null ? (Tl = cs = e) : (cs = cs.next = e)),
      (Sl = !0),
      Do || ((Do = !0), $f()));
  }
  function si(e, a) {
    if (!Yo && Sl) {
      Yo = !0;
      do
        for (var n = !1, s = Tl; s !== null; ) {
          if (e !== 0) {
            var i = s.pendingLanes;
            if (i === 0) var l = 0;
            else {
              var r = s.suspendedLanes,
                o = s.pingedLanes;
              ((l = (1 << (31 - Ye(42 | e) + 1)) - 1),
                (l &= i & ~(r & ~o)),
                (l = l & 201326741 ? (l & 201326741) | 1 : l ? l | 2 : 0));
            }
            l !== 0 && ((n = !0), bu(s, l));
          } else
            ((l = Q),
              (l = Yn(
                s,
                s === ge ? l : 0,
                s.cancelPendingCommit !== null || s.timeoutHandle !== -1
              )),
              (l & 3) === 0 || un(s, l) || ((n = !0), bu(s, l)));
          s = s.next;
        }
      while (n);
      Yo = !1;
    }
  }
  function Ff() {
    xu();
  }
  function xu() {
    Sl = Do = !1;
    var e = 0;
    Pa !== 0 && og() && (e = Pa);
    for (var a = Xe(), n = null, s = Tl; s !== null; ) {
      var i = s.next,
        l = pu(s, a);
      (l === 0
        ? ((s.next = null), n === null ? (Tl = i) : (n.next = i), i === null && (cs = n))
        : ((n = s), (e !== 0 || (l & 3) !== 0) && (Sl = !0)),
        (s = i));
    }
    ((Ie !== 0 && Ie !== 5) || si(e), Pa !== 0 && (Pa = 0));
  }
  function pu(e, a) {
    for (
      var n = e.suspendedLanes,
        s = e.pingedLanes,
        i = e.expirationTimes,
        l = e.pendingLanes & -62914561;
      0 < l;
    ) {
      var r = 31 - Ye(l),
        o = 1 << r,
        c = i[r];
      (c === -1
        ? ((o & n) === 0 || (o & s) !== 0) && (i[r] = Ee(o, a))
        : c <= a && (e.expiredLanes |= o),
        (l &= ~o));
    }
    if (
      ((a = ge),
      (n = Q),
      (n = Yn(e, e === a ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
      (s = e.callbackNode),
      n === 0 || (e === a && (le === 2 || le === 9)) || e.cancelPendingCommit !== null)
    )
      return (s !== null && s !== null && Mn(s), (e.callbackNode = null), (e.callbackPriority = 0));
    if ((n & 3) === 0 || un(e, n)) {
      if (((a = n & -n), a === e.callbackPriority)) return a;
      switch ((s !== null && Mn(s), Zt(n))) {
        case 2:
        case 8:
          n = bt;
          break;
        case 32:
          n = La;
          break;
        case 268435456:
          n = gs;
          break;
        default:
          n = La;
      }
      return (
        (s = yu.bind(null, e)),
        (n = Ra(n, s)),
        (e.callbackPriority = a),
        (e.callbackNode = n),
        a
      );
    }
    return (
      s !== null && s !== null && Mn(s),
      (e.callbackPriority = 2),
      (e.callbackNode = null),
      2
    );
  }
  function yu(e, a) {
    if (Ie !== 0 && Ie !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null);
    var n = e.callbackNode;
    if (Nl() && e.callbackNode !== n) return null;
    var s = Q;
    return (
      (s = Yn(e, e === ge ? s : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
      s === 0
        ? null
        : (Ph(e, s, a),
          pu(e, Xe()),
          e.callbackNode != null && e.callbackNode === n ? yu.bind(null, e) : null)
    );
  }
  function bu(e, a) {
    if (Nl()) return null;
    Ph(e, a, !0);
  }
  function $f() {
    dg(function () {
      (ae & 6) !== 0 ? Ra(ra, Ff) : xu();
    });
  }
  function Ro() {
    if (Pa === 0) {
      var e = Vn;
      (e === 0 && ((e = oa), (oa <<= 1), (oa & 261888) === 0 && (oa = 256)), (Pa = e));
    }
    return Pa;
  }
  function ju(e) {
    return e == null || typeof e == 'symbol' || typeof e == 'boolean'
      ? null
      : typeof e == 'function'
        ? e
        : Yi('' + e);
  }
  function vu(e, a) {
    var n = a.ownerDocument.createElement('input');
    return (
      (n.name = a.name),
      (n.value = a.value),
      e.id && n.setAttribute('form', e.id),
      a.parentNode.insertBefore(n, a),
      (e = new FormData(e)),
      n.parentNode.removeChild(n),
      e
    );
  }
  function Pf(e, a, n, s, i) {
    if (a === 'submit' && n && n.stateNode === i) {
      var l = ju((i[ve] || null).action),
        r = s.submitter;
      r &&
        ((a = (a = r[ve] || null) ? ju(a.formAction) : r.getAttribute('formAction')),
        a !== null && ((l = a), (r = null)));
      var o = new Hi('action', 'action', null, s, i);
      e.push({
        event: o,
        listeners: [
          {
            instance: null,
            listener: function () {
              if (s.defaultPrevented) {
                if (Pa !== 0) {
                  var c = r ? vu(i, r) : new FormData(i);
                  Pr(n, { pending: !0, data: c, method: i.method, action: l }, null, c);
                }
              } else
                typeof l == 'function' &&
                  (o.preventDefault(),
                  (c = r ? vu(i, r) : new FormData(i)),
                  Pr(n, { pending: !0, data: c, method: i.method, action: l }, l, c));
            },
            currentTarget: i,
          },
        ],
      });
    }
  }
  for (var Lo = 0; Lo < xr.length; Lo++) {
    var Oo = xr[Lo],
      eg = Oo.toLowerCase(),
      tg = Oo[0].toUpperCase() + Oo.slice(1);
    Qt(eg, 'on' + tg);
  }
  (Qt($c, 'onAnimationEnd'),
    Qt(Pc, 'onAnimationIteration'),
    Qt(ed, 'onAnimationStart'),
    Qt('dblclick', 'onDoubleClick'),
    Qt('focusin', 'onFocus'),
    Qt('focusout', 'onBlur'),
    Qt(pf, 'onTransitionRun'),
    Qt(yf, 'onTransitionStart'),
    Qt(bf, 'onTransitionCancel'),
    Qt(td, 'onTransitionEnd'),
    Ft('onMouseEnter', ['mouseout', 'mouseover']),
    Ft('onMouseLeave', ['mouseout', 'mouseover']),
    Ft('onPointerEnter', ['pointerout', 'pointerover']),
    Ft('onPointerLeave', ['pointerout', 'pointerover']),
    ct('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' ')),
    ct(
      'onSelect',
      'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' '
      )
    ),
    ct('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']),
    ct('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' ')),
    ct(
      'onCompositionStart',
      'compositionstart focusout keydown keypress keyup mousedown'.split(' ')
    ),
    ct(
      'onCompositionUpdate',
      'compositionupdate focusout keydown keypress keyup mousedown'.split(' ')
    ));
  var ii =
      'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
        ' '
      ),
    ag = new Set(
      'beforetoggle cancel close invalid load scroll scrollend toggle'.split(' ').concat(ii)
    );
  function wu(e, a) {
    a = (a & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
      var s = e[n],
        i = s.event;
      s = s.listeners;
      e: {
        var l = void 0;
        if (a)
          for (var r = s.length - 1; 0 <= r; r--) {
            var o = s[r],
              c = o.instance,
              y = o.currentTarget;
            if (((o = o.listener), c !== l && i.isPropagationStopped())) break e;
            ((l = o), (i.currentTarget = y));
            try {
              l(i);
            } catch (v) {
              Ui(v);
            }
            ((i.currentTarget = null), (l = c));
          }
        else
          for (r = 0; r < s.length; r++) {
            if (
              ((o = s[r]),
              (c = o.instance),
              (y = o.currentTarget),
              (o = o.listener),
              c !== l && i.isPropagationStopped())
            )
              break e;
            ((l = o), (i.currentTarget = y));
            try {
              l(i);
            } catch (v) {
              Ui(v);
            }
            ((i.currentTarget = null), (l = c));
          }
      }
    }
  }
  function G(e, a) {
    var n = a[Rn];
    n === void 0 && (n = a[Rn] = new Set());
    var s = e + '__bubble';
    n.has(s) || (Nu(a, e, 2, !1), n.add(s));
  }
  function Ho(e, a, n) {
    var s = 0;
    (a && (s |= 4), Nu(n, e, s, a));
  }
  var kl = '_reactListening' + Math.random().toString(36).slice(2);
  function _o(e) {
    if (!e[kl]) {
      ((e[kl] = !0),
        Ve.forEach(function (n) {
          n !== 'selectionchange' && (ag.has(n) || Ho(n, !1, e), Ho(n, !0, e));
        }));
      var a = e.nodeType === 9 ? e : e.ownerDocument;
      a === null || a[kl] || ((a[kl] = !0), Ho('selectionchange', !1, a));
    }
  }
  function Nu(e, a, n, s) {
    switch ($u(a)) {
      case 2:
        var i = zg;
        break;
      case 8:
        i = Mg;
        break;
      default:
        i = Po;
    }
    ((n = i.bind(null, a, n, e)),
      (i = void 0),
      !nr || (a !== 'touchstart' && a !== 'touchmove' && a !== 'wheel') || (i = !0),
      s
        ? i !== void 0
          ? e.addEventListener(a, n, { capture: !0, passive: i })
          : e.addEventListener(a, n, !0)
        : i !== void 0
          ? e.addEventListener(a, n, { passive: i })
          : e.addEventListener(a, n, !1));
  }
  function Bo(e, a, n, s, i) {
    var l = s;
    if ((a & 1) === 0 && (a & 2) === 0 && s !== null)
      e: for (;;) {
        if (s === null) return;
        var r = s.tag;
        if (r === 3 || r === 4) {
          var o = s.stateNode.containerInfo;
          if (o === i) break;
          if (r === 4)
            for (r = s.return; r !== null; ) {
              var c = r.tag;
              if ((c === 3 || c === 4) && r.stateNode.containerInfo === i) return;
              r = r.return;
            }
          for (; o !== null; ) {
            if (((r = S(o)), r === null)) return;
            if (((c = r.tag), c === 5 || c === 6 || c === 26 || c === 27)) {
              s = l = r;
              continue e;
            }
            o = o.parentNode;
          }
        }
        s = s.return;
      }
    Ec(function () {
      var y = l,
        v = tr(n),
        T = [];
      e: {
        var b = ad.get(e);
        if (b !== void 0) {
          var j = Hi,
            C = e;
          switch (e) {
            case 'keypress':
              if (Li(n) === 0) break e;
            case 'keydown':
            case 'keyup':
              j = Vm;
              break;
            case 'focusin':
              ((C = 'focus'), (j = rr));
              break;
            case 'focusout':
              ((C = 'blur'), (j = rr));
              break;
            case 'beforeblur':
            case 'afterblur':
              j = rr;
              break;
            case 'click':
              if (n.button === 2) break e;
            case 'auxclick':
            case 'dblclick':
            case 'mousedown':
            case 'mousemove':
            case 'mouseup':
            case 'mouseout':
            case 'mouseover':
            case 'contextmenu':
              j = Mc;
              break;
            case 'drag':
            case 'dragend':
            case 'dragenter':
            case 'dragexit':
            case 'dragleave':
            case 'dragover':
            case 'dragstart':
            case 'drop':
              j = Om;
              break;
            case 'touchcancel':
            case 'touchend':
            case 'touchmove':
            case 'touchstart':
              j = Fm;
              break;
            case $c:
            case Pc:
            case ed:
              j = Bm;
              break;
            case td:
              j = Pm;
              break;
            case 'scroll':
            case 'scrollend':
              j = Rm;
              break;
            case 'wheel':
              j = tf;
              break;
            case 'copy':
            case 'cut':
            case 'paste':
              j = qm;
              break;
            case 'gotpointercapture':
            case 'lostpointercapture':
            case 'pointercancel':
            case 'pointerdown':
            case 'pointermove':
            case 'pointerout':
            case 'pointerover':
            case 'pointerup':
              j = Yc;
              break;
            case 'toggle':
            case 'beforetoggle':
              j = nf;
          }
          var R = (a & 4) !== 0,
            ue = !R && (e === 'scroll' || e === 'scrollend'),
            g = R ? (b !== null ? b + 'Capture' : null) : b;
          R = [];
          for (var m = y, p; m !== null; ) {
            var w = m;
            if (
              ((p = w.stateNode),
              (w = w.tag),
              (w !== 5 && w !== 26 && w !== 27) ||
                p === null ||
                g === null ||
                ((w = As(m, g)), w != null && R.push(li(m, w, p))),
              ue)
            )
              break;
            m = m.return;
          }
          0 < R.length && ((b = new j(b, C, null, n, v)), T.push({ event: b, listeners: R }));
        }
      }
      if ((a & 7) === 0) {
        e: {
          if (
            ((b = e === 'mouseover' || e === 'pointerover'),
            (j = e === 'mouseout' || e === 'pointerout'),
            b && n !== er && (C = n.relatedTarget || n.fromElement) && (S(C) || C[ha]))
          )
            break e;
          if (
            (j || b) &&
            ((b =
              v.window === v
                ? v
                : (b = v.ownerDocument)
                  ? b.defaultView || b.parentWindow
                  : window),
            j
              ? ((C = n.relatedTarget || n.toElement),
                (j = y),
                (C = C ? S(C) : null),
                C !== null &&
                  ((ue = z(C)), (R = C.tag), C !== ue || (R !== 5 && R !== 27 && R !== 6)) &&
                  (C = null))
              : ((j = null), (C = y)),
            j !== C)
          ) {
            if (
              ((R = Mc),
              (w = 'onMouseLeave'),
              (g = 'onMouseEnter'),
              (m = 'mouse'),
              (e === 'pointerout' || e === 'pointerover') &&
                ((R = Yc), (w = 'onPointerLeave'), (g = 'onPointerEnter'), (m = 'pointer')),
              (ue = j == null ? b : se(j)),
              (p = C == null ? b : se(C)),
              (b = new R(w, m + 'leave', j, n, v)),
              (b.target = ue),
              (b.relatedTarget = p),
              (w = null),
              S(v) === y &&
                ((R = new R(g, m + 'enter', C, n, v)),
                (R.target = p),
                (R.relatedTarget = ue),
                (w = R)),
              (ue = w),
              j && C)
            )
              t: {
                for (R = ng, g = j, m = C, p = 0, w = g; w; w = R(w)) p++;
                w = 0;
                for (var Y = m; Y; Y = R(Y)) w++;
                for (; 0 < p - w; ) ((g = R(g)), p--);
                for (; 0 < w - p; ) ((m = R(m)), w--);
                for (; p--; ) {
                  if (g === m || (m !== null && g === m.alternate)) {
                    R = g;
                    break t;
                  }
                  ((g = R(g)), (m = R(m)));
                }
                R = null;
              }
            else R = null;
            (j !== null && Tu(T, b, j, R, !1), C !== null && ue !== null && Tu(T, ue, C, R, !0));
          }
        }
        e: {
          if (
            ((b = y ? se(y) : window),
            (j = b.nodeName && b.nodeName.toLowerCase()),
            j === 'select' || (j === 'input' && b.type === 'file'))
          )
            var ee = qc;
          else if (Bc(b))
            if (Ic) ee = ff;
            else {
              ee = uf;
              var D = hf;
            }
          else
            ((j = b.nodeName),
              !j || j.toLowerCase() !== 'input' || (b.type !== 'checkbox' && b.type !== 'radio')
                ? y && Pl(y.elementType) && (ee = qc)
                : (ee = mf));
          if (ee && (ee = ee(e, y))) {
            Uc(T, ee, n, v);
            break e;
          }
          (D && D(e, b, y),
            e === 'focusout' &&
              y &&
              b.type === 'number' &&
              y.memoizedProps.value != null &&
              $l(b, 'number', b.value));
        }
        switch (((D = y ? se(y) : window), e)) {
          case 'focusin':
            (Bc(D) || D.contentEditable === 'true') && ((Un = D), (mr = y), (Ls = null));
            break;
          case 'focusout':
            Ls = mr = Un = null;
            break;
          case 'mousedown':
            fr = !0;
            break;
          case 'contextmenu':
          case 'mouseup':
          case 'dragend':
            ((fr = !1), Jc(T, n, v));
            break;
          case 'selectionchange':
            if (xf) break;
          case 'keydown':
          case 'keyup':
            Jc(T, n, v);
        }
        var B;
        if (cr)
          e: {
            switch (e) {
              case 'compositionstart':
                var X = 'onCompositionStart';
                break e;
              case 'compositionend':
                X = 'onCompositionEnd';
                break e;
              case 'compositionupdate':
                X = 'onCompositionUpdate';
                break e;
            }
            X = void 0;
          }
        else
          Bn
            ? Hc(e, n) && (X = 'onCompositionEnd')
            : e === 'keydown' && n.keyCode === 229 && (X = 'onCompositionStart');
        (X &&
          (Rc &&
            n.locale !== 'ko' &&
            (Bn || X !== 'onCompositionStart'
              ? X === 'onCompositionEnd' && Bn && (B = Cc())
              : ((Ha = v), (sr = 'value' in Ha ? Ha.value : Ha.textContent), (Bn = !0))),
          (D = Al(y, X)),
          0 < D.length &&
            ((X = new Dc(X, e, null, n, v)),
            T.push({ event: X, listeners: D }),
            B ? (X.data = B) : ((B = _c(n)), B !== null && (X.data = B)))),
          (B = lf ? rf(e, n) : of(e, n)) &&
            ((X = Al(y, 'onBeforeInput')),
            0 < X.length &&
              ((D = new Dc('onBeforeInput', 'beforeinput', null, n, v)),
              T.push({ event: D, listeners: X }),
              (D.data = B))),
          Pf(T, e, y, n, v));
      }
      wu(T, a);
    });
  }
  function li(e, a, n) {
    return { instance: e, listener: a, currentTarget: n };
  }
  function Al(e, a) {
    for (var n = a + 'Capture', s = []; e !== null; ) {
      var i = e,
        l = i.stateNode;
      if (
        ((i = i.tag),
        (i !== 5 && i !== 26 && i !== 27) ||
          l === null ||
          ((i = As(e, n)),
          i != null && s.unshift(li(e, i, l)),
          (i = As(e, a)),
          i != null && s.push(li(e, i, l))),
        e.tag === 3)
      )
        return s;
      e = e.return;
    }
    return [];
  }
  function ng(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function Tu(e, a, n, s, i) {
    for (var l = a._reactName, r = []; n !== null && n !== s; ) {
      var o = n,
        c = o.alternate,
        y = o.stateNode;
      if (((o = o.tag), c !== null && c === s)) break;
      ((o !== 5 && o !== 26 && o !== 27) ||
        y === null ||
        ((c = y),
        i
          ? ((y = As(n, l)), y != null && r.unshift(li(n, y, c)))
          : i || ((y = As(n, l)), y != null && r.push(li(n, y, c)))),
        (n = n.return));
    }
    r.length !== 0 && e.push({ event: a, listeners: r });
  }
  var sg = /\r\n?/g,
    ig = /\u0000|\uFFFD/g;
  function Su(e) {
    return (typeof e == 'string' ? e : '' + e)
      .replace(
        sg,
        `
`
      )
      .replace(ig, '');
  }
  function ku(e, a) {
    return ((a = Su(a)), Su(e) === a);
  }
  function he(e, a, n, s, i, l) {
    switch (n) {
      case 'children':
        typeof s == 'string'
          ? a === 'body' || (a === 'textarea' && s === '') || On(e, s)
          : (typeof s == 'number' || typeof s == 'bigint') && a !== 'body' && On(e, '' + s);
        break;
      case 'className':
        Mi(e, 'class', s);
        break;
      case 'tabIndex':
        Mi(e, 'tabindex', s);
        break;
      case 'dir':
      case 'role':
      case 'viewBox':
      case 'width':
      case 'height':
        Mi(e, n, s);
        break;
      case 'style':
        kc(e, s, l);
        break;
      case 'data':
        if (a !== 'object') {
          Mi(e, 'data', s);
          break;
        }
      case 'src':
      case 'href':
        if (s === '' && (a !== 'a' || n !== 'href')) {
          e.removeAttribute(n);
          break;
        }
        if (s == null || typeof s == 'function' || typeof s == 'symbol' || typeof s == 'boolean') {
          e.removeAttribute(n);
          break;
        }
        ((s = Yi('' + s)), e.setAttribute(n, s));
        break;
      case 'action':
      case 'formAction':
        if (typeof s == 'function') {
          e.setAttribute(
            n,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof l == 'function' &&
            (n === 'formAction'
              ? (a !== 'input' && he(e, a, 'name', i.name, i, null),
                he(e, a, 'formEncType', i.formEncType, i, null),
                he(e, a, 'formMethod', i.formMethod, i, null),
                he(e, a, 'formTarget', i.formTarget, i, null))
              : (he(e, a, 'encType', i.encType, i, null),
                he(e, a, 'method', i.method, i, null),
                he(e, a, 'target', i.target, i, null)));
        if (s == null || typeof s == 'symbol' || typeof s == 'boolean') {
          e.removeAttribute(n);
          break;
        }
        ((s = Yi('' + s)), e.setAttribute(n, s));
        break;
      case 'onClick':
        s != null && (e.onclick = ma);
        break;
      case 'onScroll':
        s != null && G('scroll', e);
        break;
      case 'onScrollEnd':
        s != null && G('scrollend', e);
        break;
      case 'dangerouslySetInnerHTML':
        if (s != null) {
          if (typeof s != 'object' || !('__html' in s)) throw Error(u(61));
          if (((n = s.__html), n != null)) {
            if (i.children != null) throw Error(u(60));
            e.innerHTML = n;
          }
        }
        break;
      case 'multiple':
        e.multiple = s && typeof s != 'function' && typeof s != 'symbol';
        break;
      case 'muted':
        e.muted = s && typeof s != 'function' && typeof s != 'symbol';
        break;
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'defaultValue':
      case 'defaultChecked':
      case 'innerHTML':
      case 'ref':
        break;
      case 'autoFocus':
        break;
      case 'xlinkHref':
        if (s == null || typeof s == 'function' || typeof s == 'boolean' || typeof s == 'symbol') {
          e.removeAttribute('xlink:href');
          break;
        }
        ((n = Yi('' + s)), e.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', n));
        break;
      case 'contentEditable':
      case 'spellCheck':
      case 'draggable':
      case 'value':
      case 'autoReverse':
      case 'externalResourcesRequired':
      case 'focusable':
      case 'preserveAlpha':
        s != null && typeof s != 'function' && typeof s != 'symbol'
          ? e.setAttribute(n, '' + s)
          : e.removeAttribute(n);
        break;
      case 'inert':
      case 'allowFullScreen':
      case 'async':
      case 'autoPlay':
      case 'controls':
      case 'default':
      case 'defer':
      case 'disabled':
      case 'disablePictureInPicture':
      case 'disableRemotePlayback':
      case 'formNoValidate':
      case 'hidden':
      case 'loop':
      case 'noModule':
      case 'noValidate':
      case 'open':
      case 'playsInline':
      case 'readOnly':
      case 'required':
      case 'reversed':
      case 'scoped':
      case 'seamless':
      case 'itemScope':
        s && typeof s != 'function' && typeof s != 'symbol'
          ? e.setAttribute(n, '')
          : e.removeAttribute(n);
        break;
      case 'capture':
      case 'download':
        s === !0
          ? e.setAttribute(n, '')
          : s !== !1 && s != null && typeof s != 'function' && typeof s != 'symbol'
            ? e.setAttribute(n, s)
            : e.removeAttribute(n);
        break;
      case 'cols':
      case 'rows':
      case 'size':
      case 'span':
        s != null && typeof s != 'function' && typeof s != 'symbol' && !isNaN(s) && 1 <= s
          ? e.setAttribute(n, s)
          : e.removeAttribute(n);
        break;
      case 'rowSpan':
      case 'start':
        s == null || typeof s == 'function' || typeof s == 'symbol' || isNaN(s)
          ? e.removeAttribute(n)
          : e.setAttribute(n, s);
        break;
      case 'popover':
        (G('beforetoggle', e), G('toggle', e), zi(e, 'popover', s));
        break;
      case 'xlinkActuate':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:actuate', s);
        break;
      case 'xlinkArcrole':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:arcrole', s);
        break;
      case 'xlinkRole':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:role', s);
        break;
      case 'xlinkShow':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:show', s);
        break;
      case 'xlinkTitle':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:title', s);
        break;
      case 'xlinkType':
        ua(e, 'http://www.w3.org/1999/xlink', 'xlink:type', s);
        break;
      case 'xmlBase':
        ua(e, 'http://www.w3.org/XML/1998/namespace', 'xml:base', s);
        break;
      case 'xmlLang':
        ua(e, 'http://www.w3.org/XML/1998/namespace', 'xml:lang', s);
        break;
      case 'xmlSpace':
        ua(e, 'http://www.w3.org/XML/1998/namespace', 'xml:space', s);
        break;
      case 'is':
        zi(e, 'is', s);
        break;
      case 'innerText':
      case 'textContent':
        break;
      default:
        (!(2 < n.length) || (n[0] !== 'o' && n[0] !== 'O') || (n[1] !== 'n' && n[1] !== 'N')) &&
          ((n = Dm.get(n) || n), zi(e, n, s));
    }
  }
  function Uo(e, a, n, s, i, l) {
    switch (n) {
      case 'style':
        kc(e, s, l);
        break;
      case 'dangerouslySetInnerHTML':
        if (s != null) {
          if (typeof s != 'object' || !('__html' in s)) throw Error(u(61));
          if (((n = s.__html), n != null)) {
            if (i.children != null) throw Error(u(60));
            e.innerHTML = n;
          }
        }
        break;
      case 'children':
        typeof s == 'string'
          ? On(e, s)
          : (typeof s == 'number' || typeof s == 'bigint') && On(e, '' + s);
        break;
      case 'onScroll':
        s != null && G('scroll', e);
        break;
      case 'onScrollEnd':
        s != null && G('scrollend', e);
        break;
      case 'onClick':
        s != null && (e.onclick = ma);
        break;
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'innerHTML':
      case 'ref':
        break;
      case 'innerText':
      case 'textContent':
        break;
      default:
        if (!zt.hasOwnProperty(n))
          e: {
            if (
              n[0] === 'o' &&
              n[1] === 'n' &&
              ((i = n.endsWith('Capture')),
              (a = n.slice(2, i ? n.length - 7 : void 0)),
              (l = e[ve] || null),
              (l = l != null ? l[n] : null),
              typeof l == 'function' && e.removeEventListener(a, l, i),
              typeof s == 'function')
            ) {
              (typeof l != 'function' &&
                l !== null &&
                (n in e ? (e[n] = null) : e.hasAttribute(n) && e.removeAttribute(n)),
                e.addEventListener(a, s, i));
              break e;
            }
            n in e ? (e[n] = s) : s === !0 ? e.setAttribute(n, '') : zi(e, n, s);
          }
    }
  }
  function $e(e, a, n) {
    switch (a) {
      case 'div':
      case 'span':
      case 'svg':
      case 'path':
      case 'a':
      case 'g':
      case 'p':
      case 'li':
        break;
      case 'img':
        (G('error', e), G('load', e));
        var s = !1,
          i = !1,
          l;
        for (l in n)
          if (n.hasOwnProperty(l)) {
            var r = n[l];
            if (r != null)
              switch (l) {
                case 'src':
                  s = !0;
                  break;
                case 'srcSet':
                  i = !0;
                  break;
                case 'children':
                case 'dangerouslySetInnerHTML':
                  throw Error(u(137, a));
                default:
                  he(e, a, l, r, n, null);
              }
          }
        (i && he(e, a, 'srcSet', n.srcSet, n, null), s && he(e, a, 'src', n.src, n, null));
        return;
      case 'input':
        G('invalid', e);
        var o = (l = r = i = null),
          c = null,
          y = null;
        for (s in n)
          if (n.hasOwnProperty(s)) {
            var v = n[s];
            if (v != null)
              switch (s) {
                case 'name':
                  i = v;
                  break;
                case 'type':
                  r = v;
                  break;
                case 'checked':
                  c = v;
                  break;
                case 'defaultChecked':
                  y = v;
                  break;
                case 'value':
                  l = v;
                  break;
                case 'defaultValue':
                  o = v;
                  break;
                case 'children':
                case 'dangerouslySetInnerHTML':
                  if (v != null) throw Error(u(137, a));
                  break;
                default:
                  he(e, a, s, v, n, null);
              }
          }
        wc(e, l, o, c, y, r, i, !1);
        return;
      case 'select':
        (G('invalid', e), (s = r = l = null));
        for (i in n)
          if (n.hasOwnProperty(i) && ((o = n[i]), o != null))
            switch (i) {
              case 'value':
                l = o;
                break;
              case 'defaultValue':
                r = o;
                break;
              case 'multiple':
                s = o;
              default:
                he(e, a, i, o, n, null);
            }
        ((a = l),
          (n = r),
          (e.multiple = !!s),
          a != null ? Ln(e, !!s, a, !1) : n != null && Ln(e, !!s, n, !0));
        return;
      case 'textarea':
        (G('invalid', e), (l = i = s = null));
        for (r in n)
          if (n.hasOwnProperty(r) && ((o = n[r]), o != null))
            switch (r) {
              case 'value':
                s = o;
                break;
              case 'defaultValue':
                i = o;
                break;
              case 'children':
                l = o;
                break;
              case 'dangerouslySetInnerHTML':
                if (o != null) throw Error(u(91));
                break;
              default:
                he(e, a, r, o, n, null);
            }
        Tc(e, s, i, l);
        return;
      case 'option':
        for (c in n)
          n.hasOwnProperty(c) &&
            ((s = n[c]), s != null) &&
            (c === 'selected'
              ? (e.selected = s && typeof s != 'function' && typeof s != 'symbol')
              : he(e, a, c, s, n, null));
        return;
      case 'dialog':
        (G('beforetoggle', e), G('toggle', e), G('cancel', e), G('close', e));
        break;
      case 'iframe':
      case 'object':
        G('load', e);
        break;
      case 'video':
      case 'audio':
        for (s = 0; s < ii.length; s++) G(ii[s], e);
        break;
      case 'image':
        (G('error', e), G('load', e));
        break;
      case 'details':
        G('toggle', e);
        break;
      case 'embed':
      case 'source':
      case 'link':
        (G('error', e), G('load', e));
      case 'area':
      case 'base':
      case 'br':
      case 'col':
      case 'hr':
      case 'keygen':
      case 'meta':
      case 'param':
      case 'track':
      case 'wbr':
      case 'menuitem':
        for (y in n)
          if (n.hasOwnProperty(y) && ((s = n[y]), s != null))
            switch (y) {
              case 'children':
              case 'dangerouslySetInnerHTML':
                throw Error(u(137, a));
              default:
                he(e, a, y, s, n, null);
            }
        return;
      default:
        if (Pl(a)) {
          for (v in n)
            n.hasOwnProperty(v) && ((s = n[v]), s !== void 0 && Uo(e, a, v, s, n, void 0));
          return;
        }
    }
    for (o in n) n.hasOwnProperty(o) && ((s = n[o]), s != null && he(e, a, o, s, n, null));
  }
  function lg(e, a, n, s) {
    switch (a) {
      case 'div':
      case 'span':
      case 'svg':
      case 'path':
      case 'a':
      case 'g':
      case 'p':
      case 'li':
        break;
      case 'input':
        var i = null,
          l = null,
          r = null,
          o = null,
          c = null,
          y = null,
          v = null;
        for (j in n) {
          var T = n[j];
          if (n.hasOwnProperty(j) && T != null)
            switch (j) {
              case 'checked':
                break;
              case 'value':
                break;
              case 'defaultValue':
                c = T;
              default:
                s.hasOwnProperty(j) || he(e, a, j, null, s, T);
            }
        }
        for (var b in s) {
          var j = s[b];
          if (((T = n[b]), s.hasOwnProperty(b) && (j != null || T != null)))
            switch (b) {
              case 'type':
                l = j;
                break;
              case 'name':
                i = j;
                break;
              case 'checked':
                y = j;
                break;
              case 'defaultChecked':
                v = j;
                break;
              case 'value':
                r = j;
                break;
              case 'defaultValue':
                o = j;
                break;
              case 'children':
              case 'dangerouslySetInnerHTML':
                if (j != null) throw Error(u(137, a));
                break;
              default:
                j !== T && he(e, a, b, j, s, T);
            }
        }
        Fl(e, r, o, c, y, v, l, i);
        return;
      case 'select':
        j = r = o = b = null;
        for (l in n)
          if (((c = n[l]), n.hasOwnProperty(l) && c != null))
            switch (l) {
              case 'value':
                break;
              case 'multiple':
                j = c;
              default:
                s.hasOwnProperty(l) || he(e, a, l, null, s, c);
            }
        for (i in s)
          if (((l = s[i]), (c = n[i]), s.hasOwnProperty(i) && (l != null || c != null)))
            switch (i) {
              case 'value':
                b = l;
                break;
              case 'defaultValue':
                o = l;
                break;
              case 'multiple':
                r = l;
              default:
                l !== c && he(e, a, i, l, s, c);
            }
        ((a = o),
          (n = r),
          (s = j),
          b != null
            ? Ln(e, !!n, b, !1)
            : !!s != !!n && (a != null ? Ln(e, !!n, a, !0) : Ln(e, !!n, n ? [] : '', !1)));
        return;
      case 'textarea':
        j = b = null;
        for (o in n)
          if (((i = n[o]), n.hasOwnProperty(o) && i != null && !s.hasOwnProperty(o)))
            switch (o) {
              case 'value':
                break;
              case 'children':
                break;
              default:
                he(e, a, o, null, s, i);
            }
        for (r in s)
          if (((i = s[r]), (l = n[r]), s.hasOwnProperty(r) && (i != null || l != null)))
            switch (r) {
              case 'value':
                b = i;
                break;
              case 'defaultValue':
                j = i;
                break;
              case 'children':
                break;
              case 'dangerouslySetInnerHTML':
                if (i != null) throw Error(u(91));
                break;
              default:
                i !== l && he(e, a, r, i, s, l);
            }
        Nc(e, b, j);
        return;
      case 'option':
        for (var C in n)
          ((b = n[C]),
            n.hasOwnProperty(C) &&
              b != null &&
              !s.hasOwnProperty(C) &&
              (C === 'selected' ? (e.selected = !1) : he(e, a, C, null, s, b)));
        for (c in s)
          ((b = s[c]),
            (j = n[c]),
            s.hasOwnProperty(c) &&
              b !== j &&
              (b != null || j != null) &&
              (c === 'selected'
                ? (e.selected = b && typeof b != 'function' && typeof b != 'symbol')
                : he(e, a, c, b, s, j)));
        return;
      case 'img':
      case 'link':
      case 'area':
      case 'base':
      case 'br':
      case 'col':
      case 'embed':
      case 'hr':
      case 'keygen':
      case 'meta':
      case 'param':
      case 'source':
      case 'track':
      case 'wbr':
      case 'menuitem':
        for (var R in n)
          ((b = n[R]),
            n.hasOwnProperty(R) && b != null && !s.hasOwnProperty(R) && he(e, a, R, null, s, b));
        for (y in s)
          if (((b = s[y]), (j = n[y]), s.hasOwnProperty(y) && b !== j && (b != null || j != null)))
            switch (y) {
              case 'children':
              case 'dangerouslySetInnerHTML':
                if (b != null) throw Error(u(137, a));
                break;
              default:
                he(e, a, y, b, s, j);
            }
        return;
      default:
        if (Pl(a)) {
          for (var ue in n)
            ((b = n[ue]),
              n.hasOwnProperty(ue) &&
                b !== void 0 &&
                !s.hasOwnProperty(ue) &&
                Uo(e, a, ue, void 0, s, b));
          for (v in s)
            ((b = s[v]),
              (j = n[v]),
              !s.hasOwnProperty(v) ||
                b === j ||
                (b === void 0 && j === void 0) ||
                Uo(e, a, v, b, s, j));
          return;
        }
    }
    for (var g in n)
      ((b = n[g]),
        n.hasOwnProperty(g) && b != null && !s.hasOwnProperty(g) && he(e, a, g, null, s, b));
    for (T in s)
      ((b = s[T]),
        (j = n[T]),
        !s.hasOwnProperty(T) || b === j || (b == null && j == null) || he(e, a, T, b, s, j));
  }
  function Au(e) {
    switch (e) {
      case 'css':
      case 'script':
      case 'font':
      case 'img':
      case 'image':
      case 'input':
      case 'link':
        return !0;
      default:
        return !1;
    }
  }
  function rg() {
    if (typeof performance.getEntriesByType == 'function') {
      for (
        var e = 0, a = 0, n = performance.getEntriesByType('resource'), s = 0;
        s < n.length;
        s++
      ) {
        var i = n[s],
          l = i.transferSize,
          r = i.initiatorType,
          o = i.duration;
        if (l && o && Au(r)) {
          for (r = 0, o = i.responseEnd, s += 1; s < n.length; s++) {
            var c = n[s],
              y = c.startTime;
            if (y > o) break;
            var v = c.transferSize,
              T = c.initiatorType;
            v && Au(T) && ((c = c.responseEnd), (r += v * (c < o ? 1 : (o - y) / (c - y))));
          }
          if ((--s, (a += (8 * (l + r)) / (i.duration / 1e3)), e++, 10 < e)) break;
        }
      }
      if (0 < e) return a / e / 1e6;
    }
    return navigator.connection && ((e = navigator.connection.downlink), typeof e == 'number')
      ? e
      : 5;
  }
  var qo = null,
    Io = null;
  function El(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Eu(e) {
    switch (e) {
      case 'http://www.w3.org/2000/svg':
        return 1;
      case 'http://www.w3.org/1998/Math/MathML':
        return 2;
      default:
        return 0;
    }
  }
  function Cu(e, a) {
    if (e === 0)
      switch (a) {
        case 'svg':
          return 1;
        case 'math':
          return 2;
        default:
          return 0;
      }
    return e === 1 && a === 'foreignObject' ? 0 : e;
  }
  function Wo(e, a) {
    return (
      e === 'textarea' ||
      e === 'noscript' ||
      typeof a.children == 'string' ||
      typeof a.children == 'number' ||
      typeof a.children == 'bigint' ||
      (typeof a.dangerouslySetInnerHTML == 'object' &&
        a.dangerouslySetInnerHTML !== null &&
        a.dangerouslySetInnerHTML.__html != null)
    );
  }
  var Go = null;
  function og() {
    var e = window.event;
    return e && e.type === 'popstate' ? (e === Go ? !1 : ((Go = e), !0)) : ((Go = null), !1);
  }
  var zu = typeof setTimeout == 'function' ? setTimeout : void 0,
    cg = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    Mu = typeof Promise == 'function' ? Promise : void 0,
    dg =
      typeof queueMicrotask == 'function'
        ? queueMicrotask
        : typeof Mu < 'u'
          ? function (e) {
              return Mu.resolve(null).then(e).catch(hg);
            }
          : zu;
  function hg(e) {
    setTimeout(function () {
      throw e;
    });
  }
  function en(e) {
    return e === 'head';
  }
  function Du(e, a) {
    var n = a,
      s = 0;
    do {
      var i = n.nextSibling;
      if ((e.removeChild(n), i && i.nodeType === 8))
        if (((n = i.data), n === '/$' || n === '/&')) {
          if (s === 0) {
            (e.removeChild(i), ms(a));
            return;
          }
          s--;
        } else if (n === '$' || n === '$?' || n === '$~' || n === '$!' || n === '&') s++;
        else if (n === 'html') ri(e.ownerDocument.documentElement);
        else if (n === 'head') {
          ((n = e.ownerDocument.head), ri(n));
          for (var l = n.firstChild; l; ) {
            var r = l.nextSibling,
              o = l.nodeName;
            (l[M] ||
              o === 'SCRIPT' ||
              o === 'STYLE' ||
              (o === 'LINK' && l.rel.toLowerCase() === 'stylesheet') ||
              n.removeChild(l),
              (l = r));
          }
        } else n === 'body' && ri(e.ownerDocument.body);
      n = i;
    } while (n);
    ms(a);
  }
  function Yu(e, a) {
    var n = e;
    e = 0;
    do {
      var s = n.nextSibling;
      if (
        (n.nodeType === 1
          ? a
            ? ((n._stashedDisplay = n.style.display), (n.style.display = 'none'))
            : ((n.style.display = n._stashedDisplay || ''),
              n.getAttribute('style') === '' && n.removeAttribute('style'))
          : n.nodeType === 3 &&
            (a
              ? ((n._stashedText = n.nodeValue), (n.nodeValue = ''))
              : (n.nodeValue = n._stashedText || '')),
        s && s.nodeType === 8)
      )
        if (((n = s.data), n === '/$')) {
          if (e === 0) break;
          e--;
        } else (n !== '$' && n !== '$?' && n !== '$~' && n !== '$!') || e++;
      n = s;
    } while (n);
  }
  function Zo(e) {
    var a = e.firstChild;
    for (a && a.nodeType === 10 && (a = a.nextSibling); a; ) {
      var n = a;
      switch (((a = a.nextSibling), n.nodeName)) {
        case 'HTML':
        case 'HEAD':
        case 'BODY':
          (Zo(n), h(n));
          continue;
        case 'SCRIPT':
        case 'STYLE':
          continue;
        case 'LINK':
          if (n.rel.toLowerCase() === 'stylesheet') continue;
      }
      e.removeChild(n);
    }
  }
  function ug(e, a, n, s) {
    for (; e.nodeType === 1; ) {
      var i = n;
      if (e.nodeName.toLowerCase() !== a.toLowerCase()) {
        if (!s && (e.nodeName !== 'INPUT' || e.type !== 'hidden')) break;
      } else if (s) {
        if (!e[M])
          switch (a) {
            case 'meta':
              if (!e.hasAttribute('itemprop')) break;
              return e;
            case 'link':
              if (
                ((l = e.getAttribute('rel')),
                l === 'stylesheet' && e.hasAttribute('data-precedence'))
              )
                break;
              if (
                l !== i.rel ||
                e.getAttribute('href') !== (i.href == null || i.href === '' ? null : i.href) ||
                e.getAttribute('crossorigin') !== (i.crossOrigin == null ? null : i.crossOrigin) ||
                e.getAttribute('title') !== (i.title == null ? null : i.title)
              )
                break;
              return e;
            case 'style':
              if (e.hasAttribute('data-precedence')) break;
              return e;
            case 'script':
              if (
                ((l = e.getAttribute('src')),
                (l !== (i.src == null ? null : i.src) ||
                  e.getAttribute('type') !== (i.type == null ? null : i.type) ||
                  e.getAttribute('crossorigin') !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  l &&
                  e.hasAttribute('async') &&
                  !e.hasAttribute('itemprop'))
              )
                break;
              return e;
            default:
              return e;
          }
      } else if (a === 'input' && e.type === 'hidden') {
        var l = i.name == null ? null : '' + i.name;
        if (i.type === 'hidden' && e.getAttribute('name') === l) return e;
      } else return e;
      if (((e = Bt(e.nextSibling)), e === null)) break;
    }
    return null;
  }
  function mg(e, a, n) {
    if (a === '') return null;
    for (; e.nodeType !== 3; )
      if (
        ((e.nodeType !== 1 || e.nodeName !== 'INPUT' || e.type !== 'hidden') && !n) ||
        ((e = Bt(e.nextSibling)), e === null)
      )
        return null;
    return e;
  }
  function Ru(e, a) {
    for (; e.nodeType !== 8; )
      if (
        ((e.nodeType !== 1 || e.nodeName !== 'INPUT' || e.type !== 'hidden') && !a) ||
        ((e = Bt(e.nextSibling)), e === null)
      )
        return null;
    return e;
  }
  function Qo(e) {
    return e.data === '$?' || e.data === '$~';
  }
  function Xo(e) {
    return e.data === '$!' || (e.data === '$?' && e.ownerDocument.readyState !== 'loading');
  }
  function fg(e, a) {
    var n = e.ownerDocument;
    if (e.data === '$~') e._reactRetry = a;
    else if (e.data !== '$?' || n.readyState !== 'loading') a();
    else {
      var s = function () {
        (a(), n.removeEventListener('DOMContentLoaded', s));
      };
      (n.addEventListener('DOMContentLoaded', s), (e._reactRetry = s));
    }
  }
  function Bt(e) {
    for (; e != null; e = e.nextSibling) {
      var a = e.nodeType;
      if (a === 1 || a === 3) break;
      if (a === 8) {
        if (
          ((a = e.data),
          a === '$' ||
            a === '$!' ||
            a === '$?' ||
            a === '$~' ||
            a === '&' ||
            a === 'F!' ||
            a === 'F')
        )
          break;
        if (a === '/$' || a === '/&') return null;
      }
    }
    return e;
  }
  var Vo = null;
  function Lu(e) {
    e = e.nextSibling;
    for (var a = 0; e; ) {
      if (e.nodeType === 8) {
        var n = e.data;
        if (n === '/$' || n === '/&') {
          if (a === 0) return Bt(e.nextSibling);
          a--;
        } else (n !== '$' && n !== '$!' && n !== '$?' && n !== '$~' && n !== '&') || a++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Ou(e) {
    e = e.previousSibling;
    for (var a = 0; e; ) {
      if (e.nodeType === 8) {
        var n = e.data;
        if (n === '$' || n === '$!' || n === '$?' || n === '$~' || n === '&') {
          if (a === 0) return e;
          a--;
        } else (n !== '/$' && n !== '/&') || a++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function Hu(e, a, n) {
    switch (((a = El(n)), e)) {
      case 'html':
        if (((e = a.documentElement), !e)) throw Error(u(452));
        return e;
      case 'head':
        if (((e = a.head), !e)) throw Error(u(453));
        return e;
      case 'body':
        if (((e = a.body), !e)) throw Error(u(454));
        return e;
      default:
        throw Error(u(451));
    }
  }
  function ri(e) {
    for (var a = e.attributes; a.length; ) e.removeAttributeNode(a[0]);
    h(e);
  }
  var Ut = new Map(),
    _u = new Set();
  function Cl(e) {
    return typeof e.getRootNode == 'function'
      ? e.getRootNode()
      : e.nodeType === 9
        ? e
        : e.ownerDocument;
  }
  var Ca = A.d;
  A.d = { f: gg, r: xg, D: pg, C: yg, L: bg, m: jg, X: wg, S: vg, M: Ng };
  function gg() {
    var e = Ca.f(),
      a = jl();
    return e || a;
  }
  function xg(e) {
    var a = E(e);
    a !== null && a.tag === 5 && a.type === 'form' ? th(a) : Ca.r(e);
  }
  var ds = typeof document > 'u' ? null : document;
  function Bu(e, a, n) {
    var s = ds;
    if (s && typeof a == 'string' && a) {
      var i = Dt(a);
      ((i = 'link[rel="' + e + '"][href="' + i + '"]'),
        typeof n == 'string' && (i += '[crossorigin="' + n + '"]'),
        _u.has(i) ||
          (_u.add(i),
          (e = { rel: e, crossOrigin: n, href: a }),
          s.querySelector(i) === null &&
            ((a = s.createElement('link')), $e(a, 'link', e), U(a), s.head.appendChild(a))));
    }
  }
  function pg(e) {
    (Ca.D(e), Bu('dns-prefetch', e, null));
  }
  function yg(e, a) {
    (Ca.C(e, a), Bu('preconnect', e, a));
  }
  function bg(e, a, n) {
    Ca.L(e, a, n);
    var s = ds;
    if (s && e && a) {
      var i = 'link[rel="preload"][as="' + Dt(a) + '"]';
      a === 'image' && n && n.imageSrcSet
        ? ((i += '[imagesrcset="' + Dt(n.imageSrcSet) + '"]'),
          typeof n.imageSizes == 'string' && (i += '[imagesizes="' + Dt(n.imageSizes) + '"]'))
        : (i += '[href="' + Dt(e) + '"]');
      var l = i;
      switch (a) {
        case 'style':
          l = hs(e);
          break;
        case 'script':
          l = us(e);
      }
      Ut.has(l) ||
        ((e = L(
          { rel: 'preload', href: a === 'image' && n && n.imageSrcSet ? void 0 : e, as: a },
          n
        )),
        Ut.set(l, e),
        s.querySelector(i) !== null ||
          (a === 'style' && s.querySelector(oi(l))) ||
          (a === 'script' && s.querySelector(ci(l))) ||
          ((a = s.createElement('link')), $e(a, 'link', e), U(a), s.head.appendChild(a)));
    }
  }
  function jg(e, a) {
    Ca.m(e, a);
    var n = ds;
    if (n && e) {
      var s = a && typeof a.as == 'string' ? a.as : 'script',
        i = 'link[rel="modulepreload"][as="' + Dt(s) + '"][href="' + Dt(e) + '"]',
        l = i;
      switch (s) {
        case 'audioworklet':
        case 'paintworklet':
        case 'serviceworker':
        case 'sharedworker':
        case 'worker':
        case 'script':
          l = us(e);
      }
      if (
        !Ut.has(l) &&
        ((e = L({ rel: 'modulepreload', href: e }, a)), Ut.set(l, e), n.querySelector(i) === null)
      ) {
        switch (s) {
          case 'audioworklet':
          case 'paintworklet':
          case 'serviceworker':
          case 'sharedworker':
          case 'worker':
          case 'script':
            if (n.querySelector(ci(l))) return;
        }
        ((s = n.createElement('link')), $e(s, 'link', e), U(s), n.head.appendChild(s));
      }
    }
  }
  function vg(e, a, n) {
    Ca.S(e, a, n);
    var s = ds;
    if (s && e) {
      var i = Ne(s).hoistableStyles,
        l = hs(e);
      a = a || 'default';
      var r = i.get(l);
      if (!r) {
        var o = { loading: 0, preload: null };
        if ((r = s.querySelector(oi(l)))) o.loading = 5;
        else {
          ((e = L({ rel: 'stylesheet', href: e, 'data-precedence': a }, n)),
            (n = Ut.get(l)) && Ko(e, n));
          var c = (r = s.createElement('link'));
          (U(c),
            $e(c, 'link', e),
            (c._p = new Promise(function (y, v) {
              ((c.onload = y), (c.onerror = v));
            })),
            c.addEventListener('load', function () {
              o.loading |= 1;
            }),
            c.addEventListener('error', function () {
              o.loading |= 2;
            }),
            (o.loading |= 4),
            zl(r, a, s));
        }
        ((r = { type: 'stylesheet', instance: r, count: 1, state: o }), i.set(l, r));
      }
    }
  }
  function wg(e, a) {
    Ca.X(e, a);
    var n = ds;
    if (n && e) {
      var s = Ne(n).hoistableScripts,
        i = us(e),
        l = s.get(i);
      l ||
        ((l = n.querySelector(ci(i))),
        l ||
          ((e = L({ src: e, async: !0 }, a)),
          (a = Ut.get(i)) && Jo(e, a),
          (l = n.createElement('script')),
          U(l),
          $e(l, 'link', e),
          n.head.appendChild(l)),
        (l = { type: 'script', instance: l, count: 1, state: null }),
        s.set(i, l));
    }
  }
  function Ng(e, a) {
    Ca.M(e, a);
    var n = ds;
    if (n && e) {
      var s = Ne(n).hoistableScripts,
        i = us(e),
        l = s.get(i);
      l ||
        ((l = n.querySelector(ci(i))),
        l ||
          ((e = L({ src: e, async: !0, type: 'module' }, a)),
          (a = Ut.get(i)) && Jo(e, a),
          (l = n.createElement('script')),
          U(l),
          $e(l, 'link', e),
          n.head.appendChild(l)),
        (l = { type: 'script', instance: l, count: 1, state: null }),
        s.set(i, l));
    }
  }
  function Uu(e, a, n, s) {
    var i = (i = rt.current) ? Cl(i) : null;
    if (!i) throw Error(u(446));
    switch (e) {
      case 'meta':
      case 'title':
        return null;
      case 'style':
        return typeof n.precedence == 'string' && typeof n.href == 'string'
          ? ((a = hs(n.href)),
            (n = Ne(i).hoistableStyles),
            (s = n.get(a)),
            s || ((s = { type: 'style', instance: null, count: 0, state: null }), n.set(a, s)),
            s)
          : { type: 'void', instance: null, count: 0, state: null };
      case 'link':
        if (
          n.rel === 'stylesheet' &&
          typeof n.href == 'string' &&
          typeof n.precedence == 'string'
        ) {
          e = hs(n.href);
          var l = Ne(i).hoistableStyles,
            r = l.get(e);
          if (
            (r ||
              ((i = i.ownerDocument || i),
              (r = {
                type: 'stylesheet',
                instance: null,
                count: 0,
                state: { loading: 0, preload: null },
              }),
              l.set(e, r),
              (l = i.querySelector(oi(e))) && !l._p && ((r.instance = l), (r.state.loading = 5)),
              Ut.has(e) ||
                ((n = {
                  rel: 'preload',
                  as: 'style',
                  href: n.href,
                  crossOrigin: n.crossOrigin,
                  integrity: n.integrity,
                  media: n.media,
                  hrefLang: n.hrefLang,
                  referrerPolicy: n.referrerPolicy,
                }),
                Ut.set(e, n),
                l || Tg(i, e, n, r.state))),
            a && s === null)
          )
            throw Error(u(528, ''));
          return r;
        }
        if (a && s !== null) throw Error(u(529, ''));
        return null;
      case 'script':
        return (
          (a = n.async),
          (n = n.src),
          typeof n == 'string' && a && typeof a != 'function' && typeof a != 'symbol'
            ? ((a = us(n)),
              (n = Ne(i).hoistableScripts),
              (s = n.get(a)),
              s || ((s = { type: 'script', instance: null, count: 0, state: null }), n.set(a, s)),
              s)
            : { type: 'void', instance: null, count: 0, state: null }
        );
      default:
        throw Error(u(444, e));
    }
  }
  function hs(e) {
    return 'href="' + Dt(e) + '"';
  }
  function oi(e) {
    return 'link[rel="stylesheet"][' + e + ']';
  }
  function qu(e) {
    return L({}, e, { 'data-precedence': e.precedence, precedence: null });
  }
  function Tg(e, a, n, s) {
    e.querySelector('link[rel="preload"][as="style"][' + a + ']')
      ? (s.loading = 1)
      : ((a = e.createElement('link')),
        (s.preload = a),
        a.addEventListener('load', function () {
          return (s.loading |= 1);
        }),
        a.addEventListener('error', function () {
          return (s.loading |= 2);
        }),
        $e(a, 'link', n),
        U(a),
        e.head.appendChild(a));
  }
  function us(e) {
    return '[src="' + Dt(e) + '"]';
  }
  function ci(e) {
    return 'script[async]' + e;
  }
  function Iu(e, a, n) {
    if ((a.count++, a.instance === null))
      switch (a.type) {
        case 'style':
          var s = e.querySelector('style[data-href~="' + Dt(n.href) + '"]');
          if (s) return ((a.instance = s), U(s), s);
          var i = L({}, n, {
            'data-href': n.href,
            'data-precedence': n.precedence,
            href: null,
            precedence: null,
          });
          return (
            (s = (e.ownerDocument || e).createElement('style')),
            U(s),
            $e(s, 'style', i),
            zl(s, n.precedence, e),
            (a.instance = s)
          );
        case 'stylesheet':
          i = hs(n.href);
          var l = e.querySelector(oi(i));
          if (l) return ((a.state.loading |= 4), (a.instance = l), U(l), l);
          ((s = qu(n)),
            (i = Ut.get(i)) && Ko(s, i),
            (l = (e.ownerDocument || e).createElement('link')),
            U(l));
          var r = l;
          return (
            (r._p = new Promise(function (o, c) {
              ((r.onload = o), (r.onerror = c));
            })),
            $e(l, 'link', s),
            (a.state.loading |= 4),
            zl(l, n.precedence, e),
            (a.instance = l)
          );
        case 'script':
          return (
            (l = us(n.src)),
            (i = e.querySelector(ci(l)))
              ? ((a.instance = i), U(i), i)
              : ((s = n),
                (i = Ut.get(l)) && ((s = L({}, n)), Jo(s, i)),
                (e = e.ownerDocument || e),
                (i = e.createElement('script')),
                U(i),
                $e(i, 'link', s),
                e.head.appendChild(i),
                (a.instance = i))
          );
        case 'void':
          return null;
        default:
          throw Error(u(443, a.type));
      }
    else
      a.type === 'stylesheet' &&
        (a.state.loading & 4) === 0 &&
        ((s = a.instance), (a.state.loading |= 4), zl(s, n.precedence, e));
    return a.instance;
  }
  function zl(e, a, n) {
    for (
      var s = n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),
        i = s.length ? s[s.length - 1] : null,
        l = i,
        r = 0;
      r < s.length;
      r++
    ) {
      var o = s[r];
      if (o.dataset.precedence === a) l = o;
      else if (l !== i) break;
    }
    l
      ? l.parentNode.insertBefore(e, l.nextSibling)
      : ((a = n.nodeType === 9 ? n.head : n), a.insertBefore(e, a.firstChild));
  }
  function Ko(e, a) {
    (e.crossOrigin == null && (e.crossOrigin = a.crossOrigin),
      e.referrerPolicy == null && (e.referrerPolicy = a.referrerPolicy),
      e.title == null && (e.title = a.title));
  }
  function Jo(e, a) {
    (e.crossOrigin == null && (e.crossOrigin = a.crossOrigin),
      e.referrerPolicy == null && (e.referrerPolicy = a.referrerPolicy),
      e.integrity == null && (e.integrity = a.integrity));
  }
  var Ml = null;
  function Wu(e, a, n) {
    if (Ml === null) {
      var s = new Map(),
        i = (Ml = new Map());
      i.set(n, s);
    } else ((i = Ml), (s = i.get(n)), s || ((s = new Map()), i.set(n, s)));
    if (s.has(e)) return s;
    for (s.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
      var l = n[i];
      if (
        !(l[M] || l[Re] || (e === 'link' && l.getAttribute('rel') === 'stylesheet')) &&
        l.namespaceURI !== 'http://www.w3.org/2000/svg'
      ) {
        var r = l.getAttribute(a) || '';
        r = e + r;
        var o = s.get(r);
        o ? o.push(l) : s.set(r, [l]);
      }
    }
    return s;
  }
  function Gu(e, a, n) {
    ((e = e.ownerDocument || e),
      e.head.insertBefore(n, a === 'title' ? e.querySelector('head > title') : null));
  }
  function Sg(e, a, n) {
    if (n === 1 || a.itemProp != null) return !1;
    switch (e) {
      case 'meta':
      case 'title':
        return !0;
      case 'style':
        if (typeof a.precedence != 'string' || typeof a.href != 'string' || a.href === '') break;
        return !0;
      case 'link':
        if (
          typeof a.rel != 'string' ||
          typeof a.href != 'string' ||
          a.href === '' ||
          a.onLoad ||
          a.onError
        )
          break;
        return a.rel === 'stylesheet'
          ? ((e = a.disabled), typeof a.precedence == 'string' && e == null)
          : !0;
      case 'script':
        if (
          a.async &&
          typeof a.async != 'function' &&
          typeof a.async != 'symbol' &&
          !a.onLoad &&
          !a.onError &&
          a.src &&
          typeof a.src == 'string'
        )
          return !0;
    }
    return !1;
  }
  function Zu(e) {
    return !(e.type === 'stylesheet' && (e.state.loading & 3) === 0);
  }
  function kg(e, a, n, s) {
    if (
      n.type === 'stylesheet' &&
      (typeof s.media != 'string' || matchMedia(s.media).matches !== !1) &&
      (n.state.loading & 4) === 0
    ) {
      if (n.instance === null) {
        var i = hs(s.href),
          l = a.querySelector(oi(i));
        if (l) {
          ((a = l._p),
            a !== null &&
              typeof a == 'object' &&
              typeof a.then == 'function' &&
              (e.count++, (e = Dl.bind(e)), a.then(e, e)),
            (n.state.loading |= 4),
            (n.instance = l),
            U(l));
          return;
        }
        ((l = a.ownerDocument || a),
          (s = qu(s)),
          (i = Ut.get(i)) && Ko(s, i),
          (l = l.createElement('link')),
          U(l));
        var r = l;
        ((r._p = new Promise(function (o, c) {
          ((r.onload = o), (r.onerror = c));
        })),
          $e(l, 'link', s),
          (n.instance = l));
      }
      (e.stylesheets === null && (e.stylesheets = new Map()),
        e.stylesheets.set(n, a),
        (a = n.state.preload) &&
          (n.state.loading & 3) === 0 &&
          (e.count++,
          (n = Dl.bind(e)),
          a.addEventListener('load', n),
          a.addEventListener('error', n)));
    }
  }
  var Fo = 0;
  function Ag(e, a) {
    return (
      e.stylesheets && e.count === 0 && Rl(e, e.stylesheets),
      0 < e.count || 0 < e.imgCount
        ? function (n) {
            var s = setTimeout(function () {
              if ((e.stylesheets && Rl(e, e.stylesheets), e.unsuspend)) {
                var l = e.unsuspend;
                ((e.unsuspend = null), l());
              }
            }, 6e4 + a);
            0 < e.imgBytes && Fo === 0 && (Fo = 62500 * rg());
            var i = setTimeout(
              function () {
                if (
                  ((e.waitingForImages = !1),
                  e.count === 0 && (e.stylesheets && Rl(e, e.stylesheets), e.unsuspend))
                ) {
                  var l = e.unsuspend;
                  ((e.unsuspend = null), l());
                }
              },
              (e.imgBytes > Fo ? 50 : 800) + a
            );
            return (
              (e.unsuspend = n),
              function () {
                ((e.unsuspend = null), clearTimeout(s), clearTimeout(i));
              }
            );
          }
        : null
    );
  }
  function Dl() {
    if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
      if (this.stylesheets) Rl(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        ((this.unsuspend = null), e());
      }
    }
  }
  var Yl = null;
  function Rl(e, a) {
    ((e.stylesheets = null),
      e.unsuspend !== null &&
        (e.count++, (Yl = new Map()), a.forEach(Eg, e), (Yl = null), Dl.call(e)));
  }
  function Eg(e, a) {
    if (!(a.state.loading & 4)) {
      var n = Yl.get(e);
      if (n) var s = n.get(null);
      else {
        ((n = new Map()), Yl.set(e, n));
        for (
          var i = e.querySelectorAll('link[data-precedence],style[data-precedence]'), l = 0;
          l < i.length;
          l++
        ) {
          var r = i[l];
          (r.nodeName === 'LINK' || r.getAttribute('media') !== 'not all') &&
            (n.set(r.dataset.precedence, r), (s = r));
        }
        s && n.set(null, s);
      }
      ((i = a.instance),
        (r = i.getAttribute('data-precedence')),
        (l = n.get(r) || s),
        l === s && n.set(null, i),
        n.set(r, i),
        this.count++,
        (s = Dl.bind(this)),
        i.addEventListener('load', s),
        i.addEventListener('error', s),
        l
          ? l.parentNode.insertBefore(i, l.nextSibling)
          : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(i, e.firstChild)),
        (a.state.loading |= 4));
    }
  }
  var di = {
    $$typeof: Z,
    Provider: null,
    Consumer: null,
    _currentValue: O,
    _currentValue2: O,
    _threadCount: 0,
  };
  function Cg(e, a, n, s, i, l, r, o, c) {
    ((this.tag = 1),
      (this.containerInfo = e),
      (this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode =
        this.next =
        this.pendingContext =
        this.context =
        this.cancelPendingCommit =
          null),
      (this.callbackPriority = 0),
      (this.expirationTimes = bs(-1)),
      (this.entangledLanes =
        this.shellSuspendCounter =
        this.errorRecoveryDisabledLanes =
        this.expiredLanes =
        this.warmLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = bs(0)),
      (this.hiddenUpdates = bs(null)),
      (this.identifierPrefix = s),
      (this.onUncaughtError = i),
      (this.onCaughtError = l),
      (this.onRecoverableError = r),
      (this.pooledCache = null),
      (this.pooledCacheLanes = 0),
      (this.formState = c),
      (this.incompleteTransitions = new Map()));
  }
  function Qu(e, a, n, s, i, l, r, o, c, y, v, T) {
    return (
      (e = new Cg(e, a, n, r, c, y, v, T, o)),
      (a = 1),
      l === !0 && (a |= 24),
      (l = wt(3, null, null, a)),
      (e.current = l),
      (l.stateNode = e),
      (a = Cr()),
      a.refCount++,
      (e.pooledCache = a),
      a.refCount++,
      (l.memoizedState = { element: s, isDehydrated: n, cache: a }),
      Yr(l),
      e
    );
  }
  function Xu(e) {
    return e ? ((e = Wn), e) : Wn;
  }
  function Vu(e, a, n, s, i, l) {
    ((i = Xu(i)),
      s.context === null ? (s.context = i) : (s.pendingContext = i),
      (s = Wa(a)),
      (s.payload = { element: n }),
      (l = l === void 0 ? null : l),
      l !== null && (s.callback = l),
      (n = Ga(e, s, a)),
      n !== null && (gt(n, e, a), Is(n, e, a)));
  }
  function Ku(e, a) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
      var n = e.retryLane;
      e.retryLane = n !== 0 && n < a ? n : a;
    }
  }
  function $o(e, a) {
    (Ku(e, a), (e = e.alternate) && Ku(e, a));
  }
  function Ju(e) {
    if (e.tag === 13 || e.tag === 31) {
      var a = xn(e, 67108864);
      (a !== null && gt(a, e, 67108864), $o(e, 67108864));
    }
  }
  function Fu(e) {
    if (e.tag === 13 || e.tag === 31) {
      var a = At();
      a = ot(a);
      var n = xn(e, a);
      (n !== null && gt(n, e, a), $o(e, a));
    }
  }
  var Ll = !0;
  function zg(e, a, n, s) {
    var i = N.T;
    N.T = null;
    var l = A.p;
    try {
      ((A.p = 2), Po(e, a, n, s));
    } finally {
      ((A.p = l), (N.T = i));
    }
  }
  function Mg(e, a, n, s) {
    var i = N.T;
    N.T = null;
    var l = A.p;
    try {
      ((A.p = 8), Po(e, a, n, s));
    } finally {
      ((A.p = l), (N.T = i));
    }
  }
  function Po(e, a, n, s) {
    if (Ll) {
      var i = ec(s);
      if (i === null) (Bo(e, a, s, Ol, n), Pu(e, s));
      else if (Yg(i, e, a, n, s)) s.stopPropagation();
      else if ((Pu(e, s), a & 4 && -1 < Dg.indexOf(e))) {
        for (; i !== null; ) {
          var l = E(i);
          if (l !== null)
            switch (l.tag) {
              case 3:
                if (((l = l.stateNode), l.current.memoizedState.isDehydrated)) {
                  var r = jt(l.pendingLanes);
                  if (r !== 0) {
                    var o = l;
                    for (o.pendingLanes |= 2, o.entangledLanes |= 2; r; ) {
                      var c = 1 << (31 - Ye(r));
                      ((o.entanglements[1] |= c), (r &= ~c));
                    }
                    (ta(l), (ae & 6) === 0 && ((yl = Xe() + 500), si(0)));
                  }
                }
                break;
              case 31:
              case 13:
                ((o = xn(l, 2)), o !== null && gt(o, l, 2), jl(), $o(l, 2));
            }
          if (((l = ec(s)), l === null && Bo(e, a, s, Ol, n), l === i)) break;
          i = l;
        }
        i !== null && s.stopPropagation();
      } else Bo(e, a, s, null, n);
    }
  }
  function ec(e) {
    return ((e = tr(e)), tc(e));
  }
  var Ol = null;
  function tc(e) {
    if (((Ol = null), (e = S(e)), e !== null)) {
      var a = z(e);
      if (a === null) e = null;
      else {
        var n = a.tag;
        if (n === 13) {
          if (((e = q(a)), e !== null)) return e;
          e = null;
        } else if (n === 31) {
          if (((e = $(a)), e !== null)) return e;
          e = null;
        } else if (n === 3) {
          if (a.stateNode.current.memoizedState.isDehydrated)
            return a.tag === 3 ? a.stateNode.containerInfo : null;
          e = null;
        } else a !== e && (e = null);
      }
    }
    return ((Ol = e), null);
  }
  function $u(e) {
    switch (e) {
      case 'beforetoggle':
      case 'cancel':
      case 'click':
      case 'close':
      case 'contextmenu':
      case 'copy':
      case 'cut':
      case 'auxclick':
      case 'dblclick':
      case 'dragend':
      case 'dragstart':
      case 'drop':
      case 'focusin':
      case 'focusout':
      case 'input':
      case 'invalid':
      case 'keydown':
      case 'keypress':
      case 'keyup':
      case 'mousedown':
      case 'mouseup':
      case 'paste':
      case 'pause':
      case 'play':
      case 'pointercancel':
      case 'pointerdown':
      case 'pointerup':
      case 'ratechange':
      case 'reset':
      case 'resize':
      case 'seeked':
      case 'submit':
      case 'toggle':
      case 'touchcancel':
      case 'touchend':
      case 'touchstart':
      case 'volumechange':
      case 'change':
      case 'selectionchange':
      case 'textInput':
      case 'compositionstart':
      case 'compositionend':
      case 'compositionupdate':
      case 'beforeblur':
      case 'afterblur':
      case 'beforeinput':
      case 'blur':
      case 'fullscreenchange':
      case 'focus':
      case 'hashchange':
      case 'popstate':
      case 'select':
      case 'selectstart':
        return 2;
      case 'drag':
      case 'dragenter':
      case 'dragexit':
      case 'dragleave':
      case 'dragover':
      case 'mousemove':
      case 'mouseout':
      case 'mouseover':
      case 'pointermove':
      case 'pointerout':
      case 'pointerover':
      case 'scroll':
      case 'touchmove':
      case 'wheel':
      case 'mouseenter':
      case 'mouseleave':
      case 'pointerenter':
      case 'pointerleave':
        return 8;
      case 'message':
        switch (hn()) {
          case ra:
            return 2;
          case bt:
            return 8;
          case La:
          case Ti:
            return 32;
          case gs:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var ac = !1,
    tn = null,
    an = null,
    nn = null,
    hi = new Map(),
    ui = new Map(),
    sn = [],
    Dg =
      'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset'.split(
        ' '
      );
  function Pu(e, a) {
    switch (e) {
      case 'focusin':
      case 'focusout':
        tn = null;
        break;
      case 'dragenter':
      case 'dragleave':
        an = null;
        break;
      case 'mouseover':
      case 'mouseout':
        nn = null;
        break;
      case 'pointerover':
      case 'pointerout':
        hi.delete(a.pointerId);
        break;
      case 'gotpointercapture':
      case 'lostpointercapture':
        ui.delete(a.pointerId);
    }
  }
  function mi(e, a, n, s, i, l) {
    return e === null || e.nativeEvent !== l
      ? ((e = {
          blockedOn: a,
          domEventName: n,
          eventSystemFlags: s,
          nativeEvent: l,
          targetContainers: [i],
        }),
        a !== null && ((a = E(a)), a !== null && Ju(a)),
        e)
      : ((e.eventSystemFlags |= s),
        (a = e.targetContainers),
        i !== null && a.indexOf(i) === -1 && a.push(i),
        e);
  }
  function Yg(e, a, n, s, i) {
    switch (a) {
      case 'focusin':
        return ((tn = mi(tn, e, a, n, s, i)), !0);
      case 'dragenter':
        return ((an = mi(an, e, a, n, s, i)), !0);
      case 'mouseover':
        return ((nn = mi(nn, e, a, n, s, i)), !0);
      case 'pointerover':
        var l = i.pointerId;
        return (hi.set(l, mi(hi.get(l) || null, e, a, n, s, i)), !0);
      case 'gotpointercapture':
        return ((l = i.pointerId), ui.set(l, mi(ui.get(l) || null, e, a, n, s, i)), !0);
    }
    return !1;
  }
  function em(e) {
    var a = S(e.target);
    if (a !== null) {
      var n = z(a);
      if (n !== null) {
        if (((a = n.tag), a === 13)) {
          if (((a = q(n)), a !== null)) {
            ((e.blockedOn = a),
              Ts(e.priority, function () {
                Fu(n);
              }));
            return;
          }
        } else if (a === 31) {
          if (((a = $(n)), a !== null)) {
            ((e.blockedOn = a),
              Ts(e.priority, function () {
                Fu(n);
              }));
            return;
          }
        } else if (a === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function Hl(e) {
    if (e.blockedOn !== null) return !1;
    for (var a = e.targetContainers; 0 < a.length; ) {
      var n = ec(e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        var s = new n.constructor(n.type, n);
        ((er = s), n.target.dispatchEvent(s), (er = null));
      } else return ((a = E(n)), a !== null && Ju(a), (e.blockedOn = n), !1);
      a.shift();
    }
    return !0;
  }
  function tm(e, a, n) {
    Hl(e) && n.delete(a);
  }
  function Rg() {
    ((ac = !1),
      tn !== null && Hl(tn) && (tn = null),
      an !== null && Hl(an) && (an = null),
      nn !== null && Hl(nn) && (nn = null),
      hi.forEach(tm),
      ui.forEach(tm));
  }
  function _l(e, a) {
    e.blockedOn === a &&
      ((e.blockedOn = null),
      ac || ((ac = !0), d.unstable_scheduleCallback(d.unstable_NormalPriority, Rg)));
  }
  var Bl = null;
  function am(e) {
    Bl !== e &&
      ((Bl = e),
      d.unstable_scheduleCallback(d.unstable_NormalPriority, function () {
        Bl === e && (Bl = null);
        for (var a = 0; a < e.length; a += 3) {
          var n = e[a],
            s = e[a + 1],
            i = e[a + 2];
          if (typeof s != 'function') {
            if (tc(s || n) === null) continue;
            break;
          }
          var l = E(n);
          l !== null &&
            (e.splice(a, 3),
            (a -= 3),
            Pr(l, { pending: !0, data: i, method: n.method, action: s }, s, i));
        }
      }));
  }
  function ms(e) {
    function a(c) {
      return _l(c, e);
    }
    (tn !== null && _l(tn, e),
      an !== null && _l(an, e),
      nn !== null && _l(nn, e),
      hi.forEach(a),
      ui.forEach(a));
    for (var n = 0; n < sn.length; n++) {
      var s = sn[n];
      s.blockedOn === e && (s.blockedOn = null);
    }
    for (; 0 < sn.length && ((n = sn[0]), n.blockedOn === null); )
      (em(n), n.blockedOn === null && sn.shift());
    if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
      for (s = 0; s < n.length; s += 3) {
        var i = n[s],
          l = n[s + 1],
          r = i[ve] || null;
        if (typeof l == 'function') r || am(n);
        else if (r) {
          var o = null;
          if (l && l.hasAttribute('formAction')) {
            if (((i = l), (r = l[ve] || null))) o = r.formAction;
            else if (tc(i) !== null) continue;
          } else o = r.action;
          (typeof o == 'function' ? (n[s + 1] = o) : (n.splice(s, 3), (s -= 3)), am(n));
        }
      }
  }
  function nm() {
    function e(l) {
      l.canIntercept &&
        l.info === 'react-transition' &&
        l.intercept({
          handler: function () {
            return new Promise(function (r) {
              return (i = r);
            });
          },
          focusReset: 'manual',
          scroll: 'manual',
        });
    }
    function a() {
      (i !== null && (i(), (i = null)), s || setTimeout(n, 20));
    }
    function n() {
      if (!s && !navigation.transition) {
        var l = navigation.currentEntry;
        l &&
          l.url != null &&
          navigation.navigate(l.url, {
            state: l.getState(),
            info: 'react-transition',
            history: 'replace',
          });
      }
    }
    if (typeof navigation == 'object') {
      var s = !1,
        i = null;
      return (
        navigation.addEventListener('navigate', e),
        navigation.addEventListener('navigatesuccess', a),
        navigation.addEventListener('navigateerror', a),
        setTimeout(n, 100),
        function () {
          ((s = !0),
            navigation.removeEventListener('navigate', e),
            navigation.removeEventListener('navigatesuccess', a),
            navigation.removeEventListener('navigateerror', a),
            i !== null && (i(), (i = null)));
        }
      );
    }
  }
  function nc(e) {
    this._internalRoot = e;
  }
  ((Ul.prototype.render = nc.prototype.render =
    function (e) {
      var a = this._internalRoot;
      if (a === null) throw Error(u(409));
      var n = a.current,
        s = At();
      Vu(n, s, e, a, null, null);
    }),
    (Ul.prototype.unmount = nc.prototype.unmount =
      function () {
        var e = this._internalRoot;
        if (e !== null) {
          this._internalRoot = null;
          var a = e.containerInfo;
          (Vu(e.current, 2, null, e, null, null), jl(), (a[ha] = null));
        }
      }));
  function Ul(e) {
    this._internalRoot = e;
  }
  Ul.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
      var a = Ns();
      e = { blockedOn: null, target: e, priority: a };
      for (var n = 0; n < sn.length && a !== 0 && a < sn[n].priority; n++);
      (sn.splice(n, 0, e), n === 0 && em(e));
    }
  };
  var sm = f.version;
  if (sm !== '19.2.3') throw Error(u(527, sm, '19.2.3'));
  A.findDOMNode = function (e) {
    var a = e._reactInternals;
    if (a === void 0)
      throw typeof e.render == 'function'
        ? Error(u(188))
        : ((e = Object.keys(e).join(',')), Error(u(268, e)));
    return ((e = me(a)), (e = e !== null ? pt(e) : null), (e = e === null ? null : e.stateNode), e);
  };
  var Lg = {
    bundleType: 0,
    version: '19.2.3',
    rendererPackageName: 'react-dom',
    currentDispatcherRef: N,
    reconcilerVersion: '19.2.3',
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var ql = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!ql.isDisabled && ql.supportsFiber)
      try {
        ((Jt = ql.inject(Lg)), (We = ql));
      } catch {}
  }
  return (
    (gi.createRoot = function (e, a) {
      if (!k(e)) throw Error(u(299));
      var n = !1,
        s = '',
        i = hh,
        l = uh,
        r = mh;
      return (
        a != null &&
          (a.unstable_strictMode === !0 && (n = !0),
          a.identifierPrefix !== void 0 && (s = a.identifierPrefix),
          a.onUncaughtError !== void 0 && (i = a.onUncaughtError),
          a.onCaughtError !== void 0 && (l = a.onCaughtError),
          a.onRecoverableError !== void 0 && (r = a.onRecoverableError)),
        (a = Qu(e, 1, !1, null, null, n, s, null, i, l, r, nm)),
        (e[ha] = a.current),
        _o(e),
        new nc(a)
      );
    }),
    (gi.hydrateRoot = function (e, a, n) {
      if (!k(e)) throw Error(u(299));
      var s = !1,
        i = '',
        l = hh,
        r = uh,
        o = mh,
        c = null;
      return (
        n != null &&
          (n.unstable_strictMode === !0 && (s = !0),
          n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
          n.onUncaughtError !== void 0 && (l = n.onUncaughtError),
          n.onCaughtError !== void 0 && (r = n.onCaughtError),
          n.onRecoverableError !== void 0 && (o = n.onRecoverableError),
          n.formState !== void 0 && (c = n.formState)),
        (a = Qu(e, 1, !0, a, n ?? null, s, i, c, l, r, o, nm)),
        (a.context = Xu(null)),
        (n = a.current),
        (s = At()),
        (s = ot(s)),
        (i = Wa(s)),
        (i.callback = null),
        Ga(n, i, s),
        (n = s),
        (a.current.lanes = n),
        Oa(a, n),
        ta(a),
        (e[ha] = a.current),
        _o(e),
        new Ul(a)
      );
    }),
    (gi.version = '19.2.3'),
    gi
  );
}
var dm;
function Vg() {
  if (dm) return ic.exports;
  dm = 1;
  function d() {
    if (
      !(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
      )
    )
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(d);
      } catch (f) {
        console.error(f);
      }
  }
  return (d(), (ic.exports = Xg()), ic.exports);
}
var Kg = Vg();
const Jg = Bg(Kg);
function vi({
  children: d,
  variant: f = 'teal-solid',
  size: x = 'medium',
  className: u = '',
  disabled: k = !1,
  type: z = 'button',
  onClick: q,
  ...$
}) {
  const pe =
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    me = {
      'teal-solid': 'bg-teal-medium text-white hover:bg-teal-dark focus:ring-teal-medium',
      'teal-outline':
        'border-2 border-teal-medium text-teal-medium hover:bg-teal-lightest focus:ring-teal-medium',
      white: 'bg-white text-teal-medium hover:bg-gray-50 focus:ring-teal-medium',
    },
    pt = { small: 'px-4 py-2 text-sm', medium: 'px-6 py-3 text-base', large: 'px-8 py-4 text-lg' },
    L = me[f] || me['teal-solid'],
    ie = pt[x] || pt.medium;
  return t.jsx('button', {
    type: z,
    className: `${pe} ${L} ${ie} ${u}`,
    disabled: k,
    onClick: q,
    ...$,
    children: d,
  });
}
const wm = ({ children: d, color: f = 'medium', size: x = 'base', className: u = '', ...k }) => {
  const z = { light: 'text-teal-light', medium: 'text-teal-medium', dark: 'text-teal-dark' },
    q = { sm: 'text-xs sm:text-sm', base: 'text-sm sm:text-base', lg: 'text-base sm:text-lg' },
    $ = z[f] || z.medium,
    pe = q[x] || q.base;
  return t.jsx('div', {
    className: `${pe} ${$} font-semibold uppercase tracking-wider ${u}`,
    ...k,
    children: d,
  });
};
function Qe({ children: d, level: f = 2, className: x = '', ...u }) {
  const k = 'font-bold text-gray-900',
    z = {
      1: 'text-4xl sm:text-5xl lg:text-6xl',
      2: 'text-3xl sm:text-4xl lg:text-5xl',
      3: 'text-2xl sm:text-3xl lg:text-4xl',
      4: 'text-xl sm:text-2xl',
      5: 'text-lg sm:text-xl',
      6: 'text-base sm:text-lg',
    },
    q = z[f] || z[2],
    $ = `h${f}`;
  return Xl.createElement($, { className: `${k} ${q} ${x}`, ...u }, d);
}
function Fg({
  familiesHelped: d,
  waitlistEmail: f,
  setWaitlistEmail: x,
  waitlistSubmitting: u,
  waitlistSuccess: k,
  waitlistError: z,
  handleWaitlistSubmit: q,
  heroFormRef: $,
}) {
  return t.jsxs('div', {
    className:
      'pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-teal-lightest/30 to-white overflow-hidden relative',
    children: [
      t.jsx('div', {
        className: 'absolute inset-0 opacity-[0.03] pointer-events-none',
        style: {
          backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        },
      }),
      t.jsx('div', {
        className: 'max-w-7xl mx-auto',
        children: t.jsxs('div', {
          className:
            'mb-0 sm:mb-8 lg:mb-0 flex flex-col lg:flex-row lg:items-center lg:gap-8 xl:gap-16',
          children: [
            t.jsxs('div', {
              className: 'flex-1 lg:flex-[1.2] xl:flex-[1.3] relative z-10',
              children: [
                t.jsxs('div', {
                  className: 'mb-6 sm:mb-8 animate-fade-in-up',
                  style: { animationDelay: '0.1s' },
                  children: [
                    t.jsxs('div', {
                      className: 'flex items-center gap-2 sm:gap-3 mb-3',
                      children: [
                        t.jsx('img', {
                          src: '/assets/Logo.svg',
                          alt: 'LiaiZen Logo',
                          className: 'h-12 sm:h-14 w-auto',
                        }),
                        t.jsx('img', {
                          src: '/assets/wordmark.svg',
                          alt: 'LiaiZen',
                          className: 'h-12 sm:h-14 w-auto',
                        }),
                      ],
                    }),
                    t.jsx(wm, {
                      color: 'medium',
                      size: 'base',
                      children: 'AI Mediation & Guidance',
                    }),
                  ],
                }),
                t.jsx('div', {
                  className: 'mb-6 sm:mb-8 animate-fade-in-up',
                  style: { animationDelay: '0.2s' },
                  children: t.jsxs('h1', {
                    className:
                      'text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] font-medium text-teal-dark tracking-tight',
                    children: [
                      t.jsx('span', {
                        className: 'font-sans block sm:inline',
                        children: 'Co-parenting,',
                      }),
                      t.jsx('br', { className: 'hidden sm:block' }),
                      t.jsx('em', {
                        className: 'font-serif block sm:inline text-teal-medium',
                        children: 'without the cringe.',
                      }),
                    ],
                  }),
                }),
                t.jsx('div', {
                  className:
                    'flex lg:hidden justify-center my-8 md:my-10 animate-fade-in mx-auto w-full max-w-[280px] md:max-w-md',
                  children: t.jsx('img', {
                    src: '/assets/family-exchange.svg',
                    alt: 'Co-parents peacefully exchanging child during custody transition',
                    className: 'w-full h-auto scale-x-[-1]',
                    style: {
                      maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    },
                  }),
                }),
                t.jsx('p', {
                  className:
                    'text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-xl leading-relaxed animate-fade-in-up',
                  style: { animationDelay: '0.3s' },
                  children:
                    'LiaiZen prevents conflict in real time—so every message is constructive.',
                }),
                t.jsx($g, { familiesHelped: d }),
                t.jsx(Pg, {
                  waitlistEmail: f,
                  setWaitlistEmail: x,
                  waitlistSubmitting: u,
                  waitlistSuccess: k,
                  waitlistError: z,
                  handleWaitlistSubmit: q,
                  heroFormRef: $,
                }),
                t.jsx(ex, {}),
              ],
            }),
            t.jsx(tx, {}),
          ],
        }),
      }),
    ],
  });
}
function $g({ familiesHelped: d }) {
  return t.jsxs('div', {
    className:
      'mb-8 sm:mb-10 flex flex-col sm:flex-row items-center sm:items-center gap-4 animate-fade-in-up',
    style: { animationDelay: '0.4s' },
    children: [
      t.jsxs('div', {
        className:
          'flex items-center gap-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm p-1.5 pr-4 rounded-full border border-gray-100 shadow-sm',
        children: [
          t.jsxs('div', {
            className: 'flex -space-x-3',
            children: [
              t.jsx('div', {
                className:
                  'w-9 h-9 rounded-full bg-teal-light border-2 border-white flex items-center justify-center text-xs font-bold text-teal-dark shadow-sm',
                children: 'J',
              }),
              t.jsx('div', {
                className:
                  'w-9 h-9 rounded-full bg-teal-medium border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm',
                children: 'M',
              }),
              t.jsx('div', {
                className:
                  'w-9 h-9 rounded-full bg-teal-dark border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm',
                children: 'S',
              }),
            ],
          }),
          t.jsxs('span', {
            className: 'font-medium',
            children: [d !== null ? `${d}+` : '47+', ' families joined'],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 shadow-sm',
        children: [
          t.jsxs('span', {
            className: 'relative flex h-2.5 w-2.5',
            children: [
              t.jsx('span', {
                className:
                  'animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75',
              }),
              t.jsx('span', {
                className: 'relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500',
              }),
            ],
          }),
          t.jsx('span', {
            className: 'text-xs sm:text-sm font-bold whitespace-nowrap',
            children: 'Beta Access Starting Soon!',
          }),
        ],
      }),
    ],
  });
}
function Pg({
  waitlistEmail: d,
  setWaitlistEmail: f,
  waitlistSubmitting: x,
  waitlistSuccess: u,
  waitlistError: k,
  handleWaitlistSubmit: z,
  heroFormRef: q,
}) {
  return t.jsx('div', {
    className: 'animate-fade-in-up',
    style: { animationDelay: '0.5s' },
    children: u
      ? t.jsxs('div', {
          className:
            'w-full max-w-md bg-teal-50 border border-teal-100 rounded-xl p-5 text-center shadow-sm animate-fade-in',
          children: [
            t.jsxs('div', {
              className: 'flex items-center justify-center gap-2 mb-2',
              children: [
                t.jsx('div', {
                  className: 'w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center',
                  children: t.jsx('svg', {
                    className: 'w-5 h-5 text-teal-600',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24',
                    children: t.jsx('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2.5,
                      d: 'M5 13l4 4L19 7',
                    }),
                  }),
                }),
                t.jsx('span', {
                  className: 'text-lg font-bold text-teal-800',
                  children: "You're on the list!",
                }),
              ],
            }),
            t.jsx('p', {
              className: 'text-sm text-teal-600',
              children: "Watch your inbox. We'll be in touch soon with your invite.",
            }),
          ],
        })
      : t.jsxs('form', {
          onSubmit: $ => z($, 'hero'),
          className: 'w-full max-w-md',
          ref: q,
          children: [
            t.jsxs('div', {
              className: 'flex flex-col sm:flex-row gap-3',
              children: [
                t.jsx('input', {
                  type: 'email',
                  value: d,
                  onChange: $ => f($.target.value),
                  placeholder: 'Enter your email',
                  required: !0,
                  disabled: x,
                  className:
                    'flex-[2] min-w-0 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-medium focus:ring-4 focus:ring-teal-light/20 focus:outline-none text-base transition-all bg-white shadow-sm disabled:bg-gray-50 placeholder:text-gray-400',
                }),
                t.jsx(vi, {
                  type: 'submit',
                  disabled: x,
                  variant: 'teal-solid',
                  size: 'medium',
                  className:
                    'w-full sm:w-auto bg-teal-medium hover:bg-teal-dark transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap py-2 px-5 text-sm font-medium rounded-full border-none',
                  children: x ? 'Joining...' : 'Join Waitlist',
                }),
              ],
            }),
            k &&
              t.jsxs('p', {
                className: 'mt-3 text-sm text-red-600 flex items-center gap-1',
                children: [
                  t.jsx('svg', {
                    className: 'w-4 h-4',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24',
                    children: t.jsx('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    }),
                  }),
                  k,
                ],
              }),
          ],
        }),
  });
}
function ex() {
  return t.jsxs('div', {
    className:
      'mt-6 sm:mt-8 flex flex-nowrap items-center justify-between sm:justify-start gap-x-2 sm:gap-x-6 text-[10px] min-[380px]:text-xs sm:text-sm text-gray-500 font-medium animate-fade-in-up whitespace-nowrap',
    style: { animationDelay: '0.6s' },
    children: [
      t.jsxs('span', {
        className: 'flex items-center gap-1 sm:gap-2',
        children: [
          t.jsx('svg', {
            className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: t.jsx('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            }),
          }),
          'Easy to Use',
        ],
      }),
      t.jsxs('span', {
        className: 'flex items-center gap-1 sm:gap-2',
        children: [
          t.jsx('svg', {
            className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: t.jsx('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            }),
          }),
          'Co-Parent Founder',
        ],
      }),
      t.jsxs('span', {
        className: 'flex items-center gap-1 sm:gap-2',
        children: [
          t.jsx('svg', {
            className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: t.jsx('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
            }),
          }),
          'Secure & Private',
        ],
      }),
    ],
  });
}
function tx() {
  return t.jsxs('div', {
    className: 'hidden lg:block flex-1 ml-auto relative',
    children: [
      t.jsx('div', {
        className:
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] z-0 pointer-events-none opacity-60',
        children: t.jsx('svg', {
          viewBox: '0 0 200 200',
          xmlns: 'http://www.w3.org/2000/svg',
          children: t.jsx('path', {
            fill: '#F0FDFA',
            d: 'M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.5C93.5,8.2,82.2,20.7,71.5,31.7C60.9,42.7,50.9,52.2,39.9,59.3C28.9,66.4,16.9,71.1,3.4,65.2C-10.1,59.3,-25.1,42.8,-38.3,29.9C-51.5,17,-62.9,7.7,-64.8,-3.3C-66.7,-14.3,-59.1,-27,-49.6,-38.3C-40.1,-49.6,-28.7,-59.5,-16.4,-63.9C-4.1,-68.3,9.1,-67.2,22.4,-66.1L44.7,-76.4Z',
            transform: 'translate(100 100) scale(1.1)',
          }),
        }),
      }),
      t.jsx('img', {
        src: '/assets/family-exchange.svg',
        alt: 'Co-parents peacefully exchanging child during custody transition',
        className:
          'relative z-10 w-full max-w-lg xl:max-w-xl scale-x-[-1] animate-float mx-auto mix-blend-multiply',
        style: {
          animationDuration: '6s',
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        },
      }),
    ],
  });
}
function ax() {
  return t.jsx('div', {
    className:
      'mt-8 sm:mt-12 md:mt-16 mb-16 sm:mb-24 md:mb-32 bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out',
    'data-animate': 'fade-in',
    children: t.jsxs('div', {
      className: 'max-w-4xl mx-auto',
      children: [
        t.jsx(Qe, {
          variant: 'medium',
          color: 'dark',
          as: 'h2',
          className: 'mb-6 sm:mb-8 text-center leading-tight',
          children: t.jsx('span', {
            className: 'block text-2xl sm:text-3xl md:text-4xl font-medium text-teal-medium pb-2',
            children: 'Finally, feel at ease when you open a message.',
          }),
        }),
        t.jsxs('div', {
          className: 'grid md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10',
          children: [
            t.jsxs('div', {
              className: 'bg-white rounded-xl p-4 sm:p-6 border border-red-100',
              children: [
                t.jsx(Qe, {
                  variant: 'small',
                  color: 'dark',
                  as: 'h3',
                  className: 'mb-4 sm:mb-5 text-lg sm:text-xl',
                  children: 'Not This',
                }),
                t.jsxs('ul', {
                  className: 'space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700',
                  children: [
                    t.jsx(rn, {
                      negative: !0,
                      text: 'Reactively seeking expert intervention after conflict',
                    }),
                    t.jsx(rn, { negative: !0, text: 'Waiting until therapy to unpack conflict' }),
                    t.jsx(rn, { negative: !0, text: 'Building a case against the other parent' }),
                    t.jsx(rn, {
                      negative: !0,
                      text: "Relying on the court to decide what's best for your children",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200',
              children: [
                t.jsx(Qe, {
                  variant: 'small',
                  color: 'dark',
                  as: 'h3',
                  className: 'mb-4 sm:mb-5 text-lg sm:text-xl',
                  children: 'This',
                }),
                t.jsxs('ul', {
                  className: 'space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700',
                  children: [
                    t.jsx(rn, {
                      text: t.jsxs(t.Fragment, {
                        children: [
                          t.jsx('strong', { children: 'Intercepting' }),
                          ' conflict before it escalates',
                        ],
                      }),
                    }),
                    t.jsx(rn, {
                      text: t.jsxs(t.Fragment, {
                        children: [
                          t.jsx('strong', { children: 'Writing proactive messages' }),
                          ' that move things forward',
                        ],
                      }),
                    }),
                    t.jsx(rn, {
                      text: t.jsxs(t.Fragment, {
                        children: [
                          t.jsx('strong', { children: 'Keeping a neutral tone' }),
                          ' so you stay calm and defensible',
                        ],
                      }),
                    }),
                    t.jsx(rn, {
                      text: t.jsxs(t.Fragment, {
                        children: [
                          t.jsx('strong', { children: 'Staying calm and professional' }),
                          ' even when emotions run hot',
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        t.jsx('div', {
          className: 'bg-gray-50 border-l-4 border-teal-medium p-4 sm:p-6 rounded-r-lg',
          children: t.jsx('p', {
            className: 'text-gray-800 italic leading-relaxed text-base sm:text-lg',
            children: `"The conflict isn't happening in court—it's happening in the messages. And nothing we tried changed the way we talk to each other."`,
          }),
        }),
      ],
    }),
  });
}
function rn({ negative: d, text: f }) {
  return t.jsxs('li', {
    className: 'flex items-start gap-3',
    children: [
      t.jsx('span', {
        className: `${d ? 'text-red-500' : 'text-teal-medium'} font-bold text-lg`,
        children: d ? '✗' : '✓',
      }),
      t.jsx('span', { className: 'leading-relaxed', children: f }),
    ],
  });
}
const nx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  }),
  sx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  }),
  ix = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  }),
  Nm = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  }),
  lx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  }),
  rx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  }),
  ox = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  }),
  cx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2.5,
    d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  }),
  dx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2.5,
    d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  }),
  hx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  }),
  ux = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  }),
  mx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  }),
  fx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M5 13l4 4L19 7',
  }),
  gx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  }),
  xx = t.jsx('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  }),
  px = { edit: nx, chart: sx, dollar: ix, shield: Nm, heart: lx, scale: rx },
  yx = { lock: ox, check: cx, book: dx },
  bx = { chat: hx, clipboard: ux, users: mx },
  jx = { check: fx, users: gx, map: xx, shield: Nm };
function vx() {
  const d = [
    { icon: 'edit', text: '"I wish someone could rewrite the message before I send it."' },
    { icon: 'chart', text: `"I want communication that doesn't escalate every week."` },
    {
      icon: 'dollar',
      text: `"I'm tired of paying thousands for things that don't actually change anything."`,
    },
    { icon: 'shield', text: '"I want a tool that protects my sanity AND my reputation."' },
    { icon: 'heart', text: '"I need help staying calm when they trigger me."' },
    { icon: 'scale', text: `"I want conversations that don't end up in court."` },
  ];
  return t.jsx('div', {
    className:
      'mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 text-gray-900 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out',
    'data-animate': 'fade-in',
    style: {
      backgroundImage:
        'radial-gradient(circle at 20% 50%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%)',
    },
    children: t.jsxs('div', {
      className: 'max-w-5xl mx-auto',
      children: [
        t.jsx(Qe, {
          variant: 'medium',
          color: 'dark',
          as: 'h2',
          className: 'mb-6 sm:mb-8 text-center text-xl sm:text-2xl md:text-3xl',
          children: "After talking to real co-parents, their needs couldn't be clearer:",
        }),
        t.jsx('div', {
          className:
            'grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mt-6 sm:mt-8 md:mt-10 mb-6 sm:mb-8 md:mb-10',
          children: d.map((f, x) => t.jsx(wx, { icon: f.icon, text: f.text }, x)),
        }),
        t.jsx('div', {
          className: 'text-center mt-6 sm:mt-8 md:mt-10',
          children: t.jsx('p', {
            className: 'text-xl sm:text-2xl md:text-3xl font-semibold mb-4 px-4',
            children: t.jsx('span', {
              className:
                'bg-gradient-to-r from-teal-medium via-teal-dark to-teal-medium bg-clip-text text-transparent',
              children: "And that's exactly what LiaiZen was built for.",
            }),
          }),
        }),
      ],
    }),
  });
}
function wx({ icon: d, text: f }) {
  return t.jsx('div', {
    className:
      'group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1',
    children: t.jsxs('div', {
      className: 'flex items-start gap-3 sm:gap-4',
      children: [
        t.jsx('div', {
          className:
            'flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300',
          children: t.jsx('svg', {
            className: 'w-4 h-4 sm:w-5 sm:h-5 text-white',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            strokeWidth: 2,
            children: px[d],
          }),
        }),
        t.jsx('p', {
          className: 'text-sm sm:text-base italic text-gray-700 flex-1 leading-relaxed',
          children: f,
        }),
      ],
    }),
  });
}
function Nx() {
  return t.jsx('div', {
    className:
      'mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 opacity-0 translate-y-4 transition-all duration-700 ease-out',
    'data-animate': 'fade-in',
    children: t.jsxs('div', {
      className: 'max-w-5xl mx-auto',
      children: [
        t.jsx(Qe, {
          variant: 'medium',
          color: 'dark',
          as: 'h2',
          className: 'mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl',
          children: 'Become a stronger communicator',
        }),
        t.jsx('p', {
          className:
            'text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4',
          children:
            'Real-time guidance that helps you find the right words — even when emotions are high.',
        }),
        t.jsxs('div', {
          className: 'bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200',
          children: [
            t.jsxs('div', {
              className: 'grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8',
              children: [t.jsx(Tx, {}), t.jsx(Sx, {})],
            }),
            t.jsxs('div', {
              className:
                'mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 px-4',
              children: [
                t.jsx('svg', {
                  className: 'w-4 h-4 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0',
                  fill: 'none',
                  stroke: 'currentColor',
                  viewBox: '0 0 24 24',
                  children: t.jsx('path', {
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    strokeWidth: 2,
                    d: 'M13 10V3L4 14h7v7l9-11h-7z',
                  }),
                }),
                t.jsx('span', {
                  className: 'text-center',
                  children: 'AI rewrites your message in real-time—before emotions escalate',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function Tx() {
  return t.jsxs('div', {
    className: 'space-y-3 sm:space-y-4',
    children: [
      t.jsxs('div', {
        className: 'flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4',
        children: [
          t.jsx('div', {
            className:
              'w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0',
            children: t.jsx('svg', {
              className: 'w-4 h-4 sm:w-5 sm:h-5 text-red-600',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24',
              children: t.jsx('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M6 18L18 6M6 6l12 12',
              }),
            }),
          }),
          t.jsx(Qe, {
            variant: 'small',
            color: 'dark',
            as: 'h3',
            className: 'text-base sm:text-lg',
            children: 'Before LiaiZen',
          }),
        ],
      }),
      t.jsx('div', {
        className: 'bg-white rounded-xl p-4 sm:p-6 border-2 border-red-200 shadow-sm',
        children: t.jsx('p', {
          className: 'text-sm sm:text-base text-gray-900 leading-relaxed italic',
          children: `"You're ALWAYS changing plans last minute! This is exactly why I can't trust you with anything. Maybe if you actually cared about our son you'd stick to the schedule for once."`,
        }),
      }),
      t.jsxs('div', {
        className:
          'flex items-start gap-2 text-xs sm:text-sm text-red-700 bg-red-50 p-2 sm:p-3 rounded-lg',
        children: [
          t.jsx('svg', {
            className: 'w-5 h-5 flex-shrink-0 mt-0.5',
            fill: 'currentColor',
            viewBox: '0 0 20 20',
            children: t.jsx('path', {
              fillRule: 'evenodd',
              d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
              clipRule: 'evenodd',
            }),
          }),
          t.jsxs('span', {
            children: [
              t.jsx('strong', { children: 'High conflict risk:' }),
              ' Accusatory tone, personal attacks, likely to escalate',
            ],
          }),
        ],
      }),
    ],
  });
}
function Sx() {
  return t.jsxs('div', {
    className: 'space-y-3 sm:space-y-4',
    children: [
      t.jsxs('div', {
        className: 'flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4',
        children: [
          t.jsx('div', {
            className:
              'w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#6dd4b0] flex items-center justify-center flex-shrink-0',
            children: t.jsx('svg', {
              className: 'w-4 h-4 sm:w-5 sm:h-5 text-teal-medium',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24',
              children: t.jsx('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2.5,
                d: 'M5 13l4 4L19 7',
              }),
            }),
          }),
          t.jsx(Qe, {
            variant: 'small',
            color: 'teal-medium',
            as: 'h3',
            className: 'text-base sm:text-lg',
            children: 'With LiaiZen',
          }),
        ],
      }),
      t.jsx('div', {
        className:
          'bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 border-2 border-teal-light shadow-sm',
        children: t.jsx('p', {
          className: 'text-sm sm:text-base text-gray-900 leading-relaxed',
          children:
            '"I noticed the schedule changed. For planning purposes, could we aim for 48-hour notice when possible?"',
        }),
      }),
      t.jsxs('div', {
        className:
          'flex items-start gap-2 text-xs sm:text-sm text-teal-medium bg-teal-lightest p-2 sm:p-3 rounded-lg',
        children: [
          t.jsx('svg', {
            className: 'w-5 h-5 flex-shrink-0 mt-0.5',
            fill: 'currentColor',
            viewBox: '0 0 20 20',
            children: t.jsx('path', {
              fillRule: 'evenodd',
              d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
              clipRule: 'evenodd',
            }),
          }),
          t.jsxs('span', {
            children: [
              t.jsx('strong', { children: 'Flexible & collaborative:' }),
              ' Neutral tone, focuses on problem-solving, invites collaboration',
            ],
          }),
        ],
      }),
    ],
  });
}
function kx() {
  return t.jsxs(t.Fragment, {
    children: [
      t.jsx('div', {
        className: 'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24',
        'data-section': 'value_proposition',
        children: t.jsxs('div', {
          className: 'grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto px-4',
          children: [
            t.jsx(oc, {
              icon: 'lock',
              title: 'Pro-active',
              description: 'develop a forward-thinking mindset',
            }),
            t.jsx(oc, {
              icon: 'check',
              title: 'Removes Bias',
              description: 'Stay centered in the current conversation.',
            }),
            t.jsx(oc, {
              icon: 'book',
              title: 'Break Patterns',
              description: 'Form healthier communication habits',
            }),
          ],
        }),
      }),
      t.jsxs('div', {
        className: 'grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-20 px-4',
        children: [
          t.jsx(cc, {
            icon: 'chat',
            title: 'Instant Mediation',
            description:
              'Real-time message filtering and tone adjustment to keep conversations respectful and productive',
            colorClass: 'from-teal-lightest to-teal-light',
            hoverColor: 'hover:border-teal-light',
          }),
          t.jsx(cc, {
            icon: 'clipboard',
            title: 'Keep Organized',
            description: 'Reduce confusion with automated updates.',
            colorClass: 'from-[#D4F0EC] to-[#A8D9D3]',
            hoverColor: 'hover:border-[#A8D9D3]',
          }),
          t.jsx(cc, {
            icon: 'users',
            title: 'Adaptive Learning',
            description: 'Get relative insights based on your unique situation.',
            colorClass: 'from-[#C0E9E3] to-[#8BCAC1]',
            hoverColor: 'hover:border-[#8BCAC1]',
          }),
        ],
      }),
    ],
  });
}
function oc({ icon: d, title: f, description: x }) {
  return t.jsxs('div', {
    className:
      'group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
    children: [
      t.jsx('div', {
        className:
          'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-medium to-teal-dark rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0',
        children: t.jsx('svg', {
          className: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          strokeWidth: 2,
          children: yx[d],
        }),
      }),
      t.jsx(Qe, {
        variant: 'small',
        color: 'dark',
        as: 'h3',
        className: 'mb-2 sm:mb-3 text-center sm:text-left',
        children: f,
      }),
      t.jsx('p', {
        className: 'text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left',
        children: x,
      }),
    ],
  });
}
function cc({ icon: d, title: f, description: x, colorClass: u, hoverColor: k }) {
  return t.jsxs('div', {
    className: `group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 ${k} transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-2`,
    children: [
      t.jsx('div', {
        className: `w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${u} rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0`,
        children: t.jsx('svg', {
          className: 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-teal-medium',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          children: bx[d],
        }),
      }),
      t.jsx(Qe, {
        variant: 'small',
        color: 'teal-medium',
        as: 'h3',
        className: 'mb-2 sm:mb-3 text-center sm:text-left text-lg sm:text-xl',
        children: f,
      }),
      t.jsx('p', {
        className: 'text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left',
        children: x,
      }),
    ],
  });
}
function Ax() {
  return t.jsxs('div', {
    className:
      'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-dark to-teal-medium rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-teal-dark shadow-xl relative overflow-hidden opacity-0 translate-y-4 transition-all duration-700 ease-out',
    'data-animate': 'fade-in',
    children: [
      t.jsx('div', {
        className: 'absolute inset-0 opacity-10',
        style: {
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 40%)',
        },
      }),
      t.jsxs('div', {
        className: 'max-w-4xl mx-auto relative z-10 px-4',
        children: [
          t.jsx(Qe, {
            variant: 'medium',
            color: 'white',
            as: 'h2',
            className: 'mb-4 sm:mb-6 text-center text-white text-xl sm:text-2xl md:text-3xl',
            children: "Parallel parenting avoids conflict — it doesn't dissolve it.",
          }),
          t.jsx('p', {
            className:
              'text-base sm:text-lg md:text-xl text-white/95 mb-6 sm:mb-8 md:mb-10 text-center max-w-2xl mx-auto leading-relaxed',
            children:
              'When communication and expectations differ between households, kids feel the instability — and it shows up in their emotions and behavior.',
          }),
          t.jsxs('div', {
            className: 'grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8',
            children: [
              t.jsx(hm, {
                title: 'Avoidance',
                items: [
                  'Limits contact to prevent flare-ups',
                  'Focuses on separation instead of collaboration',
                  'Creates two distinct parenting environments',
                  'Avoids triggers rather than resolving them',
                ],
              }),
              t.jsx(hm, {
                title: 'Prevention (LiaiZen Approach)',
                isPositive: !0,
                items: [
                  'Builds healthier communication habits in real time',
                  'Encourages clarity, respect, and shared understanding',
                  'Creates consistent expectations across both homes',
                  'Stops conflict at the language level before it escalates',
                ],
              }),
            ],
          }),
          t.jsx('div', {
            className:
              'text-center bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/25 shadow-sm',
            children: t.jsx('p', {
              className: 'text-base sm:text-lg font-semibold mb-3 text-white leading-relaxed',
              children: `"I don't need a perfect co-parent. I just need peace, consistency, and the strength to raise my child with love—even when the drama tries to step in."`,
            }),
          }),
        ],
      }),
    ],
  });
}
function hm({ title: d, items: f, isPositive: x }) {
  return t.jsxs('div', {
    className:
      'bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/20 shadow-sm',
    children: [
      t.jsx(Qe, {
        variant: 'small',
        color: 'white',
        as: 'h3',
        className: 'mb-3 sm:mb-4 text-white text-lg sm:text-xl',
        children: d,
      }),
      t.jsx('ul', {
        className: 'space-y-2 sm:space-y-3 text-sm sm:text-base text-white/95',
        children: f.map((u, k) =>
          t.jsxs(
            'li',
            {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-white font-semibold', children: x ? '✓' : '•' }),
                t.jsx('span', { className: 'leading-relaxed', children: u }),
              ],
            },
            k
          )
        ),
      }),
    ],
  });
}
const Ex = (d, f, x) => console.log(`[Analytics] CTA click: ${d} - ${f} (${x})`);
function Cx({ scrollToWaitlistForm: d }) {
  const f = [
      {
        number: 1,
        title: 'Create Your Account',
        description:
          'Sign up in seconds. No credit card required. Your data is encrypted and secure.',
        gradient: 'from-teal-lightest to-teal-light',
      },
      {
        number: 2,
        title: 'Invite Your Co-Parent',
        description: 'Share a simple invite link. Both parents communicate on equal footing.',
        gradient: 'from-teal-light to-teal-medium',
      },
      {
        number: 3,
        title: 'Communicate Respectfully',
        description:
          'AI helps you find common ground, meet in the middle, and keep conversations productive.',
        gradient: 'from-teal-medium to-teal-dark',
      },
    ],
    x = () => {
      (Ex('how_it_works', 'Join the Waitlist', 'middle'), d());
    };
  return t.jsxs('div', {
    className:
      'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 opacity-0 translate-y-4 transition-all duration-700 ease-out',
    'data-animate': 'fade-in',
    children: [
      t.jsx(Qe, {
        variant: 'medium',
        color: 'teal-medium',
        as: 'h2',
        className: 'mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4',
        children: 'How It Works',
      }),
      t.jsx('p', {
        className:
          'text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4',
        children: 'Getting started is simple. Three steps to healthier co-parenting.',
      }),
      t.jsx('div', {
        className: 'grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4',
        children: f.map(u => t.jsx(zx, { ...u }, u.number)),
      }),
      t.jsx('div', {
        className: 'mt-8 sm:mt-10 md:mt-12 flex flex-col items-center px-4',
        children: t.jsx(vi, {
          onClick: x,
          variant: 'teal-solid',
          size: 'large',
          className:
            'w-full sm:w-auto bg-gradient-to-r from-teal-medium to-teal-dark hover:from-teal-dark hover:to-teal-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105',
          children: 'Join the Waitlist',
        }),
      }),
    ],
  });
}
function zx({ number: d, title: f, description: x, gradient: u }) {
  return t.jsxs('div', {
    className: 'text-center',
    children: [
      t.jsx('div', {
        className: `w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${u} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border-4 border-white shadow-md`,
        children: t.jsx('span', {
          className: 'text-xl sm:text-2xl md:text-3xl font-semibold text-teal-medium',
          children: d,
        }),
      }),
      t.jsx(Qe, {
        variant: 'small',
        color: 'teal-medium',
        as: 'h3',
        className: 'mb-2 sm:mb-3 text-lg sm:text-xl',
        children: f,
      }),
      t.jsx('p', { className: 'text-sm sm:text-base text-gray-600 leading-relaxed', children: x }),
    ],
  });
}
function Mx() {
  const d = [
    {
      quote:
        '"This is an effective tool that family lawyers would welcome. As a family mediator for over 17 years, I think it is a great idea."',
      author: '— Family Mediator',
    },
    {
      quote: `"For our family, I could see this helping us adapt better to change. I think it's a great idea not only for my family, but for situations at work."`,
      author: '— Divorced Mom',
    },
    {
      quote:
        '"I regularly see the impact of divorce on children who go to my school. An app like this would be extremely helpful for the parents and children."',
      author: '— Minister & School Director',
    },
    {
      quote:
        '"Our biggest challenge is being on the same page about how our children should be raised. I could see this being helpful to find a middle ground."',
      author: '— Divorced Mom',
    },
  ];
  return t.jsxs('div', {
    className:
      'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light',
    'data-section': 'testimonials',
    children: [
      t.jsx(Qe, {
        variant: 'medium',
        color: 'teal-medium',
        as: 'h2',
        className: 'mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4',
        children: 'What Professionals Are Saying',
      }),
      t.jsx('p', {
        className:
          'text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4',
        children: 'Early feedback from family professionals and co-parents',
      }),
      t.jsx('div', {
        className: 'grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto px-4',
        children: d.map((f, x) => t.jsx(Dx, { ...f }, x)),
      }),
    ],
  });
}
function Dx({ quote: d, author: f }) {
  return t.jsxs('div', {
    className: 'bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light',
    children: [
      t.jsx(Yx, {}),
      t.jsx('p', {
        className: 'text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic',
        children: d,
      }),
      t.jsx('p', { className: 'text-xs sm:text-sm font-semibold text-teal-medium', children: f }),
    ],
  });
}
function Yx() {
  return t.jsx('div', {
    className: 'flex items-center gap-2 mb-3 sm:mb-4 flex-wrap',
    children: [...Array(5)].map((d, f) =>
      t.jsx(
        'svg',
        {
          className: 'w-5 h-5 text-teal-medium',
          fill: 'currentColor',
          viewBox: '0 0 20 20',
          children: t.jsx('path', {
            d: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z',
          }),
        },
        f
      )
    ),
  });
}
const Rx = d => console.log(`[Analytics] FAQ expand: ${d}`);
function Lx() {
  const d = [
    {
      question: 'Is my information private and secure?',
      answer:
        "Absolutely. All communications are end-to-end encrypted, and we follow privacy-first design principles. Your data is never sold or shared with third parties. We take your family's privacy seriously.",
      tracked: !0,
    },
    {
      question: "What if my co-parent doesn't want to use it?",
      answer:
        'LiaiZen works best when both parents participate, but you can still use features like task management, calendar organization, and contact management on your own. The platform is designed to make collaboration so easy that your co-parent may want to join once they see the benefits.',
    },
    {
      question: 'How does the AI mediation work?',
      answer:
        'Our AI analyzes tone and suggests alternative phrasing for messages that might escalate conflict. It provides neutral perspectives and keeps conversations productive and solution-focused, treating both parents equally.',
    },
    {
      question: 'Is this really free during beta?',
      answer:
        "Yes! Beta access is completely free with no credit card required. We're looking for families to help us test and improve LiaiZen. Your feedback is invaluable as we build the best co-parenting platform possible.",
    },
    {
      question: 'Can this be used for legal purposes?',
      answer:
        'LiaiZen helps you communicate better and stay organized, which can support your co-parenting journey. While we provide tools that help document conversations and agreements, we recommend consulting with a legal professional for specific legal advice.',
    },
    {
      question: 'What happens after the beta period?',
      answer:
        "Beta testers will receive special pricing and early access to new features as a thank you for helping us improve. We'll notify you well in advance of any changes, and your data will always remain secure and accessible.",
    },
    {
      question: 'How do I join the beta program?',
      answer: `Simply click "Start Free Beta Access" above and create your account. Beta access is completely free with no credit card required. You'll get full access to all features and can provide feedback to help us improve.`,
    },
    {
      question: 'What if I find bugs or have suggestions?',
      answer:
        "We love feedback! As a beta tester, you'll have direct access to our team. You can report issues, suggest improvements, and help shape the future of LiaiZen. Your input directly influences what features we build next.",
    },
  ];
  return t.jsxs('div', {
    className: 'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24',
    children: [
      t.jsx(Qe, {
        variant: 'medium',
        color: 'teal-medium',
        as: 'h2',
        className: 'mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4',
        children: 'Frequently Asked Questions',
      }),
      t.jsx('p', {
        className:
          'text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4',
        children: 'Everything you need to know about getting started',
      }),
      t.jsx('div', {
        className: 'max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4',
        children: d.map((f, x) => t.jsx(Ox, { ...f }, x)),
      }),
    ],
  });
}
function Ox({ question: d, answer: f, tracked: x }) {
  const u = k => {
    x && k.target.open && Rx(d);
  };
  return t.jsxs('details', {
    className:
      'bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all',
    onToggle: x ? u : void 0,
    children: [
      t.jsx('summary', {
        className:
          'font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2',
        children: d,
      }),
      t.jsx('p', {
        className: 'mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed',
        children: f,
      }),
    ],
  });
}
function Hx() {
  const d = [
    {
      icon: 'check',
      title: 'No One Is Wrong',
      description:
        "Both parents have valid perspectives. We help you understand each other's viewpoints and find solutions that work for everyone.",
    },
    {
      icon: 'users',
      title: 'Treat Everyone Equal',
      description:
        'Fair communication means both parents have an equal voice. Our platform ensures balanced, respectful dialogue.',
    },
    {
      icon: 'map',
      title: 'Meet in the Middle',
      description:
        "Compromise isn't losing - it's winning together. We help you find common ground that puts your children first.",
    },
    {
      icon: 'shield',
      title: 'Preserve Dignity',
      description: 'Feel proud of how you responded — not ashamed of how you reacted.',
    },
  ];
  return t.jsxs('div', {
    className:
      'mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light',
    children: [
      t.jsx(Qe, {
        variant: 'medium',
        color: 'teal-medium',
        as: 'h2',
        className: 'mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4',
        children: 'Co-Parenting Principles We Stand By',
      }),
      t.jsx('p', {
        className:
          'text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 text-center max-w-2xl mx-auto px-4',
        children: 'Our approach is built on mutual respect, equality, and prevention',
      }),
      t.jsx('div', {
        className: 'grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto px-4',
        children: d.map((f, x) => t.jsx(_x, { ...f }, x)),
      }),
    ],
  });
}
function _x({ icon: d, title: f, description: x }) {
  return t.jsxs('div', {
    className: 'flex gap-4',
    children: [
      t.jsx('div', {
        className: 'flex-shrink-0',
        children: t.jsx('div', {
          className: 'w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center',
          children: t.jsx('svg', {
            className: 'w-6 h-6 text-white',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            children: jx[d],
          }),
        }),
      }),
      t.jsxs('div', {
        children: [
          t.jsx(Qe, {
            variant: 'small',
            color: 'teal-medium',
            as: 'h3',
            className: 'mb-2',
            children: f,
          }),
          t.jsx('p', { className: 'text-gray-600 leading-relaxed', children: x }),
        ],
      }),
    ],
  });
}
function Bx() {
  const d = [
    { title: 'Co-Parenting Communication', path: '/co-parenting-communication/' },
    { title: 'High-Conflict Co-Parenting', path: '/high-conflict-co-parenting/' },
    { title: 'Child-Centered Co-Parenting', path: '/child-centered-co-parenting/' },
    { title: 'AI + Co-Parenting Tools', path: '/liaizen-ai-co-parenting/' },
    { title: 'Quizzes', path: '/quizzes' },
  ];
  return t.jsx('div', {
    className: 'mt-16 mb-24 px-4 sm:px-6 lg:px-8',
    'data-section': 'resources',
    children: t.jsxs('div', {
      className: 'max-w-7xl mx-auto',
      children: [
        t.jsx(Qe, {
          variant: 'medium',
          color: 'dark',
          as: 'h2',
          className: 'mb-10 text-center',
          children: 'Resources',
        }),
        t.jsx('div', {
          className: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
          children: d.map(f =>
            t.jsx(
              'a',
              {
                href: f.path,
                className:
                  'group block p-6 bg-white border border-teal-light rounded-xl hover:border-teal-medium hover:shadow-md transition-all duration-300',
                children: t.jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    t.jsx('h3', {
                      className:
                        'text-lg font-medium text-gray-800 group-hover:text-teal-dark transition-colors',
                      children: f.title,
                    }),
                    t.jsx('svg', {
                      className:
                        'w-5 h-5 text-teal-medium opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M9 5l7 7-7 7',
                      }),
                    }),
                  ],
                }),
              },
              f.path
            )
          ),
        }),
      ],
    }),
  });
}
function Ux() {
  return t.jsx('footer', {
    className: 'border-t-2 border-teal-light py-8 px-4 bg-gray-50 pb-24 sm:pb-8',
    children: t.jsxs('div', {
      className: 'max-w-7xl mx-auto',
      children: [
        t.jsxs('div', {
          className: 'flex flex-col md:flex-row justify-between items-center gap-6',
          children: [
            t.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                t.jsx('img', {
                  src: '/assets/Logo.svg',
                  alt: 'LiaiZen Logo',
                  className: 'h-8 w-auto',
                }),
                t.jsx('img', {
                  src: '/assets/wordmark.svg',
                  alt: 'LiaiZen',
                  className: 'h-10 w-auto',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex gap-6 text-sm',
              children: [
                t.jsx('a', {
                  href: '/privacy',
                  className: 'text-gray-600 hover:text-teal-medium transition-colors',
                  children: 'Privacy Policy',
                }),
                t.jsx('a', {
                  href: '/terms',
                  className: 'text-gray-600 hover:text-teal-medium transition-colors',
                  children: 'Terms of Service',
                }),
                t.jsx('a', {
                  href: '/contact.html',
                  className: 'text-gray-600 hover:text-teal-medium transition-colors',
                  children: 'Contact Us',
                }),
              ],
            }),
          ],
        }),
        t.jsx('div', {
          className: 'mt-8 text-center text-gray-600 text-sm',
          children: t.jsx('p', {
            children: '© 2025 LiaiZen. Making co-parenting peaceful, one conversation at a time.',
          }),
        }),
      ],
    }),
  });
}
const qx = (d, f, x) => console.log(`[Analytics] CTA click: ${d} - ${f} (${x})`);
function Ix({ show: d, scrollToWaitlistForm: f }) {
  const x = () => {
    (qx('sticky_mobile', 'Join the Waitlist', 'sticky'), f());
  };
  return t.jsx('div', {
    className: `fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-teal-light shadow-lg transform transition-transform duration-300 pb-safe ${d ? 'translate-y-0' : 'translate-y-full'}`,
    style: { zIndex: 50 },
    children: t.jsxs('div', {
      className: 'px-4 py-3 flex items-center justify-between gap-3',
      children: [
        t.jsxs('div', {
          className: 'flex-1 min-w-0',
          children: [
            t.jsx('p', {
              className: 'text-xs font-bold text-teal-800 truncate',
              children: 'Be the first to try LiaiZen',
            }),
            t.jsx('p', {
              className: 'text-xs text-teal-600',
              children: 'Official launch coming soon!',
            }),
          ],
        }),
        t.jsx(vi, {
          onClick: x,
          variant: 'teal-solid',
          size: 'small',
          className:
            'flex-shrink-0 bg-teal-medium hover:bg-teal-dark border-none px-3 py-1.5 text-xs font-medium shadow-sm rounded-full tracking-normal',
          children: 'Join the Waitlist',
        }),
      ],
    }),
  });
}
function Wx() {
  return 'https://demo-production-6dcd.up.railway.app';
}
const wi = Wx();
async function Gx(d) {
  const f = `${wi}${d}`;
  try {
    return await fetch(f, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (x) {
    throw (console.error(`API GET error (${d}):`, x), x);
  }
}
async function Zx(d, f) {
  const x = `${wi}${d}`;
  try {
    return await fetch(x, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(f),
    });
  } catch (u) {
    throw (console.error(`API POST error (${d}):`, u), u);
  }
}
const Qx = (d, f) => console.log(`[Analytics] Conversion: ${d} from ${f}`),
  Xx = (d, f) => console.log(`[Analytics] Form submit: ${d} field: ${f}`),
  Il = d => console.log(`[Analytics] Scroll depth: ${d}%`),
  Vx = d => console.log(`[Analytics] Section view: ${d}`);
function Kx() {
  const [d, f] = xt.useState(null),
    [x, u] = xt.useState(!1),
    [k, z] = xt.useState(''),
    [q, $] = xt.useState(!1),
    [pe, me] = xt.useState(!1),
    [pt, L] = xt.useState(''),
    ie = xt.useRef(null);
  return (
    xt.useEffect(() => {
      const ne = () => {
        const F = window.pageYOffset || document.documentElement.scrollTop,
          oe = window.innerHeight,
          tt = document.documentElement.scrollHeight,
          Z = Math.round((F / (tt - oe)) * 100);
        if (ie.current) {
          const K = ie.current.getBoundingClientRect();
          u(K.bottom < 0);
        } else u(F > 600);
        Z >= 25 && Z < 50
          ? Il(25)
          : Z >= 50 && Z < 75
            ? Il(50)
            : Z >= 75 && Z < 90
              ? Il(75)
              : Z >= 90 && Il(90);
      };
      return (
        window.addEventListener('scroll', ne, { passive: !0 }),
        () => window.removeEventListener('scroll', ne)
      );
    }, []),
    xt.useEffect(() => {
      let ne = null,
        F = null;
      const oe = () => {
        const tt = { root: null, rootMargin: '0px', threshold: 0.3 };
        ((ne = new IntersectionObserver(Ue => {
          Ue.forEach(De => {
            if (De.isIntersecting) {
              const lt = De.target.dataset.section;
              (lt && Vx(lt),
                De.target.dataset.animate === 'fade-in' &&
                  ((De.target.style.opacity = '1'), (De.target.style.transform = 'translateY(0)')));
            }
          });
        }, tt)),
          document.querySelectorAll('[data-section]').forEach(Ue => ne.observe(Ue)),
          document.querySelectorAll('[data-animate="fade-in"]').forEach(Ue => ne.observe(Ue)));
      };
      return (
        (F = requestAnimationFrame(() => {
          F = requestAnimationFrame(oe);
        })),
        () => {
          (F && cancelAnimationFrame(F), ne && ne.disconnect());
        }
      );
    }, []),
    xt.useEffect(() => {
      async function ne() {
        try {
          const oe = await Gx('/api/stats/user-count');
          if (oe.ok) {
            const Z = (await oe.json()).count || 0;
            f(Z > 0 ? Z : 47);
          }
        } catch (oe) {
          (console.error('Error fetching user count:', oe), f(47));
        }
      }
      ne();
      const F = setInterval(ne, 3e4);
      return () => clearInterval(F);
    }, []),
    {
      familiesHelped: d,
      showStickyMobileCTA: x,
      heroFormRef: ie,
      waitlistEmail: k,
      setWaitlistEmail: z,
      waitlistSubmitting: q,
      waitlistSuccess: pe,
      waitlistError: pt,
      handleWaitlistSubmit: async (ne, F = 'hero') => {
        (ne.preventDefault(), L(''), $(!0));
        const oe = k.trim().toLowerCase();
        if (!oe || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oe)) {
          (L('Please enter a valid email address'), $(!1));
          return;
        }
        try {
          const Z = await Zx('/api/waitlist', { email: oe, source: F }),
            K = await Z.json();
          Z.ok && K.success
            ? (me(!0), z(''), Qx('waitlist', F), Xx('waitlist', 'email'))
            : L(K.error || 'Something went wrong. Please try again.');
        } catch (Z) {
          (console.error('Waitlist submission error:', Z),
            L('Unable to join waitlist. Please try again.'));
        } finally {
          $(!1);
        }
      },
      scrollToWaitlistForm: () => {
        (window.scrollTo({ top: 0, behavior: 'smooth' }),
          setTimeout(() => {
            document.querySelector('input[type="email"]')?.focus();
          }, 500));
      },
    }
  );
}
function um() {
  const {
    familiesHelped: d,
    showStickyMobileCTA: f,
    heroFormRef: x,
    waitlistEmail: u,
    setWaitlistEmail: k,
    waitlistSubmitting: z,
    waitlistSuccess: q,
    waitlistError: $,
    handleWaitlistSubmit: pe,
    scrollToWaitlistForm: me,
  } = Kx();
  return t.jsxs('div', {
    className: 'min-h-dvh bg-white',
    children: [
      t.jsx(Fg, {
        familiesHelped: d,
        waitlistEmail: u,
        setWaitlistEmail: k,
        waitlistSubmitting: z,
        waitlistSuccess: q,
        waitlistError: $,
        handleWaitlistSubmit: pe,
        heroFormRef: x,
      }),
      t.jsxs('div', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        children: [
          t.jsx(ax, {}),
          t.jsx(vx, {}),
          t.jsx(Nx, {}),
          t.jsx(kx, {}),
          t.jsx(Ax, {}),
          t.jsx(Cx, { scrollToWaitlistForm: me }),
          t.jsx(Mx, {}),
          t.jsx(Lx, {}),
          t.jsx(Hx, {}),
        ],
      }),
      t.jsx(Bx, {}),
      t.jsx(Ux, {}),
      !q && t.jsx(Ix, { show: f, scrollToWaitlistForm: me }),
    ],
  });
}
const Jx = {
  pillars: [
    {
      id: 'communication',
      title: 'Co-Parenting Communication',
      slug: '/co-parenting-communication',
      description:
        'Practical guides, scripts, and strategies to help you communicate effectively with your co-parent, even in high-stress situations.',
      articles: [
        {
          title: 'Why Co-Parenting Arguments Repeat (And How to Break the Communication Cycle)',
          excerpt:
            'Stuck in the same fights? Learn why conflict patterns repeat and how to break the cycle with calmer, more effective tools.',
          date: 'Dec 10, 2025',
          readTime: '5 min read',
          path: '/break-co-parenting-argument-cycle-game-theory',
          featured: !0,
        },
        {
          title: 'Why Co-Parenting Messages Feel More Hurtful Than They Are',
          excerpt:
            'Understanding the psychology behind emotional triggers and why neutral texts can feel like attacks.',
          path: '/co-parenting-communication/emotional-triggers',
          date: 'Dec 11, 2025',
          readTime: '6 min read',
        },
        {
          title: 'How Emotional Regulation Changes Co-Parenting Outcomes',
          excerpt:
            'Why managing your own nervous system is the most powerful move you can make in a co-parenting dynamic.',
          path: '/co-parenting-communication/emotional-regulation',
          date: 'Dec 12, 2025',
          readTime: '7 min read',
        },
        {
          title: 'From Reaction to Response: The Most Important Co-Parenting Skill',
          excerpt: 'Learn the pause technique that stops escalation in its tracks.',
          path: '/co-parenting-communication/reaction-vs-response',
          date: 'Dec 13, 2025',
          readTime: '6 min read',
        },
        {
          title: 'How to Pause Before Sending a Heated Message',
          excerpt: 'Practical strategies for hitting the brakes when you really want to hit send.',
          path: '/co-parenting-communication/pause-before-reacting',
          date: 'Dec 14, 2025',
          readTime: '5 min read',
        },
        {
          title: 'How to Communicate With a Defensive Co-Parent',
          excerpt:
            'Strategies for getting your point across without triggering their defense mechanisms.',
          path: '/co-parenting-communication/defensiveness-strategies',
          date: 'Dec 15, 2025',
          readTime: '7 min read',
        },
      ],
    },
    {
      id: 'high-conflict',
      title: 'High-Conflict Co-Parenting',
      slug: '/high-conflict-co-parenting',
      description:
        'Navigating complex dynamics, setting boundaries, and protecting your peace when emotions run high.',
      articles: [
        {
          title: 'Why High-Conflict Co-Parenting Feels Impossible to Fix',
          excerpt:
            'Understanding the dynamics of high-conflict relationships and why standard advice often fails.',
          path: '/high-conflict/why-it-feels-impossible',
          date: 'Dec 16, 2025',
          readTime: '8 min read',
          featured: !0,
        },
        {
          title: 'How to De-escalate Communication With a High-Conflict Co-Parent',
          excerpt: 'Specific phrases and techniques to lower the temperature of heated exchanges.',
          path: '/high-conflict/de-escalation-techniques',
          date: 'Dec 17, 2025',
          readTime: '8 min read',
        },
        {
          title: 'Navigating Co-Parent Gaslighting, Guilt, and Blame',
          excerpt: 'How to spot manipulation tactics and respond with factual neutrality.',
          path: '/high-conflict/gaslighting-guilt-blame',
          date: 'Dec 18, 2025',
          readTime: '9 min read',
        },
        {
          title: 'How to Protect Your Mental Health While Co-Parenting',
          excerpt:
            'Essential self-care strategies for parents in high-stress co-parenting relationships.',
          path: '/high-conflict/mental-health-protection',
          date: 'Dec 19, 2025',
          readTime: '8 min read',
        },
        {
          title: 'What to Do When Every Conversation Turns Into a Fight',
          excerpt: "Breaking the cycle of constant conflict even when your co-parent won't change.",
          path: '/high-conflict/every-conversation-fight',
          date: 'Dec 20, 2025',
          readTime: '7 min read',
        },
      ],
    },
    {
      id: 'child-centered',
      title: 'Child-Centered Co-Parenting',
      slug: '/child-centered-co-parenting',
      description:
        'Keeping children the focus, modeling healthy communication, and shielding them from conflict.',
      articles: [
        {
          title: 'How Repeated Parental Conflict Affects Children Long-Term',
          excerpt:
            'The evidence-based impact of conflict on child development and future relationships.',
          path: '/child-impact/long-term-effects',
          date: 'Dec 21, 2025',
          readTime: '9 min read',
          featured: !0,
        },
        {
          title: 'What Children Need Most During High-Conflict Co-Parenting',
          excerpt: "It's not perfect parents—it's stability. Here's how to provide it.",
          path: '/child-impact/what-kids-need',
          date: 'Dec 22, 2025',
          readTime: '7 min read',
        },
        {
          title: "Stability vs. Stress: How Communication Shapes a Child's Home Environment",
          excerpt:
            'Creating a sense of safety for your children through consistent communication styles.',
          path: '/child-impact/stability-stress',
          date: 'Dec 23, 2025',
          readTime: '7 min read',
        },
        {
          title: 'How to Model Healthy Communication for Your Kids',
          excerpt:
            "Your children are watching. Here's how to show them what healthy boundaries look like.",
          path: '/child-impact/modeling-communication',
          date: 'Dec 24, 2025',
          readTime: '7 min read',
        },
      ],
    },
    {
      id: 'liaizen-ai',
      title: 'AI + Co-Parenting Tools',
      slug: '/liaizen-ai-co-parenting',
      description: 'Leveraging technology to bridge the communication gap and prevent escalation.',
      articles: [
        {
          title: 'AI-Guided Co-Parenting Mediation: How It Works',
          excerpt:
            'Demystifying the technology that helps you rewrite toxic messages in real-time.',
          path: '/liaizen/how-ai-mediation-works',
          date: 'Dec 12, 2025',
          readTime: '6 min read',
          featured: !0,
        },
        {
          title: 'How LiaiZen Intercepts Escalation Before It Starts',
          excerpt: "Why catching the 'micro-aggression' is key to preventing the blow-up.",
          path: '/liaizen/escalation-prevention',
          date: 'Dec 13, 2025',
          readTime: '5 min read',
        },
        {
          title: 'How AI Helps Parents Communicate More Calmly',
          excerpt: 'Using feedback loops to train your nervous system for peace.',
          path: '/liaizen/calm-communication-ai',
          date: 'Dec 14, 2025',
          readTime: '4 min read',
        },
        {
          title: 'Is AI Safe for Co-Parenting Communication?',
          excerpt: 'Privacy, security, and why unbiased machine learning is safer than you think.',
          path: '/liaizen/ai-safety-for-parents',
          date: 'Dec 15, 2025',
          readTime: '7 min read',
        },
        {
          title: 'Why Co-Parents Trust LiaiZen More Than Their Own Impulse in Hard Moments',
          excerpt:
            "When the red mist descends, you need a safety net. Here's why AI is better than willpower.",
          path: '/liaizen/ai-vs-impulse',
          date: 'Dec 16, 2025',
          readTime: '5 min read',
        },
      ],
    },
  ],
};
function Wl({ categoryId: d }) {
  const f = Jx.pillars.find(x => x.id === d);
  return f
    ? t.jsxs('div', {
        className: 'min-h-dvh bg-white pb-nav-mobile pt-nav-mobile overflow-y-auto',
        children: [
          t.jsx('div', {
            className: 'bg-gradient-to-b from-teal-50 to-white pt-32 pb-16 px-4 sm:px-6 lg:px-8',
            children: t.jsxs('div', {
              className: 'max-w-4xl mx-auto text-center',
              children: [
                t.jsx(wm, { color: 'medium', size: 'base', children: 'Resources' }),
                t.jsx('h1', {
                  className:
                    'text-4xl sm:text-5xl font-bold text-teal-dark mb-6 leading-tight mt-4',
                  children: f.title,
                }),
                t.jsx('p', {
                  className: 'text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto',
                  children: f.description,
                }),
              ],
            }),
          }),
          t.jsx('div', {
            className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24',
            children: t.jsx('div', {
              className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
              children: f.articles.map(x =>
                t.jsxs(
                  'a',
                  {
                    href: x.comingSoon ? '#' : x.path,
                    onClick: u => x.comingSoon && u.preventDefault(),
                    className: `group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${x.comingSoon ? 'opacity-70 cursor-default hover:shadow-none hover:border-gray-200' : ''} ${x.featured ? 'md:col-span-2 lg:col-span-3 flex flex-col md:flex-row' : ''}`,
                    children: [
                      t.jsxs('div', {
                        className: `bg-teal-100 ${x.featured ? 'md:w-1/2 min-h-[300px]' : 'h-48'} flex items-center justify-center relative`,
                        children: [
                          t.jsx('svg', {
                            className: 'w-16 h-16 text-teal-300',
                            fill: 'currentColor',
                            viewBox: '0 0 20 20',
                            children: t.jsx('path', {
                              fillRule: 'evenodd',
                              d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
                              clipRule: 'evenodd',
                            }),
                          }),
                          x.comingSoon &&
                            t.jsx('div', {
                              className:
                                'absolute inset-0 bg-white/60 flex items-center justify-center',
                              children: t.jsx('span', {
                                className:
                                  'bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-500 shadow-sm border border-gray-200',
                                children: 'Coming Soon',
                              }),
                            }),
                        ],
                      }),
                      t.jsxs('div', {
                        className: `p-6 sm:p-8 ${x.featured ? 'md:w-1/2 flex flex-col justify-center' : ''}`,
                        children: [
                          !x.comingSoon &&
                            x.date &&
                            t.jsxs('div', {
                              className: 'flex items-center gap-4 text-sm text-gray-500 mb-3',
                              children: [
                                t.jsx('span', { children: x.date }),
                                t.jsx('span', { children: '•' }),
                                t.jsx('span', { children: x.readTime }),
                              ],
                            }),
                          t.jsx('h3', {
                            className: `font-bold text-teal-dark mb-3 ${x.comingSoon ? '' : 'group-hover:text-teal-medium transition-colors'} ${x.featured ? 'text-2xl sm:text-3xl' : 'text-xl'}`,
                            children: x.title,
                          }),
                          t.jsx('p', {
                            className: 'text-gray-600 mb-6 leading-relaxed',
                            children: x.excerpt,
                          }),
                          !x.comingSoon &&
                            t.jsxs('span', {
                              className:
                                'text-teal-medium font-medium group-hover:underline inline-flex items-center gap-1',
                              children: [
                                'Read Article',
                                t.jsx('svg', {
                                  className: 'w-4 h-4',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  viewBox: '0 0 24 24',
                                  children: t.jsx('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: 2,
                                    d: 'M17 8l4 4m0 0l-4 4m4-4H3',
                                  }),
                                }),
                              ],
                            }),
                        ],
                      }),
                    ],
                  },
                  x.path
                )
              ),
            }),
          }),
          t.jsx('footer', {
            className: 'bg-gray-50 border-t border-gray-200 py-12 px-4',
            children: t.jsxs('div', {
              className: 'max-w-7xl mx-auto flex flex-col items-center',
              children: [
                t.jsx('img', { src: '/assets/Logo.svg', alt: 'LiaiZen', className: 'h-8 mb-6' }),
                t.jsxs('div', {
                  className: 'flex gap-6 mb-6',
                  children: [
                    t.jsx('a', {
                      href: '/',
                      className: 'text-gray-500 hover:text-teal-medium',
                      children: 'Home',
                    }),
                    t.jsx('a', {
                      href: '/liaizen-ai-co-parenting',
                      className: 'text-gray-500 hover:text-teal-medium',
                      children: 'LiaiZen AI',
                    }),
                    t.jsx('a', {
                      href: '/contact',
                      className: 'text-gray-500 hover:text-teal-medium',
                      children: 'Contact',
                    }),
                  ],
                }),
                t.jsx('p', {
                  className: 'text-gray-500 text-sm',
                  children: '© 2025 LiaiZen. All rights reserved.',
                }),
              ],
            }),
          }),
        ],
      })
    : t.jsx('div', {
        className: 'h-dvh flex items-center justify-center',
        children: 'Category not found',
      });
}
const {
  entries: Tm,
  setPrototypeOf: mm,
  isFrozen: Fx,
  getPrototypeOf: $x,
  getOwnPropertyDescriptor: Px,
} = Object;
let { freeze: st, seal: qt, create: xc } = Object,
  { apply: pc, construct: yc } = typeof Reflect < 'u' && Reflect;
st ||
  (st = function (f) {
    return f;
  });
qt ||
  (qt = function (f) {
    return f;
  });
pc ||
  (pc = function (f, x) {
    for (var u = arguments.length, k = new Array(u > 2 ? u - 2 : 0), z = 2; z < u; z++)
      k[z - 2] = arguments[z];
    return f.apply(x, k);
  });
yc ||
  (yc = function (f) {
    for (var x = arguments.length, u = new Array(x > 1 ? x - 1 : 0), k = 1; k < x; k++)
      u[k - 1] = arguments[k];
    return new f(...u);
  });
const Gl = it(Array.prototype.forEach),
  ep = it(Array.prototype.lastIndexOf),
  fm = it(Array.prototype.pop),
  xi = it(Array.prototype.push),
  tp = it(Array.prototype.splice),
  Ql = it(String.prototype.toLowerCase),
  dc = it(String.prototype.toString),
  hc = it(String.prototype.match),
  pi = it(String.prototype.replace),
  ap = it(String.prototype.indexOf),
  np = it(String.prototype.trim),
  Kt = it(Object.prototype.hasOwnProperty),
  nt = it(RegExp.prototype.test),
  yi = sp(TypeError);
function it(d) {
  return function (f) {
    f instanceof RegExp && (f.lastIndex = 0);
    for (var x = arguments.length, u = new Array(x > 1 ? x - 1 : 0), k = 1; k < x; k++)
      u[k - 1] = arguments[k];
    return pc(d, f, u);
  };
}
function sp(d) {
  return function () {
    for (var f = arguments.length, x = new Array(f), u = 0; u < f; u++) x[u] = arguments[u];
    return yc(d, x);
  };
}
function I(d, f) {
  let x = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Ql;
  mm && mm(d, null);
  let u = f.length;
  for (; u--; ) {
    let k = f[u];
    if (typeof k == 'string') {
      const z = x(k);
      z !== k && (Fx(f) || (f[u] = z), (k = z));
    }
    d[k] = !0;
  }
  return d;
}
function ip(d) {
  for (let f = 0; f < d.length; f++) Kt(d, f) || (d[f] = null);
  return d;
}
function aa(d) {
  const f = xc(null);
  for (const [x, u] of Tm(d))
    Kt(d, x) &&
      (Array.isArray(u)
        ? (f[x] = ip(u))
        : u && typeof u == 'object' && u.constructor === Object
          ? (f[x] = aa(u))
          : (f[x] = u));
  return f;
}
function bi(d, f) {
  for (; d !== null; ) {
    const u = Px(d, f);
    if (u) {
      if (u.get) return it(u.get);
      if (typeof u.value == 'function') return it(u.value);
    }
    d = $x(d);
  }
  function x() {
    return null;
  }
  return x;
}
const gm = st([
    'a',
    'abbr',
    'acronym',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'bdi',
    'bdo',
    'big',
    'blink',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'center',
    'cite',
    'code',
    'col',
    'colgroup',
    'content',
    'data',
    'datalist',
    'dd',
    'decorator',
    'del',
    'details',
    'dfn',
    'dialog',
    'dir',
    'div',
    'dl',
    'dt',
    'element',
    'em',
    'fieldset',
    'figcaption',
    'figure',
    'font',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hgroup',
    'hr',
    'html',
    'i',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'main',
    'map',
    'mark',
    'marquee',
    'menu',
    'menuitem',
    'meter',
    'nav',
    'nobr',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'picture',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'search',
    'section',
    'select',
    'shadow',
    'slot',
    'small',
    'source',
    'spacer',
    'span',
    'strike',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'track',
    'tt',
    'u',
    'ul',
    'var',
    'video',
    'wbr',
  ]),
  uc = st([
    'svg',
    'a',
    'altglyph',
    'altglyphdef',
    'altglyphitem',
    'animatecolor',
    'animatemotion',
    'animatetransform',
    'circle',
    'clippath',
    'defs',
    'desc',
    'ellipse',
    'enterkeyhint',
    'exportparts',
    'filter',
    'font',
    'g',
    'glyph',
    'glyphref',
    'hkern',
    'image',
    'inputmode',
    'line',
    'lineargradient',
    'marker',
    'mask',
    'metadata',
    'mpath',
    'part',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialgradient',
    'rect',
    'stop',
    'style',
    'switch',
    'symbol',
    'text',
    'textpath',
    'title',
    'tref',
    'tspan',
    'view',
    'vkern',
  ]),
  mc = st([
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feDropShadow',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotLight',
    'feTile',
    'feTurbulence',
  ]),
  lp = st([
    'animate',
    'color-profile',
    'cursor',
    'discard',
    'font-face',
    'font-face-format',
    'font-face-name',
    'font-face-src',
    'font-face-uri',
    'foreignobject',
    'hatch',
    'hatchpath',
    'mesh',
    'meshgradient',
    'meshpatch',
    'meshrow',
    'missing-glyph',
    'script',
    'set',
    'solidcolor',
    'unknown',
    'use',
  ]),
  fc = st([
    'math',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mglyph',
    'mi',
    'mlabeledtr',
    'mmultiscripts',
    'mn',
    'mo',
    'mover',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'ms',
    'mspace',
    'msqrt',
    'mstyle',
    'msub',
    'msup',
    'msubsup',
    'mtable',
    'mtd',
    'mtext',
    'mtr',
    'munder',
    'munderover',
    'mprescripts',
  ]),
  rp = st([
    'maction',
    'maligngroup',
    'malignmark',
    'mlongdiv',
    'mscarries',
    'mscarry',
    'msgroup',
    'mstack',
    'msline',
    'msrow',
    'semantics',
    'annotation',
    'annotation-xml',
    'mprescripts',
    'none',
  ]),
  xm = st(['#text']),
  pm = st([
    'accept',
    'action',
    'align',
    'alt',
    'autocapitalize',
    'autocomplete',
    'autopictureinpicture',
    'autoplay',
    'background',
    'bgcolor',
    'border',
    'capture',
    'cellpadding',
    'cellspacing',
    'checked',
    'cite',
    'class',
    'clear',
    'color',
    'cols',
    'colspan',
    'controls',
    'controlslist',
    'coords',
    'crossorigin',
    'datetime',
    'decoding',
    'default',
    'dir',
    'disabled',
    'disablepictureinpicture',
    'disableremoteplayback',
    'download',
    'draggable',
    'enctype',
    'enterkeyhint',
    'exportparts',
    'face',
    'for',
    'headers',
    'height',
    'hidden',
    'high',
    'href',
    'hreflang',
    'id',
    'inert',
    'inputmode',
    'integrity',
    'ismap',
    'kind',
    'label',
    'lang',
    'list',
    'loading',
    'loop',
    'low',
    'max',
    'maxlength',
    'media',
    'method',
    'min',
    'minlength',
    'multiple',
    'muted',
    'name',
    'nonce',
    'noshade',
    'novalidate',
    'nowrap',
    'open',
    'optimum',
    'part',
    'pattern',
    'placeholder',
    'playsinline',
    'popover',
    'popovertarget',
    'popovertargetaction',
    'poster',
    'preload',
    'pubdate',
    'radiogroup',
    'readonly',
    'rel',
    'required',
    'rev',
    'reversed',
    'role',
    'rows',
    'rowspan',
    'spellcheck',
    'scope',
    'selected',
    'shape',
    'size',
    'sizes',
    'slot',
    'span',
    'srclang',
    'start',
    'src',
    'srcset',
    'step',
    'style',
    'summary',
    'tabindex',
    'title',
    'translate',
    'type',
    'usemap',
    'valign',
    'value',
    'width',
    'wrap',
    'xmlns',
    'slot',
  ]),
  gc = st([
    'accent-height',
    'accumulate',
    'additive',
    'alignment-baseline',
    'amplitude',
    'ascent',
    'attributename',
    'attributetype',
    'azimuth',
    'basefrequency',
    'baseline-shift',
    'begin',
    'bias',
    'by',
    'class',
    'clip',
    'clippathunits',
    'clip-path',
    'clip-rule',
    'color',
    'color-interpolation',
    'color-interpolation-filters',
    'color-profile',
    'color-rendering',
    'cx',
    'cy',
    'd',
    'dx',
    'dy',
    'diffuseconstant',
    'direction',
    'display',
    'divisor',
    'dur',
    'edgemode',
    'elevation',
    'end',
    'exponent',
    'fill',
    'fill-opacity',
    'fill-rule',
    'filter',
    'filterunits',
    'flood-color',
    'flood-opacity',
    'font-family',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'fx',
    'fy',
    'g1',
    'g2',
    'glyph-name',
    'glyphref',
    'gradientunits',
    'gradienttransform',
    'height',
    'href',
    'id',
    'image-rendering',
    'in',
    'in2',
    'intercept',
    'k',
    'k1',
    'k2',
    'k3',
    'k4',
    'kerning',
    'keypoints',
    'keysplines',
    'keytimes',
    'lang',
    'lengthadjust',
    'letter-spacing',
    'kernelmatrix',
    'kernelunitlength',
    'lighting-color',
    'local',
    'marker-end',
    'marker-mid',
    'marker-start',
    'markerheight',
    'markerunits',
    'markerwidth',
    'maskcontentunits',
    'maskunits',
    'max',
    'mask',
    'mask-type',
    'media',
    'method',
    'mode',
    'min',
    'name',
    'numoctaves',
    'offset',
    'operator',
    'opacity',
    'order',
    'orient',
    'orientation',
    'origin',
    'overflow',
    'paint-order',
    'path',
    'pathlength',
    'patterncontentunits',
    'patterntransform',
    'patternunits',
    'points',
    'preservealpha',
    'preserveaspectratio',
    'primitiveunits',
    'r',
    'rx',
    'ry',
    'radius',
    'refx',
    'refy',
    'repeatcount',
    'repeatdur',
    'restart',
    'result',
    'rotate',
    'scale',
    'seed',
    'shape-rendering',
    'slope',
    'specularconstant',
    'specularexponent',
    'spreadmethod',
    'startoffset',
    'stddeviation',
    'stitchtiles',
    'stop-color',
    'stop-opacity',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke',
    'stroke-width',
    'style',
    'surfacescale',
    'systemlanguage',
    'tabindex',
    'tablevalues',
    'targetx',
    'targety',
    'transform',
    'transform-origin',
    'text-anchor',
    'text-decoration',
    'text-rendering',
    'textlength',
    'type',
    'u1',
    'u2',
    'unicode',
    'values',
    'viewbox',
    'visibility',
    'version',
    'vert-adv-y',
    'vert-origin-x',
    'vert-origin-y',
    'width',
    'word-spacing',
    'wrap',
    'writing-mode',
    'xchannelselector',
    'ychannelselector',
    'x',
    'x1',
    'x2',
    'xmlns',
    'y',
    'y1',
    'y2',
    'z',
    'zoomandpan',
  ]),
  ym = st([
    'accent',
    'accentunder',
    'align',
    'bevelled',
    'close',
    'columnsalign',
    'columnlines',
    'columnspan',
    'denomalign',
    'depth',
    'dir',
    'display',
    'displaystyle',
    'encoding',
    'fence',
    'frame',
    'height',
    'href',
    'id',
    'largeop',
    'length',
    'linethickness',
    'lspace',
    'lquote',
    'mathbackground',
    'mathcolor',
    'mathsize',
    'mathvariant',
    'maxsize',
    'minsize',
    'movablelimits',
    'notation',
    'numalign',
    'open',
    'rowalign',
    'rowlines',
    'rowspacing',
    'rowspan',
    'rspace',
    'rquote',
    'scriptlevel',
    'scriptminsize',
    'scriptsizemultiplier',
    'selection',
    'separator',
    'separators',
    'stretchy',
    'subscriptshift',
    'supscriptshift',
    'symmetric',
    'voffset',
    'width',
    'xmlns',
  ]),
  Zl = st(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']),
  op = qt(/\{\{[\w\W]*|[\w\W]*\}\}/gm),
  cp = qt(/<%[\w\W]*|[\w\W]*%>/gm),
  dp = qt(/\$\{[\w\W]*/gm),
  hp = qt(/^data-[\-\w.\u00B7-\uFFFF]+$/),
  up = qt(/^aria-[\-\w]+$/),
  Sm = qt(
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  ),
  mp = qt(/^(?:\w+script|data):/i),
  fp = qt(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),
  km = qt(/^html$/i),
  gp = qt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var bm = Object.freeze({
  __proto__: null,
  ARIA_ATTR: up,
  ATTR_WHITESPACE: fp,
  CUSTOM_ELEMENT: gp,
  DATA_ATTR: hp,
  DOCTYPE_NAME: km,
  ERB_EXPR: cp,
  IS_ALLOWED_URI: Sm,
  IS_SCRIPT_OR_DATA: mp,
  MUSTACHE_EXPR: op,
  TMPLIT_EXPR: dp,
});
const ji = { element: 1, text: 3, progressingInstruction: 7, comment: 8, document: 9 },
  xp = function () {
    return typeof window > 'u' ? null : window;
  },
  pp = function (f, x) {
    if (typeof f != 'object' || typeof f.createPolicy != 'function') return null;
    let u = null;
    const k = 'data-tt-policy-suffix';
    x && x.hasAttribute(k) && (u = x.getAttribute(k));
    const z = 'dompurify' + (u ? '#' + u : '');
    try {
      return f.createPolicy(z, {
        createHTML(q) {
          return q;
        },
        createScriptURL(q) {
          return q;
        },
      });
    } catch {
      return (console.warn('TrustedTypes policy ' + z + ' could not be created.'), null);
    }
  },
  jm = function () {
    return {
      afterSanitizeAttributes: [],
      afterSanitizeElements: [],
      afterSanitizeShadowDOM: [],
      beforeSanitizeAttributes: [],
      beforeSanitizeElements: [],
      beforeSanitizeShadowDOM: [],
      uponSanitizeAttribute: [],
      uponSanitizeElement: [],
      uponSanitizeShadowNode: [],
    };
  };
function Am() {
  let d = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : xp();
  const f = M => Am(M);
  if (
    ((f.version = '3.3.1'),
    (f.removed = []),
    !d || !d.document || d.document.nodeType !== ji.document || !d.Element)
  )
    return ((f.isSupported = !1), f);
  let { document: x } = d;
  const u = x,
    k = u.currentScript,
    {
      DocumentFragment: z,
      HTMLTemplateElement: q,
      Node: $,
      Element: pe,
      NodeFilter: me,
      NamedNodeMap: pt = d.NamedNodeMap || d.MozNamedAttrMap,
      HTMLFormElement: L,
      DOMParser: ie,
      trustedTypes: Pe,
    } = d,
    Me = pe.prototype,
    ne = bi(Me, 'cloneNode'),
    F = bi(Me, 'remove'),
    oe = bi(Me, 'nextSibling'),
    tt = bi(Me, 'childNodes'),
    Z = bi(Me, 'parentNode');
  if (typeof q == 'function') {
    const M = x.createElement('template');
    M.content && M.content.ownerDocument && (x = M.content.ownerDocument);
  }
  let K,
    Ue = '';
  const {
      implementation: De,
      createNodeIterator: lt,
      createDocumentFragment: yt,
      getElementsByTagName: za,
    } = x,
    { importNode: Cn } = u;
  let Te = jm();
  f.isSupported =
    typeof Tm == 'function' && typeof Z == 'function' && De && De.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: et,
    ERB_EXPR: Ma,
    TMPLIT_EXPR: na,
    DATA_ATTR: It,
    ARIA_ATTR: N,
    IS_SCRIPT_OR_DATA: A,
    ATTR_WHITESPACE: O,
    CUSTOM_ELEMENT: fe,
  } = bm;
  let { IS_ALLOWED_URI: ce } = bm,
    J = null;
  const ye = I({}, [...gm, ...uc, ...mc, ...fc, ...xm]);
  let H = null;
  const Ae = I({}, [...pm, ...gc, ...ym, ...Zl]);
  let P = Object.seal(
      xc(null, {
        tagNameCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
        attributeNameCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
        allowCustomizedBuiltInElements: {
          writable: !0,
          configurable: !1,
          enumerable: !0,
          value: !1,
        },
      })
    ),
    rt = null,
    Da = null;
  const Wt = Object.seal(
    xc(null, {
      tagCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
      attributeCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
    })
  );
  let sa = !0,
    on = !0,
    cn = !1,
    zn = !0,
    ia = !1,
    Et = !0,
    Gt = !1,
    dn = !1,
    fs = !1,
    la = !1,
    Ya = !1,
    Ra = !1,
    Mn = !0,
    Ni = !1;
  const Vl = 'user-content-';
  let Xe = !0,
    hn = !1,
    ra = {},
    bt = null;
  const La = I({}, [
    'annotation-xml',
    'audio',
    'colgroup',
    'desc',
    'foreignobject',
    'head',
    'iframe',
    'math',
    'mi',
    'mn',
    'mo',
    'ms',
    'mtext',
    'noembed',
    'noframes',
    'noscript',
    'plaintext',
    'script',
    'style',
    'svg',
    'template',
    'thead',
    'title',
    'video',
    'xmp',
  ]);
  let Ti = null;
  const gs = I({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
  let xs = null;
  const Si = I({}, [
      'alt',
      'class',
      'for',
      'id',
      'label',
      'name',
      'pattern',
      'placeholder',
      'role',
      'summary',
      'title',
      'value',
      'style',
      'xmlns',
    ]),
    Jt = 'http://www.w3.org/1998/Math/MathML',
    We = 'http://www.w3.org/2000/svg',
    Ge = 'http://www.w3.org/1999/xhtml';
  let Ye = Ge,
    ps = !1,
    ys = null;
  const Kl = I({}, [Jt, We, Ge], dc);
  let oa = I({}, ['mi', 'mo', 'mn', 'ms', 'mtext']),
    ca = I({}, ['annotation-xml']);
  const Dn = I({}, ['title', 'style', 'font', 'a', 'script']);
  let jt = null;
  const Yn = ['application/xhtml+xml', 'text/html'],
    un = 'text/html';
  let Ee = null,
    da = null;
  const bs = x.createElement('form'),
    Oa = function (h) {
      return h instanceof RegExp || h instanceof Function;
    },
    js = function () {
      let h = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (!(da && da === h)) {
        if (
          ((!h || typeof h != 'object') && (h = {}),
          (h = aa(h)),
          (jt = Yn.indexOf(h.PARSER_MEDIA_TYPE) === -1 ? un : h.PARSER_MEDIA_TYPE),
          (Ee = jt === 'application/xhtml+xml' ? dc : Ql),
          (J = Kt(h, 'ALLOWED_TAGS') ? I({}, h.ALLOWED_TAGS, Ee) : ye),
          (H = Kt(h, 'ALLOWED_ATTR') ? I({}, h.ALLOWED_ATTR, Ee) : Ae),
          (ys = Kt(h, 'ALLOWED_NAMESPACES') ? I({}, h.ALLOWED_NAMESPACES, dc) : Kl),
          (xs = Kt(h, 'ADD_URI_SAFE_ATTR') ? I(aa(Si), h.ADD_URI_SAFE_ATTR, Ee) : Si),
          (Ti = Kt(h, 'ADD_DATA_URI_TAGS') ? I(aa(gs), h.ADD_DATA_URI_TAGS, Ee) : gs),
          (bt = Kt(h, 'FORBID_CONTENTS') ? I({}, h.FORBID_CONTENTS, Ee) : La),
          (rt = Kt(h, 'FORBID_TAGS') ? I({}, h.FORBID_TAGS, Ee) : aa({})),
          (Da = Kt(h, 'FORBID_ATTR') ? I({}, h.FORBID_ATTR, Ee) : aa({})),
          (ra = Kt(h, 'USE_PROFILES') ? h.USE_PROFILES : !1),
          (sa = h.ALLOW_ARIA_ATTR !== !1),
          (on = h.ALLOW_DATA_ATTR !== !1),
          (cn = h.ALLOW_UNKNOWN_PROTOCOLS || !1),
          (zn = h.ALLOW_SELF_CLOSE_IN_ATTR !== !1),
          (ia = h.SAFE_FOR_TEMPLATES || !1),
          (Et = h.SAFE_FOR_XML !== !1),
          (Gt = h.WHOLE_DOCUMENT || !1),
          (la = h.RETURN_DOM || !1),
          (Ya = h.RETURN_DOM_FRAGMENT || !1),
          (Ra = h.RETURN_TRUSTED_TYPE || !1),
          (fs = h.FORCE_BODY || !1),
          (Mn = h.SANITIZE_DOM !== !1),
          (Ni = h.SANITIZE_NAMED_PROPS || !1),
          (Xe = h.KEEP_CONTENT !== !1),
          (hn = h.IN_PLACE || !1),
          (ce = h.ALLOWED_URI_REGEXP || Sm),
          (Ye = h.NAMESPACE || Ge),
          (oa = h.MATHML_TEXT_INTEGRATION_POINTS || oa),
          (ca = h.HTML_INTEGRATION_POINTS || ca),
          (P = h.CUSTOM_ELEMENT_HANDLING || {}),
          h.CUSTOM_ELEMENT_HANDLING &&
            Oa(h.CUSTOM_ELEMENT_HANDLING.tagNameCheck) &&
            (P.tagNameCheck = h.CUSTOM_ELEMENT_HANDLING.tagNameCheck),
          h.CUSTOM_ELEMENT_HANDLING &&
            Oa(h.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) &&
            (P.attributeNameCheck = h.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),
          h.CUSTOM_ELEMENT_HANDLING &&
            typeof h.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == 'boolean' &&
            (P.allowCustomizedBuiltInElements =
              h.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),
          ia && (on = !1),
          Ya && (la = !0),
          ra &&
            ((J = I({}, xm)),
            (H = []),
            ra.html === !0 && (I(J, gm), I(H, pm)),
            ra.svg === !0 && (I(J, uc), I(H, gc), I(H, Zl)),
            ra.svgFilters === !0 && (I(J, mc), I(H, gc), I(H, Zl)),
            ra.mathMl === !0 && (I(J, fc), I(H, ym), I(H, Zl))),
          h.ADD_TAGS &&
            (typeof h.ADD_TAGS == 'function'
              ? (Wt.tagCheck = h.ADD_TAGS)
              : (J === ye && (J = aa(J)), I(J, h.ADD_TAGS, Ee))),
          h.ADD_ATTR &&
            (typeof h.ADD_ATTR == 'function'
              ? (Wt.attributeCheck = h.ADD_ATTR)
              : (H === Ae && (H = aa(H)), I(H, h.ADD_ATTR, Ee))),
          h.ADD_URI_SAFE_ATTR && I(xs, h.ADD_URI_SAFE_ATTR, Ee),
          h.FORBID_CONTENTS && (bt === La && (bt = aa(bt)), I(bt, h.FORBID_CONTENTS, Ee)),
          h.ADD_FORBID_CONTENTS && (bt === La && (bt = aa(bt)), I(bt, h.ADD_FORBID_CONTENTS, Ee)),
          Xe && (J['#text'] = !0),
          Gt && I(J, ['html', 'head', 'body']),
          J.table && (I(J, ['tbody']), delete rt.tbody),
          h.TRUSTED_TYPES_POLICY)
        ) {
          if (typeof h.TRUSTED_TYPES_POLICY.createHTML != 'function')
            throw yi('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
          if (typeof h.TRUSTED_TYPES_POLICY.createScriptURL != 'function')
            throw yi(
              'TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.'
            );
          ((K = h.TRUSTED_TYPES_POLICY), (Ue = K.createHTML('')));
        } else
          (K === void 0 && (K = pp(Pe, k)),
            K !== null && typeof Ue == 'string' && (Ue = K.createHTML('')));
        (st && st(h), (da = h));
      }
    },
    vs = I({}, [...uc, ...mc, ...lp]),
    ws = I({}, [...fc, ...rp]),
    ki = function (h) {
      let S = Z(h);
      (!S || !S.tagName) && (S = { namespaceURI: Ye, tagName: 'template' });
      const E = Ql(h.tagName),
        se = Ql(S.tagName);
      return ys[h.namespaceURI]
        ? h.namespaceURI === We
          ? S.namespaceURI === Ge
            ? E === 'svg'
            : S.namespaceURI === Jt
              ? E === 'svg' && (se === 'annotation-xml' || oa[se])
              : !!vs[E]
          : h.namespaceURI === Jt
            ? S.namespaceURI === Ge
              ? E === 'math'
              : S.namespaceURI === We
                ? E === 'math' && ca[se]
                : !!ws[E]
            : h.namespaceURI === Ge
              ? (S.namespaceURI === We && !ca[se]) || (S.namespaceURI === Jt && !oa[se])
                ? !1
                : !ws[E] && (Dn[E] || !vs[E])
              : !!(jt === 'application/xhtml+xml' && ys[h.namespaceURI])
        : !1;
    },
    ot = function (h) {
      xi(f.removed, { element: h });
      try {
        Z(h).removeChild(h);
      } catch {
        F(h);
      }
    },
    Zt = function (h, S) {
      try {
        xi(f.removed, { attribute: S.getAttributeNode(h), from: S });
      } catch {
        xi(f.removed, { attribute: null, from: S });
      }
      if ((S.removeAttribute(h), h === 'is'))
        if (la || Ya)
          try {
            ot(S);
          } catch {}
        else
          try {
            S.setAttribute(h, '');
          } catch {}
    },
    Ns = function (h) {
      let S = null,
        E = null;
      if (fs) h = '<remove></remove>' + h;
      else {
        const U = hc(h, /^[\r\n\t ]+/);
        E = U && U[0];
      }
      jt === 'application/xhtml+xml' &&
        Ye === Ge &&
        (h =
          '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + h + '</body></html>');
      const se = K ? K.createHTML(h) : h;
      if (Ye === Ge)
        try {
          S = new ie().parseFromString(se, jt);
        } catch {}
      if (!S || !S.documentElement) {
        S = De.createDocument(Ye, 'template', null);
        try {
          S.documentElement.innerHTML = ps ? Ue : se;
        } catch {}
      }
      const Ne = S.body || S.documentElement;
      return (
        h && E && Ne.insertBefore(x.createTextNode(E), Ne.childNodes[0] || null),
        Ye === Ge ? za.call(S, Gt ? 'html' : 'body')[0] : Gt ? S.documentElement : Ne
      );
    },
    Ts = function (h) {
      return lt.call(
        h.ownerDocument || h,
        h,
        me.SHOW_ELEMENT |
          me.SHOW_COMMENT |
          me.SHOW_TEXT |
          me.SHOW_PROCESSING_INSTRUCTION |
          me.SHOW_CDATA_SECTION,
        null
      );
    },
    Ct = function (h) {
      return (
        h instanceof L &&
        (typeof h.nodeName != 'string' ||
          typeof h.textContent != 'string' ||
          typeof h.removeChild != 'function' ||
          !(h.attributes instanceof pt) ||
          typeof h.removeAttribute != 'function' ||
          typeof h.setAttribute != 'function' ||
          typeof h.namespaceURI != 'string' ||
          typeof h.insertBefore != 'function' ||
          typeof h.hasChildNodes != 'function')
      );
    },
    Re = function (h) {
      return typeof $ == 'function' && h instanceof $;
    };
  function ve(M, h, S) {
    Gl(M, E => {
      E.call(f, h, S, da);
    });
  }
  const ha = function (h) {
      let S = null;
      if ((ve(Te.beforeSanitizeElements, h, null), Ct(h))) return (ot(h), !0);
      const E = Ee(h.nodeName);
      if (
        (ve(Te.uponSanitizeElement, h, { tagName: E, allowedTags: J }),
        (Et &&
          h.hasChildNodes() &&
          !Re(h.firstElementChild) &&
          nt(/<[/\w!]/g, h.innerHTML) &&
          nt(/<[/\w!]/g, h.textContent)) ||
          h.nodeType === ji.progressingInstruction ||
          (Et && h.nodeType === ji.comment && nt(/<[/\w]/g, h.data)))
      )
        return (ot(h), !0);
      if (!(Wt.tagCheck instanceof Function && Wt.tagCheck(E)) && (!J[E] || rt[E])) {
        if (
          !rt[E] &&
          Ai(E) &&
          ((P.tagNameCheck instanceof RegExp && nt(P.tagNameCheck, E)) ||
            (P.tagNameCheck instanceof Function && P.tagNameCheck(E)))
        )
          return !1;
        if (Xe && !bt[E]) {
          const se = Z(h) || h.parentNode,
            Ne = tt(h) || h.childNodes;
          if (Ne && se) {
            const U = Ne.length;
            for (let Ve = U - 1; Ve >= 0; --Ve) {
              const zt = ne(Ne[Ve], !0);
              ((zt.__removalCount = (h.__removalCount || 0) + 1), se.insertBefore(zt, oe(h)));
            }
          }
        }
        return (ot(h), !0);
      }
      return (h instanceof pe && !ki(h)) ||
        ((E === 'noscript' || E === 'noembed' || E === 'noframes') &&
          nt(/<\/no(script|embed|frames)/i, h.innerHTML))
        ? (ot(h), !0)
        : (ia &&
            h.nodeType === ji.text &&
            ((S = h.textContent),
            Gl([et, Ma, na], se => {
              S = pi(S, se, ' ');
            }),
            h.textContent !== S &&
              (xi(f.removed, { element: h.cloneNode() }), (h.textContent = S))),
          ve(Te.afterSanitizeElements, h, null),
          !1);
    },
    Rn = function (h, S, E) {
      if (Mn && (S === 'id' || S === 'name') && (E in x || E in bs)) return !1;
      if (!(on && !Da[S] && nt(It, S))) {
        if (!(sa && nt(N, S))) {
          if (!(Wt.attributeCheck instanceof Function && Wt.attributeCheck(S, h))) {
            if (!H[S] || Da[S]) {
              if (
                !(
                  (Ai(h) &&
                    ((P.tagNameCheck instanceof RegExp && nt(P.tagNameCheck, h)) ||
                      (P.tagNameCheck instanceof Function && P.tagNameCheck(h))) &&
                    ((P.attributeNameCheck instanceof RegExp && nt(P.attributeNameCheck, S)) ||
                      (P.attributeNameCheck instanceof Function && P.attributeNameCheck(S, h)))) ||
                  (S === 'is' &&
                    P.allowCustomizedBuiltInElements &&
                    ((P.tagNameCheck instanceof RegExp && nt(P.tagNameCheck, E)) ||
                      (P.tagNameCheck instanceof Function && P.tagNameCheck(E))))
                )
              )
                return !1;
            } else if (!xs[S]) {
              if (!nt(ce, pi(E, O, ''))) {
                if (
                  !(
                    (S === 'src' || S === 'xlink:href' || S === 'href') &&
                    h !== 'script' &&
                    ap(E, 'data:') === 0 &&
                    Ti[h]
                  )
                ) {
                  if (!(cn && !nt(A, pi(E, O, '')))) {
                    if (E) return !1;
                  }
                }
              }
            }
          }
        }
      }
      return !0;
    },
    Ai = function (h) {
      return h !== 'annotation-xml' && hc(h, fe);
    },
    Ei = function (h) {
      ve(Te.beforeSanitizeAttributes, h, null);
      const { attributes: S } = h;
      if (!S || Ct(h)) return;
      const E = {
        attrName: '',
        attrValue: '',
        keepAttr: !0,
        allowedAttributes: H,
        forceKeepAttr: void 0,
      };
      let se = S.length;
      for (; se--; ) {
        const Ne = S[se],
          { name: U, namespaceURI: Ve, value: zt } = Ne,
          ct = Ee(U),
          Ft = zt;
        let qe = U === 'value' ? Ft : np(Ft);
        if (
          ((E.attrName = ct),
          (E.attrValue = qe),
          (E.keepAttr = !0),
          (E.forceKeepAttr = void 0),
          ve(Te.uponSanitizeAttribute, h, E),
          (qe = E.attrValue),
          Ni && (ct === 'id' || ct === 'name') && (Zt(U, h), (qe = Vl + qe)),
          Et && nt(/((--!?|])>)|<\/(style|title|textarea)/i, qe))
        ) {
          Zt(U, h);
          continue;
        }
        if (ct === 'attributename' && hc(qe, 'href')) {
          Zt(U, h);
          continue;
        }
        if (E.forceKeepAttr) continue;
        if (!E.keepAttr) {
          Zt(U, h);
          continue;
        }
        if (!zn && nt(/\/>/i, qe)) {
          Zt(U, h);
          continue;
        }
        ia &&
          Gl([et, Ma, na], ks => {
            qe = pi(qe, ks, ' ');
          });
        const Ss = Ee(h.nodeName);
        if (!Rn(Ss, ct, qe)) {
          Zt(U, h);
          continue;
        }
        if (K && typeof Pe == 'object' && typeof Pe.getAttributeType == 'function' && !Ve)
          switch (Pe.getAttributeType(Ss, ct)) {
            case 'TrustedHTML': {
              qe = K.createHTML(qe);
              break;
            }
            case 'TrustedScriptURL': {
              qe = K.createScriptURL(qe);
              break;
            }
          }
        if (qe !== Ft)
          try {
            (Ve ? h.setAttributeNS(Ve, U, qe) : h.setAttribute(U, qe),
              Ct(h) ? ot(h) : fm(f.removed));
          } catch {
            Zt(U, h);
          }
      }
      ve(Te.afterSanitizeAttributes, h, null);
    },
    Ci = function M(h) {
      let S = null;
      const E = Ts(h);
      for (ve(Te.beforeSanitizeShadowDOM, h, null); (S = E.nextNode()); )
        (ve(Te.uponSanitizeShadowNode, S, null),
          ha(S),
          Ei(S),
          S.content instanceof z && M(S.content));
      ve(Te.afterSanitizeShadowDOM, h, null);
    };
  return (
    (f.sanitize = function (M) {
      let h = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
        S = null,
        E = null,
        se = null,
        Ne = null;
      if (((ps = !M), ps && (M = '<!-->'), typeof M != 'string' && !Re(M)))
        if (typeof M.toString == 'function') {
          if (((M = M.toString()), typeof M != 'string'))
            throw yi('dirty is not a string, aborting');
        } else throw yi('toString is not a function');
      if (!f.isSupported) return M;
      if ((dn || js(h), (f.removed = []), typeof M == 'string' && (hn = !1), hn)) {
        if (M.nodeName) {
          const zt = Ee(M.nodeName);
          if (!J[zt] || rt[zt]) throw yi('root node is forbidden and cannot be sanitized in-place');
        }
      } else if (M instanceof $)
        ((S = Ns('<!---->')),
          (E = S.ownerDocument.importNode(M, !0)),
          (E.nodeType === ji.element && E.nodeName === 'BODY') || E.nodeName === 'HTML'
            ? (S = E)
            : S.appendChild(E));
      else {
        if (!la && !ia && !Gt && M.indexOf('<') === -1) return K && Ra ? K.createHTML(M) : M;
        if (((S = Ns(M)), !S)) return la ? null : Ra ? Ue : '';
      }
      S && fs && ot(S.firstChild);
      const U = Ts(hn ? M : S);
      for (; (se = U.nextNode()); ) (ha(se), Ei(se), se.content instanceof z && Ci(se.content));
      if (hn) return M;
      if (la) {
        if (Ya) for (Ne = yt.call(S.ownerDocument); S.firstChild; ) Ne.appendChild(S.firstChild);
        else Ne = S;
        return ((H.shadowroot || H.shadowrootmode) && (Ne = Cn.call(u, Ne, !0)), Ne);
      }
      let Ve = Gt ? S.outerHTML : S.innerHTML;
      return (
        Gt &&
          J['!doctype'] &&
          S.ownerDocument &&
          S.ownerDocument.doctype &&
          S.ownerDocument.doctype.name &&
          nt(km, S.ownerDocument.doctype.name) &&
          (Ve =
            '<!DOCTYPE ' +
            S.ownerDocument.doctype.name +
            `>
` +
            Ve),
        ia &&
          Gl([et, Ma, na], zt => {
            Ve = pi(Ve, zt, ' ');
          }),
        K && Ra ? K.createHTML(Ve) : Ve
      );
    }),
    (f.setConfig = function () {
      let M = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      (js(M), (dn = !0));
    }),
    (f.clearConfig = function () {
      ((da = null), (dn = !1));
    }),
    (f.isValidAttribute = function (M, h, S) {
      da || js({});
      const E = Ee(M),
        se = Ee(h);
      return Rn(E, se, S);
    }),
    (f.addHook = function (M, h) {
      typeof h == 'function' && xi(Te[M], h);
    }),
    (f.removeHook = function (M, h) {
      if (h !== void 0) {
        const S = ep(Te[M], h);
        return S === -1 ? void 0 : tp(Te[M], S, 1)[0];
      }
      return fm(Te[M]);
    }),
    (f.removeHooks = function (M) {
      Te[M] = [];
    }),
    (f.removeAllHooks = function () {
      Te = jm();
    }),
    f
  );
}
var yp = Am();
function Be({ children: d, meta: f, breadcrumbs: x, keyTakeaways: u, ctaOverride: k }) {
  const [z, q] = xt.useState(0),
    [$, pe] = xt.useState(!0),
    [me, pt] = xt.useState(0),
    {
      title: L,
      subtitle: ie,
      date: Pe = 'Dec 10, 2025',
      readTime: Me = '5 min read',
      author: ne = 'LiaiZen Team',
    } = f || {};
  return (
    xt.useEffect(() => {
      const F = () => {
        const oe = document.documentElement.scrollTop,
          tt = document.documentElement.scrollHeight - document.documentElement.clientHeight,
          Z = `${oe / tt}`;
        q(Number(Z));
        const K = window.scrollY;
        (K > me && K > 100 ? pe(!1) : pe(!0), pt(K));
      };
      return (
        window.addEventListener('scroll', F, { passive: !0 }),
        () => window.removeEventListener('scroll', F)
      );
    }, [me]),
    t.jsxs('div', {
      className:
        'min-h-dvh bg-white font-sans text-gray-900 selection:bg-teal-100 selection:text-teal-900 pb-nav-mobile overflow-y-auto',
      children: [
        t.jsx('div', {
          className: 'fixed top-0 left-0 h-1 bg-teal-500 z-50 transition-all duration-150',
          style: { width: `${z * 100}%` },
        }),
        t.jsx('nav', {
          className: `fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40 transition-transform duration-300 ${$ ? 'translate-y-0' : '-translate-y-full'}`,
          children: t.jsxs('div', {
            className:
              'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between',
            children: [
              t.jsx('a', {
                href: '/',
                className: 'flex items-center gap-2 group',
                children: t.jsx('img', {
                  src: '/assets/Logo.svg',
                  alt: 'LiaiZen',
                  className: 'h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity',
                }),
              }),
              t.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  t.jsx('a', {
                    href: '/co-parenting-communication',
                    className:
                      'hidden sm:block text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors',
                    children: 'All Articles',
                  }),
                  t.jsx(vi, {
                    variant: 'teal-solid',
                    size: 'small',
                    onClick: () => (window.location.href = '/'),
                    className: 'rounded-full px-4',
                    children: 'Join Waitlist',
                  }),
                ],
              }),
            ],
          }),
        }),
        t.jsx('header', {
          className: 'bg-gradient-to-b from-teal-50/50 to-white pt-32 pb-12 px-4 sm:px-6 lg:px-8',
          children: t.jsxs('div', {
            className: 'max-w-3xl mx-auto',
            children: [
              t.jsxs('nav', {
                className:
                  'flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar',
                children: [
                  t.jsx('a', {
                    href: '/',
                    className: 'hover:text-teal-600 transition-colors',
                    children: 'Home',
                  }),
                  t.jsx('span', { className: 'text-gray-300', children: '/' }),
                  x &&
                    x.map((F, oe) =>
                      t.jsxs(
                        Xl.Fragment,
                        {
                          children: [
                            F.href
                              ? t.jsx('a', {
                                  href: F.href,
                                  className: 'hover:text-teal-600 transition-colors',
                                  children: F.label,
                                })
                              : t.jsx('span', {
                                  className: 'text-teal-700 font-medium',
                                  children: F.label,
                                }),
                            oe < x.length - 1 &&
                              t.jsx('span', { className: 'text-gray-300', children: '/' }),
                          ],
                        },
                        oe
                      )
                    ),
                ],
              }),
              t.jsx('h1', {
                className:
                  'text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight',
                children: L,
              }),
              ie &&
                t.jsx('p', {
                  className: 'text-xl text-gray-600 mb-8 leading-relaxed',
                  children: ie,
                }),
              t.jsxs('div', {
                className:
                  'flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-6',
                children: [
                  t.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      t.jsx('div', {
                        className:
                          'w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs',
                        children: 'LZ',
                      }),
                      t.jsx('span', { className: 'font-medium text-gray-900', children: ne }),
                    ],
                  }),
                  t.jsx('span', { className: 'text-gray-300', children: '•' }),
                  t.jsx('span', { children: Pe }),
                  t.jsx('span', { className: 'text-gray-300', children: '•' }),
                  t.jsx('span', { children: Me }),
                ],
              }),
            ],
          }),
        }),
        f.heroImage &&
          t.jsx('div', {
            className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8 relative z-10',
            children: t.jsx('div', {
              className:
                'aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-gray-100/50',
              children: t.jsx('img', {
                src: f.heroImage,
                alt: f.heroImageAlt || f.title,
                className: 'w-full h-full object-cover',
                onError: F => {
                  (console.error('[BlogArticleLayout] Image failed to load:', f.heroImage),
                    console.error('[BlogArticleLayout] Error details:', F));
                },
                onLoad: () => {
                  console.log('[BlogArticleLayout] Image loaded successfully:', f.heroImage);
                },
              }),
            }),
          }),
        t.jsxs('main', {
          className: 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
          children: [
            u &&
              t.jsxs('div', {
                className: 'bg-teal-50/50 border border-teal-100 rounded-2xl p-6 mb-12',
                children: [
                  t.jsxs('h3', {
                    className: 'text-teal-800 font-bold mb-3 flex items-center gap-2',
                    children: [
                      t.jsx('svg', {
                        className: 'w-5 h-5',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24',
                        children: t.jsx('path', {
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          strokeWidth: 2,
                          d: 'M13 10V3L4 14h7v7l9-11h-7z',
                        }),
                      }),
                      'Key Takeaways',
                    ],
                  }),
                  t.jsx('ul', {
                    className: 'space-y-2 text-gray-700 text-sm sm:text-base',
                    children: u.map((F, oe) =>
                      t.jsxs(
                        'li',
                        {
                          className: 'flex items-start gap-2',
                          children: [
                            t.jsx('span', { className: 'text-teal-400 mt-1.5', children: '•' }),
                            t.jsx('span', { dangerouslySetInnerHTML: { __html: yp.sanitize(F) } }),
                          ],
                        },
                        oe
                      )
                    ),
                  }),
                ],
              }),
            t.jsx('article', {
              className:
                'prose prose-lg prose-teal mx-auto prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-8 prose-li:text-gray-600',
              children: d,
            }),
            k ||
              t.jsxs('div', {
                className:
                  'my-16 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl',
                children: [
                  t.jsxs('div', {
                    className: 'relative z-10',
                    children: [
                      t.jsx('span', {
                        className:
                          'inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase mb-4 text-teal-50 border border-white/20',
                        children: 'Early Access',
                      }),
                      t.jsx('h3', {
                        className: 'text-2xl sm:text-3xl font-bold mb-4',
                        children: 'Ready to break the cycle?',
                      }),
                      t.jsx('p', {
                        className: 'text-lg text-teal-100 mb-8 max-w-xl mx-auto leading-relaxed',
                        children:
                          'LiaiZen gives you the real-time guidance you need to change your co-parenting dynamic—one message at a time.',
                      }),
                      t.jsx(vi, {
                        variant: 'white',
                        size: 'large',
                        className:
                          'font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto text-teal-700 hover:text-teal-800',
                        onClick: () => {
                          window.location.href = '/';
                        },
                        children: 'Join the Waitlist',
                      }),
                      t.jsx('p', {
                        className: 'mt-4 text-xs text-teal-200 opacity-80',
                        children: 'Free for early beta users. No credit card required.',
                      }),
                    ],
                  }),
                  t.jsx('div', {
                    className: 'absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none',
                    children: t.jsx('svg', {
                      viewBox: '0 0 100 100',
                      preserveAspectRatio: 'none',
                      className: 'w-full h-full',
                      children: t.jsx('path', { d: 'M0 100 C 20 0 50 0 100 100 Z', fill: 'white' }),
                    }),
                  }),
                ],
              }),
          ],
        }),
        t.jsx('footer', {
          className: 'bg-white border-t border-gray-100 mt-20 py-12 px-4',
          children: t.jsxs('div', {
            className: 'max-w-7xl mx-auto flex flex-col items-center',
            children: [
              t.jsx('img', {
                src: '/assets/Logo.svg',
                alt: 'LiaiZen',
                className:
                  'h-6 mb-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500',
              }),
              t.jsxs('div', {
                className:
                  'flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500 mb-8',
                children: [
                  t.jsx('a', {
                    href: '/co-parenting-communication',
                    className: 'hover:text-teal-600 transition-colors',
                    children: 'Communication',
                  }),
                  t.jsx('a', {
                    href: '/high-conflict-co-parenting',
                    className: 'hover:text-teal-600 transition-colors',
                    children: 'High Conflict',
                  }),
                  t.jsx('a', {
                    href: '/child-centered-co-parenting',
                    className: 'hover:text-teal-600 transition-colors',
                    children: 'Child-Centered',
                  }),
                  t.jsx('a', {
                    href: '/liaizen-ai-co-parenting',
                    className: 'hover:text-teal-600 transition-colors',
                    children: 'LiaiZen AI',
                  }),
                ],
              }),
              t.jsx('p', {
                className: 'text-gray-400 text-sm',
                children: '© 2025 LiaiZen. All rights reserved.',
              }),
            ],
          }),
        }),
      ],
    })
  );
}
function bc(d) {
  const f = `${wi}/api/blog/images/${d}.png`,
    x = f.includes('?') ? '&' : '?';
  return `${f}${x}v=8`;
}
const bp = bc('why-arguments-repeat') || `${wi}/api/blog/images/why-arguments-repeat.png`,
  jp = `${wi}/api/blog/images/game-theory-matrix.png`;
function vm() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          "The Co-Parent's Dilemma:",
          ' ',
          t.jsx('span', {
            className: 'text-teal-600',
            children: 'Why Negotiation Feels Like War (And How to Find Peace)',
          }),
        ],
      }),
      subtitle:
        'Discover why simple conversations turn into emotional tug-of-wars, the psychological traps keeping you stuck, and five powerful reframes to find your way back to win-win.',
      date: 'Dec 10, 2025',
      readTime: '8 min read',
      heroImage: bp,
      heroImageAlt: "Understanding the co-parent's dilemma",
    },
    f = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Co-Parenting Communication' },
    ],
    x = [
      '<strong>The Sunset/Sunrise Problem:</strong> You and your co-parent can witness the same event and derive completely opposite—yet logical—truths.',
      `<strong>Loss Aversion:</strong> Your brain processes compromise as a "loss," making collaboration feel like surrender even when it's the best path.`,
      '<strong>The Override:</strong> Five specific mental reframes can help you stay in win-win mode when your biology screams "protect yourself."',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('p', {
        className: 'text-lg text-gray-700 leading-relaxed',
        children:
          'Have you ever started a conversation with your co-parent expecting a simple, logical negotiation, only to find yourself locked in an emotional tug-of-war ten minutes later?',
      }),
      t.jsxs('p', {
        className: 'text-lg text-gray-700 leading-relaxed',
        children: [
          'It is a frustratingly common dynamic. You walk away thinking,',
          ' ',
          t.jsx('em', { children: '"How can they be so unreasonable?"' }),
          ' Meanwhile, they are likely thinking the exact same thing about you.',
        ],
      }),
      t.jsx('p', {
        className: 'text-lg text-gray-700 leading-relaxed',
        children: `For the longest time, I wondered why this happens even when both parents love their children. The answer, it turns out, isn't that one person is "bad" or "wrong." The answer lies in how our brains process reality.`,
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children:
            'We are stuck in a psychological trap, but the good news is that once you see the trap, you can step out of it.',
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Hidden Truth: The "Sunset/Sunrise" Problem' }),
      t.jsxs('p', {
        children: [
          'The first discovery we need to make is about perspective. In psychology, there is a concept called ',
          t.jsx('strong', { children: 'Naive Realism' }),
          '. It is the natural human tendency to believe that we see the world objectively—exactly as it is. Therefore, we assume that if the other person disagrees with us, they must be uninformed, irrational, or biased.',
        ],
      }),
      t.jsx('p', { children: 'Think of it as the "Sunset/Sunrise" problem.' }),
      t.jsx('p', {
        children:
          'Imagine a late drop-off or a missed school flyer. Two people witness this exact same event but derive two opposing, yet seemingly logical, truths:',
      }),
      t.jsxs('div', {
        className: 'grid sm:grid-cols-2 gap-4 my-8',
        children: [
          t.jsxs('div', {
            className: 'bg-gray-50 rounded-xl p-6 border border-gray-200',
            children: [
              t.jsx('p', {
                className: 'font-semibold text-gray-800 mb-2',
                children: 'Parent A sees:',
              }),
              t.jsx('p', {
                className: 'text-gray-600 italic',
                children: '"A simple, human mistake."',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'bg-gray-50 rounded-xl p-6 border border-gray-200',
            children: [
              t.jsx('p', {
                className: 'font-semibold text-gray-800 mb-2',
                children: 'Parent B sees:',
              }),
              t.jsx('p', {
                className: 'text-gray-600 italic',
                children: '"A blatant lack of respect."',
              }),
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'When you add a history of broken trust to this mix, your brain adds a filter called',
          ' ',
          t.jsx('strong', { children: 'Negativity Bias' }),
          '. Evolution has hard-wired the human brain to prioritize "threat" over "reward" to ensure survival. This is why your amygdala reacts intensely to a perceived slight in a text message, while completely overlooking a cooperative gesture.',
        ],
      }),
      t.jsxs('p', {
        children: [
          'This combination of different perspectives and biological defensiveness lands you squarely in what I call ',
          t.jsx('strong', { children: "The Co-parent's Dilemma" }),
          '.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Biological Hurdle: Why "Winning" Feels Safer' }),
      t.jsx('p', { children: 'In this dilemma, you generally have two choices:' }),
      t.jsxs('ol', {
        className: 'list-decimal list-inside space-y-2 my-6 text-gray-700',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Collaborate:' }),
              ' Give a little to get a little, reaching a happy medium.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Turn against each other:' }),
              ' Fight for what is "rightfully yours."',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Logically, we know collaboration is better. But if you choose the second path, someone has to take the loss. And in co-parenting, those losses usually become heavy burdens that the children have to carry.',
      }),
      t.jsxs('div', {
        className: 'my-10',
        children: [
          t.jsx('img', {
            src: jp,
            alt: 'Co-Parenting Game Theory Matrix showing the outcomes of cooperation vs domination',
            className: 'w-full rounded-xl shadow-lg',
            loading: 'lazy',
            decoding: 'async',
          }),
          t.jsx('p', {
            className: 'text-center text-sm text-gray-500 mt-3 italic',
            children: "The Co-Parent's Dilemma: Why collaboration is logical but feels impossible",
          }),
        ],
      }),
      t.jsx('p', { children: 'So, why is it so hard to just collaborate?' }),
      t.jsx('div', {
        className: 'bg-amber-50 border border-amber-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'flex items-start gap-4',
          children: [
            t.jsx('div', {
              className:
                'flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center',
              children: t.jsx('svg', {
                className: 'w-5 h-5 text-amber-600',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                children: t.jsx('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
                }),
              }),
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'font-semibold text-amber-800 mb-1',
                  children: 'The "Aha!" Moment',
                }),
                t.jsx('p', {
                  className: 'text-amber-900',
                  children:
                    'The desire to protect your children often gets overridden by your own need for survival. Your brain processes a compromise as a "loss," and loss is biologically processed as a threat.',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsxs('p', {
        children: [
          'This is ',
          t.jsx('strong', { children: 'Loss Aversion' }),
          ". It's a cornerstone of behavioral economics suggesting that the pain of losing something is psychologically about",
          ' ',
          t.jsx('em', { children: 'twice as powerful' }),
          ' as the pleasure of gaining the same thing. Giving up an hour of parenting time feels twice as bad as gaining an hour feels good.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Solution: 5 Ways to Override Your Instincts' }),
      t.jsxs('p', {
        children: [
          'Ultimately, a win/win scenario is the best outcome for your family. However, because of your wiring, ',
          t.jsx('em', { children: "it won't feel like the best outcome" }),
          ' in the heat of the moment.',
        ],
      }),
      t.jsx('p', {
        children:
          'Staying in a win-win mindset when your biology is screaming "protect yourself" is hard work. It requires a mental override—a way to trick your brain out of the short-term fight and into the long-term build.',
      }),
      t.jsx('p', {
        children:
          'Here are five specific reframes to help you rediscover your power and anchor yourself in the bigger picture.',
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsxs('div', {
            className: 'flex items-start gap-3 mb-4',
            children: [
              t.jsx('div', {
                className:
                  'w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0',
                children: '1',
              }),
              t.jsx('h3', {
                className: 'text-xl font-bold text-teal-800 m-0',
                children: 'Shift from the Finite to the Infinite Game',
              }),
            ],
          }),
          t.jsx('p', {
            className: 'text-gray-700 mb-4',
            children:
              'Most arguments feel high-stakes because we treat them like a "Finite Game"—a match with a winner, a loser, and a final buzzer. If you lose the argument about the holiday schedule, it feels like "game over."',
          }),
          t.jsxs('div', {
            className: 'bg-white rounded-lg p-4 border border-teal-100',
            children: [
              t.jsx('p', {
                className: 'font-semibold text-teal-700 mb-2',
                children: 'The Reframe:',
              }),
              t.jsxs('p', {
                className: 'text-gray-700 mb-3',
                children: [
                  'Realize you are playing an ',
                  t.jsx('strong', { children: 'Infinite Game' }),
                  ". The goal isn't to win the Tuesday text exchange; the goal is to keep the game (your child's development) going for 20 years.",
                ],
              }),
              t.jsx('p', { className: 'font-semibold text-teal-700 mb-2', children: 'The Check:' }),
              t.jsx('p', {
                className: 'text-gray-600 italic',
                children: `"Does winning this battle help me win the war for my child's mental health?"`,
              }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsxs('div', {
            className: 'flex items-start gap-3 mb-4',
            children: [
              t.jsx('div', {
                className:
                  'w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0',
                children: '2',
              }),
              t.jsx('h3', {
                className: 'text-xl font-bold text-teal-800 m-0',
                children: 'The "Future-Retro" Perspective',
              }),
            ],
          }),
          t.jsx('p', {
            className: 'text-gray-700 mb-4',
            children:
              "It is easy to get tunnel vision on the resources right in front of you—the $50 for the cleats or the 2 hours on Sunday. But there are invisible resources that are arguably more valuable: your child's trust and your own peace.",
          }),
          t.jsxs('div', {
            className: 'bg-white rounded-lg p-4 border border-teal-100',
            children: [
              t.jsx('p', { className: 'font-semibold text-teal-700 mb-2', children: 'The Check:' }),
              t.jsxs('p', {
                className: 'text-gray-700',
                children: [
                  "Project yourself 15 years into the future. Imagine your child is graduating. Will this specific disagreement matter? If the answer is no, it is a depreciable asset. Don't spend your expensive emotional energy on it. Save your capital for the things that",
                  ' ',
                  t.jsx('em', { children: 'will' }),
                  ' be remembered.',
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsxs('div', {
            className: 'flex items-start gap-3 mb-4',
            children: [
              t.jsx('div', {
                className:
                  'w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0',
                children: '3',
              }),
              t.jsx('h3', {
                className: 'text-xl font-bold text-teal-800 m-0',
                children: 'Audit Your "Emotional Accounting"',
              }),
            ],
          }),
          t.jsxs('p', {
            className: 'text-gray-700 mb-4',
            children: [
              'We tend to keep a mental ledger of debts:',
              ' ',
              t.jsx('em', { children: '"I was flexible last week, so they owe me this week."' }),
              " When the other person doesn't pay up, we feel cheated.",
            ],
          }),
          t.jsxs('div', {
            className: 'bg-white rounded-lg p-4 border border-teal-100',
            children: [
              t.jsx('p', {
                className: 'font-semibold text-teal-700 mb-2',
                children: 'The Reframe:',
              }),
              t.jsxs('p', {
                className: 'text-gray-700',
                children: [
                  'Stop viewing flexibility as a loan. View it as an',
                  ' ',
                  t.jsx('strong', { children: 'investment in the ecosystem' }),
                  ". You aren't doing it for ",
                  t.jsx('em', { children: 'them' }),
                  '; you are doing it to lower the toxicity levels in the water your child swims in. When you view kindness as a gift to your child rather than a favor to your ex, you stop waiting for a "thank you" that might never come.',
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsxs('div', {
            className: 'flex items-start gap-3 mb-4',
            children: [
              t.jsx('div', {
                className:
                  'w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0',
                children: '4',
              }),
              t.jsx('h3', {
                className: 'text-xl font-bold text-teal-800 m-0',
                children: 'The Somatic "Circuit Breaker"',
              }),
            ],
          }),
          t.jsx('p', {
            className: 'text-gray-700 mb-4',
            children:
              'Your body usually knows you are leaving the "win-win" zone before your brain does. A tight chest, shallow breathing, or a clenched jaw are the first signs that your amygdala is hijacking the bus.',
          }),
          t.jsxs('div', {
            className: 'bg-white rounded-lg p-4 border border-teal-100',
            children: [
              t.jsx('p', { className: 'font-semibold text-teal-700 mb-2', children: 'The Check:' }),
              t.jsxs('p', {
                className: 'text-gray-700',
                children: [
                  'Before you hit send on a reply, do a quick body scan. If you are physically tense, you are likely in "survival mode." In that state, you are biologically incapable of seeing the win-win.',
                  ' ',
                  t.jsx('strong', {
                    children:
                      'Step away. The most productive thing you can do in that moment is nothing.',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsxs('div', {
            className: 'flex items-start gap-3 mb-4',
            children: [
              t.jsx('div', {
                className:
                  'w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0',
                children: '5',
              }),
              t.jsx('h3', {
                className: 'text-xl font-bold text-teal-800 m-0',
                children: 'Separate the Intent from the Impact',
              }),
            ],
          }),
          t.jsxs('p', {
            className: 'text-gray-700 mb-4',
            children: [
              'Naive Realism makes us assume that if their action hurt us, their ',
              t.jsx('em', { children: 'intention' }),
              ' was to hurt us. This is often false. They might be disorganized, stressed, or oblivious—not malicious.',
            ],
          }),
          t.jsxs('div', {
            className: 'bg-white rounded-lg p-4 border border-teal-100',
            children: [
              t.jsx('p', {
                className: 'font-semibold text-teal-700 mb-2',
                children: 'The Reframe:',
              }),
              t.jsxs('p', {
                className: 'text-gray-700 mb-3',
                children: [
                  'Try on the "Benevolent Translator" hat. Ask yourself,',
                  ' ',
                  t.jsx('em', { children: '"Is there a generous explanation for this?"' }),
                ],
              }),
              t.jsxs('div', {
                className: 'space-y-2 text-sm',
                children: [
                  t.jsxs('p', {
                    children: [t.jsx('strong', { children: 'Impact:' }), " They didn't call back."],
                  }),
                  t.jsxs('p', {
                    children: [
                      t.jsx('strong', { children: 'Fear Story:' }),
                      ' They are ignoring me to be controlling.',
                    ],
                  }),
                  t.jsxs('p', {
                    children: [
                      t.jsx('strong', { children: 'Generous Story:' }),
                      ' They are overwhelmed at work and forgot.',
                    ],
                  }),
                ],
              }),
              t.jsxs('p', {
                className: 'text-gray-600 mt-3 italic',
                children: [
                  "Even if the generous story isn't 100% true, believing it keeps ",
                  t.jsx('em', { children: 'you' }),
                  ' calm, which keeps ',
                  t.jsx('em', { children: 'you' }),
                  " in the driver's seat.",
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', {
        className: 'text-2xl font-bold text-gray-900 mb-4',
        children: 'The Final Discovery: Peace is a Practice, Not a Destination',
      }),
      t.jsx('p', {
        className: 'text-lg text-gray-700 leading-relaxed mb-6',
        children: `Knowledge is the antidote to the chaos. When you understand that your co-parent isn't necessarily a villain, but a human struggling with the same Naive Realism and Loss Aversion that you are, the game changes. You stop reacting to the "sunset" and start building a new horizon.`,
      }),
      t.jsx('p', {
        className: 'text-lg text-gray-700 leading-relaxed',
        children:
          "It won't be easy, and you won't get it right every time. But every time you choose to pause, reframe, and override your biology, you are doing more than just avoiding an argument—you are actively constructing a foundation of peace for your children to stand on. And that is a victory worth every bit of the effort.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsxs('div', {
        className: 'bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 my-8 text-white',
        children: [
          t.jsx('h3', {
            className: 'text-2xl font-bold mb-3',
            children: 'Ready to Put This Into Practice?',
          }),
          t.jsx('p', {
            className: 'text-teal-100 mb-6',
            children:
              'The first step in changing a pattern is understanding where you currently stand. Take our quick assessment to discover your natural co-parenting stance and get personalized insights.',
          }),
          t.jsxs(Ug, {
            to: '/quizzes/co-parenting-stance',
            className:
              'inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors',
            children: [
              'Take the Co-Parenting Stance Assessment',
              t.jsx('svg', {
                className: 'w-5 h-5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                children: t.jsx('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M9 5l7 7-7 7',
                }),
              }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What is Naive Realism?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Naive Realism is the psychological tendency to believe we see the world objectively and as it truly is. This leads us to assume that people who disagree with us must be uninformed, irrational, or biased—when in reality, they're processing the same events through their own equally valid lens.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Why does compromise feel like losing?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'This is due to Loss Aversion—a principle from behavioral economics showing that the pain of losing something feels about twice as intense as the pleasure of gaining the same thing. Your brain literally processes "giving up" parenting time as a threat, even when the trade-off benefits everyone.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "What's the difference between a Finite and Infinite Game?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `A Finite Game has clear rules, winners, losers, and an endpoint (like a tennis match). An Infinite Game has no final winner—the goal is to keep playing (like raising a child). When you treat co-parenting arguments as finite games to "win," you sacrifice the infinite game of your child's long-term wellbeing.`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function vp() {
  const d = bc('emotional-triggers');
  Xl.useEffect(() => {
    (console.log('[EmotionalTriggers] Hero image path:', d),
      console.log('[EmotionalTriggers] Image map loaded:', d !== null));
  }, [d]);
  const f = {
      title: t.jsxs(t.Fragment, {
        children: [
          'Why Co-Parenting Messages Feel ',
          t.jsx('span', { className: 'text-teal-600', children: 'More Hurtful' }),
          ' Than They Are',
        ],
      }),
      subtitle:
        'Understanding the psychology behind emotional triggers and why neutral texts can feel like attacks.',
      date: 'Dec 11, 2025',
      readTime: '6 min read',
      heroImage: d,
      heroImageAlt: 'Understanding emotional triggers in co-parenting communication',
    },
    x = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Emotional Triggers' },
    ],
    u = [
      'Your nervous system processes co-parent messages through a <strong>threat filter</strong> shaped by past conflict.',
      'Neutral messages get misread because your brain is <strong>pattern-matching</strong> against painful history.',
      'The gap between <strong>intent and interpretation</strong> is widest when trust has been damaged.',
    ];
  return t.jsxs(Be, {
    meta: f,
    breadcrumbs: x,
    keyTakeaways: u,
    children: [
      t.jsx('h2', { children: 'Why Do Their Messages Sting So Much?' }),
      t.jsx('p', {
        children: `You read the message. It's three words: "Can you confirm?" And somehow your chest tightens. Your jaw clenches. You feel attacked—but you can't explain why.`,
      }),
      t.jsx('p', {
        children:
          "If co-parenting messages consistently feel more hurtful than they look on paper, you're not overreacting. You're experiencing a well-documented neurological phenomenon: your brain is reading threats where none exist.",
      }),
      t.jsx('p', {
        children: 'Understanding why this happens is the first step to reclaiming your peace.',
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"The most painful part isn't what they said—it's what your nervous system heard."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Threat Filter: How Your Brain Processes Co-Parent Messages' }),
      t.jsxs('p', {
        children: [
          'After repeated conflict, your brain develops what neuroscientists call a',
          ' ',
          t.jsx('strong', { children: 'negativity bias' }),
          " specifically tuned to your co-parent. Every ping from their number activates a subtle stress response before you've even read the words.",
        ],
      }),
      t.jsx('p', {
        children:
          "This isn't weakness—it's survival programming. Your brain learned that messages from this person can lead to:",
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Unexpected demands' }),
          t.jsx('li', { children: 'Blame and criticism' }),
          t.jsx('li', { children: 'Schedule disruptions' }),
          t.jsx('li', { children: 'Arguments that drain hours of emotional energy' }),
        ],
      }),
      t.jsx('p', {
        children:
          'So it prepares you. Cortisol rises. Your reading comprehension narrows. And suddenly a straightforward question sounds like an accusation.',
      }),
      t.jsx('h2', { children: 'Pattern Matching Gone Wrong' }),
      t.jsxs('p', {
        children: [
          "Your brain doesn't read each message fresh. It ",
          t.jsx('strong', { children: 'pattern-matches' }),
          " against every hurtful exchange you've had.",
        ],
      }),
      t.jsx('p', {
        children:
          '"Can you confirm?" triggers the memory of "You NEVER confirm anything" from six months ago. A request for a schedule change echoes that time they unilaterally changed plans without asking. A period instead of an exclamation point feels cold because you remember the silent treatment.',
      }),
      t.jsx('p', {
        children:
          "This is why the same message from your co-parent feels different than it would from a colleague or friend. The words aren't the whole story—your history rewrites them.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'The Same Message, Two Readings',
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-gray-500 mb-2',
                    children: 'What they wrote:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900',
                    children: '"Let me know about Saturday."',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-gray-500 mb-2',
                    children: 'What your threat filter hears:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 italic',
                    children: `"You haven't responded fast enough. Again. Typical."`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Trust Damage Amplifier' }),
      t.jsx('p', {
        children: `When trust is intact, we give people the benefit of the doubt. Ambiguous messages get interpreted generously. "They probably didn't mean it that way."`,
      }),
      t.jsxs('p', {
        children: [
          'When trust is broken, the opposite happens. Every ambiguity becomes a potential attack.',
          ' ',
          t.jsx('a', {
            href: '/break-co-parenting-argument-cycle-game-theory',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'This is one reason co-parenting arguments repeat',
          }),
          '—because the same words land differently when filtered through damaged trust.',
        ],
      }),
      t.jsx('p', {
        children:
          "The cruel irony: the more conflict you've experienced, the more likely you are to perceive conflict—even when it isn't there.",
      }),
      t.jsx('h2', { children: 'Why Text Makes Everything Worse' }),
      t.jsx('p', {
        children:
          'Face-to-face communication includes hundreds of nonverbal cues: facial expressions, tone of voice, body language. These help us accurately interpret intent.',
      }),
      t.jsx('p', {
        children:
          "Text strips all of that away. You're left with words on a screen—and your brain fills in the blanks with the most threatening interpretation available.",
      }),
      t.jsx('p', {
        children:
          'Research shows that people interpret neutral emails as more negative than they are. Add in a conflicted history, and text becomes a minefield of misinterpretation.',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [t.jsx('strong', { children: 'Short replies' }), ' feel dismissive'],
          }),
          t.jsxs('li', {
            children: [t.jsx('strong', { children: 'Longer replies' }), ' feel like lectures'],
          }),
          t.jsxs('li', {
            children: [t.jsx('strong', { children: 'Quick responses' }), ' feel aggressive'],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Delayed responses' }),
              ' feel like power plays',
            ],
          }),
        ],
      }),
      t.jsx('p', { children: "You can't win—because the medium itself is working against you." }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "What's Actually Happening in Your Body" }),
      t.jsx('p', {
        children:
          "When you see a message from your co-parent, your amygdala (the brain's threat detector) activates faster than your conscious mind can process words. This triggers:",
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Elevated cortisol' }),
              ' – stress hormones flood your system',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Narrowed attention' }),
              ' – you focus on potential threats',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reduced prefrontal activity' }),
              ' – logical thinking becomes harder',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Fight-or-flight activation' }),
              " – you're primed to defend or attack",
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "This entire cascade happens in milliseconds, before you've finished reading. By the time you consciously process the message, your body has already decided it's under attack.",
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-regulation',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'Emotional regulation',
          }),
          ' ',
          'becomes nearly impossible in this state—which is exactly when you need it most.',
        ],
      }),
      t.jsx('h2', { children: 'The Intent-Interpretation Gap' }),
      t.jsx('p', {
        children:
          "Here's the uncomfortable truth: your co-parent probably isn't trying to hurt you with most of their messages. They're trying to coordinate childcare.",
      }),
      t.jsxs('p', {
        children: [
          "But there's a gap between what they ",
          t.jsx('em', { children: 'intend' }),
          ' and what you ',
          t.jsx('em', { children: 'interpret' }),
          '. And when trust is damaged, that gap becomes a chasm.',
        ],
      }),
      t.jsx('p', { children: 'They write: "Did you remember the permission slip?"' }),
      t.jsx('p', { children: `They mean: "Checking that we're on track."` }),
      t.jsx('p', { children: `You hear: "You always forget things. You're a bad parent."` }),
      t.jsx('p', {
        children: 'Neither interpretation is "wrong"—but only one leads to conflict escalation.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How to Interrupt the Trigger Response' }),
      t.jsxs('p', {
        children: [
          "Knowing why this happens doesn't automatically fix it. But awareness creates a gap—a tiny window where you can",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/reaction-vs-response',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'move from reaction to response',
          }),
          '.',
        ],
      }),
      t.jsx('p', { children: 'Try these approaches:' }),
      t.jsx('h3', { children: '1. Name the Filter' }),
      t.jsx('p', {
        children:
          'When you notice the sting, pause and ask: "Am I reacting to this message, or to every message like it that came before?"',
      }),
      t.jsx('p', { children: 'Simply naming the pattern creates distance from it.' }),
      t.jsx('h3', { children: '2. Read It Like a Stranger Wrote It' }),
      t.jsx('p', {
        children:
          "Imagine the same words came from a coworker with no history. How would you interpret them then? This isn't about denying your feelings—it's about accessing a cleaner read before you respond.",
      }),
      t.jsx('h3', { children: '3. Wait for the Cortisol to Clear' }),
      t.jsxs('p', {
        children: [
          "The initial stress response peaks and fades within about 20 minutes if you don't feed it.",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/pause-before-reacting',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'Pausing before responding',
          }),
          ' ',
          "isn't avoidance—it's giving your brain time to return to baseline.",
        ],
      }),
      t.jsx('h3', { children: '4. Separate the Message from the Messenger' }),
      t.jsx('p', {
        children: `The content might be reasonable even if the relationship is strained. Ask: "If this request is valid, what's the clearest way to address it?"`,
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Helps Bridge the Interpretation Gap' }),
      t.jsx('p', {
        children:
          'LiaiZen was built for exactly this moment—when your nervous system is screaming "attack" but the logical part of your brain suspects you might be misreading things.',
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'AI-guided mediation',
          }),
          ' ',
          'helps by:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Slowing the exchange' }),
              ' – creating space between receiving and responding',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Offering neutral reads' }),
              ' – showing how the message might be interpreted without the threat filter',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Suggesting calmer alternatives' }),
              ' – helping you respond to content rather than perceived tone',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Breaking the escalation cycle' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'intercepting conflict before it builds',
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Over time, this external support helps rebuild the neural pathways. Messages that once felt like attacks start to feel like... messages.',
      }),
      t.jsx('h2', { children: "You're Not Crazy—But You Can Change This" }),
      t.jsx('p', {
        children:
          "If co-parenting messages consistently hurt more than they should, it doesn't mean you're too sensitive. It means your brain is working exactly as designed—protecting you from a perceived threat.",
      }),
      t.jsx('p', {
        children:
          "The problem is that the protection has become the problem. When every message triggers a fight response, coordination becomes exhausting. And your children feel the tension, even when they don't see the texts.",
      }),
      t.jsx('p', {
        children:
          'Understanding the mechanism is the first step. Creating space between stimulus and response is the second. And with the right support, the messages that once ruined your day become just... logistics.',
      }),
      t.jsx('p', {
        children: "That's not suppressing your feelings. That's reclaiming your peace.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Why do I get so triggered by my co-parent's messages?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Your brain has learned to associate their messages with past conflict, triggering a stress response before you've even finished reading. This is called a negativity bias—and it's a protective mechanism that's outlived its usefulness.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "How can I tell if I'm misreading a message?",
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "Try reading it as if a neutral coworker sent it. If the same words would feel fine from someone else, you're likely filtering through past conflict.",
                      ' ',
                      t.jsx('a', {
                        href: '/co-parenting-communication/pause-before-reacting',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'Pausing before reacting',
                      }),
                      ' ',
                      'gives you time to check your interpretation.',
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Will this triggered feeling ever go away?',
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "Yes. Neural pathways can be rewired, but it takes consistent practice. Each time you pause, reinterpret, and respond calmly, you're building new associations. Tools like",
                      ' ',
                      t.jsx('a', {
                        href: '/liaizen/how-ai-mediation-works',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'AI-guided mediation',
                      }),
                      ' ',
                      'can accelerate this process.',
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if my co-parent IS being hostile?',
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "Sometimes the hostile interpretation is accurate. The goal isn't to assume every message is neutral—it's to check whether your threat filter is adding hostility that isn't there.",
                      ' ',
                      t.jsx('a', {
                        href: '/high-conflict-co-parenting',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'High-conflict strategies',
                      }),
                      ' ',
                      'help when the hostility is real.',
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function wp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How Emotional Regulation Changes',
          ' ',
          t.jsx('span', { className: 'text-teal-600', children: 'Co-Parenting Outcomes' }),
        ],
      }),
      subtitle:
        'Why managing your own nervous system is the most powerful move you can make in a co-parenting dynamic.',
      date: 'Dec 12, 2025',
      readTime: '7 min read',
      heroImage: bc('emotional-regulation'),
      heroImageAlt: 'How emotional regulation changes co-parenting outcomes',
    },
    f = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Emotional Regulation' },
    ],
    x = [
      "You can't control your co-parent, but you <strong>can</strong> control your nervous system response.",
      "Emotional regulation isn't suppression—it's creating <strong>space between trigger and response</strong>.",
      'Regulated communication changes the <strong>entire dynamic</strong>, even if only one parent practices it.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The One Thing You Can Actually Control' }),
      t.jsx('p', {
        children:
          "Co-parenting often feels like being trapped in a system you didn't design. You can't control what your co-parent says, how they interpret your messages, or whether they'll escalate a simple request into a three-day conflict.",
      }),
      t.jsx('p', {
        children:
          "But there's one variable in this equation that belongs entirely to you: your own nervous system.",
      }),
      t.jsx('p', {
        children:
          "Emotional regulation isn't about being a robot or pretending things don't bother you. It's about choosing when and how you respond—rather than having your stress response choose for you.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"The goal isn't to feel nothing. It's to feel everything—and still respond intentionally."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What Emotional Regulation Actually Means' }),
      t.jsx('p', {
        children:
          "Emotional regulation is often misunderstood as emotional suppression. It's not. Suppression means shoving feelings down and pretending they don't exist. That approach backfires—the pressure builds until it explodes.",
      }),
      t.jsx('p', { children: 'True emotional regulation means:' }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Noticing' }),
              ' your emotional state as it arises',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Allowing' }),
              ' the feeling without being controlled by it',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Choosing' }),
              ' your response based on your goals, not your impulses',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Recovering' }),
              ' more quickly after stress activation',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'In co-parenting terms: you read a message that makes your blood boil, you feel the anger fully, and then you decide what to do with it—rather than firing off the first response that comes to mind.',
      }),
      t.jsx('h2', { children: 'Why Co-Parenting Dysregulates You So Effectively' }),
      t.jsx('p', {
        children: 'Co-parenting communication is uniquely triggering for several reasons:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'High stakes' }),
              " – Your children's wellbeing is on the line",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Shared history' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/emotional-triggers',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Past wounds',
              }),
              ' ',
              'get activated by present messages',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Limited control' }),
              " – You can't make them behave differently",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Ongoing contact' }),
              " – Unlike other difficult relationships, you can't walk away",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Identity involvement' }),
              ' – Attacks on your parenting feel like attacks on your worth',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'This combination creates the perfect storm for nervous system activation. Your brain treats co-parent conflict like a survival threat—because in some ways, it is. Your relationship with your children feels at stake.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Cascade: What Happens When You Lose Regulation' }),
      t.jsx('p', { children: 'When emotional regulation fails, a predictable cascade unfolds:' }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-1',
                      children: 'Trigger',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'A message arrives that activates your threat response',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-1',
                      children: 'Physiological Reaction',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'Heart rate increases, cortisol floods, thinking narrows',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-1',
                      children: 'Impulsive Response',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'You send a message designed to defend, attack, or prove a point',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-1',
                      children: 'Escalation',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'Your co-parent reacts to your reaction, and the conflict spirals',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-medium text-gray-900 mb-1', children: 'Regret' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: "Hours later, you wish you'd handled it differently",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsxs('p', {
        children: [
          'This cycle is why',
          ' ',
          t.jsx('a', {
            href: '/break-co-parenting-argument-cycle-game-theory',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'co-parenting arguments repeat',
          }),
          '. The content changes, but the emotional pattern stays the same.',
        ],
      }),
      t.jsx('h2', { children: 'The Regulation Advantage: What Changes' }),
      t.jsx('p', {
        children:
          'When you develop emotional regulation skills, the cascade gets interrupted at step 2. You still feel the trigger. Your body still has an initial reaction. But instead of moving immediately to impulsive response, you create a gap.',
      }),
      t.jsx('p', { children: 'In that gap, everything changes:' }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Perception expands' }),
              ' – You can see their message more objectively',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Options appear' }),
              ' – You recognize you have choices beyond fight or flight',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Long-term thinking returns' }),
              ' – You remember what actually matters',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Strategic response becomes possible' }),
              ' – You can choose words that serve your goals',
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'This is the difference between',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/reaction-vs-response',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'reaction and response',
          }),
          '. One is automatic; the other is chosen.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Practical Regulation Techniques for Co-Parent Messages' }),
      t.jsx('p', {
        children:
          'Emotional regulation is a skill, which means it can be practiced and strengthened. Here are techniques specifically designed for co-parenting communication:',
      }),
      t.jsx('h3', { children: '1. The Notification Buffer' }),
      t.jsx('p', {
        children:
          "Don't read co-parent messages immediately when they arrive. Give yourself a buffer—even five minutes—so you're reading on your terms, not theirs.",
      }),
      t.jsx('p', {
        children:
          "If you can, read messages when you're in a calm state: after a meal, during a break, or when you have time to process. Avoid reading right before bed or when you're already stressed.",
      }),
      t.jsx('h3', { children: '2. The Body Scan' }),
      t.jsx('p', {
        children: 'Before responding to any charged message, take 30 seconds to notice your body:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Where is the tension? (jaw, shoulders, chest?)' }),
          t.jsx('li', { children: "What's your breathing like? (shallow, fast?)" }),
          t.jsx('li', { children: 'What would you rate your activation level, 1-10?' }),
        ],
      }),
      t.jsxs('p', {
        children: [
          "If you're above a 6, your response will likely be reactive.",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/pause-before-reacting',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "Wait until you're calmer",
          }),
          '.',
        ],
      }),
      t.jsx('h3', { children: '3. The "What Do I Actually Need?" Question' }),
      t.jsx('p', {
        children: 'Before typing a response, ask yourself: "What outcome do I actually need here?"',
      }),
      t.jsx('p', {
        children:
          'Usually the answer is something practical: confirm pickup time, get agreement on an expense, coordinate a schedule change. Keep your response focused on that outcome, not on defending yourself or proving a point.',
      }),
      t.jsx('h3', { children: '4. The Draft and Delay' }),
      t.jsx('p', {
        children:
          "Write your first response—the one your nervous system wants to send—in your notes app, not in the message field. Let it sit. Come back in 20 minutes. Then write the message you'll actually send.",
      }),
      t.jsx('p', {
        children:
          'The first draft gets the emotion out. The second draft serves your actual goals.',
      }),
      t.jsx('h3', { children: '5. The Witness Perspective' }),
      t.jsx('p', {
        children:
          'Before sending, read your message as if a neutral third party—or a family court judge—would read it. Does it sound reasonable? Does it focus on facts and logistics? Would you be comfortable if your child read it someday?',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Ripple Effect: How Your Regulation Changes the Dynamic' }),
      t.jsx('p', {
        children:
          "Here's the counterintuitive truth: when one person in a conflict pattern changes their response, the entire dynamic shifts—even if the other person doesn't change at all.",
      }),
      t.jsx('p', {
        children:
          'Conflict requires two participants escalating together. When you stop escalating:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'The conflict loses fuel' }),
          t.jsx('li', { children: "Your co-parent's attacks don't land the same way" }),
          t.jsx('li', { children: 'Cycles that usually spiral for days resolve in hours' }),
          t.jsx('li', {
            children: "Your children feel the reduced tension, even if they don't see the messages",
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "This doesn't mean becoming a doormat or accepting mistreatment. It means choosing your battles strategically and fighting them from a regulated state when you do.",
      }),
      t.jsx('h2', { children: 'What Regulation Looks Like in Practice' }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Same Trigger, Two Approaches',
          }),
          t.jsx('p', {
            className: 'text-sm font-medium text-gray-500 mb-2',
            children: 'Their message:',
          }),
          t.jsx('div', {
            className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
            children: t.jsx('p', {
              className: 'text-gray-900',
              children: `"You forgot to send the permission slip AGAIN. This is exactly why I can't trust you with anything important."`,
            }),
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-700 mb-2',
                    children: 'Dysregulated Response:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"Oh really? You want to talk about trust? You're the one who showed up 45 minutes late last week. At least I actually remember things that matter."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-700 mb-2',
                    children: 'Regulated Response:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"You're right, I missed it. I've sent it now. I'll set a reminder system for future forms."`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The regulated response isn't weak—it's strategic. It acknowledges the valid concern (the slip was forgotten), solves the problem (sends it now), and prevents future issues (commits to a system). It gives the conflict nowhere to go.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Supports Emotional Regulation' }),
      t.jsx('p', {
        children:
          "Emotional regulation is a skill that takes time to develop. In the meantime, you need support in the moments when regulation is hardest—when you're activated, when the stakes feel high, when your fingers are ready to fire off a defensive response.",
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI-guided mediation",
          }),
          ' ',
          'acts as an external regulatory system:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creates forced pauses' }),
              ' – Interrupts the trigger-to-response speed',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Offers calmer alternatives' }),
              ' – Shows you what a regulated response could sound like',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Highlights escalation patterns' }),
              " – Helps you notice when you're reactive",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Preserves your intent' }),
              ' – Keeps your underlying concerns while improving delivery',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Over time, using this kind of support trains your own nervous system. You start to internalize the pause. You begin to notice your activation before it takes over. The external scaffolding becomes internal skill.',
      }),
      t.jsx('h2', { children: 'The Long Game: Why This Investment Matters' }),
      t.jsx('p', {
        children: 'Every regulated response you send is a deposit in multiple accounts:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Your mental health' }),
              ' – Less time spent in cortisol-flooded states',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Your relationship with your children' }),
              ' – They sense your stability',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Your legal standing' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/court-safe-co-parenting-messages',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Calm messages look better in court',
              }),
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Your co-parenting dynamic' }),
              ' – Even difficult dynamics can slowly shift',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: "Your children's future" }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/child-centered-co-parenting',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: "They're learning from watching you",
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "Emotional regulation isn't about being perfect. It's about getting better, one message at a time. And every time you choose response over reaction, you're changing more than just that conversation—you're changing the pattern.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Isn't emotional regulation just bottling things up?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Not at all. Suppression means pretending you don't feel anything. Regulation means feeling fully while choosing how to express it. You still process the emotion—you just don't let it write your messages for you.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if I regulate but my co-parent never does?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Your regulation still changes the dynamic. Conflict needs two escalators. When you stop escalating, conflicts resolve faster and your stress levels drop—regardless of what they do. You can't control them, but you can stop being controlled by their behavior.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'How long does it take to get better at this?',
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "You'll notice small improvements within weeks of consistent practice. Major shifts typically take 3-6 months. Tools like",
                      ' ',
                      t.jsx('a', {
                        href: '/liaizen/how-ai-mediation-works',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'AI-guided mediation',
                      }),
                      ' ',
                      'can accelerate the process by providing support in real-time while you build the skill.',
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Does staying regulated mean I can't set boundaries?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `The opposite. Regulated communication makes boundaries clearer and more effective. "I won't be responding to messages that include personal attacks" lands better when delivered calmly than when fired off in anger. Regulation makes your boundaries more powerful, not weaker.`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Np() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'From Reaction to Response:',
          ' ',
          t.jsx('span', {
            className: 'text-teal-600',
            children: 'The Most Important Co-Parenting Skill',
          }),
        ],
      }),
      subtitle: 'Learn the pause technique that stops escalation in its tracks.',
      date: 'Dec 13, 2025',
      readTime: '6 min read',
    },
    f = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Reaction vs Response' },
    ],
    x = [
      'A <strong>reaction</strong> is automatic and driven by your nervous system. A <strong>response</strong> is chosen.',
      'The gap between stimulus and action is <strong>where conflict either escalates or resolves</strong>.',
      "You don't need to change how you feel—just <strong>when you act</strong> on it.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Difference That Changes Everything' }),
      t.jsx('p', {
        children:
          "There's a moment between reading your co-parent's message and hitting send on your reply. In that moment, everything is decided: whether the conversation stays calm or spirals, whether you feel proud of your words later or wish you could take them back.",
      }),
      t.jsx('p', {
        children:
          "Most co-parenting conflicts don't escalate because of what was said first. They escalate because of what came next—the reaction.",
      }),
      t.jsx('p', {
        children:
          "Learning to transform reaction into response is the single most important communication skill you can develop. It won't change your co-parent. But it will change everything else.",
      }),
      t.jsxs('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: [
          t.jsx('p', {
            className: 'font-medium text-gray-900 m-0 italic',
            children:
              '"Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom."',
          }),
          t.jsx('p', { className: 'text-sm text-gray-500 mt-2 mb-0', children: '— Viktor Frankl' }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "Reaction vs. Response: What's the Difference?" }),
      t.jsx('p', {
        children: 'The words sound similar, but they describe fundamentally different processes:',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-6 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              className: 'bg-red-50 rounded-lg p-5 border border-red-100',
              children: [
                t.jsx('h4', {
                  className: 'text-lg font-bold text-red-800 mb-3',
                  children: 'Reaction',
                }),
                t.jsxs('ul', {
                  className: 'space-y-2 text-gray-700 text-sm',
                  children: [
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-red-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Automatic, instinctive' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-red-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Driven by emotion and nervous system' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-red-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Happens in milliseconds' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-red-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Goal: Protect, defend, attack back' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-red-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Often regretted later' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-teal-50 rounded-lg p-5 border border-teal-100',
              children: [
                t.jsx('h4', {
                  className: 'text-lg font-bold text-teal-800 mb-3',
                  children: 'Response',
                }),
                t.jsxs('ul', {
                  className: 'space-y-2 text-gray-700 text-sm',
                  children: [
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-teal-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Deliberate, intentional' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-teal-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Involves prefrontal cortex (thinking brain)' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-teal-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Requires a pause' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-teal-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Goal: Achieve your actual objective' }),
                      ],
                    }),
                    t.jsxs('li', {
                      className: 'flex items-start gap-2',
                      children: [
                        t.jsx('span', { className: 'text-teal-400 mt-0.5', children: '•' }),
                        t.jsx('span', { children: 'Aligned with your values' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', { children: 'A reaction says: "They attacked me, so I attack back."' }),
      t.jsx('p', {
        children: `A response says: "They sent something difficult. What's my smartest move here?"`,
      }),
      t.jsx('h2', { children: 'Why Reactions Feel So Right in the Moment' }),
      t.jsx('p', {
        children:
          "Here's the tricky part: reactions feel completely justified when they happen. Your co-parent said something hurtful, so of course you defended yourself. They were unfair, so you pointed out their unfairness. They made an accusation, so you made one back.",
      }),
      t.jsxs('p', {
        children: [
          'This is your brain doing exactly what it evolved to do—protecting you from perceived threats. The problem is that',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'co-parenting messages trigger threat responses',
          }),
          ' ',
          "even when there's no actual danger.",
        ],
      }),
      t.jsx('p', {
        children:
          "The threat-response system doesn't distinguish between a tiger attack and a passive-aggressive text. It just knows: something is wrong, act now.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Anatomy of the Pause' }),
      t.jsx('p', {
        children:
          "The pause is simple to describe and difficult to execute: it's the space between receiving a message and sending your reply.",
      }),
      t.jsx('p', { children: 'In that space, several things happen:' }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Adrenaline peaks and begins to fade' }),
              ' – The initial surge subsides',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Prefrontal cortex comes back online' }),
              ' – You can think strategically again',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Perspective expands' }),
              ' – You see more options than fight or flight',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Goals become visible' }),
              ' – You remember what you actually want',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The pause doesn't have to be long. Sometimes 30 seconds is enough. Sometimes you need 30 minutes. The key is that the pause exists at all.",
      }),
      t.jsx('h2', { children: 'The Pause Technique: A Step-by-Step Guide' }),
      t.jsx('p', { children: 'When you receive a triggering message, try this sequence:' }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-6',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Notice' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `Recognize that you've been triggered. Signs: racing heart, tight chest, urge to type immediately, thoughts like "How dare they" or "I need to set them straight."`,
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Name' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `Silently label what's happening: "I'm activated" or "My nervous system just got triggered." This creates distance between you and the reaction.`,
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Breathe' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Take three slow breaths. Exhale longer than you inhale. This physically activates your parasympathetic nervous system and reduces the stress response.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Wait' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Put the phone down. Close the laptop. Walk away for at least 10 minutes. The goal is to let the initial cortisol spike pass before engaging.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Ask' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Before typing, ask: "What do I actually need from this exchange?" Focus your message on that outcome, not on defending or attacking.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'What the Pause Makes Possible' }),
      t.jsx('p', {
        children:
          "When you pause before responding, you gain access to choices that don't exist in reaction mode:",
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'You can choose not to respond at all' }),
              " – Some messages don't require a reply",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'You can respond only to the factual content' }),
              ' – Ignore the emotional bait',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'You can ask a clarifying question' }),
              ' – Instead of assuming the worst interpretation',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: "You can acknowledge what's valid" }),
              ' – Even if you disagree with the tone',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'You can set a boundary calmly' }),
              ' – Without escalating',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "None of these options are available when you're in reaction mode. The pause creates them.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Real Examples: Reaction vs. Response' }),
      t.jsxs('div', {
        className: 'space-y-8 my-8',
        children: [
          t.jsxs('div', {
            className: 'bg-gray-50 border border-gray-200 rounded-xl p-6',
            children: [
              t.jsx('p', {
                className: 'text-sm font-medium text-gray-500 mb-2',
                children: 'They sent:',
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children:
                    '"You ALWAYS do this. You can never just follow the schedule like a normal person."',
                }),
              }),
              t.jsxs('div', {
                className: 'grid gap-4 md:grid-cols-2',
                children: [
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-red-600 mb-2',
                        children: 'Reaction:',
                      }),
                      t.jsx('div', {
                        className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"Normal? You want to talk about normal? You're the one who changed the schedule 4 times last month. Maybe look in the mirror before you start pointing fingers."`,
                        }),
                      }),
                    ],
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-teal-600 mb-2',
                        children: 'Response:',
                      }),
                      t.jsx('div', {
                        className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"I hear that you're frustrated about the schedule. What specifically needs to be adjusted for Saturday?"`,
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'bg-gray-50 border border-gray-200 rounded-xl p-6',
            children: [
              t.jsx('p', {
                className: 'text-sm font-medium text-gray-500 mb-2',
                children: 'They sent:',
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children:
                    '"The kids said you let them stay up until 11 on a school night. Great parenting."',
                }),
              }),
              t.jsxs('div', {
                className: 'grid gap-4 md:grid-cols-2',
                children: [
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-red-600 mb-2',
                        children: 'Reaction:',
                      }),
                      t.jsx('div', {
                        className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"Don't lecture me about parenting. At least I actually spend quality time with them instead of parking them in front of screens."`,
                        }),
                      }),
                    ],
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-teal-600 mb-2',
                        children: 'Response:',
                      }),
                      t.jsx('div', {
                        className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"We had a special movie night. I'll make sure they're back on regular schedule going forward."`,
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'bg-gray-50 border border-gray-200 rounded-xl p-6',
            children: [
              t.jsx('p', {
                className: 'text-sm font-medium text-gray-500 mb-2',
                children: 'They sent:',
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children: `"I shouldn't have to remind you about the doctor appointment. This is exactly why I can't rely on you for anything."`,
                }),
              }),
              t.jsxs('div', {
                className: 'grid gap-4 md:grid-cols-2',
                children: [
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-red-600 mb-2',
                        children: 'Reaction:',
                      }),
                      t.jsx('div', {
                        className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"You can't rely on ME? That's hilarious coming from you. Should I pull up the list of things YOU'VE forgotten? Want to compare notes?"`,
                        }),
                      }),
                    ],
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'text-sm font-medium text-teal-600 mb-2',
                        children: 'Response:',
                      }),
                      t.jsx('div', {
                        className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                        children: t.jsx('p', {
                          className: 'text-gray-900 text-sm',
                          children: `"You're right, I should have had it on my calendar. What time is the appointment? I'll make sure I'm there."`,
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "Notice what the responses have in common: they address the actual issue without taking the bait. They don't defend, attack, or escalate. They move the conversation forward.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "Why This Is So Hard (And Why It's Worth It)" }),
      t.jsx('p', {
        children:
          "Let's be honest: choosing response over reaction can feel deeply unfair. Why should you have to be the calm one when they're the one being unreasonable? Why should you regulate when they won't?",
      }),
      t.jsx('p', { children: "The answer isn't about fairness. It's about effectiveness." }),
      t.jsx('p', {
        children:
          'Reactions feel satisfying in the moment but create more problems. Responses feel harder but actually solve things. Every time you respond instead of react:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'The conflict resolves faster' }),
          t.jsx('li', { children: 'You feel better about yourself afterward' }),
          t.jsx('li', { children: 'Your children experience less tension' }),
          t.jsxs('li', {
            children: [
              'Your',
              ' ',
              t.jsx('a', {
                href: '/court-safe-co-parenting-messages',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'communication record looks better',
              }),
              ' ',
              'if it ever matters legally',
            ],
          }),
          t.jsxs('li', {
            children: [
              "You're modeling",
              ' ',
              t.jsx('a', {
                href: '/child-centered-co-parenting',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'healthy communication for your kids',
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children: "You're not doing it for them. You're doing it for you—and for your children.",
      }),
      t.jsx('h2', { children: 'How LiaiZen Helps You Pause' }),
      t.jsx('p', {
        children:
          "The hardest part of the pause is remembering to do it. When you're triggered, the last thing your brain wants is to slow down. It wants to act.",
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI mediation",
          }),
          ' ',
          'builds the pause into the system:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Automatic intervention' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Catches escalation',
              }),
              ' ',
              'before you hit send',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Alternative suggestions' }),
              ' – Shows you what a response (not reaction) could look like',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Pattern recognition' }),
              " – Helps you notice when you're triggered",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Skill building' }),
              ' – Over time, you internalize the pause',
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'Think of it as training wheels for',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-regulation',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'emotional regulation',
          }),
          ". Eventually, you won't need the external support—but while you're building the skill, it's there to catch you.",
        ],
      }),
      t.jsx('h2', { children: 'Start Small' }),
      t.jsx('p', { children: "You don't have to master this overnight. Start with one practice:" }),
      t.jsx('p', {
        children: t.jsx('strong', {
          children:
            'For the next week, wait 10 minutes before responding to any co-parent message that triggers you.',
        }),
      }),
      t.jsx('p', {
        children:
          "That's it. Just 10 minutes. Notice what changes—in your messages, in their responses, in how you feel.",
      }),
      t.jsx('p', {
        children:
          "The pause is where your power lives. Every time you use it, you're choosing who you want to be in this co-parenting relationship. Not a reactor. A responder.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if they need an immediate answer?',
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      `True emergencies are rare. For most messages, "I'll get back to you in an hour" is an acceptable response. If something genuinely can't wait, the`,
                      ' ',
                      t.jsx('a', {
                        href: '/co-parenting-communication/pause-before-reacting',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: '30-second pause',
                      }),
                      ' ',
                      'is still possible—three deep breaths before typing.',
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Doesn't responding calmly just let them get away with being rude?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `A calm response isn't the same as acceptance. You can set boundaries firmly without escalating. "I'm happy to discuss schedule changes, but I won't respond to insults" is a response, not a reaction—and it's more effective than matching their energy.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "What if I've already sent a reaction?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `You can still course-correct. A follow-up message like "I reacted quickly earlier. Let me try again: [calmer version]" can de-escalate a conversation that's already started going sideways. It's not weakness—it's skill.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'How long until this becomes automatic?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "The pause never becomes fully automatic—that's actually the point. What changes is how quickly you can access it. With practice, you'll notice you're triggered earlier and pause more naturally. Most people see significant improvement within 4-8 weeks of consistent practice.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Tp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How to Pause Before Sending ',
          t.jsx('span', { className: 'text-teal-600', children: 'a Heated Message' }),
        ],
      }),
      subtitle: 'Practical strategies for hitting the brakes when you really want to hit send.',
      date: 'Dec 14, 2025',
      readTime: '5 min read',
    },
    f = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Pause Before Reacting' },
    ],
    x = [
      'The urge to reply immediately is a <strong>nervous system response</strong>, not a communication need.',
      'Specific <strong>physical and environmental barriers</strong> work better than willpower alone.',
      'A delayed response almost always serves your goals better than an immediate one.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Send Button Is Not Your Friend' }),
      t.jsx('p', {
        children:
          "You've read the message. Your heart is pounding. Your fingers are already typing. Everything in you wants to fire back—to defend yourself, to correct them, to make them understand how wrong they are.",
      }),
      t.jsx('p', {
        children:
          'This is the moment that determines whether the next hour of your day is peaceful or consumed by conflict. And it happens in seconds.',
      }),
      t.jsx('p', {
        children:
          "The good news: you don't need superhuman willpower to pause. You need systems—specific, practical strategies that create friction between the impulse and the action.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"The message you don't send can never be used against you, regretted, or escalate a conflict."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: `Why "Just Don't React" Doesn't Work` }),
      t.jsx('p', {
        children:
          "You've probably tried telling yourself to stay calm. Maybe you've even promised yourself you wouldn't engage. And then the message arrives, and all that resolve evaporates.",
      }),
      t.jsxs('p', {
        children: [
          "This isn't a character flaw—it's biology. When your",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'threat response is activated',
          }),
          ', the part of your brain responsible for impulse control goes partially offline. You literally have reduced access to your better judgment.',
        ],
      }),
      t.jsx('p', {
        children:
          "Willpower is a limited resource that depletes under stress. That's why the strategies that actually work don't rely on willpower at all—they create external barriers that do the work for you.",
      }),
      t.jsx('h2', { children: 'The 10 Best Ways to Create a Pause' }),
      t.jsx('p', {
        children:
          "These techniques range from immediate interventions (for when you're already activated) to preventive systems (that reduce activation in the first place). Use the ones that fit your situation.",
      }),
      t.jsx('h3', { children: '1. The Physical Separation' }),
      t.jsx('p', {
        children:
          "Put your phone in another room. Physically. When the barrier to responding requires you to get up and walk somewhere, you've created enough friction to interrupt the impulse.",
      }),
      t.jsx('p', {
        children:
          'This works because your body is part of the reaction. Moving your body changes your state.',
      }),
      t.jsx('h3', { children: '2. The Draft Folder Technique' }),
      t.jsx('p', {
        children:
          'Type your response—all of it, as heated as you want—but in your notes app, not in the message field. Let it sit there. Come back in 20 minutes and read it as if someone else wrote it.',
      }),
      t.jsx('p', {
        children:
          "You'll almost never send the draft version. But writing it gets the emotion out of your system so you can think clearly.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-3',
            children: 'The Draft Folder in Action',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: "Draft version (don't send):",
                  }),
                  t.jsx('div', {
                    className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children: `"Are you kidding me right now? You're the one who NEVER sticks to the schedule and now you're lecturing ME? This is so typical. You always have to make everything my fault. I'm done with this conversation."`,
                    }),
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'Actual send (20 minutes later):',
                  }),
                  t.jsx('div', {
                    className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children: `"I understand there's been some confusion about the schedule. Let's clarify: I'll pick up at 5pm Saturday as we agreed. Does that work?"`,
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: '3. The Timer Rule' }),
      t.jsx('p', {
        children:
          "Set a non-negotiable rule: no response to triggering messages for at least 20 minutes. Set an actual timer. Don't trust yourself to estimate.",
      }),
      t.jsx('p', {
        children:
          "Why 20 minutes? That's roughly how long it takes for the initial cortisol spike to begin fading. Your brain chemistry will be measurably different.",
      }),
      t.jsx('h3', { children: '4. The Body Reset' }),
      t.jsx('p', {
        children:
          "Before responding, do something physical: walk around the block, do 20 jumping jacks, splash cold water on your face, or hold an ice cube. These aren't distractions—they're interventions that shift your nervous system state.",
      }),
      t.jsx('p', {
        children:
          'Cold water on your face specifically triggers the "dive reflex," which activates your parasympathetic nervous system and physically calms you down.',
      }),
      t.jsx('h3', { children: '5. The Read-Aloud Test' }),
      t.jsx('p', {
        children:
          'Before sending any message, read it out loud. Hearing your own words changes how you perceive them. Things that seemed reasonable in your head often sound different when you hear them.',
      }),
      t.jsx('p', {
        children:
          "Better yet: read it as if you're the one receiving it. Does it sound like something that would escalate or de-escalate the situation?",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: '6. The Notification Delay' }),
      t.jsx('p', {
        children:
          "Change your settings so co-parent messages don't push to your screen immediately. Check them on your schedule, when you're in a calm state, not when your phone buzzes.",
      }),
      t.jsx('p', {
        children:
          "This prevents the ambush effect—where a message catches you off-guard and you react before you've had time to prepare.",
      }),
      t.jsx('h3', { children: '7. The Witness Technique' }),
      t.jsx('p', { children: 'Before sending, imagine your message being read by:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'A family court judge' }),
          t.jsx('li', { children: 'Your child (in 10 years)' }),
          t.jsx('li', { children: 'A neutral mediator' }),
          t.jsx('li', { children: 'Your best friend' }),
        ],
      }),
      t.jsx('p', {
        children:
          "If any of those audiences would make you cringe, revise before sending. This isn't about being fake—it's about aligning your communication with your actual values and goals.",
      }),
      t.jsx('h3', { children: '8. The "What Do I Need?" Question' }),
      t.jsx('p', {
        children:
          'Before typing anything, write down the answer to: "What do I actually need from this exchange?"',
      }),
      t.jsx('p', {
        children:
          "Usually it's something concrete: confirmation of a time, agreement on an expense, acknowledgment of a concern. Keep your message focused only on achieving that outcome. Everything else is noise.",
      }),
      t.jsx('h3', { children: '9. The Sleep-On-It Protocol' }),
      t.jsx('p', {
        children:
          "For messages that arrive in the evening, make a rule: no response until morning. Sleep resets your nervous system and provides perspective that's impossible to access when activated.",
      }),
      t.jsx('p', {
        children:
          'Very few co-parenting messages are genuine emergencies that require same-night responses.',
      }),
      t.jsx('h3', { children: '10. The Trusted Friend Filter' }),
      t.jsx('p', {
        children:
          'Before sending anything heated, text it to a trusted friend first. Not for validation—for a reality check. Ask them: "Is this going to help or hurt?"',
      }),
      t.jsx('p', {
        children:
          'Sometimes just the act of preparing to show someone else your message is enough to make you reconsider.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Building Your Personal Pause System' }),
      t.jsx('p', {
        children:
          'Not every technique works for everyone. The key is to identify 2-3 strategies that fit your life and practice them until they become automatic.',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Choose Your Pause Stack',
          }),
          t.jsx('p', {
            className: 'text-gray-600 mb-4',
            children: 'Select one from each category:',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Immediate Intervention (when already triggered):',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-600 text-sm space-y-1 ml-4',
                    children: [
                      t.jsx('li', { children: '□ Physical separation (phone in another room)' }),
                      t.jsx('li', { children: '□ Body reset (cold water, movement)' }),
                      t.jsx('li', { children: '□ Timer rule (20 minutes minimum)' }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Processing Technique (to clarify your response):',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-600 text-sm space-y-1 ml-4',
                    children: [
                      t.jsx('li', { children: '□ Draft folder technique' }),
                      t.jsx('li', { children: '□ Read-aloud test' }),
                      t.jsx('li', { children: '□ "What do I need?" question' }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Quality Check (before hitting send):',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-600 text-sm space-y-1 ml-4',
                    children: [
                      t.jsx('li', { children: '□ Witness technique' }),
                      t.jsx('li', { children: '□ Trusted friend filter' }),
                      t.jsx('li', { children: '□ Sleep-on-it protocol' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'What If You Need to Respond Quickly?' }),
      t.jsx('p', {
        children:
          'Sometimes there are genuine time constraints. Even then, you can create a micro-pause:',
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Three breaths' }),
              ' – Exhale longer than you inhale, three times',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'One question' }),
              ' – "Will this response get me what I actually need?"',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Stick to facts' }),
              ' – Only respond to the logistical content, ignore emotional bait',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'A 30-second pause is infinitely better than no pause. And very few situations truly require an immediate response.',
      }),
      t.jsx('h2', { children: 'The Long-Term Benefit: Rewiring Your Default' }),
      t.jsx('p', {
        children:
          "Every time you successfully pause before reacting, you're not just avoiding one conflict—you're rewiring your brain. Neural pathways strengthen with repetition.",
      }),
      t.jsxs('p', {
        children: [
          "Over time, the pause becomes less effortful. You'll notice you're triggered but find yourself naturally waiting before responding. The",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/reaction-vs-response',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'shift from reaction to response',
          }),
          ' ',
          'becomes your default mode.',
        ],
      }),
      t.jsxs('p', {
        children: [
          'This is how',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-regulation',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'emotional regulation',
          }),
          ' ',
          'develops—not through one heroic act of willpower, but through consistent practice of small pauses.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Builds the Pause Into Every Message' }),
      t.jsxs('p', {
        children: [
          "Even with the best systems, there will be moments when your fingers move faster than your judgment. That's why LiaiZen was designed to",
          ' ',
          t.jsx('a', {
            href: '/liaizen/escalation-prevention',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'catch escalation before it happens',
          }),
          '.',
        ],
      }),
      t.jsxs('p', {
        children: [
          "When you're about to send something that might escalate,",
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI mediation",
          }),
          ':',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creates a forced pause' }),
              ' – An intervention before the message goes through',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: "Shows you what you're about to send" }),
              ' – Sometimes seeing your words reflected back is enough',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Offers calmer alternatives' }),
              ' – Ready-to-use rewrites that achieve your goal without the heat',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: "Explains what's happening" }),
              ' – Helps you understand why this message might backfire',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "Think of it as a safety net for the moments when your own pause systems fail. It's not about AI writing your messages—it's about giving you the pause you need to write better ones yourself.",
      }),
      t.jsx('h2', { children: 'Start Today: The One-Week Challenge' }),
      t.jsx('p', {
        children:
          'Choose one technique from this article and commit to using it for seven days. Just one.',
      }),
      t.jsxs('p', {
        children: [
          t.jsx('strong', { children: 'Suggestion:' }),
          ' The timer rule. For one week, set a 20-minute timer before responding to any co-parent message that triggers a reaction. No exceptions.',
        ],
      }),
      t.jsx('p', { children: 'Notice what changes:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'How different do your messages look after the wait?' }),
          t.jsx('li', { children: 'How does your co-parent respond differently?' }),
          t.jsx('li', { children: 'How do you feel about yourself?' }),
        ],
      }),
      t.jsx('p', {
        children:
          'The pause is the most underrated skill in co-parenting communication. Master it, and everything else becomes easier.',
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "Won't my co-parent think I'm ignoring them if I don't respond right away?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `A thoughtful response after 20 minutes is better than a reactive response in 20 seconds. If you're concerned, you can send a brief acknowledgment: "Got your message. I'll respond properly this afternoon." Then take the time you need.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if I write a draft and still want to send it after 20 minutes?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "That's actually useful information. If the message still feels right after your nervous system has calmed, it might be more measured than you thought. But run it through the witness technique first—would you be comfortable if a judge read it?",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "My co-parent sends multiple messages if I don't respond immediately. What then?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Their urgency isn't your emergency. Multiple messages in quick succession are often a sign of their dysregulation—which makes your pause even more important. You can respond to all the messages in one calm reply after your timer goes off.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "These techniques feel like I'm walking on eggshells. Is that healthy?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "There's a difference between walking on eggshells (changing yourself to avoid someone's unpredictable reactions) and strategic communication (choosing your words intentionally to achieve your goals). The pause isn't about appeasing your co-parent—it's about serving your own interests and your children's wellbeing.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Sp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How to Communicate With ',
          t.jsx('span', { className: 'text-teal-600', children: 'a Defensive Co-Parent' }),
        ],
      }),
      subtitle:
        'Strategies for getting your point across without triggering their defense mechanisms.',
      date: 'Dec 15, 2025',
      readTime: '7 min read',
    },
    f = [
      { label: 'Resources', href: '/co-parenting-communication' },
      { label: 'Defensiveness Strategies' },
    ],
    x = [
      'Defensiveness is a <strong>protective response</strong>, not a character trait—and your phrasing can trigger or bypass it.',
      "The goal isn't to avoid all conflict, but to <strong>get your message through</strong> before walls go up.",
      'Small changes in word choice can be the difference between <strong>being heard and being blocked out</strong>.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'When Everything You Say Gets Turned Into a Fight' }),
      t.jsx('p', {
        children:
          'You ask a simple question and get a defensive lecture. You make a reasonable request and receive a counterattack. You try to discuss logistics and somehow end up relitigating the entire relationship.',
      }),
      t.jsx('p', {
        children:
          'Communicating with a defensive co-parent can feel impossible. No matter how carefully you word things, they seem to hear criticism, blame, or attack. And once their defenses are up, the conversation is over before it started.',
      }),
      t.jsx('p', {
        children:
          "But here's what most people don't realize: defensiveness isn't random. It follows predictable patterns. And once you understand those patterns, you can communicate in ways that bypass the defensive response entirely.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"You can't control whether someone gets defensive. But you can control whether your words make it more or less likely."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Understanding the Defensive Response' }),
      t.jsx('p', {
        children:
          "Defensiveness isn't a choice—it's an automatic nervous system response. When someone perceives a threat to their self-image, competence, or worth, their brain shifts into protection mode.",
      }),
      t.jsx('p', { children: 'In this state:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', {
            children: 'They stop listening to content and start scanning for attacks',
          }),
          t.jsx('li', { children: 'Neutral words get interpreted as criticism' }),
          t.jsx('li', { children: 'The goal shifts from understanding to winning' }),
          t.jsx('li', { children: 'Access to empathy and reason diminishes' }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'This is why',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'messages feel more hurtful than they are',
          }),
          "—and why defensive people often seem to react to things you didn't actually say.",
        ],
      }),
      t.jsx('p', {
        children:
          "The key insight: your co-parent's defensiveness is usually not about you. It's about their own fears, insecurities, and past wounds. But your communication style can either activate those triggers or avoid them.",
      }),
      t.jsx('h2', { children: 'The 7 Triggers That Activate Defensiveness' }),
      t.jsx('p', {
        children:
          'Certain communication patterns reliably trigger defensive responses. Learning to recognize them in your own messages is the first step.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: '"You" Statements',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        '"You forgot..." "You always..." "You never..." These sound like accusations and trigger immediate defense.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Absolutes',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        '"Always," "never," "every time"—these invite counterexamples and shift the conversation to proving exceptions.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Implied Criticism',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        '"I thought we agreed..." "As I mentioned before..." These suggest incompetence without saying it directly.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Questions That Are Actually Statements',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `"Don't you think you should..." "Why didn't you..." These are accusations disguised as curiosity.`,
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Bringing Up the Past',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        '"Last time this happened..." "Remember when you..." The past becomes ammunition, not context.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '6',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Tone Indicators',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'ALL CAPS, excessive punctuation!!!, sarcasm, and passive-aggressive politeness all signal hostility.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: '7',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Unsolicited Advice or Correction',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `"You should..." "The right way to do this is..." These imply they're doing it wrong.`,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Communication Strategies That Bypass Defensiveness' }),
      t.jsx('p', {
        children:
          "The goal isn't to manipulate or trick your co-parent. It's to communicate in a way that gives your actual message the best chance of being heard. These strategies help you do that.",
      }),
      t.jsx('h3', { children: '1. Lead with the Logistics' }),
      t.jsx('p', {
        children:
          "Start with the practical need, not the backstory or emotional context. Defensive people are looking for things to defend against—don't give them ammunition in your opening.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Triggers defensiveness:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children:
                      '"You forgot to tell me about the dentist appointment again. I really need you to communicate these things. When is it?"',
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Bypasses defensiveness:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children:
                      '"What time is the dentist appointment? I want to make sure I have it on my calendar."',
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '2. Use "I" Statements Strategically' }),
      t.jsx('p', {
        children: `"I" statements are often recommended, but they can still trigger defensiveness if they're disguised blame. The key is focusing on your need, not their failure.`,
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Disguised blame:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"I feel frustrated when you don't communicate with me."`,
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Actual need statement:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children:
                      '"I need to know about schedule changes as soon as possible so I can plan."',
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '3. Ask Questions That Invite Collaboration' }),
      t.jsx('p', {
        children:
          'Questions can be weapons or bridges. The difference is whether they imply incompetence or genuinely seek input.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Accusatory question:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"Why didn't you tell me about the school event?"`,
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Collaborative question:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children:
                      '"How should we handle sharing information about school events going forward?"',
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '4. Acknowledge Before Requesting' }),
      t.jsx('p', {
        children:
          "When you need to address something they did (or didn't do), briefly acknowledge any valid context before making your request. This doesn't mean agreeing with them—it means showing you've considered their perspective.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'No acknowledgment:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: '"You were late picking up again. This needs to stop."',
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'With acknowledgment:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children:
                      '"I know traffic can be unpredictable. Can we build in a 15-minute buffer for pickups?"',
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '5. Separate the Request from the History' }),
      t.jsx('p', {
        children:
          "Every time you reference past failures, you're adding fuel to the defensive fire. Make your current request stand alone.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Loaded with history:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"Since you didn't pay on time last month OR the month before, I need to know when to expect this month's payment."`,
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Present-focused:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"What date works for sending this month's payment?"`,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: '6. Give Them an Out' }),
      t.jsx('p', {
        children:
          "When you need to address a problem, phrase it in a way that allows them to save face. People are more likely to cooperate when they don't feel cornered.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'No exit:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"You clearly didn't read the email I sent. The permission slip was attached."`,
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Face-saving exit:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"The permission slip might have gotten buried in email. I'll resend it now."`,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '7. Use "We" for Shared Problems' }),
      t.jsx('p', {
        children:
          'When addressing issues that affect your child, framing it as a shared problem (rather than their problem) reduces defensiveness.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Their problem:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"You need to get him to bed earlier at your house. He's exhausted on Mondays."`,
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Our problem:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"He's been tired on Mondays. What can we do to help him get more rest on weekends?"`,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'When Defensiveness Is Unavoidable' }),
      t.jsx('p', {
        children:
          'Sometimes, no matter how carefully you communicate, defensiveness will still arise. In those moments:',
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: "Don't match their energy" }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/reaction-vs-response',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: "Respond, don't react",
              }),
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Return to logistics' }),
              ' – Keep redirecting to the practical issue',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Take a break' }),
              ` – "Let's revisit this tomorrow" is always an option`,
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Focus on what you can control' }),
              ' – Your words, your tone, your boundaries',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "You can't force someone to be less defensive. But you can refuse to escalate and give the conversation time to cool.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Helps Navigate Defensiveness' }),
      t.jsxs('p', {
        children: [
          "Even when you know these strategies, it's hard to apply them in the moment—especially when you're",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'triggered yourself',
          }),
          '.',
        ],
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI mediation",
          }),
          ' ',
          'helps by:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Identifying defensive triggers' }),
              ' – Catches "you" statements, absolutes, and implied criticism before you send',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Suggesting reframes' }),
              ' – Offers alternative phrasings that are less likely to activate defenses',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Keeping you focused on logistics' }),
              ' – Helps separate the emotional content from the practical need',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Building your skill over time' }),
              " – The more you see the alternatives, the more naturally you'll write them yourself",
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'Think of it as a real-time coach that helps you',
          ' ',
          t.jsx('a', {
            href: '/liaizen/escalation-prevention',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'prevent escalation',
          }),
          ' ',
          'before it starts.',
        ],
      }),
      t.jsx('h2', { children: 'The Bigger Picture' }),
      t.jsx('p', {
        children:
          "Communicating with a defensive co-parent is exhausting. It can feel like you're constantly walking on eggshells, choosing every word carefully, managing their reactions.",
      }),
      t.jsxs('p', {
        children: [
          "But here's the reframe: you're not managing them. You're managing your communication to serve your goals. Your goal isn't to never trigger defensiveness—it's to",
          ' ',
          t.jsx('a', {
            href: '/child-centered-co-parenting',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'coordinate effectively for your children',
          }),
          '.',
        ],
      }),
      t.jsx('p', {
        children:
          'Every message that gets through without escalating is a win. Every conflict avoided is energy preserved. And over time, these small wins can shift the entire dynamic—even if your co-parent never changes.',
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Isn't this just enabling their bad behavior?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Strategic communication isn't enabling—it's effective. You're not accepting mistreatment or abandoning your needs. You're packaging your message in a way that actually gets heard. Setting boundaries calmly is more powerful than setting them while escalating.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if they get defensive no matter what I say?',
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "Some people are so defended that even perfect communication won't get through. In those cases, your goal shifts from being heard to protecting yourself—keeping messages brief, factual, and",
                      ' ',
                      t.jsx('a', {
                        href: '/court-safe-co-parenting-messages',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'documentable',
                      }),
                      ". You can't control their response, only your input.",
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'This feels exhausting. Is it worth the effort?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'The initial effort is high, but it decreases over time as these patterns become automatic. And the payoff—fewer conflicts, faster resolutions, less emotional drain—is significant. Most people find that an hour spent on careful communication saves days of conflict aftermath.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Can these strategies backfire?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "If used inauthentically or manipulatively, yes. These aren't tricks—they're communication skills. The goal is genuine clarity, not manipulation. If your underlying intent is hostile, no amount of careful wording will hide that. These strategies work best when you genuinely want to solve problems, not win fights.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function kp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'Why High-Conflict Co-Parenting Feels',
          ' ',
          t.jsx('span', { className: 'text-teal-600', children: 'Impossible to Fix' }),
        ],
      }),
      subtitle:
        'Understanding the dynamics of high-conflict relationships and why standard advice often fails.',
      date: 'Dec 16, 2025',
      readTime: '8 min read',
    },
    f = [
      { label: 'Resources', href: '/high-conflict-co-parenting' },
      { label: 'Why It Feels Impossible' },
    ],
    x = [
      "High-conflict co-parenting follows <strong>predictable patterns</strong> that standard advice doesn't address.",
      'The dynamic often has <strong>one high-conflict person</strong> and one person reacting to them—but both feel stuck.',
      "Progress isn't about fixing the other person—it's about <strong>changing your role in the pattern</strong>.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: "You've Tried Everything. Nothing Works." }),
      t.jsx('p', {
        children:
          "You've read the co-parenting books. You've tried the communication techniques. You've taken the high road, bitten your tongue, and done everything the experts recommend.",
      }),
      t.jsx('p', { children: 'And nothing changes. Or worse—it gets worse.' }),
      t.jsx('p', {
        children: `If you're in a high-conflict co-parenting situation, you've probably noticed that the advice designed for "normal" co-parenting doesn't work. The techniques that help most separated parents coordinate peacefully seem to backfire when you try them.`,
      }),
      t.jsx('p', {
        children:
          "This isn't your imagination. High-conflict dynamics operate by different rules. And until you understand those rules, you'll keep hitting the same walls.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children:
            '"The definition of insanity is doing the same thing over and over and expecting different results. But in high-conflict co-parenting, even doing different things often produces the same results."',
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What Makes Co-Parenting "High-Conflict"?' }),
      t.jsxs('p', {
        children: [
          'All co-parenting involves some conflict. Disagreements about schedules, rules, and parenting styles are normal. What distinguishes high-conflict co-parenting is the ',
          t.jsx('em', { children: 'pattern' }),
          ', not just the frequency or intensity.',
        ],
      }),
      t.jsx('p', { children: 'High-conflict co-parenting typically involves:' }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Disproportionate reactions' }),
              ' – Small issues become major battles',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Inability to resolve' }),
              " – Conflicts don't end; they accumulate",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Pattern repetition' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/break-co-parenting-argument-cycle-game-theory',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'The same arguments repeat',
              }),
              ' ',
              'in different forms',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Blame focus' }),
              ' – More energy on assigning fault than solving problems',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'All-or-nothing thinking' }),
              ' – No middle ground, no compromise',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Chronic distrust' }),
              ' – Every action interpreted in the worst possible light',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Boundary violations' }),
              ' – Agreements broken, limits pushed, privacy invaded',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children: `If this sounds familiar, you're not in a "difficult" co-parenting situation—you're in a high-conflict one. And that distinction matters enormously for what strategies will actually help.`,
      }),
      t.jsx('h2', { children: 'Why Standard Co-Parenting Advice Fails' }),
      t.jsx('p', {
        children:
          'Most co-parenting advice assumes both parties want to reduce conflict. It assumes that better communication will lead to better understanding, and better understanding will lead to cooperation.',
      }),
      t.jsx('p', { children: 'In high-conflict situations, this assumption is often wrong.' }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Why Common Advice Backfires',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-1',
                    children: '"Communicate more openly"',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'In high-conflict dynamics, more communication often means more ammunition. Information shared openly gets used against you.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-1',
                    children: '"Try to see their perspective"',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'When one party is unreasonable, trying to understand their perspective can become an endless exercise in rationalizing irrational behavior.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-1',
                    children: '"Meet in the middle"',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'If one party makes extreme demands, splitting the difference rewards extremism. The middle keeps moving.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-1',
                    children: '"Keep it friendly for the kids"',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'Friendliness can be exploited. In high-conflict situations, businesslike neutrality is often safer than warmth.',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "This doesn't mean these approaches are wrong—they work beautifully in normal co-parenting relationships. But high-conflict dynamics require a different playbook.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Anatomy of a High-Conflict Pattern' }),
      t.jsx('p', { children: 'High-conflict co-parenting usually involves a predictable cycle:' }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Trigger Event',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Something happens—often minor. A schedule request, a parenting decision, a miscommunication.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Escalation',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'The high-conflict person responds with blame, accusations, or extreme demands. The stakes suddenly feel enormous.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Defensive Response',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'You defend yourself, explain, justify, or counter-attack. This feels necessary but fuels the fire.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Prolonged Conflict',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'The exchange goes back and forth, draining hours or days. The original issue gets lost in the noise.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Exhausted Withdrawal',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "Eventually someone disengages—not because it's resolved, but because they're depleted. Nothing is settled.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '6',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Calm Before Storm',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'A period of relative quiet—until the next trigger event starts the cycle again.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "If you recognize this pattern, you've probably also noticed: it doesn't matter how reasonable you try to be. The cycle keeps repeating.",
      }),
      t.jsx('h2', { children: 'The Hard Truth About High-Conflict People' }),
      t.jsx('p', {
        children:
          "Not every high-conflict situation involves a high-conflict person—sometimes it's two ordinary people caught in an extraordinary difficult dynamic. But often, one person is driving the conflict pattern.",
      }),
      t.jsx('p', { children: 'High-conflict individuals typically share certain traits:' }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'External blame' }),
              " – Problems are always someone else's fault",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'All-or-nothing thinking' }),
              ' – People are all good or all bad, no nuance',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Intense emotions' }),
              ' – Reactions are outsized relative to triggers',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Difficulty with boundaries' }),
              ' – Your limits are seen as attacks on them',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Resistance to closure' }),
              ' – Conflicts never truly end',
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          "Here's the hard truth: ",
          t.jsx('strong', { children: 'you cannot change a high-conflict person' }),
          '. Not through logic, kindness, firmness, or perfect communication. Their patterns are deeply ingrained and typically require professional help to address—help they rarely seek.',
        ],
      }),
      t.jsx('p', {
        children:
          "This is why high-conflict co-parenting feels impossible. You keep trying to solve a problem that can't be solved from your side alone.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What You Can Actually Change' }),
      t.jsx('p', {
        children: "If you can't change them, what can you change? Your own role in the pattern.",
      }),
      t.jsx('p', {
        children:
          "This isn't victim-blaming. It's recognizing that conflict patterns require participation from both sides. When you change your responses, the pattern has to shift—even if they don't.",
      }),
      t.jsx('h3', { children: '1. Stop Trying to Be Understood' }),
      t.jsx('p', {
        children:
          'In normal relationships, explaining your perspective helps. In high-conflict dynamics, it provides ammunition. Your explanations get twisted, quoted out of context, or used to prolong the argument.',
      }),
      t.jsx('p', {
        children: `Shift from explaining to stating: "I won't be able to accommodate that request" instead of "Here's why I can't accommodate that request and all the reasons and history behind it..."`,
      }),
      t.jsx('h3', { children: '2. Respond to Content, Not Tone' }),
      t.jsx('p', {
        children:
          'High-conflict messages often contain a legitimate logistical question buried under emotional content. Extract and respond to the logistical piece only. Ignore the rest.',
      }),
      t.jsx('p', {
        children:
          'When they write: "You NEVER think about anyone but yourself. Are you planning to pick up Saturday or not?"',
      }),
      t.jsx('p', { children: 'You respond to: "Are you planning to pick up Saturday?"' }),
      t.jsx('p', { children: `Your reply: "Yes, I'll pick up at 5pm Saturday."` }),
      t.jsx('h3', { children: '3. Embrace "Boring" Communication' }),
      t.jsx('p', {
        children:
          'Your goal is to become the most boring person to fight with. No emotional reactions to latch onto. No defensiveness to escalate against. Just flat, factual, businesslike responses.',
      }),
      t.jsx('p', {
        children: `This is sometimes called "gray rock"—becoming as uninteresting as a gray rock. When there's nothing to react to, conflict loses its fuel.`,
      }),
      t.jsx('h3', { children: '4. Set Boundaries Without Explaining Them' }),
      t.jsx('p', {
        children:
          'Boundaries in high-conflict situations need to be stated, not justified. Justifications invite arguments about whether your reasons are valid.',
      }),
      t.jsx('p', {
        children: `Instead of: "I can't respond to your messages at 11pm because I need sleep and it stresses me out and the kids need me rested..."`,
      }),
      t.jsx('p', { children: 'Try: "I respond to non-emergency messages between 8am and 8pm."' }),
      t.jsx('h3', { children: '5. Document Everything' }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/court-safe-co-parenting-messages',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'Keep records',
          }),
          ' ',
          'of all communication. Not to use as weapons, but to protect yourself and maintain clarity. In high-conflict dynamics, reality gets disputed constantly. Documentation keeps you anchored to facts.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Why Progress Looks Different Than You Expect' }),
      t.jsx('p', {
        children:
          'In normal co-parenting, progress means the relationship improves. In high-conflict co-parenting, progress often looks like:',
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Shorter conflicts' }),
              ' – Not fewer, but they end faster',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Faster recovery' }),
              ' – You bounce back quicker emotionally',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Less internal turmoil' }),
              ' – Their messages affect you less',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Clearer boundaries' }),
              ' – You know where your limits are',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Better documentation' }),
              ' – You have a record of what actually happened',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children: `Notice what's missing: "My co-parent became reasonable." That may never happen. But your experience of the situation can still dramatically improve.`,
      }),
      t.jsx('h2', { children: 'Protecting Yourself and Your Children' }),
      t.jsx('p', {
        children:
          "High-conflict co-parenting is exhausting—and that exhaustion affects your children. When you're depleted, you have less patience, less presence, less energy for the people who need you most.",
      }),
      t.jsx('p', { children: "Protecting yourself isn't selfish. It's necessary. This includes:" }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Limiting contact' }),
              ' – Keep communication to logistics only',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Using written communication' }),
              ' – Avoid phone calls when possible',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Building support systems' }),
              ' – Therapist, friends, family who understand',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Taking breaks' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/pause-before-reacting',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Not responding immediately',
              }),
              ' ',
              'to non-urgent messages',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Focusing on what you control' }),
              ' – Your household, your parenting, your responses',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Your children benefit more from one stable, regulated parent than from two parents locked in constant battle.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Helps in High-Conflict Situations' }),
      t.jsxs('p', {
        children: [
          "When you're in a high-conflict dynamic, your nervous system is constantly activated.",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'Every message triggers a response',
          }),
          `. It becomes harder to stay "gray rock" when you're seeing red.`,
        ],
      }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI mediation",
          }),
          ' ',
          'provides support precisely when you need it most:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Catches reactive responses' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Intercepts before you send',
              }),
              ' ',
              'something that feeds the conflict',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Offers neutral alternatives' }),
              ' – Shows you how to respond to content without taking bait',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creates forced pauses' }),
              ' – Builds in the delay your nervous system needs',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Maintains documentation' }),
              ' – Every exchange is recorded clearly',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reduces your cognitive load' }),
              ' – Let the AI help you find the boring response',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "In high-conflict situations, having an external system to catch you before you react is invaluable. It's not about AI replacing your judgment—it's about AI supporting your judgment when your nervous system is compromised.",
      }),
      t.jsx('h2', { children: "It's Not Your Fault—But It Is Your Responsibility" }),
      t.jsx('p', {
        children:
          "You didn't create this dynamic. You didn't choose to co-parent with someone who escalates every interaction. The situation isn't fair.",
      }),
      t.jsx('p', {
        children: "And yet: you're the only one who can change your experience of it.",
      }),
      t.jsx('p', {
        children:
          "That's not a burden—it's actually freedom. You're not waiting for them to change. You're not trying to fix the unfixable. You're focusing on what's actually within your control: your responses, your boundaries, your peace.",
      }),
      t.jsx('p', {
        children:
          'High-conflict co-parenting may never feel easy. But with the right strategies, it can feel manageable. And manageable is enough.',
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "How do I know if I'm in a high-conflict situation vs. just a difficult one?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "The key indicator is pattern persistence. In difficult-but-normal co-parenting, conflicts eventually resolve and the relationship can stabilize. In high-conflict situations, the same patterns repeat regardless of what you try, and there's no baseline of cooperation to return to.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "What if I'm the high-conflict one?",
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "The fact that you're asking suggests you're not. High-conflict individuals rarely question their own behavior. That said, anyone can develop reactive patterns under stress. If you notice yourself escalating,",
                      ' ',
                      t.jsx('a', {
                        href: '/co-parenting-communication/emotional-regulation',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'emotional regulation strategies',
                      }),
                      ' ',
                      'can help—and so can working with a therapist.',
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Should I involve the courts?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'Courts can help establish clear boundaries when voluntary cooperation fails. But litigation also escalates conflict in the short term and can be expensive and draining. Document everything, consult a family law attorney, and make informed decisions about when legal intervention is necessary vs. when it might make things worse.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Will it ever get better?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "The dynamic with your co-parent may or may not improve—that's largely outside your control. But your experience of it can significantly improve. Many parents in high-conflict situations report that once they shift strategies, their stress levels drop dramatically even when the other parent stays the same.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Ap() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How to De-escalate Communication With',
          ' ',
          t.jsx('span', { className: 'text-teal-600', children: 'a High-Conflict Co-Parent' }),
        ],
      }),
      subtitle: 'Specific phrases and techniques to lower the temperature of heated exchanges.',
      date: 'Dec 17, 2025',
      readTime: '8 min read',
    },
    f = [
      { label: 'Resources', href: '/high-conflict-co-parenting' },
      { label: 'De-escalation Techniques' },
    ],
    x = [
      "De-escalation isn't about winning or losing—it's about <strong>ending the fight faster</strong>.",
      "The person who de-escalates isn't the weaker one—they're the one with <strong>more control</strong>.",
      'Specific phrases can <strong>interrupt escalation patterns</strong> before they reach critical mass.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Art of Lowering the Temperature' }),
      t.jsx('p', {
        children:
          "When a conversation with your co-parent starts heating up, something interesting happens in your body. Your heart rate increases. Your breathing becomes shallow. Your field of vision literally narrows. In this state, you're preparing for battle—not resolution.",
      }),
      t.jsx('p', {
        children:
          "De-escalation is the skill of stepping out of that battle stance while the other person is still in it. It's not surrender. It's not weakness. It's the recognition that nothing productive happens when two nervous systems are locked in combat mode.",
      }),
      t.jsxs('p', {
        children: [
          "And here's what makes it powerful:",
          ' ',
          t.jsx('strong', {
            children: 'you only need one person to de-escalate for the entire dynamic to shift',
          }),
          '.',
        ],
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children:
            '"Fire needs oxygen. Conflict needs participation. Remove either, and the flames begin to die."',
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Why De-escalation Feels Counterintuitive' }),
      t.jsx('p', {
        children:
          "When someone attacks you, every instinct says to defend yourself. To match their energy. To prove you won't be pushed around. This is your amygdala doing exactly what evolution designed it to do—respond to threats with proportional force.",
      }),
      t.jsxs('p', {
        children: [
          'The problem is that',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-triggers',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "co-parent messages aren't physical threats",
          }),
          ", even though they trigger the same neural pathways. Matching energy in a text exchange doesn't protect you—it escalates the conflict, depletes your energy, and often creates",
          ' ',
          t.jsx('a', {
            href: '/court-safe-co-parenting-messages',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'documentation that works against you',
          }),
          '.',
        ],
      }),
      t.jsx('p', {
        children:
          "De-escalation requires overriding this instinct. It asks you to do the opposite of what feels natural—not because you're weak, but because you're playing a longer game.",
      }),
      t.jsx('h2', { children: 'The Escalation Ladder' }),
      t.jsx('p', {
        children:
          "Conflicts don't go from zero to explosion instantly. They climb a ladder, with each response either raising or lowering the level. Understanding this ladder helps you recognize where you are—and how to step down.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-3',
          children: [
            t.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-16 h-8 rounded bg-red-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: 'Level 5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-0',
                      children: 'All-Out War',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm m-0',
                      children: 'Personal attacks, threats, ultimatums, involving others',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-16 h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: 'Level 4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-0',
                      children: 'Active Hostility',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm m-0',
                      children: 'Accusations, blame, bringing up the past, sarcasm',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-16 h-8 rounded bg-yellow-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: 'Level 3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-0',
                      children: 'Defensive Positioning',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm m-0',
                      children: 'Justifying, explaining, correcting, proving points',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-16 h-8 rounded bg-teal-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: 'Level 2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-0',
                      children: 'Tension Present',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm m-0',
                      children: 'Short responses, mild frustration, underlying irritation',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-16 h-8 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0',
                  children: 'Level 1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900 mb-0',
                      children: 'Neutral Ground',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm m-0',
                      children: 'Factual, logistics-focused, businesslike',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsxs('p', {
        children: [
          'Your goal in de-escalation is simple:',
          ' ',
          t.jsx('strong', { children: 'respond one level below where they are' }),
          ". If they're at Level 4, respond at Level 3 or lower. If they're at Level 3, drop to Level 2. Eventually, you pull the conversation down to where productive exchange is possible.",
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The 10 De-escalation Techniques' }),
      t.jsxs('p', {
        children: [
          "These aren't just communication tips—they're strategic tools designed for",
          ' ',
          t.jsx('a', {
            href: '/high-conflict-co-parenting/why-it-feels-impossible',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'high-conflict situations',
          }),
          ' ',
          'where normal advice fails.',
        ],
      }),
      t.jsx('h3', { children: '1. The Selective Response' }),
      t.jsx('p', {
        children:
          'High-conflict messages often contain multiple elements: a logistical question buried under emotional content, accusations mixed with valid concerns. The selective response extracts and responds only to the legitimate content.',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('p', {
            className: 'text-sm font-medium text-gray-500 mb-2',
            children: 'They send:',
          }),
          t.jsx('div', {
            className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
            children: t.jsx('p', {
              className: 'text-gray-900',
              children: `"This is EXACTLY what I'm talking about. You can't ever just do what you say you'll do. Are you going to be there at 5 or not? I'm so sick of this."`,
            }),
          }),
          t.jsx('p', {
            className: 'text-sm font-medium text-teal-600 mb-2',
            children: 'You respond only to:',
          }),
          t.jsx('div', {
            className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
            children: t.jsx('p', {
              className: 'text-gray-900',
              children: `"Yes, I'll be there at 5."`,
            }),
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          "Notice what you're ",
          t.jsx('em', { children: 'not' }),
          ` doing: defending against "you can't ever do what you say," addressing "EXACTLY what I'm talking about," or responding to "I'm so sick of this." You're answering the question. That's it.`,
        ],
      }),
      t.jsx('h3', { children: '2. The Broken Record' }),
      t.jsx('p', {
        children:
          "When someone keeps escalating despite your calm responses, repeat your core message without variation. Don't elaborate. Don't defend. Just repeat.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-3',
          children: [
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'Them:' }),
                ` "You're being completely unreasonable about this."`,
              ],
            }),
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'You:' }),
                ' "I can pick up at 5pm or 6pm. Which works better?"',
              ],
            }),
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'Them:' }),
                ' "You always do this. You never consider anyone else."',
              ],
            }),
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'You:' }),
                ' "I can pick up at 5pm or 6pm. Let me know."',
              ],
            }),
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'Them:' }),
                ` "This is ridiculous. You're impossible."`,
              ],
            }),
            t.jsxs('p', {
              children: [
                t.jsx('strong', { children: 'You:' }),
                ` "Let me know about 5 or 6, and I'll confirm."`,
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "The broken record gives the other person nothing to fight against. You're not ignoring them—you're redirecting to the only thing that matters.",
      }),
      t.jsx('h3', { children: '3. The Acknowledgment Without Agreement' }),
      t.jsx('p', {
        children:
          'Sometimes the other person needs to feel heard before they can hear you. You can acknowledge their experience without agreeing with their interpretation or accepting blame.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-gray-500 mb-1',
                  children: 'Instead of:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-red-50 p-3 rounded border border-red-100',
                  children: `"That's not what happened and you know it."`,
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-1',
                  children: 'Try:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                  children: `"I can hear this has been frustrating. Here's what I can do..."`,
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children: `"I can hear this has been frustrating" isn't agreeing that you caused the frustration. It's acknowledging that frustration exists—and then moving forward.`,
      }),
      t.jsx('h3', { children: '4. The Time Boundary' }),
      t.jsx('p', {
        children:
          "When emotions are running high, sometimes the best de-escalation is creating space. This isn't avoidance—it's strategic delay.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('p', {
            className: 'text-gray-600 mb-4',
            children: 'Phrases that create time without dismissing:',
          }),
          t.jsxs('ul', {
            className: 'space-y-2 text-gray-700',
            children: [
              t.jsx('li', {
                children: `"I want to respond to this thoughtfully. I'll get back to you this evening."`,
              }),
              t.jsx('li', { children: '"Let me check my calendar and confirm within the hour."' }),
              t.jsx('li', {
                children: `"I need some time to consider this. I'll respond by tomorrow morning."`,
              }),
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'The time boundary works because',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/pause-before-reacting',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'pausing before responding',
          }),
          ' ',
          'allows both nervous systems to reset. The conversation you have after a break is rarely as heated as the one happening in real-time.',
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: '5. The Redirection to Shared Interest' }),
      t.jsx('p', {
        children:
          "In the midst of conflict, it's easy to forget that you and your co-parent share a fundamental interest: your children's wellbeing. Redirecting to this shared ground can interrupt the adversarial frame.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-gray-500 mb-1',
                  children: 'Instead of:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-red-50 p-3 rounded border border-red-100',
                  children: `"This isn't my fault. You're the one who changed the plan."`,
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-1',
                  children: 'Try:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                  children: '"What arrangement would work best for Emma this weekend?"',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "Naming your child shifts the conversation from you-versus-them to both-of-you-for-the-child. It's subtle, but powerful.",
      }),
      t.jsx('h3', { children: '6. The Validation Sandwich' }),
      t.jsx('p', {
        children:
          'When you need to disagree or set a boundary, sandwiching it between validating statements makes it easier to receive.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-2',
          children: [
            t.jsx('p', { className: 'font-medium text-teal-700', children: 'Validation:' }),
            t.jsx('p', {
              className: 'text-gray-700',
              children: '"I understand you want to maximize time with the kids this summer."',
            }),
            t.jsx('p', { className: 'font-medium text-gray-900 mt-3', children: 'Boundary:' }),
            t.jsx('p', {
              className: 'text-gray-700',
              children: '"The schedule we agreed on needs to stay as planned for July."',
            }),
            t.jsx('p', { className: 'font-medium text-teal-700 mt-3', children: 'Future-focus:' }),
            t.jsx('p', {
              className: 'text-gray-700',
              children: `"Let's discuss August arrangements next week so we both have time to plan."`,
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '7. The Question Pivot' }),
      t.jsx('p', {
        children:
          'Instead of defending against accusations, pivot to questions that move the conversation forward. This shifts the dynamic from attack-defend to problem-solve.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-gray-500 mb-1',
                  children: 'They say:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900',
                  children:
                    '"You never think about anyone but yourself with these schedule requests."',
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-1',
                  children: 'Defensive response:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-red-50 p-3 rounded border border-red-100',
                  children: `"That's not true. I always try to accommodate you."`,
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-1',
                  children: 'Question pivot:',
                }),
                t.jsx('p', {
                  className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                  children: '"What would work better for you with this schedule change?"',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h3', { children: '8. The Neutral Reporter' }),
      t.jsx('p', {
        children:
          'When conflict is high, adopt the tone of a neutral third party reporting facts. Remove "you" and "I" where possible. State what is, not who did what.',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-4 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-red-600 mb-2',
                  children: 'Personal/Accusatory:',
                }),
                t.jsx('div', {
                  className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: '"You forgot to pack his medication again."',
                  }),
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'text-sm font-medium text-teal-600 mb-2',
                  children: 'Neutral Reporter:',
                }),
                t.jsx('div', {
                  className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                  children: t.jsx('p', {
                    className: 'text-gray-900 text-sm',
                    children: `"His medication wasn't in the bag. Can it be sent tomorrow?"`,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: '9. The Exit Ramp' }),
      t.jsx('p', {
        children:
          "Sometimes a conversation needs to end before it can improve. The exit ramp offers a graceful way out that doesn't feel like abandonment or avoidance.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('p', { className: 'text-gray-600 mb-4', children: 'Exit ramp phrases:' }),
          t.jsxs('ul', {
            className: 'space-y-2 text-gray-700',
            children: [
              t.jsx('li', {
                children: `"I think we've covered the main point. Let me know about Saturday."`,
              }),
              t.jsx('li', {
                children: `"I don't want this to escalate. Let's pause and revisit tomorrow."`,
              }),
              t.jsx('li', {
                children: `"I've shared my perspective. I'll wait to hear back on the logistics."`,
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The exit ramp works best when you've already addressed the practical issue. You're not running away—you're recognizing that further discussion isn't productive.",
      }),
      t.jsx('h3', { children: '10. The Non-Response' }),
      t.jsx('p', {
        children:
          'Sometimes the most powerful de-escalation is silence. Not every message requires a response—especially messages that exist solely to provoke.',
      }),
      t.jsx('p', { children: "Messages that often don't need responses:" }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Pure emotional venting with no question or action item' }),
          t.jsx('li', { children: 'Bait designed to start a fight' }),
          t.jsx('li', { children: 'Repetitions of points already addressed' }),
          t.jsx('li', { children: 'Personal attacks that add nothing new' }),
        ],
      }),
      t.jsx('p', {
        children:
          "The non-response isn't ignoring a legitimate communication. It's refusing to feed a conflict that has no resolution path. If there's a practical matter buried in the message, you can address that later when things are calmer.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What De-escalation Looks Like in Action' }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'A Complete Exchange',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-1',
                    children: 'Them (Level 4 - Hostile):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-white p-3 rounded border border-gray-200',
                    children: `"Typical. You just do whatever you want without any consideration for anyone else. The kids told me you're taking them to your mom's AGAIN this weekend. You KNOW I wanted that Saturday."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-1',
                    children: 'You (Level 2 - Calm with acknowledgment):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                    children: `"I hear that you wanted Saturday. The visit to my mom's was planned before the schedule was set. Is there a specific Saturday coming up that would work for what you had in mind?"`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-1',
                    children: 'Them (Level 3 - Still defensive):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-white p-3 rounded border border-gray-200',
                    children:
                      '"You always have an excuse. This is exactly the kind of thing that makes co-parenting with you impossible."',
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-1',
                    children: 'You (Level 1 - Neutral, broken record):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                    children: `"Let me know which Saturday works for you, and I'll do my best to accommodate."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-1',
                    children: 'Them (Level 2 - Cooling):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-white p-3 rounded border border-gray-200',
                    children: '"Fine. The 15th."',
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-1',
                    children: 'You (Level 1 - Confirming):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                    children: `"Got it. The 15th works. I'll plan around that."`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Notice how the entire exchange resolved in six messages—without you ever defending, explaining, or matching their energy. You acknowledged their concern, offered a solution, and stayed on the practical track until they joined you there.',
      }),
      t.jsx('h2', { children: "When De-escalation Isn't Working" }),
      t.jsx('p', {
        children:
          "Sometimes, despite your best efforts, the other person won't de-escalate. Recognizing when to stop trying is important.",
      }),
      t.jsx('p', { children: 'Signs that you need to disengage entirely:' }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsx('li', { children: 'Messages are becoming abusive, not just heated' }),
          t.jsx('li', { children: 'The same points are being repeated without progress' }),
          t.jsxs('li', {
            children: [
              'Your own',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/emotional-regulation',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'emotional regulation',
              }),
              ' ',
              'is failing',
            ],
          }),
          t.jsx('li', { children: 'The practical matter has been addressed but they keep going' }),
        ],
      }),
      t.jsx('p', {
        children:
          "In these cases, the exit ramp or non-response isn't just strategy—it's self-protection. You can return to the conversation later, but you can't take back words spoken in escalation.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Supports De-escalation' }),
      t.jsxs('p', {
        children: [
          "De-escalation requires thinking clearly while you're activated—which is exactly when clear thinking is hardest.",
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "LiaiZen's AI mediation",
          }),
          ' ',
          'provides support at the moment you need it most.',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Catches escalatory language' }),
              ' – Identifies when your response will likely raise the temperature',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Suggests de-escalating alternatives' }),
              ' – Offers reframes that respond one level below',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Identifies the core issue' }),
              ' – Helps you see the logistical question buried under emotional content',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creates a built-in pause' }),
              ' – The intervention itself creates space for your nervous system to recalibrate',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Over time, using this kind of support trains your own de-escalation instincts. You start to recognize your own escalatory patterns before they happen, and the tools become internalized.',
      }),
      t.jsx('h2', { children: 'The Long Game' }),
      t.jsx('p', {
        children:
          "De-escalation isn't about winning any single exchange. It's about changing the overall pattern of your co-parenting communication.",
      }),
      t.jsx('p', { children: 'When you consistently de-escalate:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Conflicts resolve faster' }),
          t.jsx('li', { children: 'Your stress levels decrease' }),
          t.jsx('li', { children: 'Your children feel less tension' }),
          t.jsxs('li', {
            children: [
              'Your',
              ' ',
              t.jsx('a', {
                href: '/court-safe-co-parenting-messages',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'communication record',
              }),
              ' ',
              'speaks well of you',
            ],
          }),
          t.jsx('li', {
            children:
              'Sometimes—not always, but sometimes—the other person starts to match your lower energy',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "You can't control whether your co-parent learns to de-escalate. But you can control the environment you create—one where escalation doesn't pay off, where calmness is met with calmness, and where the path of least resistance is resolution.",
      }),
      t.jsx('p', {
        children: "That's not weakness. That's strategy. And over time, it changes everything.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "Doesn't de-escalating mean I'm letting them get away with bad behavior?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `De-escalation is about managing the conversation, not accepting mistreatment. You can de-escalate and still maintain boundaries: "I won't respond to messages that include insults. Let me know about the schedule when you're ready to discuss it calmly." That's de-escalation with a clear boundary.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if they see my calm responses as weakness?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'Some high-conflict people do interpret calmness as weakness initially. But over time, they learn that your calmness is consistent and unshakeable—which is actually a form of strength. More importantly, calm responses protect you legally and preserve your energy for what matters.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "How do I de-escalate when I'm furious?",
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      `You don't. When you're at peak activation, the best de-escalation is the time boundary: "I'll respond to this later."`,
                      ' ',
                      t.jsx('a', {
                        href: '/co-parenting-communication/pause-before-reacting',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'Give yourself time to calm down',
                      }),
                      ' ',
                      "before attempting any of these techniques. They require access to your thinking brain, which isn't available when you're seeing red.",
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Will my co-parent ever learn to de-escalate too?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Maybe. Some people eventually match the energy they consistently receive. Others never change. The good news: your de-escalation works regardless. Even if they never learn, your experience of the co-parenting relationship improves—and that's what you can control.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Ep() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'Navigating Co-Parent ',
          t.jsx('span', { className: 'text-teal-600', children: 'Gaslighting, Guilt, and Blame' }),
        ],
      }),
      subtitle: 'How to spot manipulation tactics and respond with factual neutrality.',
      date: 'Dec 18, 2025',
      readTime: '9 min read',
    },
    f = [
      { label: 'Resources', href: '/high-conflict-co-parenting' },
      { label: 'Gaslighting, Guilt, and Blame' },
    ],
    x = [
      'These tactics work by destabilizing your <strong>sense of reality</strong>—your defense is reconnecting with facts.',
      "You don't need to convince them they're wrong. You need to <strong>stay grounded in what you know</strong>.",
      'Documentation and external support are your most powerful tools against <strong>distortion tactics</strong>.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'When Reality Feels Slippery' }),
      t.jsx('p', {
        children: `You remember the conversation clearly. You know what was agreed. And yet, somehow, you're being told it never happened that way. Or that you're "overreacting." Or that the problem is actually your fault—the very problem they created.`,
      }),
      t.jsx('p', {
        children:
          'If co-parenting with your ex leaves you questioning your own memory, judgment, or sanity, you may be experiencing manipulation tactics that are designed to do exactly that. These patterns—whether conscious or unconscious—work by destabilizing your grip on reality.',
      }),
      t.jsxs('p', {
        children: [
          "Understanding these patterns isn't about diagnosing your co-parent. It's about",
          ' ',
          t.jsx('strong', { children: "recognizing what's happening to you" }),
          ' so you can respond effectively and protect your peace.',
        ],
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"The goal of these tactics isn't to win an argument—it's to make you doubt yourself so thoroughly that you stop trusting your own perception."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Reality Distortion: What It Looks Like' }),
      t.jsx('p', {
        children:
          'Reality distortion in co-parenting takes many forms. Some are obvious, others subtle. All share a common effect: they leave you feeling confused, guilty, or uncertain about things you were sure of moments ago.',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Common Distortion Patterns',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Rewriting History',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"I never agreed to that." "That's not what happened." "You're making things up."`,
                  }),
                  t.jsx('p', {
                    className: 'text-teal-600 text-sm mt-2 italic',
                    children: 'Effect: You start doubting your memory of clear agreements.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Minimizing Your Experience',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"You're being dramatic." "It wasn't that big a deal." "You're too sensitive."`,
                  }),
                  t.jsx('p', {
                    className: 'text-teal-600 text-sm mt-2 italic',
                    children: 'Effect: You start questioning whether your concerns are valid.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Blame Reversal',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"You made me do this." "If you hadn't [X], I wouldn't have [Y]." "This is your fault."`,
                  }),
                  t.jsx('p', {
                    className: 'text-teal-600 text-sm mt-2 italic',
                    children: 'Effect: You start feeling responsible for their behavior.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Moving the Goalposts',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'You meet their demand, and suddenly the demand changes. Nothing is ever enough.',
                  }),
                  t.jsx('p', {
                    className: 'text-teal-600 text-sm mt-2 italic',
                    children: 'Effect: You feel perpetually inadequate no matter what you do.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Selective Memory',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      "They remember every mistake you've made but have no recollection of their own.",
                  }),
                  t.jsx('p', {
                    className: 'text-teal-600 text-sm mt-2 italic',
                    children: "Effect: You start believing you're the only problematic one.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'The Guilt Lever' }),
      t.jsx('p', {
        children:
          "Guilt is a powerful lever. In healthy relationships, guilt signals that we've done something we need to address. In manipulative dynamics, guilt is manufactured—created to control your behavior.",
      }),
      t.jsx('p', { children: 'Manufactured guilt sounds like:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: '"The kids are devastated because of you."' }),
          t.jsx('li', { children: '"I sacrificed everything, and this is how you repay me."' }),
          t.jsx('li', { children: `"You're ruining their childhood."` }),
          t.jsx('li', { children: '"A real parent would [X]."' }),
          t.jsx('li', { children: '"I hope you can live with yourself."' }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'These statements are designed to bypass your rational mind and target your deepest fears about being a good parent. And because you ',
          t.jsx('em', { children: 'do' }),
          " care about your children, the guilt lands—even when you haven't actually done anything wrong.",
        ],
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Real Guilt vs. Manufactured Guilt',
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-green-700 mb-2',
                    children: 'Real Guilt',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-600 text-sm space-y-1',
                    children: [
                      t.jsx('li', { children: 'Connected to a specific action you took' }),
                      t.jsx('li', { children: 'You can see how your behavior caused harm' }),
                      t.jsx('li', { children: 'Making amends resolves the feeling' }),
                      t.jsx('li', { children: 'Proportionate to the action' }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-red-700 mb-2',
                    children: 'Manufactured Guilt',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-600 text-sm space-y-1',
                    children: [
                      t.jsx('li', { children: 'Vague or exaggerated claims' }),
                      t.jsx('li', { children: "You can't identify what you actually did wrong" }),
                      t.jsx('li', { children: 'Nothing you do resolves the feeling' }),
                      t.jsx('li', { children: 'Disproportionate to any real action' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Blame Cycle' }),
      t.jsxs('p', {
        children: [
          'In',
          ' ',
          t.jsx('a', {
            href: '/high-conflict-co-parenting/why-it-feels-impossible',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'high-conflict co-parenting',
          }),
          ', blame often follows a predictable pattern:',
        ],
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'The Setup',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'A situation arises—schedule conflict, parenting disagreement, logistical issue.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'The Accusation',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `Before facts are established, you're blamed. "This is your fault." "You always do this."`,
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'The Defense Trap',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'You try to explain, provide evidence, or defend yourself. This feeds the conflict.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'The Escalation',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: `Your defense becomes "proof" of the problem. "See? You're being defensive because you know I'm right."`,
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold flex-shrink-0',
                  children: '5',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'The Exhaustion',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "Eventually, you give up—not because they were right, but because you're depleted.",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "The trap is at step 3. When you defend against false accusations, you're playing a game you can't win. The rules aren't about truth—they're about control.",
      }),
      t.jsx('h2', { children: 'Why These Tactics Work' }),
      t.jsx('p', {
        children:
          'These patterns are effective because they exploit fundamental aspects of human psychology:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Social creatures need consensus' }),
              ' – We rely on others to confirm our perception of reality',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'We trust people we were close to' }),
              " – An ex's version of events carries weight, even when distorted",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Parental guilt is primal' }),
              " – Any suggestion that we're harming our children cuts deep",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Repetition creates doubt' }),
              ' – Hear something often enough, and you start to wonder',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Stress impairs judgment' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/emotional-triggers',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'When triggered',
              }),
              ", it's harder to think clearly",
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "This isn't weakness—it's human wiring. Recognizing the mechanism helps you protect against it.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Your Primary Defense: Factual Neutrality' }),
      t.jsx('p', {
        children:
          'The antidote to reality distortion is reconnecting with concrete, verifiable facts. This means:',
      }),
      t.jsx('h3', { children: '1. Document Everything' }),
      t.jsx('p', {
        children:
          'When memories are weaponized, documentation becomes your anchor. Keep records of:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'All written communication (texts, emails, app messages)' }),
          t.jsx('li', { children: 'Schedule agreements and changes' }),
          t.jsx('li', { children: 'Financial transactions' }),
          t.jsx('li', {
            children: 'Incidents that may be relevant to custody or co-parenting disputes',
          }),
        ],
      }),
      t.jsx('p', {
        children: `This isn't paranoia—it's protection. When they say "You never told me that," you can check your records instead of doubting your memory.`,
      }),
      t.jsx('h3', { children: '2. Respond to Facts, Not Emotions' }),
      t.jsx('p', {
        children:
          'When faced with blame or guilt-tripping, extract the factual question (if there is one) and respond only to that.',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('p', {
            className: 'text-sm font-medium text-gray-500 mb-2',
            children: 'They send:',
          }),
          t.jsx('div', {
            className: 'bg-white rounded-lg p-4 border border-gray-100 mb-4',
            children: t.jsx('p', {
              className: 'text-gray-900',
              children: `"I can't believe you would do this to the kids. You're so selfish. Are you even going to be at the school play?"`,
            }),
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: 'Defensive response:',
                  }),
                  t.jsx('div', {
                    className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children: `"I'm not selfish! You're the one who always puts yourself first. And yes, I'll be there, not that you ever notice when I show up."`,
                    }),
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'Factual response:',
                  }),
                  t.jsx('div', {
                    className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children: `"Yes, I'll be at the school play. It starts at 6pm—see you there."`,
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: "3. Don't JADE (Justify, Argue, Defend, Explain)" }),
      t.jsx('p', {
        children:
          "JADE is a common trap with high-conflict personalities. When you justify, argue, defend, or explain, you're engaging on their terms—where truth doesn't matter and everything you say can be used against you.",
      }),
      t.jsx('p', {
        children: `Instead, state your position once. If they dispute it, you don't need to repeat or elaborate. "I've shared my perspective. Let me know about Saturday."`,
      }),
      t.jsx('h3', { children: '4. Trust Your Records Over Their Version' }),
      t.jsx('p', {
        children:
          'When your co-parent insists something happened differently than you remember, check your documentation first. If your records confirm your memory, trust them—even if your co-parent is completely confident in their version.',
      }),
      t.jsx('p', {
        children:
          "People who distort reality often do so with complete conviction. Their certainty doesn't make them right.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Building Your Reality Anchor' }),
      t.jsx('p', {
        children:
          'Beyond individual interactions, you need systems that keep you grounded over time:',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Your Support System',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Trusted Friends or Family',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          'People who know you, know the situation, and can provide reality checks when you start doubting yourself.',
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'A Therapist or Counselor',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          'Professional support for processing manipulation and maintaining your mental health. They can help you distinguish legitimate concerns from manufactured guilt.',
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Written Records',
                      }),
                      t.jsxs('p', {
                        className: 'text-gray-600 text-sm',
                        children: [
                          'Your',
                          ' ',
                          t.jsx('a', {
                            href: '/court-safe-co-parenting-messages',
                            className:
                              'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                            children: 'documentation',
                          }),
                          ' ',
                          'serves as an objective record when memories are disputed. Review it when you start doubting yourself.',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'A Journal',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "Recording your experiences in real-time creates a personal record that can't be disputed. Write down what happened before you start doubting it.",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'Phrases That Maintain Your Ground' }),
      t.jsx('p', {
        children:
          'When faced with distortion tactics, these phrases help you stay anchored without engaging in the distortion:',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-3',
          children: [
            t.jsx('div', {
              className: 'bg-white rounded-lg p-3 border border-gray-100',
              children: t.jsx('p', {
                className: 'text-gray-900',
                children: `"I remember it differently, but let's focus on what we need to decide now."`,
              }),
            }),
            t.jsx('div', {
              className: 'bg-white rounded-lg p-3 border border-gray-100',
              children: t.jsx('p', {
                className: 'text-gray-900',
                children: `"I understand you see it that way. What's the question about Saturday?"`,
              }),
            }),
            t.jsx('div', {
              className: 'bg-white rounded-lg p-3 border border-gray-100',
              children: t.jsx('p', {
                className: 'text-gray-900',
                children: `"I'll check my records and get back to you."`,
              }),
            }),
            t.jsx('div', {
              className: 'bg-white rounded-lg p-3 border border-gray-100',
              children: t.jsx('p', {
                className: 'text-gray-900',
                children: `"We seem to remember this differently. Let's stick to what we can agree on."`,
              }),
            }),
            t.jsx('div', {
              className: 'bg-white rounded-lg p-3 border border-gray-100',
              children: t.jsx('p', {
                className: 'text-gray-900',
                children: `"I hear your concern. Here's what I can commit to going forward."`,
              }),
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "Notice what these phrases don't do: they don't argue about who's right, they don't defend against accusations, and they don't engage with the emotional content. They acknowledge, redirect, and move forward.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'When You Start to Doubt Yourself' }),
      t.jsx('p', {
        children:
          'Even with the best defenses, exposure to consistent distortion tactics can plant seeds of doubt. When you notice yourself questioning your perception, try these resets:',
      }),
      t.jsx('h3', { children: 'The Facts Check' }),
      t.jsx('p', {
        children:
          'Pull up your documentation. What actually happened? What was actually said? Let the record speak, not your doubts.',
      }),
      t.jsx('h3', { children: 'The Outsider Test' }),
      t.jsx('p', {
        children:
          "Describe the situation to someone who isn't involved—a friend, therapist, or family member. How does it sound when you say it out loud to someone neutral?",
      }),
      t.jsx('h3', { children: 'The Pattern Recognition' }),
      t.jsx('p', {
        children:
          "Ask yourself: Is this the first time I've felt crazy after talking to them? If this is a pattern, that's information. Consistent confusion in the presence of one person is usually about that person's communication, not your sanity.",
      }),
      t.jsx('h3', { children: 'The Body Check' }),
      t.jsx('p', {
        children:
          'How do you feel physically after interactions with your co-parent? Exhausted? Confused? Anxious? Your body often recognizes manipulation before your mind does. Trust those signals.',
      }),
      t.jsx('h2', { children: 'How LiaiZen Helps' }),
      t.jsxs('p', {
        children: [
          "When you're being told that your perception is wrong, having a",
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'neutral third-party perspective',
          }),
          ' ',
          'can be invaluable. LiaiZen provides:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'A permanent record' }),
              ' – Every message is documented, creating an objective record of what was actually said',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Pattern visibility' }),
              ' – Over time, manipulative patterns become visible in the communication history',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Response support' }),
              " – When you're activated by guilt or blame, AI-guided suggestions help you craft factual, neutral responses",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Emotional buffer' }),
              ' – The',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'intervention',
              }),
              ' ',
              'creates space between their manipulation and your response',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Most importantly, having communication pass through a neutral system makes it harder for either party to later claim things were said differently.',
      }),
      t.jsx('h2', { children: 'The Long View' }),
      t.jsx('p', {
        children:
          "Dealing with distortion tactics is exhausting. Some days you'll handle it perfectly; other days you'll get pulled into the chaos. That's human.",
      }),
      t.jsx('p', {
        children:
          'What matters is the trajectory. Over time, as you practice factual neutrality, build your support system, and maintain documentation, the tactics lose their power. Not because your co-parent changes—but because you become harder to destabilize.',
      }),
      t.jsx('p', {
        children:
          'Your reality is your own. No amount of confident assertion from another person can change what actually happened. The more grounded you become in your own perception, the less power their distortions have over you.',
      }),
      t.jsx('p', {
        children: "That's not fighting back. That's something more powerful: becoming unshakeable.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "How do I know if I'm being manipulated or if I'm actually wrong?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Check your documentation and consult people you trust. If multiple neutral parties and your records confirm your perception, trust yourself. If you're consistently feeling crazy only around one person, that's significant data. Real mistakes feel different from manufactured confusion.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Should I call out the manipulation when I see it?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Usually no. Calling out manipulation typically leads to escalation, denial, and being told you're the manipulative one. It's more effective to respond factually and maintain your boundaries without naming the pattern. Your energy is better spent protecting yourself than educating them.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "My kids are being told things about me that aren't true. What do I do?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Focus on being the parent your children experience, not the one described to them. Don't bad-mouth back—that pulls children into adult conflicts. Be consistent, loving, and present. Over time, children figure out the truth from lived experience. If parental alienation is severe, consult a family therapist or attorney.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'When should I involve professionals (lawyers, mediators, therapists)?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "If manipulation is affecting custody decisions, your mental health, or your children's wellbeing, professional help is warranted. A therapist can help you maintain your equilibrium. A lawyer can advise on documentation and legal protections. A mediator may help—though high-conflict situations often require structured interventions rather than open mediation.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Cp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How to Protect Your Mental Health ',
          t.jsx('span', { className: 'text-teal-600', children: 'While Co-Parenting' }),
        ],
      }),
      subtitle:
        'Essential self-care strategies for parents in high-stress co-parenting relationships.',
      date: 'Dec 19, 2025',
      readTime: '8 min read',
    },
    f = [
      { label: 'Resources', href: '/high-conflict-co-parenting' },
      { label: 'Mental Health Protection' },
    ],
    x = [
      "Your mental health isn't a luxury—it's the <strong>foundation</strong> of your ability to parent well.",
      "Protection isn't selfish; it's <strong>necessary</strong> for you and your children.",
      'Small, consistent practices are more sustainable than <strong>dramatic interventions</strong>.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: "You Can't Pour From an Empty Cup" }),
      t.jsx('p', {
        children:
          "It's a cliché because it's true. When co-parenting drains you—when every message feels like a battle, when anxiety spikes at the sound of a notification, when you lie awake replaying conversations—your capacity to be present for your children diminishes.",
      }),
      t.jsxs('p', {
        children: [
          "This isn't about being strong or weak.",
          ' ',
          t.jsx('a', {
            href: '/high-conflict-co-parenting/why-it-feels-impossible',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'High-conflict co-parenting',
          }),
          ' ',
          'is genuinely traumatic. The constant vigilance, the emotional volatility, the feeling of being attacked in your most vulnerable role—these take a measurable toll on your nervous system.',
        ],
      }),
      t.jsx('p', {
        children:
          "Protecting your mental health isn't self-indulgence. It's survival. And it's the single most important thing you can do for your children.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"Your children don't need a perfect parent. They need a parent who isn't depleted. That starts with protecting yourself."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Hidden Cost of Chronic Conflict' }),
      t.jsx('p', {
        children:
          "High-conflict co-parenting doesn't just stress you out in the moment. It creates a state of chronic activation that affects:",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-6 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Physical Health',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-2',
                  children: [
                    t.jsx('li', { children: 'Disrupted sleep patterns' }),
                    t.jsx('li', { children: 'Elevated cortisol levels' }),
                    t.jsx('li', { children: 'Weakened immune function' }),
                    t.jsx('li', { children: 'Tension headaches and muscle pain' }),
                    t.jsx('li', { children: 'Digestive issues' }),
                    t.jsx('li', { children: 'Cardiovascular strain' }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Mental & Emotional Health',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-2',
                  children: [
                    t.jsx('li', { children: 'Anxiety and hypervigilance' }),
                    t.jsx('li', { children: 'Depression and hopelessness' }),
                    t.jsx('li', { children: 'Difficulty concentrating' }),
                    t.jsx('li', { children: 'Emotional exhaustion' }),
                    t.jsx('li', { children: 'Reduced patience and presence' }),
                    t.jsx('li', { children: 'Identity erosion' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children: `These aren't signs of weakness—they're natural responses to an unnatural situation. Your body and mind are doing exactly what they're designed to do under sustained threat. The problem is that the "threat" isn't going away, so the stress response never fully turns off.`,
      }),
      t.jsx('h2', { children: 'The Foundation: Recognizing Your Limits' }),
      t.jsx('p', {
        children:
          "Before strategies, there's recognition. Many parents in high-conflict situations push through exhaustion, telling themselves they have to be strong for their kids. But strength without limits isn't sustainable—it's a slow collapse.",
      }),
      t.jsx('p', { children: "Signs you're approaching your limits:" }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Dreading co-parent interactions more than usual' }),
          t.jsx('li', { children: 'Snapping at your children over small things' }),
          t.jsx('li', { children: "Difficulty being present even when you're with them" }),
          t.jsx('li', { children: 'Feeling numb or detached' }),
          t.jsx('li', { children: 'Physical symptoms (fatigue, headaches, stomach issues)' }),
          t.jsx('li', { children: 'Ruminating on conflicts for hours or days' }),
          t.jsx('li', {
            children: 'Using substances or behaviors to cope (alcohol, scrolling, overworking)',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "If you recognize these signs, you're not failing—you're human. And you need support.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Protection Framework' }),
      t.jsx('p', {
        children:
          'Mental health protection in high-conflict co-parenting works on three levels: boundaries, practices, and support.',
      }),
      t.jsx('h3', { children: 'Level 1: Boundaries' }),
      t.jsx('p', {
        children:
          "Boundaries aren't about controlling your co-parent—they're about controlling your exposure to stress.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Communication Boundaries',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Time Limits',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "Don't read or respond to co-parent messages outside set hours. Protect your mornings, evenings, and time with your children.",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Channel Limits',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "Keep communication to one channel (text, email, or co-parenting app). Don't respond to multiple channels simultaneously.",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Topic Limits',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "Stick to logistics only. Don't engage with emotional content, rehashing of the past, or character attacks.",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className:
                      'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                    children: t.jsx('svg', {
                      className: 'w-5 h-5',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: t.jsx('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414',
                      }),
                    }),
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-bold text-gray-900 mb-1',
                        children: 'Response Limits',
                      }),
                      t.jsxs('p', {
                        className: 'text-gray-600 text-sm',
                        children: [
                          'Not every message needs a response.',
                          ' ',
                          t.jsx('a', {
                            href: '/high-conflict-co-parenting/de-escalation-techniques',
                            className:
                              'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                            children: 'Pure emotional content',
                          }),
                          ' ',
                          'with no logistical question can be left unanswered.',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: 'Level 2: Daily Practices' }),
      t.jsx('p', {
        children:
          "Protection isn't a one-time intervention—it's a daily practice. Small, consistent actions compound over time.",
      }),
      t.jsx('h4', { children: 'Morning Anchoring' }),
      t.jsx('p', {
        children:
          'Before engaging with any co-parent communication, take 10 minutes for yourself. This could be:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Meditation or deep breathing' }),
          t.jsx('li', { children: 'Physical movement (stretching, a short walk)' }),
          t.jsx('li', { children: 'Journaling or gratitude practice' }),
          t.jsx('li', { children: 'Simply sitting with coffee before the day begins' }),
        ],
      }),
      t.jsx('p', {
        children: 'The goal is to enter the day from a grounded state, not a reactive one.',
      }),
      t.jsx('h4', { children: 'The Buffer Zone' }),
      t.jsx('p', {
        children:
          'Create transition rituals between co-parent interactions and the rest of your life:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'After reading messages' }),
              ' – Take three deep breaths before deciding how to respond',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'After exchanges' }),
              ' – Brief physical movement to discharge stress',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Before seeing your children' }),
              " – A mental reset so you're present with them, not carrying conflict",
            ],
          }),
        ],
      }),
      t.jsx('h4', { children: 'Evening Release' }),
      t.jsx('p', {
        children: 'Whatever happened during the day, find a way to release it before sleep:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: "Write down what's bothering you (then close the notebook)" }),
          t.jsx('li', { children: 'Talk to a supportive person' }),
          t.jsx('li', { children: 'Physical activity to metabolize stress hormones' }),
          t.jsx('li', { children: 'A firm "end time" for thinking about co-parenting issues' }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: 'Level 3: Support Systems' }),
      t.jsx('p', {
        children:
          "You cannot do this alone. High-conflict co-parenting requires external support—not because you're weak, but because humans aren't designed to handle sustained adversarial relationships in isolation.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Building Your Support Network',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Professional Support',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      "A therapist experienced in high-conflict divorce or co-parenting can provide tools, perspective, and a safe space to process. This isn't about fixing you—it's about having expert support for an objectively difficult situation.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Personal Support',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      'Friends and family who listen without judgment, provide reality checks when you need them, and remind you of who you are outside this conflict. Choose people who support you without inflaming the situation.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Community Support',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      "Support groups (online or in-person) for parents in similar situations. There's power in knowing you're not alone and learning from others who've navigated similar dynamics.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-gray-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'Professional Boundaries',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children:
                      "Family lawyers, mediators, or parenting coordinators when needed. Sometimes professional intervention creates boundaries that you can't establish alone.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'The Things That Actually Help' }),
      t.jsx('p', {
        children:
          'Beyond frameworks, here are specific interventions that parents in high-conflict situations find most helpful:',
      }),
      t.jsx('h3', { children: 'Physical Regulation' }),
      t.jsx('p', {
        children:
          'Your body holds stress. Moving it releases that stress in ways that thinking cannot:',
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Exercise' }),
              " – Any form that you'll actually do consistently",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Cold exposure' }),
              ' – Cold showers or face washing reset the nervous system',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Breathwork' }),
              ' – Extended exhales activate the parasympathetic system',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Sleep' }),
              ' – Protect it fiercely; nothing else works without it',
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: 'Mental Boundaries' }),
      t.jsx('p', {
        children:
          "Your co-parent doesn't just live in messages—they can live in your head. Techniques for mental boundaries:",
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Scheduled worry time' }),
              ' – Give yourself 15 minutes to think about co-parenting issues, then stop',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Containment visualization' }),
              ' – Imagine putting the conflict in a box, closing it, and setting it aside',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reality anchoring' }),
              ' – When ruminating, list five things you can see, four you can hear, three you can touch',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Identity preservation' }),
              ' – Regular engagement with parts of yourself that have nothing to do with being a co-parent',
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: 'Emotional Processing' }),
      t.jsx('p', {
        children:
          "The feelings need somewhere to go. Suppression doesn't work; healthy expression does:",
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Journaling' }),
              " – Write the angry letter you'll never send",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Therapy' }),
              ' – A professional space to process without burden on friends',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creative outlets' }),
              ' – Art, music, writing—anything that transforms emotion into something else',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Physical release' }),
              ' – Sometimes you just need to punch a pillow or scream in the car',
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What Your Children Need From You' }),
      t.jsx('p', {
        children:
          "Protecting your mental health isn't separate from being a good parent—it's essential to it. What your children actually need:",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'A regulated parent',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "Children feel their parent's emotional state. Your calm is their calm.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'A present parent',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "Being physically there while mentally replaying conflict isn't presence. They need your full attention.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'A stable home',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'When one environment is chaotic, the other being stable matters even more.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'Protection from conflict',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "They shouldn't see your stress, hear the arguments, or feel caught in the middle.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'Permission to love both parents',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Your ability to manage your emotions allows them to have a relationship with both of you without guilt.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          "You can only provide these things if you're taking care of yourself. Self-care isn't selfish—it's the foundation of being the parent your children need.",
      }),
      t.jsx('h2', { children: 'How LiaiZen Supports Your Mental Health' }),
      t.jsxs('p', {
        children: [
          'Co-parenting communication is often the primary source of stress.',
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          'was designed to reduce that burden:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creates distance' }),
              ' – The AI buffer gives you space to process before responding',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reduces reactive cycles' }),
              ' –',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Catching escalation',
              }),
              ' ',
              'before it happens means fewer draining conflicts',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsxs('strong', {
                children: [
                  'Supports',
                  ' ',
                  t.jsx('a', {
                    href: '/co-parenting-communication/emotional-regulation',
                    className:
                      'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                    children: 'emotional regulation',
                  }),
                ],
              }),
              ' ',
              '– The pause and reframe suggestions help you stay calm',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Provides documentation' }),
              ' – Knowing everything is recorded reduces anxiety about disputes',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Protects your time' }),
              ' – Efficient, focused communication means less time spent in conflict',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The goal isn't to make co-parenting easy—it's to make it sustainable. Every bit of stress you don't carry is energy available for your children and yourself.",
      }),
      t.jsx('h2', { children: 'The Long Game' }),
      t.jsx('p', {
        children:
          "High-conflict co-parenting is often a marathon, not a sprint. Your children may be young, and you may have years of co-parenting ahead. Protecting your mental health isn't about surviving the next crisis—it's about maintaining yourself over the long haul.",
      }),
      t.jsx('p', { children: 'What sustainable protection looks like:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Gradually strengthening boundaries as you learn what works' }),
          t.jsx('li', { children: 'Building support systems that can be there for years' }),
          t.jsx('li', { children: 'Developing practices that become automatic' }),
          t.jsx('li', { children: 'Recognizing your progress, even when things are hard' }),
          t.jsx('li', { children: 'Accepting that some days will be better than others' }),
        ],
      }),
      t.jsxs('p', {
        children: [
          "You're not failing if this is hard. It ",
          t.jsx('em', { children: 'is' }),
          " hard. The goal isn't perfection—it's persistence. Staying present, staying regulated, staying you.",
        ],
      }),
      t.jsx('p', {
        children:
          'Your children will remember not that you had a perfect co-parenting relationship, but that you were there for them. That you were calm in the chaos. That you protected them—by protecting yourself.',
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'I feel guilty taking time for myself when I should be with my kids. Is that normal?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Completely normal—and worth examining. Time for yourself isn't time away from your kids in any meaningful sense. A depleted parent provides less than a rested one. The quality of time with your children matters more than the quantity. Taking care of yourself makes that quality time possible.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "I can't afford therapy. What are my options?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'Many communities have sliding-scale therapy, support groups, or community mental health services. Online therapy platforms often cost less than traditional therapy. Books on high-conflict co-parenting, online communities, and self-guided resources can also help. Start where you can—any support is better than none.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'My co-parent criticizes me for "not being available" when I set communication boundaries. What do I do?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `Their criticism of your boundaries doesn't make them invalid. You can acknowledge their frustration without changing your boundary: "I understand you'd prefer immediate responses. I'm available for non-emergency communication between [hours]." Their discomfort with your boundaries is theirs to manage.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'When should I consider medication for anxiety or depression?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "If anxiety or depression is significantly impacting your daily functioning, ability to parent, work, or maintain relationships, it's worth discussing with a doctor or psychiatrist. Medication isn't a failure—it's a tool. Many parents find that medication provides enough relief to engage with therapy and other practices more effectively.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function zp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'What to Do When Every Conversation ',
          t.jsx('span', { className: 'text-teal-600', children: 'Turns Into a Fight' }),
        ],
      }),
      subtitle: "Breaking the cycle of constant conflict even when your co-parent won't change.",
      date: 'Dec 20, 2025',
      readTime: '7 min read',
    },
    f = [
      { label: 'Resources', href: '/high-conflict-co-parenting' },
      { label: 'Every Conversation a Fight' },
    ],
    x = [
      'If every conversation becomes a battle, the <strong>pattern</strong> is the problem—not just the topics.',
      'You can break cycles unilaterally by <strong>changing your role</strong> in them.',
      "Strategic communication isn't surrendering—it's <strong>refusing to play a game you can't win</strong>.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'When Communication Itself Is the Battlefield' }),
      t.jsx('p', {
        children:
          "You're not imagining it. A simple question about pickup time turns into a referendum on your failures as a partner. A logistics request spawns a three-day text war. Even agreeing on something somehow leads to conflict.",
      }),
      t.jsx('p', {
        children:
          "When every conversation with your co-parent becomes a fight, it stops being about the topics. The pattern itself has become the problem. You're no longer disagreeing about schedules or expenses—you're locked in a dynamic where conflict is the default state.",
      }),
      t.jsx('p', {
        children:
          "This is exhausting. But it's not hopeless. And counterintuitively, you don't need their cooperation to change it.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"You can't control whether they show up with boxing gloves. But you can decide not to step into the ring."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Understanding the Conflict Machine' }),
      t.jsx('p', {
        children:
          "When every conversation escalates, something mechanical is happening. It's not random—it follows a predictable pattern:",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'The Trigger',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Any communication—even neutral logistics—activates the conflict machinery. The content is almost irrelevant; it's the fact of contact that sets things in motion.",
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'The Escalation Hook',
                }),
                t.jsxs('p', {
                  className: 'text-gray-600 text-sm',
                  children: [
                    'Something in the exchange pulls you in: an accusation, a distortion of facts, a',
                    ' ',
                    t.jsx('a', {
                      href: '/high-conflict-co-parenting/gaslighting-guilt-blame',
                      className:
                        'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                      children: 'guilt-trip',
                    }),
                    ', or simply their tone. You feel compelled to respond.',
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'The Engagement',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'You defend, explain, correct, or counter-attack. Each response creates new hooks for them to grab onto.',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', { className: 'font-medium text-gray-900 mb-2', children: 'The Spiral' }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'Back and forth, the conflict expands. The original topic is lost. Hours or days pass. Nothing is resolved.',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children:
          'This machine runs on participation. It needs both parties to keep cycling. Which means the way to break it is to stop feeding it—without abandoning necessary communication.',
      }),
      t.jsx('h2', { children: 'The Minimum Viable Communication Model' }),
      t.jsx('p', {
        children:
          'If every conversation becomes a fight, the solution is to have fewer conversations—and to make the ones you have impossible to fight about.',
      }),
      t.jsx('h3', { children: "Principle 1: Only Communicate What's Necessary" }),
      t.jsx('p', {
        children: `Ask yourself before every message: "Is this communication required for co-parenting logistics?" If not, don't send it. This includes:`,
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', {
            children:
              "Explaining your reasoning (they don't need to understand—they need information)",
          }),
          t.jsx('li', {
            children: "Defending against accusations (you won't convince them anyway)",
          }),
          t.jsx('li', { children: "Providing context that isn't strictly necessary" }),
          t.jsx('li', { children: 'Attempting to create understanding or connection' }),
        ],
      }),
      t.jsx('p', {
        children: 'When every conversation becomes conflict, extra words become extra ammunition.',
      }),
      t.jsx('h3', { children: 'Principle 2: Make Your Messages Fight-Proof' }),
      t.jsx('p', { children: 'A fight-proof message contains:' }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('ul', {
          className: 'space-y-3',
          children: [
            t.jsxs('li', {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                t.jsxs('span', {
                  children: [
                    t.jsx('strong', { children: 'Only facts' }),
                    ' – No opinions, interpretations, or emotional content',
                  ],
                }),
              ],
            }),
            t.jsxs('li', {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                t.jsxs('span', {
                  children: [
                    t.jsx('strong', { children: 'Clear ask or inform' }),
                    " – Either you're asking for something specific or informing of something specific",
                  ],
                }),
              ],
            }),
            t.jsxs('li', {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                t.jsxs('span', {
                  children: [
                    t.jsx('strong', { children: 'No hooks' }),
                    ' – Nothing for them to react defensively to',
                  ],
                }),
              ],
            }),
            t.jsxs('li', {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                t.jsxs('span', {
                  children: [
                    t.jsx('strong', { children: 'No history' }),
                    ' – No reference to past conflicts or patterns',
                  ],
                }),
              ],
            }),
            t.jsxs('li', {
              className: 'flex items-start gap-3',
              children: [
                t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                t.jsxs('span', {
                  children: [
                    t.jsx('strong', { children: 'Short' }),
                    ' – The longer the message, the more attack surface',
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Same Information, Different Delivery',
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: 'Fight-prone:',
                  }),
                  t.jsx('div', {
                    className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children: `"As usual, I'm the one who has to handle everything. The school needs the medical form by Friday. I've already filled out most of it, but I need your insurance information because you never gave it to me even though I've asked multiple times. Can you please send it before Thursday?"`,
                    }),
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'Fight-proof:',
                  }),
                  t.jsx('div', {
                    className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children:
                        '"School needs medical form by Friday. Can you send insurance info by Thursday?"',
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: "Principle 3: Don't Take the Bait" }),
      t.jsxs('p', {
        children: [
          'Even with fight-proof messages, they may still respond with hooks: accusations, insults, criticism. The key is to ',
          t.jsx('strong', { children: 'not engage with any of it' }),
          '.',
        ],
      }),
      t.jsx('p', { children: 'When they respond with:' }),
      t.jsx('p', {
        className: 'bg-gray-100 p-4 rounded-lg italic text-gray-700',
        children: `"Of course you need it by Thursday. You always wait until the last minute. I shouldn't be surprised. I'll send it when I can."`,
      }),
      t.jsx('p', { children: 'You respond only to the actionable content:' }),
      t.jsx('p', {
        className: 'bg-teal-50 p-4 rounded-lg text-gray-900',
        children: '"Thanks. Thursday works."',
      }),
      t.jsx('p', {
        children:
          "You're not ignoring the attack—you're choosing not to engage with it. There's a difference. Ignoring would leave things unresolved. Not engaging means extracting the useful content and discarding the rest.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The BIFF Method' }),
      t.jsx('p', {
        children:
          'Developed by Bill Eddy for high-conflict communication, BIFF provides a framework for responses that end conflicts rather than fuel them:',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0',
                  children: 'B',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Brief' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Keep it short. Long responses provide more material for conflict. A few sentences maximum.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0',
                  children: 'I',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Informative',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Stick to facts and necessary information. No opinions, emotions, or commentary.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0',
                  children: 'F',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Friendly' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Neutral to mildly positive tone. Not warm, but not cold. "Thanks for letting me know" costs nothing.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0',
                  children: 'F',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', { className: 'font-bold text-gray-900 mb-1', children: 'Firm' }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "Ends the conversation. Doesn't invite further back-and-forth. States what will happen and stops.",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'What About When You Need to Disagree?' }),
      t.jsx('p', {
        children:
          "Sometimes you can't just comply—there are legitimate disagreements that need to be addressed. Even then, you can disagree without fueling conflict:",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'The Non-Combative Disagreement',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-gray-500 mb-2',
                    children: 'They request:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-white p-3 rounded border border-gray-200',
                    children: `"I need to swap weekends. I'm taking the kids to see my parents on your weekend."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: 'Conflict-prone response:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-red-50 p-3 rounded border border-red-100',
                    children: `"You can't just decide to take my weekend. That's not how this works. We have a custody agreement for a reason. If you want to swap, you need to ask, not tell."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'Non-combative disagreement:',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                    children: `"I can't accommodate that swap—I've made plans. If you'd like to propose different dates for a swap, I'm open to discussing."`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', { children: 'The non-combative version says no, but it:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: "Doesn't lecture or explain why their request was wrong" }),
          t.jsx('li', { children: `Doesn't invoke authority ("the agreement")` }),
          t.jsx('li', { children: 'Offers an alternative path forward' }),
          t.jsx('li', { children: 'Remains neutral in tone' }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Discipline of Disengagement' }),
      t.jsx('p', {
        children:
          "Not engaging when you're attacked is one of the hardest things you can do. Everything in you wants to defend yourself, correct the record, prove you're right. Learning to override that instinct takes practice.",
      }),
      t.jsx('h3', { children: 'What Helps' }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Remember the audience' }),
              " – You're not trying to convince them. You're creating a",
              ' ',
              t.jsx('a', {
                href: '/court-safe-co-parenting-messages',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'record',
              }),
              ' ',
              'and preserving your peace.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Ask "What do I gain?"' }),
              ' – Before responding to an attack, ask what engaging will actually achieve. Usually: nothing good.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/co-parenting-communication/pause-before-reacting',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Delay before responding',
                }),
              }),
              ' ',
              '– Never respond in the moment. Give yourself time to move from',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/reaction-vs-response',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'reaction to response',
              }),
              '.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Draft and revise' }),
              ' – Write the response you want to send, then rewrite it as BIFF.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Have a mantra' }),
              ' – Something to remind yourself in the moment: "Not my circus, not my monkeys" or "This is not a conversation I need to win."',
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: 'What Gets Easier' }),
      t.jsx('p', { children: 'With practice:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'You stop taking the bait automatically' }),
          t.jsx('li', { children: 'Their attacks lose their sting' }),
          t.jsx('li', { children: 'You see their patterns more clearly' }),
          t.jsx('li', { children: 'You spend less mental energy on conflict' }),
          t.jsx('li', {
            children:
              "The fights actually become less frequent (because there's no one fighting back)",
          }),
        ],
      }),
      t.jsx('h2', { children: "When Disengagement Isn't Enough" }),
      t.jsx('p', {
        children:
          "Sometimes, despite your best efforts, they continue to escalate. When you've consistently used minimum viable communication and they're still attacking, you have options:",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'Parallel Parenting',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Reduce communication to absolute minimums. Each parent manages their own household with minimal coordination. This isn't ideal, but it's sometimes necessary.",
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'Third-Party Communication',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'Use a co-parenting app, parenting coordinator, or mediator to buffer communication. This adds structure and accountability.',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'Legal Intervention',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'If harassment continues, documenting patterns and involving attorneys or courts may be necessary. This is a last resort, but it exists for a reason.',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Helps' }),
      t.jsxs('p', {
        children: [
          'When every conversation becomes a fight, you need support systems that work in real-time.',
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          'provides:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Automatic BIFF check' }),
              ' – Flags messages that are too long, defensive, or hook-laden before you send',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Neutral rewrites' }),
              ' – Offers fight-proof alternatives when your draft might escalate',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/liaizen/escalation-prevention',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Escalation interception',
                }),
              }),
              ' ',
              "– Catches when you're about to take bait",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Pattern visibility' }),
              ' – Helps you see the conflict patterns over time',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Built-in documentation' }),
              ' – Every exchange is recorded, protecting you if disputes arise',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'The goal is to make fight-proof communication easier than conflict. Over time, that changes the entire dynamic.',
      }),
      t.jsx('h2', { children: 'The Paradox of Surrender' }),
      t.jsx('p', {
        children:
          "Here's what feels backward but is actually true: the way to win a fight you're always losing is to stop fighting.",
      }),
      t.jsx('p', {
        children:
          "This isn't surrender—it's strategy. When you stop engaging in the conflict pattern, you:",
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Preserve your energy for your children' }),
          t.jsxs('li', {
            children: [
              'Protect your',
              ' ',
              t.jsx('a', {
                href: '/high-conflict-co-parenting/mental-health-protection',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'mental health',
              }),
            ],
          }),
          t.jsx('li', { children: 'Create a communication record that reflects well on you' }),
          t.jsx('li', { children: 'Model healthy conflict resolution for your kids' }),
          t.jsx('li', { children: 'Sometimes—not always, but sometimes—shift the entire dynamic' }),
        ],
      }),
      t.jsx('p', {
        children:
          "You're not conceding that they're right. You're recognizing that being right doesn't matter if every conversation is a war. You're choosing peace—not because they deserve it, but because you do.",
      }),
      t.jsx('p', { children: "That's not weakness. That's wisdom." }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: `Won't they think they've "won" if I stop engaging?`,
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "They might. Does it matter? Your goal isn't to win—it's to raise your children in peace. If not engaging means they feel victorious while your stress levels drop and your kids benefit from a calmer parent, that's a trade worth making.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'What if there are things I genuinely need to address?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Address them—briefly, factually, once. Then stop. If they don't engage productively, you've documented your position and can escalate to mediators or attorneys if needed. But endless back-and-forth arguing rarely changes anything.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "How do I handle it when they tell the kids things about our communication that aren't true?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Focus on being the parent your children experience, not the one described to them. Don't badmouth back. Be consistent, loving, and present. Over time, children learn to trust their own experience over narratives. If it's severe, document it and consult a family therapist.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'How long before the pattern changes?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Your internal experience can change within weeks of consistent practice. Their behavior may take longer—months or years—and may never fully change. But that's okay. Your goal is to change your experience of the dynamic, not to change them. That's within your control.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Mp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How Repeated Parental Conflict',
          ' ',
          t.jsx('span', { className: 'text-teal-600', children: 'Affects Children Long-Term' }),
        ],
      }),
      subtitle:
        'The evidence-based impact of conflict on child development and future relationships.',
      date: 'Dec 21, 2025',
      readTime: '9 min read',
    },
    f = [
      { label: 'Resources', href: '/child-centered-co-parenting' },
      { label: 'Long-Term Effects' },
    ],
    x = [
      "It's not divorce that harms children most—it's <strong>ongoing conflict between parents</strong>.",
      "Children don't need perfect co-parenting; they need <strong>buffering from adult conflict</strong>.",
      'Every reduction in conflict exposure creates <strong>measurable benefits</strong> for your children.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'What the Research Actually Shows' }),
      t.jsx('p', {
        children:
          "For decades, researchers studied whether children of divorce were worse off than children from intact families. The answer turned out to be more nuanced than anyone expected: it wasn't the divorce itself that mattered most. It was the conflict.",
      }),
      t.jsx('p', {
        children:
          'Children from high-conflict intact families often fare worse than children from low-conflict divorced families. And children from high-conflict divorced families—where the conflict continues across two households—show the most challenging outcomes.',
      }),
      t.jsx('p', {
        children:
          "This isn't meant to frighten you. It's meant to focus your attention on what actually matters: not the structure of your family, but the emotional climate your children navigate.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"The greatest gift you can give your children isn't a conflict-free co-parenting relationship—it's protection from the conflict that exists."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How Conflict Affects Developing Minds' }),
      t.jsx('p', {
        children:
          "Children's brains are still forming, and they're exquisitely attuned to their environment—especially to the emotional states of their caregivers. When that environment includes chronic conflict, it shapes development in measurable ways.",
      }),
      t.jsx('h3', { children: 'The Stress Response System' }),
      t.jsx('p', {
        children:
          'Children exposed to ongoing parental conflict often develop an overactive stress response. Their systems learn to stay vigilant, always scanning for signs of tension. This manifests as:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Heightened anxiety and hypervigilance' }),
          t.jsx('li', { children: 'Difficulty regulating emotions' }),
          t.jsx('li', { children: 'Sleep disruption' }),
          t.jsx('li', { children: 'Physical symptoms (stomach aches, headaches)' }),
          t.jsx('li', { children: 'Concentration difficulties' }),
        ],
      }),
      t.jsx('p', {
        children: `This isn't misbehavior—it's their nervous system doing exactly what it was designed to do: protecting them from perceived threats. The problem is that the "threat" is ongoing, so the protection never turns off.`,
      }),
      t.jsx('h3', { children: 'The Emotional Security Hypothesis' }),
      t.jsx('p', {
        children:
          "Researchers have found that children's sense of emotional security mediates the effects of conflict. When children feel:",
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Caught in the middle of parental disputes' }),
          t.jsx('li', { children: "Responsible for their parents' emotions" }),
          t.jsx('li', { children: 'Unable to predict what will happen next' }),
          t.jsx('li', {
            children: 'Fearful of the conflict affecting their relationship with either parent',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'Their emotional security is compromised, and negative outcomes become more likely. This is why buffering children from conflict matters so much—it preserves their sense of security even when the underlying conflict exists.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Areas of Impact' }),
      t.jsx('p', {
        children:
          "Research has documented effects across multiple domains of children's lives. Understanding these helps motivate the hard work of managing conflict.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-6',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Academic Performance',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mb-2',
                  children: 'Children from high-conflict families often show:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-1',
                  children: [
                    t.jsx('li', { children: 'Lower grades and academic achievement' }),
                    t.jsx('li', { children: 'Reduced cognitive function under stress' }),
                    t.jsx('li', { children: 'Difficulty concentrating in school' }),
                    t.jsx('li', { children: 'Higher dropout rates' }),
                  ],
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mt-2 italic',
                  children:
                    'Mechanism: When mental energy goes toward monitoring conflict, less is available for learning.',
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Emotional Well-Being',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mb-2',
                  children: 'Consistent findings include:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-1',
                  children: [
                    t.jsx('li', { children: 'Higher rates of anxiety and depression' }),
                    t.jsx('li', { children: 'Lower self-esteem' }),
                    t.jsx('li', { children: 'Increased behavioral problems' }),
                    t.jsx('li', { children: 'Difficulty identifying and expressing emotions' }),
                  ],
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mt-2 italic',
                  children:
                    'Mechanism: Children internalize conflict as a reflection of themselves, or externalize it through acting out.',
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Social Relationships',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mb-2',
                  children: 'Impact on peer and social functioning:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-1',
                  children: [
                    t.jsx('li', { children: 'Difficulty forming and maintaining friendships' }),
                    t.jsx('li', { children: 'Problems with conflict resolution among peers' }),
                    t.jsx('li', { children: 'Social withdrawal or aggression' }),
                    t.jsx('li', { children: 'Lower social competence' }),
                  ],
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mt-2 italic',
                  children:
                    'Mechanism: Children model what they observe; if conflict is the template, it becomes the default.',
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('h4', {
                  className: 'font-bold text-gray-900 mb-3',
                  children: 'Future Relationships',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mb-2',
                  children: 'Long-term relationship patterns:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-600 text-sm space-y-1',
                  children: [
                    t.jsx('li', {
                      children: 'Higher rates of relationship difficulties in adulthood',
                    }),
                    t.jsx('li', { children: 'Increased likelihood of divorce' }),
                    t.jsx('li', { children: 'Challenges with intimacy and trust' }),
                    t.jsx('li', {
                      children: 'Replication of conflict patterns in own relationships',
                    }),
                  ],
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm mt-2 italic',
                  children:
                    'Mechanism: Early templates for relationships shape what feels "normal" in adult partnerships.',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'The Good News: Protective Factors' }),
      t.jsx('p', {
        children:
          "The research isn't all concerning. It also reveals clear protective factors—things that buffer children from the negative effects of parental conflict:",
      }),
      t.jsxs('div', {
        className: 'bg-teal-50 border border-teal-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'What Protects Children',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0',
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-medium text-gray-900',
                        children: 'At Least One Stable, Regulated Parent',
                      }),
                      t.jsxs('p', {
                        className: 'text-gray-600 text-sm',
                        children: [
                          'A child with one parent who maintains',
                          ' ',
                          t.jsx('a', {
                            href: '/co-parenting-communication/emotional-regulation',
                            className:
                              'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                            children: 'emotional regulation',
                          }),
                          ' ',
                          'has significantly better outcomes. You can be that parent.',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0',
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-medium text-gray-900',
                        children: 'Buffering from Direct Conflict Exposure',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "Children who don't witness arguments, don't read hostile messages, and aren't used as messengers fare much better—even when conflict exists.",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0',
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-medium text-gray-900',
                        children: 'Secure Attachment to Both Parents',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          "When children feel secure in their relationship with each parent individually—and aren't made to choose sides—outcomes improve dramatically.",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0',
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-medium text-gray-900',
                        children: 'Consistency and Predictability',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          'Stable routines, consistent rules, and predictable schedules help children feel secure even in difficult family situations.',
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-4',
                children: [
                  t.jsx('div', {
                    className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0',
                  }),
                  t.jsxs('div', {
                    children: [
                      t.jsx('p', {
                        className: 'font-medium text-gray-900',
                        children: 'External Support Systems',
                      }),
                      t.jsx('p', {
                        className: 'text-gray-600 text-sm',
                        children:
                          'Grandparents, extended family, teachers, coaches, and therapists provide additional stability and modeling of healthy relationships.',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What Children Need to Hear' }),
      t.jsx('p', {
        children:
          'Beyond behavior, children benefit from specific messages that address their deepest fears about parental conflict:',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: `"This isn't your fault."`,
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Children often believe they caused their parents' problems or that better behavior could fix things. They need explicit reassurance that adult conflicts are not their responsibility.",
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: `"You don't have to choose."`,
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'Children fear being forced to pick sides. Explicit permission to love both parents freely—and reassurance that you want them to—is profoundly important.',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: '"Both your parents love you."',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Even when you're in conflict with your co-parent, your child needs to hear that both parents love them. This isn't about the other parent—it's about your child's security.",
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: '"The grown-up stuff is for grown-ups to handle."',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Children shouldn't carry adult problems. Reassure them that the conflict is yours to manage, not theirs to worry about.",
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'The Cumulative Effect of Small Changes' }),
      t.jsx('p', {
        children:
          "Here's what the research ultimately suggests: you don't need to eliminate conflict to protect your children. You need to reduce their exposure to it and provide buffering when it occurs.",
      }),
      t.jsx('p', { children: 'Every time you:' }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Avoid arguing in front of them' }),
              " – They're protected from direct exposure",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/high-conflict-co-parenting/de-escalation-techniques',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'De-escalate instead of escalate',
                }),
              }),
              ' ',
              '– The overall conflict level decreases',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Refrain from bad-mouthing your co-parent' }),
              ' – Their relationship with both parents stays intact',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Keep them out of adult business' }),
              ' – They stay children, not messengers or confidants',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/co-parenting-communication/emotional-regulation',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Regulate your own emotions',
                }),
              }),
              ' ',
              '– You model healthy stress management',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Maintain their routines' }),
              ' – Predictability provides security',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "These aren't small things—they're the protective factors that the research says matter most. And they're within your control, regardless of what your co-parent does.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Breaking the Cycle' }),
      t.jsx('p', {
        children:
          "Perhaps the most hopeful finding in the research: patterns don't have to repeat. Children who experience high-conflict co-parenting don't have to replicate it in their own lives.",
      }),
      t.jsx('p', { children: 'What breaks the cycle:' }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Awareness' }),
              ' – Understanding how their experience affected them',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Modeling' }),
              ' – Seeing healthy conflict resolution somewhere, even if not from both parents',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Therapy' }),
              ' – Processing childhood experiences with professional support',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Conscious choice' }),
              ' – Deciding to do things differently in their own relationships',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "You can be part of this. Every time you handle conflict differently than your instincts suggest—every time you model regulation instead of escalation—you're showing your children that there's another way.",
      }),
      t.jsx('p', {
        children:
          'You may not be able to give them conflict-free co-parenting. But you can give them a template for something better—and the belief that they can create something different for themselves.',
      }),
      t.jsx('h2', { children: 'How LiaiZen Supports Child-Centered Co-Parenting' }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          "was built with children's wellbeing at the center. The technology supports you by:",
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reducing conflict in communications' }),
              ' – Lower conflict means less stress that children sense',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/liaizen/escalation-prevention',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Preventing escalation',
                }),
              }),
              ' ',
              '– Catching heated exchanges before they spiral',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Supporting your regulation' }),
              ' – Helping you respond calmly even when triggered',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creating documentation' }),
              ' – Reducing disputes about what was said',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Making logistics easier' }),
              ' – Smoother coordination means less tension overall',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The goal isn't perfect co-parenting communication. It's good-enough communication that protects your children from the worst effects of adult conflict.",
      }),
      t.jsx('p', { children: "That's achievable. And it makes a real difference." }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "My kids seem fine. Does that mean they're not affected?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'Not necessarily. Some children internalize stress rather than showing it outwardly. "Seeming fine" can mask anxiety, hypervigilance, or people-pleasing behavior. Check in with them regularly and watch for subtle signs like sleep changes, physical complaints, or changes in school performance.',
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "I've already exposed my kids to a lot of conflict. Is the damage done?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Children are resilient, and brains continue developing. While early exposure matters, improvements at any point help. Research shows that children's outcomes improve when conflict decreases—even after significant exposure. It's never too late to make changes.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "My co-parent doesn't protect the kids from conflict. What can I do?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Focus on what you can control: your household, your behavior, your relationship with your children. One regulated, conflict-buffering parent is a powerful protective factor. You can't make your co-parent change, but you can be the stable presence your children need.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Should I put my kids in therapy?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Therapy can be helpful, especially if children are showing signs of distress. A child therapist can provide them with tools and a safe space to process. But therapy isn't always necessary—for some children, a stable, regulated parent and protection from conflict is enough. If you're unsure, a consultation with a family therapist can help you decide.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Dp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'What Children Need Most',
          ' ',
          t.jsx('span', {
            className: 'text-teal-600',
            children: 'During High-Conflict Co-Parenting',
          }),
        ],
      }),
      subtitle: "It's not perfect parents—it's stability. Here's how to provide it.",
      date: 'Dec 22, 2025',
      readTime: '7 min read',
    },
    f = [{ label: 'Resources', href: '/child-centered-co-parenting' }, { label: 'What Kids Need' }],
    x = [
      "Children don't need their parents to get along. They need to be <strong>kept out of adult conflict</strong>.",
      "Stability isn't about perfection—it's about <strong>predictability and presence</strong>.",
      "Your child's relationship with their other parent is <strong>not about you</strong>.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'What Children Actually Need (Not What We Assume)' }),
      t.jsx('p', {
        children:
          'When parents ask what their children need during a difficult co-parenting situation, they often expect the answer to involve the other parent—that the kids need mom and dad to get along, to become friends, to create seamless holidays together.',
      }),
      t.jsx('p', {
        children:
          "That's not what the research shows. Children can thrive with parents who can't stand each other—if certain conditions are met. And those conditions are entirely within each parent's individual control.",
      }),
      t.jsx('p', {
        children:
          "This is actually good news. You don't need your co-parent's cooperation to give your children what they need most. You can do this on your own.",
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: `"Children don't need their parents to be partners. They need to not be soldiers in their parents' war."`,
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Core Needs' }),
      t.jsx('p', {
        children:
          'Research on children of divorce and high-conflict families points to consistent themes. These are the needs that, when met, predict resilience and healthy development:',
      }),
      t.jsx('h3', { children: '1. Freedom from Loyalty Conflicts' }),
      t.jsx('p', {
        children:
          'Children experience loyalty conflicts when they feel that loving one parent betrays the other. This happens when parents:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Speak negatively about the other parent in front of children' }),
          t.jsx('li', { children: 'Ask children to keep secrets' }),
          t.jsx('li', { children: 'Interrogate children about the other household' }),
          t.jsx('li', {
            children: 'Show distress when children express love for the other parent',
          }),
          t.jsx('li', { children: "Compete for the child's affection" }),
        ],
      }),
      t.jsxs('p', {
        children: [
          t.jsx('strong', { children: 'What children need:' }),
          ` Explicit permission to love both parents freely. "I'm glad you had fun with Dad this weekend" costs nothing and means everything.`,
        ],
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Phrases That Free Children from Loyalty Conflicts',
          }),
          t.jsxs('div', {
            className: 'space-y-3',
            children: [
              t.jsx('div', {
                className: 'bg-white rounded-lg p-3 border border-gray-100',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children: `"It's good that you love your mom/dad. I want you to."`,
                }),
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-3 border border-gray-100',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children: '"Tell me about your weekend" (without interrogation or commentary)',
                }),
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-3 border border-gray-100',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children: '"Whatever happens between me and your mom/dad, we both love you."',
                }),
              }),
              t.jsx('div', {
                className: 'bg-white rounded-lg p-3 border border-gray-100',
                children: t.jsx('p', {
                  className: 'text-gray-900',
                  children: `"You don't have to choose sides. You're allowed to love both of us."`,
                }),
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: '2. Protection from Adult Conflict' }),
      t.jsx('p', {
        children:
          "Children are not equipped to process adult relationship conflicts. When they're exposed to arguments, hostile texts, or even tense exchanges during handoffs, their nervous systems register threat.",
      }),
      t.jsxs('p', {
        children: [
          t.jsx('strong', { children: 'What children need:' }),
          ' To be completely shielded from the conflict between their parents. This means:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', {
            children: 'Never arguing in front of them (including "quiet" tension they can feel)',
          }),
          t.jsx('li', { children: 'Never letting them see hostile messages' }),
          t.jsx('li', { children: 'Neutral or positive handoffs' }),
          t.jsx('li', { children: 'Not using them as messengers between households' }),
          t.jsx('li', { children: 'Not venting about your co-parent within earshot' }),
        ],
      }),
      t.jsx('p', {
        children:
          "Children should experience their parents' conflict the way they experience their parents' finances: they know it exists, but the details are handled by adults.",
      }),
      t.jsx('h3', { children: '3. One Stable, Regulated Parent' }),
      t.jsxs('p', {
        children: [
          "Research consistently shows that children's outcomes improve dramatically when they have at least one",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-regulation',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'emotionally regulated',
          }),
          ' ',
          'parent. This person provides:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'A calm presence when the child is distressed' }),
          t.jsx('li', { children: 'Predictable emotional responses' }),
          t.jsx('li', { children: 'Modeling of healthy stress management' }),
          t.jsx('li', { children: 'A stable home base' }),
        ],
      }),
      t.jsxs('p', {
        children: [
          t.jsx('strong', { children: 'What children need:' }),
          " You don't need to be perfect. You need to be the steadier presence—the one who doesn't spiral, who doesn't vent to them, who stays regulated even when the other parent doesn't.",
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h3', { children: '4. Predictability and Routine' }),
      t.jsx('p', {
        children:
          "Chaos is hard for developing brains. When children can't predict what's coming—which parent will pick them up, what mood that parent will be in, whether there will be a fight at handoff—their stress systems stay activated.",
      }),
      t.jsx('p', { children: t.jsx('strong', { children: 'What children need:' }) }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', {
            children:
              "Consistent schedules (even if the other household isn't consistent, yours can be)",
          }),
          t.jsx('li', { children: 'Stable routines at each home' }),
          t.jsx('li', { children: 'Advance notice of changes when possible' }),
          t.jsx('li', { children: "Reliability—you do what you say you'll do" }),
        ],
      }),
      t.jsx('p', {
        children:
          'Predictability creates safety. When children know what to expect, they can relax and just be kids.',
      }),
      t.jsx('h3', { children: '5. Their Childhood Preserved' }),
      t.jsx('p', {
        children:
          "Children in high-conflict situations often grow up too fast. They become caretakers of their parents' emotions, mediators of adult disputes, or the confidants who carry burdens they shouldn't know about.",
      }),
      t.jsxs('p', {
        children: [
          t.jsx('strong', { children: 'What children need:' }),
          ' To remain children. This means:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Not being your emotional support' }),
          t.jsx('li', { children: 'Not knowing the details of your conflicts' }),
          t.jsx('li', { children: 'Not carrying messages between parents' }),
          t.jsx('li', { children: 'Not being asked to take sides' }),
          t.jsx('li', { children: 'Having age-appropriate concerns, not adult worries' }),
        ],
      }),
      t.jsxs('div', {
        className: 'bg-red-50 border border-red-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-red-800 mb-4',
            children: 'Roles Children Should Never Have',
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'The Messenger',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: '"Tell your dad he needs to pay me back for the school trip."',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', { className: 'font-medium text-gray-900 mb-2', children: 'The Spy' }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"What did Mom say about me?" "Who was at Dad's house?"`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'The Confidant',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"Your father is so difficult. You're the only one who understands."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-white rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-gray-900 mb-2',
                    children: 'The Caretaker',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 text-sm',
                    children: `"Are you okay, Mom?" (worrying about parent's emotional state)`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "What Children Don't Need (But Parents Often Think They Do)" }),
      t.jsx('h3', { children: "They Don't Need Parents Who Are Friends" }),
      t.jsx('p', {
        children:
          'Friendly co-parenting is wonderful when possible. But children can thrive with parents who communicate minimally, businesslike, even coldly—as long as the children themselves are kept out of it.',
      }),
      t.jsx('p', {
        children:
          "What matters isn't the warmth between parents; it's the absence of active conflict that children witness or feel caught between.",
      }),
      t.jsx('h3', { children: `They Don't Need to Understand "What Really Happened"` }),
      t.jsx('p', {
        children: `It's tempting to want children to know "the truth" about the other parent, especially when you feel wronged. But children don't benefit from adult information. They benefit from being allowed to form their own relationships with each parent.`,
      }),
      t.jsx('p', {
        children:
          "Your version of events may be completely accurate. It still doesn't help your child to hear it.",
      }),
      t.jsx('h3', { children: "They Don't Need Equal Everything" }),
      t.jsx('p', {
        children:
          "Fair doesn't always mean equal. Children need quality time with each parent more than perfectly balanced schedules. They need homes that feel like home more than identical rules.",
      }),
      t.jsx('p', {
        children:
          'Focus on what happens during your time with them, not on matching what happens elsewhere.',
      }),
      t.jsx('h2', { children: 'The One Thing You Can Do Today' }),
      t.jsx('p', {
        children:
          'If you take nothing else from this article, take this: examine your interactions for any way—however small—that your children might be feeling the weight of adult conflict.',
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'A Self-Check',
          }),
          t.jsx('p', { className: 'text-gray-600 mb-4', children: 'Ask yourself honestly:' }),
          t.jsxs('ul', {
            className: 'space-y-3 text-gray-700',
            children: [
              t.jsxs('li', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-gray-400', children: '○' }),
                  t.jsx('span', {
                    children:
                      'Have I said anything negative about their other parent in front of them recently?',
                  }),
                ],
              }),
              t.jsxs('li', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-gray-400', children: '○' }),
                  t.jsx('span', {
                    children:
                      'Do I ask questions about the other household that are really about my conflict, not their wellbeing?',
                  }),
                ],
              }),
              t.jsxs('li', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-gray-400', children: '○' }),
                  t.jsx('span', {
                    children:
                      'Could they feel my tension or anxiety around handoffs or communication?',
                  }),
                ],
              }),
              t.jsxs('li', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-gray-400', children: '○' }),
                  t.jsx('span', {
                    children: 'Have I ever used them to pass messages to the other parent?',
                  }),
                ],
              }),
              t.jsxs('li', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-gray-400', children: '○' }),
                  t.jsx('span', {
                    children:
                      "Do they know details about the conflict that children shouldn't know?",
                  }),
                ],
              }),
            ],
          }),
          t.jsx('p', {
            className: 'text-gray-600 mt-4',
            children:
              'If you answered yes to any of these, you have an immediate opportunity to protect your children better. Not by being perfect—by being more intentional.',
          }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'How LiaiZen Helps You Focus on Your Children' }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          'is designed to reduce the burden of co-parent conflict so you have more energy for what matters: your children.',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Less escalation' }),
              ' – Lower-conflict communication means less stress that children sense',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Faster resolution' }),
              ' – Disputes resolved quickly mean less time in conflict mode',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Better documentation' }),
              ' – Clear records mean fewer disputes about what was agreed',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/co-parenting-communication/emotional-regulation',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Supported regulation',
                }),
              }),
              ' ',
              '– You stay calmer, which means your children feel calmer',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The goal isn't to fix your co-parenting relationship—it's to minimize its intrusion into your children's lives and your presence with them.",
      }),
      t.jsx('h2', { children: "They're Watching and Learning" }),
      t.jsx('p', {
        children:
          "Here's what your children will remember: not whether their parents were together or apart, but how they felt in each home. Not whether mom and dad got along, but whether they felt safe, loved, and free to be children.",
      }),
      t.jsx('p', {
        children:
          "You can't control your co-parent. But you can control the home you create, the stability you provide, and the example you set.",
      }),
      t.jsx('p', { children: "That's not everything. But it's enough." }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "My co-parent doesn't shield the kids from conflict. What can I do?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Focus on your household. One home that's a conflict-free zone is better than none. Be the stable, regulated parent your children need. You can also address specific behaviors through co-parenting coordination or mediation, but ultimately you can't control what happens in the other home—only in yours.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "My child asks questions about why we're not together. What do I say?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `Age-appropriate honesty without blame works best: "Mom and Dad work better living in different houses, but we both love you." Avoid details, avoid blame, and reassure them it's not their fault and they don't have to choose sides.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'My child seems to prefer the other parent. Is that my fault?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Children's preferences fluctuate for many reasons—it doesn't necessarily reflect your parenting. Focus on being present and consistent in your time with them. Avoid competing for their affection; it puts them in an impossible position. If you're concerned about alienation, consult a family therapist.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'How do I handle it when my child repeats negative things about me that they heard at the other house?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `Stay calm. Don't defend yourself extensively or attack the other parent in response. A simple "I hear you, and I understand that's what you heard. What do you think?" can open dialogue without fueling conflict. If it's persistent, address it privately with your co-parent or through a mediator.`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Yp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'Stability vs. Stress:',
          ' ',
          t.jsx('span', {
            className: 'text-teal-600',
            children: "How Communication Shapes Your Child's Home",
          }),
        ],
      }),
      subtitle:
        'Creating a sense of safety for your children through consistent communication styles.',
      date: 'Dec 23, 2025',
      readTime: '7 min read',
    },
    f = [
      { label: 'Resources', href: '/child-centered-co-parenting' },
      { label: 'Stability vs Stress' },
    ],
    x = [
      "Children don't need to understand adult conflicts. They need to feel <strong>safe despite them</strong>.",
      'Your communication patterns create an <strong>emotional climate</strong> your children live in daily.',
      "Stability isn't the absence of problems—it's the <strong>predictability of how you handle them</strong>.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Invisible Weather in Your Home' }),
      t.jsx('p', {
        children:
          'Children are extraordinarily attuned to emotional atmosphere. They notice when you tense at the sound of a text notification. They feel the shift in energy before and after co-parent exchanges. They register the difference between a calm household and one bracing for conflict.',
      }),
      t.jsx('p', {
        children:
          'This atmospheric quality—the emotional climate of your home—is shaped significantly by how you handle co-parenting communication. Not what you say to your children about it, but how you carry it in your body and your presence.',
      }),
      t.jsx('p', {
        children: 'The good news: this climate is something you can intentionally cultivate.',
      }),
      t.jsx('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: t.jsx('p', {
          className: 'font-medium text-gray-900 m-0 italic',
          children: '"Children may not understand your words, but they always feel your weather."',
        }),
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Two Homes, Two Climates' }),
      t.jsx('p', {
        children:
          'When parents separate, children gain a unique experience: living in two distinct emotional environments. In the best cases, both feel safe and stable. In harder situations, one home becomes the refuge from the storm of the other.',
      }),
      t.jsx('p', {
        children:
          "What determines the climate of a home isn't the material circumstances—the house, the neighborhood, the toys. It's the emotional tone:",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'The Emotional Climate Spectrum',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-red-800 mb-2',
                    children: 'High-Stress Climate',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-700 text-sm space-y-1',
                    children: [
                      t.jsx('li', {
                        children: 'Parent is often visibly upset about co-parent communication',
                      }),
                      t.jsx('li', {
                        children: 'Children can sense tension around schedules and handoffs',
                      }),
                      t.jsx('li', { children: 'Conflicts are discussed where children can hear' }),
                      t.jsx('li', {
                        children:
                          'The other parent is spoken of negatively or with visible disdain',
                      }),
                      t.jsx('li', {
                        children: "Children feel they need to manage parent's emotions",
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-yellow-50 rounded-lg p-4 border border-yellow-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-yellow-800 mb-2',
                    children: 'Moderate-Stress Climate',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-700 text-sm space-y-1',
                    children: [
                      t.jsx('li', {
                        children: 'Parent tries to hide stress but children still sense it',
                      }),
                      t.jsx('li', { children: 'Occasional venting or frustrated sighs' }),
                      t.jsx('li', {
                        children: 'Tension spikes around communication but usually settles',
                      }),
                      t.jsx('li', {
                        children:
                          'Generally positive but noticeably affected by co-parent dynamics',
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                children: [
                  t.jsx('p', {
                    className: 'font-medium text-teal-800 mb-2',
                    children: 'Stable Climate',
                  }),
                  t.jsxs('ul', {
                    className: 'text-gray-700 text-sm space-y-1',
                    children: [
                      t.jsx('li', {
                        children: 'Parent manages co-parent stress away from children',
                      }),
                      t.jsx('li', { children: 'Handoffs are neutral and unremarkable' }),
                      t.jsx('li', {
                        children: "Children aren't aware of conflicts between parents",
                      }),
                      t.jsx('li', {
                        children: "Home feels calm regardless of what's happening with co-parent",
                      }),
                      t.jsx('li', { children: 'Children can focus on being children' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'How Communication Patterns Create Climate' }),
      t.jsx('p', {
        children:
          "The way you handle co-parent communication directly shapes your home's emotional climate. Consider the difference:",
      }),
      t.jsx('h3', { children: 'Scenario: A Frustrating Message Arrives' }),
      t.jsx('p', {
        children:
          "Your co-parent sends a message that annoys you while you're making dinner with your kids.",
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'grid gap-6 md:grid-cols-2',
          children: [
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'font-medium text-red-600 mb-3',
                  children: 'Climate-Damaging Response:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-700 text-sm space-y-2',
                  children: [
                    t.jsx('li', {
                      children: "You read it immediately, even though you're with the kids",
                    }),
                    t.jsx('li', { children: 'Your face changes; tension enters your body' }),
                    t.jsx('li', { children: 'You sigh heavily or make a frustrated sound' }),
                    t.jsx('li', {
                      children: 'You respond right away, typing while distracted from the kids',
                    }),
                    t.jsx('li', {
                      children: 'The exchange continues, pulling your attention away',
                    }),
                    t.jsx('li', { children: "The evening's mood is colored by the conflict" }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              children: [
                t.jsx('p', {
                  className: 'font-medium text-teal-600 mb-3',
                  children: 'Climate-Protecting Response:',
                }),
                t.jsxs('ul', {
                  className: 'text-gray-700 text-sm space-y-2',
                  children: [
                    t.jsx('li', {
                      children: 'You glance at the notification and pocket your phone',
                    }),
                    t.jsx('li', { children: 'You finish dinner, present with your children' }),
                    t.jsx('li', { children: 'After bedtime, you read and process the message' }),
                    t.jsxs('li', {
                      children: [
                        'You',
                        ' ',
                        t.jsx('a', {
                          href: '/co-parenting-communication/pause-before-reacting',
                          className:
                            'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                          children: 'respond when calm',
                        }),
                        ', crafting a',
                        ' ',
                        t.jsx('a', {
                          href: '/high-conflict-co-parenting/de-escalation-techniques',
                          className:
                            'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                          children: 'neutral message',
                        }),
                      ],
                    }),
                    t.jsx('li', { children: 'Your children experienced an uninterrupted evening' }),
                    t.jsx('li', { children: 'They never knew anything happened' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('p', {
        children: "The message was the same. Your children's experience was entirely different.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Building a Stable Home Climate' }),
      t.jsx('p', {
        children:
          "Creating stability isn't about eliminating co-parent stress—it's about creating boundaries between that stress and your children's experience.",
      }),
      t.jsx('h3', { children: '1. Create Communication Zones' }),
      t.jsx('p', {
        children:
          'Designate times and places for co-parent communication that are separate from your time with your children:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Not during family time' }),
              ' – Meals, bedtime routines, quality time together',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Not first thing in the morning' }),
              ' – Start the day grounded, not reactive',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Not right before seeing your kids' }),
              ' – Give yourself buffer time to regulate',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'When you do need to check messages around your children, treat it like a brief work interruption—neutral, contained, immediately set aside.',
      }),
      t.jsx('h3', { children: '2. Master the Neutral Handoff' }),
      t.jsx('p', {
        children:
          "Handoffs (transitions between homes) are high-stakes moments for children's sense of stability. They're watching both parents, sensing the tension or absence of it.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Handoff Best Practices',
          }),
          t.jsxs('div', {
            className: 'space-y-3',
            children: [
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', {
                    children: 'Brief, friendly, unremarkable—like dropping off at school',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', {
                    children: 'Focus on the child: "Have a great weekend with Mom/Dad!"',
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', { children: 'No logistics discussions in front of children' }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', { children: 'No lingering, no prolonged goodbye performances' }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', { children: "Same tone you'd use with a friendly acquaintance" }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The goal is for handoffs to be so unremarkable that your children barely notice them. The transition itself shouldn't be an event.",
      }),
      t.jsx('h3', { children: '3. Regulate Before You Engage' }),
      t.jsxs('p', {
        children: [
          'Your',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/emotional-regulation',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'emotional state',
          }),
          ' ',
          "during and after co-parent communication directly affects your home's climate. Before reading or responding to messages:",
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Check in with your body—are you already activated?' }),
          t.jsxs('li', {
            children: [
              'If activated,',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/pause-before-reacting',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: "wait until you're calmer",
              }),
            ],
          }),
          t.jsx('li', {
            children:
              'After difficult exchanges, take time to reset before being present with kids',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "Your children shouldn't experience the emotional residue of your co-parent conflicts.",
      }),
      t.jsx('h3', { children: '4. Create Predictable Routines' }),
      t.jsx('p', {
        children: 'Stability lives in routine. Children feel safe when they know what to expect:',
      }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Consistent bedtimes and morning routines' }),
          t.jsx('li', { children: 'Regular meal times' }),
          t.jsx('li', {
            children: 'Predictable schedules at your home (even if the other home is chaotic)',
          }),
          t.jsx('li', {
            children: 'Rituals they can count on (Sunday pancakes, Friday movie night)',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'When external circumstances are unpredictable, internal routines provide an anchor.',
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'The Ripple Effect of Your Regulation' }),
      t.jsx('p', {
        children:
          "Here's what happens in your children's nervous systems when you maintain stability:",
      }),
      t.jsx('div', {
        className: 'bg-teal-50 border border-teal-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '1',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'Their Stress System Relaxes',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "When they don't sense conflict, their cortisol levels stay stable. They can think clearly and regulate their own emotions.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '2',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'They Learn What Calm Looks Like',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "You're modeling stress management. They're internalizing that difficult situations can be handled without crisis.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '3',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'They Can Focus on Childhood',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "When they're not managing adult emotions or worrying about conflict, they can focus on school, friends, play—being kids.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', {
                  className:
                    'w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0',
                  children: '4',
                }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-bold text-gray-900 mb-1',
                      children: 'They Build Secure Attachment',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'A stable, regulated parent creates secure attachment—a foundation for healthy relationships throughout their lives.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'When Stability Is Hardest' }),
      t.jsx('p', { children: 'Some moments make stability particularly challenging:' }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'After a difficult exchange' }),
              " – You're activated and your children are present",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'During transitions' }),
              ' – The other parent is right there, potentially escalating',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'When children bring conflict home' }),
              ' – They mention something that triggers you',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'High-stress periods' }),
              ' – Court dates, schedule negotiations, financial disputes',
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "In these moments, your children need your stability most—and it's hardest to provide. That's when tools and systems become essential.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "How LiaiZen Protects Your Home's Climate" }),
      t.jsxs('p', {
        children: [
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          "was designed with a fundamental insight: the conflict between you and your co-parent ripples into your children's experience. Every point of friction reduced is peace preserved for your family.",
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', {
                children: t.jsx('a', {
                  href: '/liaizen/escalation-prevention',
                  className:
                    'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                  children: 'Escalation prevention',
                }),
              }),
              ' ',
              "– Conflicts that don't escalate don't create the prolonged stress your children sense",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Built-in pause' }),
              ' – The mediation creates space for',
              ' ',
              t.jsx('a', {
                href: '/co-parenting-communication/reaction-vs-response',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'response instead of reaction',
              }),
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Calmer communication' }),
              ' – Neutral rewrites mean less emotional residue after exchanges',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Faster resolution' }),
              ' – Logistics handled efficiently means less time in conflict mode',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Your regulation supported' }),
              " – When you're calmer, your home is calmer",
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "The technology isn't about perfecting co-parenting communication—it's about protecting your children from the effects of adult conflict.",
      }),
      t.jsx('h2', { children: "The Climate You're Building" }),
      t.jsx('p', {
        children:
          "Every day, through dozens of small choices, you're creating the emotional environment your children grow up in. Not the other parent—you. In your home, during your time, through your presence.",
      }),
      t.jsx('p', { children: 'When you:' }),
      t.jsxs('ul', {
        children: [
          t.jsx('li', { children: 'Put down your phone and stay present' }),
          t.jsxs('li', {
            children: [
              t.jsx('a', {
                href: '/co-parenting-communication/pause-before-reacting',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'Wait to respond',
              }),
              ' ',
              "until you're calm",
            ],
          }),
          t.jsx('li', { children: 'Keep adult concerns adult-sized' }),
          t.jsx('li', { children: 'Create consistency and routine' }),
          t.jsx('li', { children: "Regulate yourself so they don't have to" }),
        ],
      }),
      t.jsx('p', {
        children:
          "You're not just managing co-parenting communication. You're building the foundation of your children's sense of safety in the world.",
      }),
      t.jsx('p', {
        children:
          "That matters more than anything you could say. It's the invisible gift you give them every day.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "My children can always tell when I'm upset. How do I hide it better?",
                  }),
                  t.jsxs('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: [
                      "The goal isn't to hide emotions better—it's to actually regulate them. Children don't just read facial expressions; they sense nervous system states. Focus on genuine regulation: breathing, body movement,",
                      ' ',
                      t.jsx('a', {
                        href: '/co-parenting-communication/pause-before-reacting',
                        className:
                          'text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2',
                        children: 'time before engaging',
                      }),
                      ". When you're actually calmer, they'll feel it.",
                    ],
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'The other home is chaotic. Can my stability really make a difference?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Absolutely. Research shows that having even one stable environment is a significant protective factor for children. Your home being a refuge from chaos elsewhere is incredibly valuable. You can't control the other household, but you can make yours a consistent, calm space.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "Should I explain to my kids why I'm upset sometimes?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `It depends on their age and the situation. Acknowledging that you're having a difficult moment can model healthy emotion recognition. But detailed explanations about co-parent conflict are not appropriate. "I'm feeling a bit stressed, but it's nothing for you to worry about" is enough. Then follow through by actually handling it without them.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "I work from home and can't always avoid co-parent texts during family time. What do I do?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Create micro-boundaries. Use separate notification sounds for your co-parent so you know without looking whether it's urgent. If you must check, step away briefly to read and return without engaging until later. Practice treating co-parent texts like work emails—they can wait for the appropriate time.",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Rp() {
  const d = {
      title: t.jsxs(t.Fragment, {
        children: [
          'How to Model Healthy Communication ',
          t.jsx('span', { className: 'text-teal-600', children: 'for Your Kids' }),
        ],
      }),
      subtitle:
        "Your children are watching. Here's how to show them what healthy boundaries look like.",
      date: 'Dec 24, 2025',
      readTime: '7 min read',
    },
    f = [
      { label: 'Resources', href: '/child-centered-co-parenting' },
      { label: 'Modeling Communication' },
    ],
    x = [
      'Children learn more from watching you <strong>handle conflict</strong> than from any conversation about it.',
      'You can model healthy communication <strong>even in a high-conflict relationship</strong>.',
      "Every time you choose <strong>response over reaction</strong>, you're teaching your children a skill they'll use forever.",
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Invisible Curriculum' }),
      t.jsx('p', {
        children:
          'Your children are absorbing lessons from you constantly—not through the things you tell them, but through what you show them. The way you handle difficult conversations, manage frustration, and navigate conflict is writing a textbook in their minds about how relationships work.',
      }),
      t.jsx('p', {
        children:
          'This is both sobering and empowering. Sobering because it means every text you write, every sigh you breathe, every reaction you have is being cataloged. Empowering because it means you have an opportunity—right now, in every interaction—to teach them something better than what the conflict itself might suggest.',
      }),
      t.jsx('p', {
        children:
          'You may not be able to give them cooperative co-parents. But you can give them a model of how to handle difficult relationships with grace.',
      }),
      t.jsxs('div', {
        className: 'bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg',
        children: [
          t.jsx('p', {
            className: 'font-medium text-gray-900 m-0 italic',
            children:
              '"Children have never been very good at listening to their elders, but they have never failed to imitate them."',
          }),
          t.jsx('p', { className: 'text-sm text-gray-500 mt-2 mb-0', children: '— James Baldwin' }),
        ],
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'What Children Learn From Watching' }),
      t.jsx('p', {
        children: 'Without a single word of instruction, children learn from observation:',
      }),
      t.jsx('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'How to Handle Anger',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'When you feel angry at your co-parent, do you explode? Withdraw? Or find a way to express yourself that respects both your needs and your boundaries?',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'What Boundaries Look Like',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'Can you set limits calmly? Do you stick to them? Do you apologize for having needs? Your boundary-setting becomes their template.',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'How to Disagree',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'Does disagreement equal conflict? Or can two people disagree while remaining respectful? The pattern you model becomes their default.',
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: "What's Worth Fighting About",
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    "Do small things become big battles? Or do you pick your battles strategically? They're learning when to engage and when to let go.",
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'bg-white rounded-lg p-4 border border-gray-100',
              children: [
                t.jsx('p', {
                  className: 'font-medium text-gray-900 mb-2',
                  children: 'How to Recover',
                }),
                t.jsx('p', {
                  className: 'text-gray-600 text-sm',
                  children:
                    'After difficult interactions, can you return to baseline? Can you move on without holding grudges? This resilience is learned by watching.',
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'The Challenge: Modeling Well in a Difficult Situation' }),
      t.jsx('p', {
        children:
          "Here's the hard part: you're trying to model healthy communication while in a relationship that may be anything but healthy. Your co-parent may not be cooperating. The situation may be genuinely unfair.",
      }),
      t.jsx('p', {
        children:
          "This creates an unusual teaching opportunity. Your children will face difficult relationships in their lives—impossible bosses, frustrating family members, challenging friendships. What you model isn't how to have a perfect relationship. It's how to maintain your own integrity when the other person isn't cooperating.",
      }),
      t.jsx('p', { children: "That's actually a more valuable lesson." }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: 'Five Things You Can Model Today' }),
      t.jsx('h3', { children: '1. Pausing Before Reacting' }),
      t.jsxs('p', {
        children: [
          "When something triggers you—a text, a comment, a situation—your children learn from how you handle that moment. If they see you take a breath, put down your phone, and respond later, they're learning that",
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/reaction-vs-response',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "reaction isn't mandatory",
          }),
          '.',
        ],
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'What This Looks Like',
          }),
          t.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: 'What they see if you react:',
                  }),
                  t.jsx('div', {
                    className: 'bg-red-50 rounded-lg p-4 border border-red-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children:
                        "Your body tenses. You mutter under your breath. You start typing immediately. The rest of the evening, you're distracted and tense.",
                    }),
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'What they see if you pause:',
                  }),
                  t.jsx('div', {
                    className: 'bg-teal-50 rounded-lg p-4 border border-teal-100',
                    children: t.jsx('p', {
                      className: 'text-gray-900 text-sm',
                      children:
                        'You glance at your phone, put it away, and continue what you were doing. Later, they see you respond calmly. The evening continues normally.',
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'The',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/pause-before-reacting',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'pause',
          }),
          ' ',
          "teaches them: you don't have to react instantly. You can choose your response.",
        ],
      }),
      t.jsx('h3', { children: '2. Boundaries Without Drama' }),
      t.jsx('p', {
        children:
          "Setting boundaries doesn't require anger, justification, or long explanations. It can be simple and calm. When your children see you maintain limits without escalating, they learn that boundaries are normal, not aggressive.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'Boundary Modeling',
          }),
          t.jsxs('div', {
            className: 'space-y-4',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-red-600 mb-2',
                    children: 'Dramatic boundary-setting (teaches conflict):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-red-50 p-3 rounded border border-red-100',
                    children: `"I can't believe your father is asking this AGAIN. He knows I have plans. He always does this. Fine, tell him I said no and he needs to respect my time."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-sm font-medium text-teal-600 mb-2',
                    children: 'Calm boundary-setting (teaches healthy limits):',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-900 bg-teal-50 p-3 rounded border border-teal-100',
                    children: `(To co-parent, privately): "That time doesn't work for me. Here's what I can do instead."`,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: '3. Speaking Neutrally About Their Other Parent' }),
      t.jsx('p', {
        children:
          "Whatever you feel about your co-parent, your children need to form their own relationship with both of you. When you speak neutrally—or even positively—about their other parent, you're teaching them that people can disagree and still respect each other.",
      }),
      t.jsx('p', {
        children:
          "This doesn't mean pretending everything is fine. It means keeping adult conflict adult-sized and letting children have their own experiences.",
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-gray-900 mb-4',
            children: 'The Neutral Approach',
          }),
          t.jsxs('div', {
            className: 'space-y-3',
            children: [
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold', children: '✗' }),
                  t.jsx('span', {
                    children: `"Your dad always does this. He doesn't care about anyone but himself."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', {
                    children: `"There's been a change in plans. You'll see Dad tomorrow instead."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold', children: '✗' }),
                  t.jsx('span', {
                    children: `"I can't believe Mom signed you up for that. Did she even ask me?"`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  t.jsx('span', { className: 'text-teal-500 font-bold', children: '✓' }),
                  t.jsx('span', { children: `"I heard you're doing soccer! That sounds fun."` }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h3', { children: '4. Emotional Recovery' }),
      t.jsx('p', {
        children:
          'Children need to see that difficult emotions can be felt, processed, and moved through. If they only see you stuck in resentment or constantly triggered, they learn that emotional wounds are permanent.',
      }),
      t.jsx('p', {
        children:
          "When you model recovery—handling a difficult interaction and then returning to your baseline, enjoying your evening, being present—you teach them that setbacks don't have to derail you.",
      }),
      t.jsx('h3', { children: '5. Taking Responsibility' }),
      t.jsx('p', {
        children:
          'When you make mistakes—because you will—acknowledging them models something powerful. Children who see their parents own their mistakes learn that imperfection is normal and fixable.',
      }),
      t.jsx('p', {
        children: `"I was more short-tempered than I wanted to be earlier. That wasn't about you—I was dealing with something stressful. I'm sorry."`,
      }),
      t.jsx('p', {
        children:
          "This teaches them: adults make mistakes, apologize, and move on. That's how it's supposed to work.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "What Your Children Don't Need to See" }),
      t.jsx('p', {
        children: 'Modeling healthy communication includes knowing what to keep private:',
      }),
      t.jsxs('div', {
        className: 'bg-red-50 border border-red-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'text-lg font-bold text-red-800 mb-4',
            children: 'Keep These Private',
          }),
          t.jsxs('ul', {
            className: 'text-gray-700 space-y-2',
            children: [
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  'The content of your conflicts with their other parent',
                ],
              }),
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  'Financial disputes and child support discussions',
                ],
              }),
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  'Legal matters and court proceedings',
                ],
              }),
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  'Your emotional processing of the co-parent relationship',
                ],
              }),
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  'Text exchanges or emails with your co-parent',
                ],
              }),
              t.jsxs('li', {
                children: [
                  t.jsx('span', { className: 'text-red-500 font-bold mr-2', children: '✗' }),
                  "Your complaints about the other parent's behavior",
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "These aren't your children's burdens to carry. Process them with friends, therapists, support groups—anyone but your children.",
      }),
      t.jsx('h2', { children: 'The Long-Term Impact' }),
      t.jsx('p', {
        children: "The communication skills you model now will echo through your children's lives:",
      }),
      t.jsx('div', {
        className: 'bg-teal-50 border border-teal-200 rounded-xl p-6 my-8',
        children: t.jsxs('div', {
          className: 'space-y-4',
          children: [
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'In Their Future Relationships',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        "They'll have a template for how to disagree respectfully, set boundaries, and navigate conflict without destruction.",
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'In Their Workplaces',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Professional relationships require exactly these skills: handling difficult people, maintaining composure, communicating clearly under stress.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'In Their Own Parenting',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'How you handle this will influence how they handle their own difficult family situations someday.',
                    }),
                  ],
                }),
              ],
            }),
            t.jsxs('div', {
              className: 'flex items-start gap-4',
              children: [
                t.jsx('div', { className: 'w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0' }),
                t.jsxs('div', {
                  children: [
                    t.jsx('p', {
                      className: 'font-medium text-gray-900',
                      children: 'In Their Self-Image',
                    }),
                    t.jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children:
                        'Watching a parent handle difficulty with grace teaches them that they, too, can handle difficult things.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      t.jsx('h2', { children: 'How LiaiZen Supports Better Modeling' }),
      t.jsxs('p', {
        children: [
          "The hardest part of modeling healthy communication is doing it in real-time, when you're activated, when your nervous system is screaming at you to react.",
          ' ',
          t.jsx('a', {
            href: '/liaizen/how-ai-mediation-works',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen',
          }),
          ' ',
          'helps by:',
        ],
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Creating automatic pauses' }),
              ' – The',
              ' ',
              t.jsx('a', {
                href: '/liaizen/escalation-prevention',
                className:
                  'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                children: 'intervention',
              }),
              ' ',
              'gives you time to choose response over reaction',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Offering calm alternatives' }),
              " – When you're activated, you see what a regulated response looks like",
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Reducing overall conflict' }),
              ' – Less conflict means fewer difficult modeling moments',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsxs('strong', {
                children: [
                  'Supporting your',
                  ' ',
                  t.jsx('a', {
                    href: '/co-parenting-communication/emotional-regulation',
                    className:
                      'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
                    children: 'regulation',
                  }),
                ],
              }),
              ' ',
              "– When you're calmer, you model calmness",
            ],
          }),
        ],
      }),
      t.jsx('p', {
        children:
          "Think of it as training wheels for the communication patterns you want to model. Over time, those patterns become natural—and your children absorb them without knowing they're being taught.",
      }),
      t.jsx('hr', { className: 'my-12 border-gray-100' }),
      t.jsx('h2', { children: "You're Teaching Right Now" }),
      t.jsx('p', {
        children:
          'In every moment of co-parenting communication—every text you write, every reaction you have, every handoff you navigate—your children are learning something. You get to decide what.',
      }),
      t.jsx('p', {
        children:
          "You can't control your co-parent. You can't create a perfect situation. But you can be the person who shows your children that difficult relationships can be handled with dignity, that boundaries can be set without warfare, that disagreement doesn't have to mean destruction.",
      }),
      t.jsx('p', {
        children:
          "That's not a consolation prize. That's the real gift—one that will outlast this co-parenting relationship and shape who your children become.",
      }),
      t.jsx('p', {
        children: "You're already teaching. The only question is what the lesson will be.",
      }),
      t.jsxs('div', {
        className: 'mt-16 pt-12 border-t border-gray-100',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-2 mb-8',
            children: [
              t.jsx('div', { className: 'w-1 h-8 bg-teal-500 rounded-full' }),
              t.jsx('h3', {
                className: 'text-2xl font-bold text-gray-900',
                children: 'Frequently Asked Questions',
              }),
            ],
          }),
          t.jsxs('div', {
            className: 'grid gap-6',
            children: [
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      "My co-parent models terrible communication. Won't that cancel out what I model?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      "Children learn from contrast as well as example. Seeing two different approaches gives them perspective and choice. Research shows that having one parent who models healthy communication is protective, even when the other doesn't. You can't control what they learn elsewhere, but your modeling still matters.",
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: "What if I've already modeled badly? Have I damaged them?",
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `Children are resilient, and patterns can change. If you've modeled unhealthy communication in the past, starting to model healthier patterns now still helps. You can even acknowledge the change: "I'm working on handling things more calmly." That itself models growth and self-improvement.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children: 'Should I explicitly teach my children about healthy communication?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children: `Age-appropriate conversations can help, but modeling matters more than instruction. Children rarely learn communication skills from lectures—they learn from watching. That said, naming what you're doing ("I'm going to take a breath before I respond") can help them connect your behavior to something they can practice themselves.`,
                  }),
                ],
              }),
              t.jsxs('div', {
                className:
                  'bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200',
                children: [
                  t.jsx('h4', {
                    className: 'text-lg font-bold text-gray-900 mb-2',
                    children:
                      'How do I handle it when my kids tell me about bad behavior they witnessed at the other home?',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 leading-relaxed',
                    children:
                      'Listen without amplifying. Validate their feelings ("That sounds like it was stressful") without badmouthing the other parent ("Your dad is so terrible"). Help them process the experience without making it bigger. If there are safety concerns, address those appropriately—but most of the time, kids need empathy, not alignment against their other parent.',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Lp() {
  const d = {
      title: 'AI-Guided Co-Parenting Mediation: How It Works',
      subtitle:
        'A deep dive into how LiaiZen uses advanced AI to facilitate better co-parenting communication without the need for a human middleman.',
      date: 'Dec 12, 2025',
      readTime: '6 min read',
    },
    f = [
      { label: 'Resources', href: '/liaizen-ai-co-parenting' },
      { label: 'AI + Co-Parenting Tools' },
    ],
    x = [
      'LiaiZen acts as a <strong>real-time filter</strong>, checking messages for toxicity before they are sent.',
      'It provides <strong>neutral, conflict-free alternatives</strong> that preserve your original intent.',
      'Unlike human mediators, it is available <strong>24/7</strong> and costs a fraction of the price.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Problem with Traditional Mediation' }),
      t.jsx('p', {
        children:
          'Traditional family mediation is incredibly effective, but it has two major flaws: it’s expensive, and it requires an appointment. Conflict, however, doesn’t wait for business hours. It happens at 9 PM on a Tuesday when a pickup time is misunderstood, or on a Saturday morning when a schedule change is requested.',
      }),
      t.jsx('p', {
        children:
          'This gap—between when conflict happens and when help is available—is where most damage occurs.',
      }),
      t.jsx('h2', { children: 'Enter AI-Guided Mediation' }),
      t.jsxs('p', {
        children: [
          'LiaiZen bridges this gap by embedding mediation principles directly into your communication stream. It doesn’t tell you ',
          t.jsx('em', { children: 'what' }),
          ' to do, but it helps you say what you need to say in a way that is most likely to get a positive result.',
        ],
      }),
      t.jsxs('p', {
        children: [
          'Think of it as a spell-checker, but for ',
          t.jsx('strong', { children: 'tone and conflict' }),
          '.',
        ],
      }),
      t.jsx('h2', { children: 'How the Process Works' }),
      t.jsx('p', {
        children:
          'When you type a message to your co-parent in LiaiZen, several things happen in milliseconds:',
      }),
      t.jsxs('ul', {
        className: 'marker:text-teal-500',
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Sentiment Analysis:' }),
              ' The AI scans for accusatory language, "you" statements, and emotional intensity.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Conflict Prediction:' }),
              ' It compares your draft against patterns known to trigger high-conflict responses.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Restructuring:' }),
              ' If a message is flagged, LiaiZen suggests a rewrite. It strips away the emotional charge while keeping the factual request intact.',
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className: 'bg-gray-50 border border-gray-200 rounded-xl p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'font-bold text-gray-900 mb-4',
            children: 'Example: The Pickup Change',
          }),
          t.jsxs('div', {
            className: 'grid md:grid-cols-2 gap-6',
            children: [
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-xs font-bold text-red-500 uppercase tracking-wide mb-2',
                    children: 'Original Draft',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-600 italic',
                    children: `"You're always late. If you can't be here by 5, don't bother coming at all. I'm sick of waiting for you."`,
                  }),
                ],
              }),
              t.jsxs('div', {
                children: [
                  t.jsx('p', {
                    className: 'text-xs font-bold text-teal-600 uppercase tracking-wide mb-2',
                    children: 'LiaiZen Suggestion',
                  }),
                  t.jsx('p', {
                    className: 'text-gray-800 font-medium',
                    children:
                      '"Please let me know if you will be here by 5:00 PM. If not, we will need to reschedule for tomorrow as we have plans."',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'Preserving Boundaries, Not Just Niceties' }),
      t.jsx('p', {
        children:
          'A common misconception is that AI mediation forces you to be "nice" to someone who might be mistreating you. That is not the goal.',
      }),
      t.jsxs('p', {
        children: [
          'The goal is to be ',
          t.jsx('strong', { children: 'BIFF' }),
          ': Brief, Informative, Friendly (or Firm), and Firm.',
        ],
      }),
      t.jsx('p', {
        children: `LiaiZen helps you hold boundaries without handing your co-parent ammunition. By removing the emotional hooks (the "I'm sick of waiting" part), you deny a high-conflict co-parent the opportunity to deflect the issue back onto your behavior.`,
      }),
      t.jsx('h2', { children: 'Why It Works Better Than Willpower' }),
      t.jsx('p', {
        children:
          'Even the most patient parent has a breaking point. When you are tired, stressed, or triggered, your prefrontal cortex (the logic center) goes offline.',
      }),
      t.jsx('p', {
        children:
          "LiaiZen acts as an external prefrontal cortex. It doesn't get tired. It doesn't get triggered. It simply ensures that every message you send serves your long-term goal of peace, rather than your short-term impulse to vent.",
      }),
      t.jsx('h2', { children: 'Is It Replacing Human Lawyers?' }),
      t.jsxs('p', {
        children: [
          'No.',
          ' ',
          t.jsx('a', {
            href: '/court-safe-co-parenting-messages',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'LiaiZen generates court-ready documentation',
          }),
          ', but it does not give legal advice. It is a tool for day-to-day management, helping you avoid the kind of petty conflicts that clutter court dockets and drain bank accounts.',
        ],
      }),
    ],
  });
}
function Op() {
  const d = {
      title: 'How LiaiZen Intercepts Escalation Before It Starts',
      subtitle:
        'The technology behind identifying and neutralizing conflict triggers in real-time, helping you stop arguments before they happen.',
      date: 'Dec 13, 2025',
      readTime: '5 min read',
    },
    f = [
      { label: 'Resources', href: '/liaizen-ai-co-parenting' },
      { label: 'AI + Co-Parenting Tools' },
    ],
    x = [
      'Escalation usually follows a <strong>predictable pattern</strong> of micro-aggressions and defensive responses.',
      "LiaiZen identifies the <strong>'turn'</strong> in a conversation where it moves from productive to destructive.",
      'Breaking the loop early saves hours of emotional recovery time.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Anatomy of an Argument' }),
      t.jsx('p', {
        children:
          'Co-parenting arguments rarely explode out of nowhere. They incubate. They start with a subtle dig, a sarcastic comment, or a vague accusation.',
      }),
      t.jsx('p', {
        children:
          'Psychologists call this the "escalation ladder." Each response climbs one rung higher in intensity.',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Rung 1:' }),
              ' "Did you wash his jersey?" (Neutral question)',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Rung 2:' }),
              ' "Yeah, unlike you, I actually take care of his stuff." (Personal attack)',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Rung 3:' }),
              ` "Oh, so now you're parent of the year? Don't make me laugh." (Counter-attack)`,
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Rung 4:' }),
              ' [Full blown argument about the past 5 years]',
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'The LiaiZen Interception Point' }),
      t.jsx('p', {
        children:
          "Most people try to stop the argument at Rung 4. By then, it's too late. The physiological stress response (fight or flight) is already active.",
      }),
      t.jsxs('p', {
        children: ['LiaiZen focuses on ', t.jsx('strong', { children: 'Rung 2' }), '.'],
      }),
      t.jsxs('p', {
        children: [
          'When our AI detects that a response has shifted from ',
          t.jsx('em', { children: 'informational' }),
          ' to',
          ' ',
          t.jsx('em', { children: 'personal' }),
          ', it intervenes. It might pause the message and ask:',
          ' ',
          t.jsx('em', {
            children:
              '"This message seems to contain personal criticism. Would you like to rephrase it to focus on the logistics?"',
          }),
        ],
      }),
      t.jsx('h2', { children: 'Why Interception Matters' }),
      t.jsx('p', { children: "This isn't just about being polite. It's about efficiency." }),
      t.jsxs('p', {
        children: [
          'An escalated argument can ruin an entire weekend. It affects your mood, your sleep, and your ability to be present with your children. By catching the spark before it hits the gasoline, LiaiZen protects your ',
          t.jsx('strong', { children: 'time' }),
          ' and your ',
          t.jsx('strong', { children: 'peace' }),
          '.',
        ],
      }),
      t.jsx('div', {
        className: 'bg-teal-50 border-l-4 border-teal-500 p-6 my-8',
        children: t.jsx('p', {
          className: 'font-medium text-teal-900 m-0',
          children:
            '"Conflict requires two participants. If LiaiZen can help prevent just one person from climbing the ladder, the argument cannot exist."',
        }),
      }),
      t.jsx('h2', { children: 'Identifying Your Triggers' }),
      t.jsxs('p', {
        children: [
          'Over time, using LiaiZen teaches you to identify your own interception points. You start to notice:',
          ' ',
          t.jsx('em', {
            children: `"Ah, I'm feeling defensive right now. I should probably wait before replying."`,
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'This awareness helps you',
          ' ',
          t.jsx('a', {
            href: '/co-parenting-communication/reaction-vs-response',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: 'move from reaction to response',
          }),
          ' ',
          "naturally, even when you aren't using the app.",
        ],
      }),
      t.jsx('h2', { children: 'The Ripple Effect' }),
      t.jsx('p', {
        children:
          "When you consistently refuse to escalate, the co-parenting dynamic essentially runs out of fuel. High-conflict co-parents often feed on the reaction. When the reaction stops coming, the conflict often decreases simply because it isn't being rewarded.",
      }),
    ],
  });
}
function Hp() {
  const d = {
      title: 'How AI Helps Parents Communicate More Calmly',
      subtitle:
        'Using feedback loops to train your nervous system for calmer interactions and rewiring your brain for peace.',
      date: 'Dec 14, 2025',
      readTime: '4 min read',
    },
    f = [
      { label: 'Resources', href: '/liaizen-ai-co-parenting' },
      { label: 'AI + Co-Parenting Tools' },
    ],
    x = [
      'Calm is a skill, not just a personality trait. It can be practiced.',
      'LiaiZen provides <strong>micro-feedback</strong> that trains you to spot emotional loading in your own words.',
      'Over time, this rewires your default response to be less reactive.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Neuroscience of "Co-Regulation"' }),
      t.jsxs('p', {
        children: [
          'In a healthy relationship, people "co-regulate." If one person gets upset, the other stays calm, and eventually, both settle down. In a high-conflict co-parenting dynamic, the opposite happens: ',
          t.jsx('strong', { children: 'co-dysregulation' }),
          '.',
        ],
      }),
      t.jsx('p', {
        children:
          "One person's stress triggers the other's, creating a feedback loop of anxiety and anger.",
      }),
      t.jsxs('p', {
        children: [
          'LiaiZen acts as an ',
          t.jsx('strong', { children: 'artificial regulator' }),
          '. Because the AI never gets upset, never raises its voice, and never takes offense, it anchors the conversation in neutrality.',
        ],
      }),
      t.jsx('h2', { children: 'Training Your "Calm Muscle"' }),
      t.jsx('p', {
        children: "Every time LiaiZen suggests a rewrite, it's a micro-lesson in communication.",
      }),
      t.jsxs('p', {
        children: [
          'You type: ',
          t.jsx('em', { children: '"Stop confusing the kids with your schedule changes."' }),
          t.jsx('br', {}),
          'LiaiZen suggests:',
          ' ',
          t.jsx('em', {
            children:
              '"The frequent schedule changes seem to be confusing the children. Can we stick to the agreed calendar?"',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'The first time you see this, you might be annoyed. The tenth time, you start to see the pattern. The fiftieth time, you might just write it the calm way yourself.',
      }),
      t.jsx('h2', { children: 'Gamifying Emotional Control' }),
      t.jsx('p', {
        children:
          'It sounds trivial, but seeing a "toxicity score" drop from 85% to 10% gives your brain a dopamine hit. It turns de-escalation into a game you can win.',
      }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Validation:' }),
              ' Seeing your message marked as "Safe to Send" provides reassurance.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Control:' }),
              ' You feel in charge of the interaction, rather than a victim of it.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Mastery:' }),
              ' You realize you can handle difficult topics without losing your cool.',
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className:
          'bg-gradient-to-r from-teal-50 to-white p-6 rounded-xl border border-teal-100 my-8',
        children: [
          t.jsx('h4', { className: 'font-bold text-teal-800 mb-2', children: 'Did You Know?' }),
          t.jsxs('p', {
            className: 'text-gray-600 m-0',
            children: [
              'Studies show that it takes approximately ',
              t.jsx('strong', { children: '66 days' }),
              ' to form a new habit. Consistent use of communication tools can permanently alter how you speak to your co-parent in about two months.',
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: 'The Ultimate Benefit: Your Children' }),
      t.jsx('p', {
        children:
          "When you communicate calmly, you aren't just making your life easier. You are creating a safer environment for your children.",
      }),
      t.jsxs('p', {
        children: [
          'Children absorb the ambient stress of their parents. By lowering the temperature of your text exchanges, you are literally lowering the stress levels in your home. Learn more about',
          ' ',
          t.jsx('a', {
            href: '/child-centered-co-parenting/impact-on-children',
            className:
              'text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium',
            children: "how parental communication shapes a child's environment",
          }),
          '.',
        ],
      }),
    ],
  });
}
function _p() {
  const d = {
      title: 'Is AI Safe for Co-Parenting Communication?',
      subtitle:
        'Addressing privacy, security, and the reliability of AI in sensitive family matters. Why LiaiZen puts safety first.',
      date: 'Dec 15, 2025',
      readTime: '7 min read',
    },
    f = [
      { label: 'Resources', href: '/liaizen-ai-co-parenting' },
      { label: 'AI + Co-Parenting Tools' },
    ],
    x = [
      'Your data is <strong>encrypted and private</strong>. LiaiZen does not sell your conversations.',
      'The AI is <strong>neutral</strong>. It does not take sides in a dispute.',
      'You always have the <strong>final say</strong> on what gets sent.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The Trust Question' }),
      t.jsxs('p', {
        children: [
          "Handing over your most sensitive, stressful conversations to an algorithm is a big leap of faith. It's reasonable to ask:",
          ' ',
          t.jsx('em', {
            children: 'Is this safe? Who is reading this? Can this be used against me?',
          }),
        ],
      }),
      t.jsx('p', {
        children:
          'At LiaiZen, we built our platform with these fears in mind. Here is exactly how we handle safety.',
      }),
      t.jsx('h2', { children: '1. Privacy & Encryption' }),
      t.jsx('p', { children: "Your co-parenting messages shouldn't be fodder for ad targeting." }),
      t.jsxs('ul', {
        children: [
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Encryption:' }),
              ' All messages are encrypted in transit and at rest.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'No Ad Sales:' }),
              ' We do not sell your personal conversation data to advertisers. Our business model is subscription-based, meaning ',
              t.jsx('em', { children: 'you' }),
              ' are the customer, not the product.',
            ],
          }),
          t.jsxs('li', {
            children: [
              t.jsx('strong', { children: 'Data Ownership:' }),
              ' You own your data. You can export your communication history for legal purposes anytime.',
            ],
          }),
        ],
      }),
      t.jsx('h2', { children: '2. The "Bias" Myth' }),
      t.jsx('p', { children: 'A common worry is that the AI might "side" with one parent.' }),
      t.jsx('p', {
        children: t.jsx('em', {
          children: '"What if my ex manipulates the AI to make me look bad?"',
        }),
      }),
      t.jsxs('p', {
        children: [
          `LiaiZen's AI is trained on successful conflict resolution patterns, specifically the BIFF method (Brief, Informative, Friendly, Firm). It does not "know" who is right or wrong in your argument. It only judges the `,
          t.jsx('strong', { children: 'effectiveness' }),
          ' of the communication.',
        ],
      }),
      t.jsxs('p', {
        children: [
          'It will correct ',
          t.jsx('em', { children: 'both' }),
          ' parents equally if they use toxic language. It is a mirror, reflecting your words back to you without judgment.',
        ],
      }),
      t.jsx('h2', { children: `3. The "Human in the Loop" (That's You)` }),
      t.jsxs('p', {
        children: [
          'LiaiZen is an ',
          t.jsx('strong', { children: 'assistant' }),
          ', not an agent. It never sends a message on your behalf automatically.',
        ],
      }),
      t.jsx('p', {
        children:
          'You review every suggestion. You can edit it, ignore it, or rewrite it completely. The AI is there to offer a smarter option, but you retain full agency over your voice.',
      }),
      t.jsxs('div', {
        className: 'bg-orange-50 border-l-4 border-orange-400 p-6 my-8',
        children: [
          t.jsx('h4', {
            className: 'font-bold text-orange-900 mb-2',
            children: 'Important Legal Note',
          }),
          t.jsx('p', {
            className: 'text-orange-900/80 m-0 text-sm',
            children:
              'While LiaiZen helps create better documentation, we are not a law firm. The AI does not provide legal advice. Always consult with a family law attorney for legal strategy. However, presenting a clean, abuse-free communication log (which LiaiZen helps you create) is generally looked upon favorably by family courts.',
          }),
        ],
      }),
      t.jsx('h2', { children: '4. Reducing "Technological Abuse"' }),
      t.jsx('p', {
        children:
          'In high-conflict dynamics, technology is often used as a weapon (incessant texting, tracking, etc.).',
      }),
      t.jsxs('p', {
        children: [
          'LiaiZen actually ',
          t.jsx('strong', { children: 'reduces' }),
          ' this risk by imposing structure. Features like "Calm Mode" (which delays delivery of non-urgent messages) prevent devices from being used as tools of harassment.',
        ],
      }),
      t.jsx('h2', { children: 'Conclusion' }),
      t.jsx('p', {
        children:
          "AI isn't a replacement for human judgment, but it is a powerful shield against human fallibility. By using LiaiZen, you are adding a layer of safety and rationality to a part of your life that needs it most.",
      }),
    ],
  });
}
function Bp() {
  const d = {
      title: 'Why Co-Parents Trust LiaiZen More Than Their Own Impulse in Hard Moments',
      subtitle:
        'When the red mist descends, even the best parents make mistakes. Here is why an AI pause button is the ultimate safety net.',
      date: 'Dec 16, 2025',
      readTime: '5 min read',
    },
    f = [
      { label: 'Resources', href: '/liaizen-ai-co-parenting' },
      { label: 'AI + Co-Parenting Tools' },
    ],
    x = [
      "Impulse control is biological; stress chemicals hijack your brain's logic center.",
      'LiaiZen serves as an <strong>external regulator</strong> when your internal one fails.',
      'Trusting the app means trusting your <strong>best self</strong>, not your reactive self.',
    ];
  return t.jsxs(Be, {
    meta: d,
    breadcrumbs: f,
    keyTakeaways: x,
    children: [
      t.jsx('h2', { children: 'The "Red Mist" Phenomenon' }),
      t.jsx('p', {
        children:
          'You know the feeling. You read a text from your ex, and your heart rate spikes. Your face gets hot. You type out a furious reply. You hit send.',
      }),
      t.jsxs('p', {
        children: [
          'Thirty minutes later, the adrenaline fades, and you think:',
          ' ',
          t.jsx('em', { children: `"I shouldn't have sent that."` }),
        ],
      }),
      t.jsx('p', {
        children:
          'This is the refractory period—the time during which your brain is biologically incapable of processing new information because it is locked in a threat response.',
      }),
      t.jsx('h2', { children: "Why We Can't Always Trust Ourselves" }),
      t.jsx('p', {
        children:
          'We like to think we are rational beings. But under chronic stress—which defines most high-conflict co-parenting—we are survival beings.',
      }),
      t.jsxs('p', {
        children: [
          'Your impulse is designed to protect you ',
          t.jsx('em', { children: 'right now' }),
          " (by fighting back). It is not designed to protect your court case next month, or your child's mental health next year.",
        ],
      }),
      t.jsx('h2', { children: 'Why LiaiZen Earns Trust' }),
      t.jsxs('p', {
        children: [
          'Parents tell us they trust LiaiZen because it ',
          t.jsx('strong', { children: 'validates' }),
          ' them without',
          ' ',
          t.jsx('strong', { children: 'enabling' }),
          ' them.',
        ],
      }),
      t.jsxs('p', {
        children: [
          'When you type a furious draft, LiaiZen effectively says:',
          ' ',
          t.jsx('em', {
            children: `"I see you are upset, and you have a right to be. But saying it this way will hurt you later. Let's say it this way instead."`,
          }),
        ],
      }),
      t.jsxs('p', {
        children: [
          'It separates the ',
          t.jsx('strong', { children: 'valid emotion' }),
          ' from the ',
          t.jsx('strong', { children: 'destructive action' }),
          '.',
        ],
      }),
      t.jsx('h2', { children: 'The "Sleep On It" Feature, Instantaneously' }),
      t.jsx('p', {
        children: `Old advice says to "write the letter but don't send it." That requires immense willpower.`,
      }),
      t.jsx('p', {
        children:
          'LiaiZen automates that advice. It forces the friction that your brain needs to switch gears from "fight" to "think."',
      }),
      t.jsxs('div', {
        className:
          'bg-teal-900 text-teal-50 p-8 rounded-2xl my-8 text-center italic font-medium leading-relaxed shadow-lg',
        children: [
          `"I used to regret about 50% of the texts I sent my ex. Since using LiaiZen, I haven't regretted a single one. It saves me from myself."`,
          t.jsx('br', {}),
          t.jsx('span', {
            className: 'text-sm font-normal not-italic opacity-70 mt-4 block',
            children: '— Sarah M., Co-parent & User',
          }),
        ],
      }),
      t.jsx('h2', { children: 'Surrendering the Need for the "Last Word"' }),
      t.jsx('p', {
        children:
          'Trusting the app often means letting go of the need to win the argument. This is hard. But users quickly find that the peace they gain is worth far more than the momentary satisfaction of a snarky comeback.',
      }),
      t.jsx('p', {
        children:
          "LiaiZen proves that the real win isn't having the last word—it's having the last laugh, by living a peaceful life despite the conflict.",
      }),
    ],
  });
}
function Up() {
  return t.jsxs(qg, {
    children: [
      t.jsx(xe, { path: '/', element: t.jsx(um, {}) }),
      t.jsx(xe, {
        path: '/co-parenting-communication',
        element: t.jsx(Wl, { categoryId: 'communication' }),
      }),
      t.jsx(xe, { path: '/break-co-parenting-argument-cycle-game-theory', element: t.jsx(vm, {}) }),
      t.jsx(xe, {
        path: '/co-parenting-communication/why-arguments-repeat',
        element: t.jsx(vm, {}),
      }),
      t.jsx(xe, { path: '/co-parenting-communication/emotional-triggers', element: t.jsx(vp, {}) }),
      t.jsx(xe, {
        path: '/co-parenting-communication/emotional-regulation',
        element: t.jsx(wp, {}),
      }),
      t.jsx(xe, {
        path: '/co-parenting-communication/reaction-vs-response',
        element: t.jsx(Np, {}),
      }),
      t.jsx(xe, {
        path: '/co-parenting-communication/pause-before-reacting',
        element: t.jsx(Tp, {}),
      }),
      t.jsx(xe, {
        path: '/co-parenting-communication/defensiveness-strategies',
        element: t.jsx(Sp, {}),
      }),
      t.jsx(xe, {
        path: '/high-conflict-co-parenting',
        element: t.jsx(Wl, { categoryId: 'high-conflict' }),
      }),
      t.jsx(xe, { path: '/high-conflict/why-it-feels-impossible', element: t.jsx(kp, {}) }),
      t.jsx(xe, { path: '/high-conflict/de-escalation-techniques', element: t.jsx(Ap, {}) }),
      t.jsx(xe, { path: '/high-conflict/gaslighting-guilt-blame', element: t.jsx(Ep, {}) }),
      t.jsx(xe, { path: '/high-conflict/mental-health-protection', element: t.jsx(Cp, {}) }),
      t.jsx(xe, { path: '/high-conflict/every-conversation-fight', element: t.jsx(zp, {}) }),
      t.jsx(xe, {
        path: '/child-centered-co-parenting',
        element: t.jsx(Wl, { categoryId: 'child-centered' }),
      }),
      t.jsx(xe, { path: '/child-impact/long-term-effects', element: t.jsx(Mp, {}) }),
      t.jsx(xe, { path: '/child-impact/what-kids-need', element: t.jsx(Dp, {}) }),
      t.jsx(xe, { path: '/child-impact/stability-stress', element: t.jsx(Yp, {}) }),
      t.jsx(xe, { path: '/child-impact/modeling-communication', element: t.jsx(Rp, {}) }),
      t.jsx(xe, {
        path: '/liaizen-ai-co-parenting',
        element: t.jsx(Wl, { categoryId: 'liaizen-ai' }),
      }),
      t.jsx(xe, { path: '/liaizen/how-ai-mediation-works', element: t.jsx(Lp, {}) }),
      t.jsx(xe, { path: '/liaizen/escalation-prevention', element: t.jsx(Op, {}) }),
      t.jsx(xe, { path: '/liaizen/calm-communication-ai', element: t.jsx(Hp, {}) }),
      t.jsx(xe, { path: '/liaizen/ai-safety-for-parents', element: t.jsx(_p, {}) }),
      t.jsx(xe, { path: '/liaizen/ai-vs-impulse', element: t.jsx(Bp, {}) }),
      t.jsx(xe, { path: '*', element: t.jsx(um, {}) }),
    ],
  });
}
Jg.createRoot(document.getElementById('root')).render(
  t.jsx(Xl.StrictMode, { children: t.jsx(Ig, { children: t.jsx(Up, {}) }) })
);
