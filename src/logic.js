
var _ = require('underscore')
  , empty = [];

function LogicVar(n) {
  this.name = n;
}

LogicVar.prototype = {
    is: function(n) {
      return this.name === n.name;
    }
  , toString: function() {
      return this.name;
    }
};

function lvar(n) {
  return new LogicVar(n);
}

function islvar(n) {
  return n instanceof LogicVar;
}

function append(to, value) {
  var n = to.slice();
  n.push(value);
  return n;
}

function findInPairs(key, pairs) {
  return _.reduce(pairs, function(a, b) { return b[0].is(key) ? b : a }, false);
}

function rhs(pairs) {
  return pairs[1];
}

function walk(v, s) {
  var a;
  if (!islvar(v)) return v;
  a = findInPairs(v, s);
  return !!a.length ? walk(rhs(a), s) : v;
}

function extSNoCheck(x, v, s) {
  return append(s, [x, v]);
}

function occursCheck(x, v, s) {
  v = walk(v, s);
  if (islvar(v)) return v.is(x)
  if (_.isArray(v)) return occursCheck(x, _.first(v), s) || occursCheck(x, _.rest(v), s);
  return false;
}

function extS(x, v, s) {
  return occursCheck(x, v, s) ? false : extSNoCheck(x, v, s);
}

function nonEmptyArr(s) {
  return _.isArray(s) && !!s.length;
}

function unify(u, v, s) {
  u = walk(u, s);
  v = walk(v, s);
  if (u === v) return s;
  if (islvar(u)) return islvar(v) ? extSNoCheck(u, v, s) : extS(u, v, s);
  if (islvar(v)) return extS(v, u, s);
  if (nonEmptyArr(u) && nonEmptyArr(v)) {
    s = unify(_.first(u), _.first(v), s);
    return !_.isArray(s) ? false : unify(_.rest(u), _.rest(v), s);
  }
  return _.isEqual(u, v) ? s : false;
}

function reify(v, s) {
  v = walk_(v, s);
  return walk_(v, reifyS(v, empty));
}

function walk_(v, s) {
  v = walk(v, s);
  if (islvar(v)) return v;
  if (nonEmptyArr(v)) return [walk_(_.first(v), s)].concat(walk_(_.rest(v), s));
  return v;
}

function reifyS(v, s) {
  v = walk(v, s);
  if (islvar(v)) return extS(v, reifyName(s.length), s);
  if (nonEmptyArr(v)) return reifyS(_.rest(v), reifyS(_.first(v), s));
  return s;
}

function reifyName(n) {
  return new LogicVar("_." + n);
}

function delay(f) {
  return function() {
    return f;
  };
}

function eq(val1, val2) {
  return function(s) {
    console.log('val1: ', val1)
    console.log('val2: ', val2)
    return unify(val1, val2, s);
  }
}

function either() {
  var goals = [].slice.call(arguments, 0);

  return function(s) {
    var r = goals.length
      ? delay(function() {
          return [
              _.first(goals)(s)
            , delay(function() { return either.apply(null, _.rest(goals)); })
          ];
        })
      : delay(mzero);

    console.log('end of either', r());
    return r;
    // if (!goals.length) return empty;
    //  var r = [_.first(goals)(s), delay(function() { return either.apply(null, _.rest(goals))})]
    //  console.log('heererere', r);
    //  return r;
    // // var r =  goals.map(function(a) {
    // //   // console.log('goal:', a)
    // //   return a(s)
    // // })
    // // // console.log('either goals: ', r)
    // // r = [].concat.apply([], r);
    // // return [].concat.apply([], r)
    // // re
  }
}

function mzero() {
  return false;
}

function choice(a, b) {
  return [a, b];
}

function ccase(thing, actions) {

  var action, args = [];
  if (!!thing.length || !thing) {
    action = '_';
  } else if (_.isFunction(thing)) {
    action = 'f_';
    args = [thing];
  } else if (nonEmptyArr(thing) && _.isFunction(thing[1])) {
    action = 'a_f';
    args = thing;
  } else {
    action = 'a';
    args = [thing];
  }

  return actions[action].apply(null, args);
}

function bind(thing, goal) {
  return ccase(thing, {
      _: mzero
    , f_: function(f_) {
        return function() {
          bind((f_), goal)
        }
      }
    , a: function(a) {
        return goal(a)
      }
    , a_f: function(a, f) {
        return mplus(goal(a), function() {
          return bind((f), g);
        });
      }
  });
}

function bindLazy(e) {
  var args = slice(arguments, 1);
  if (!args.length) return e;
  args[0] = bind(e, args[0]);
  return bindLazy.apply(null, args);
}

function mplus(thing, f) {
  return ccase(thing, {
      _: function() {
        return f();
      }
    , f_: function(f_) {
        return function() {
          return mplus(f(), f_);
        };
      }
    , a: function(a) {
        return choice(a, f);
      }
    , a_f: function(a, f_) {
        return choice(a, function() {
          return mplus(f(), f_);
        });
      }
  });
}

function mplusLazy(thing) {
  var rest = slice(arguments, 1);
  return rest.length
    ? mplus(thing, function() { return mplusLazy.apply(null, rest); })
    : thing;
}

function fresh(vars) {
  var fs = slice(arguments, 1);

  return function(a) {
    delay(function() {

    })
  }
}

function run(v /*, ... goals */) {

  v = islvar(v) ? v : lvar(v);

  var goals = slice(arguments, 1);



  var s = empty
    , re = []
  for (var i = 0; i < goals.length; i++) {
    s = goals[i](s);
    re.push(reify(v, s))
  }
  console.log('finishing:', s)
  return re
}


// console.log(eq(lvar('q'), 1)(empty))

// var q = lvar('q');

// console.log(run(q, eq(q, 1)));

// console.log(
//   run(q
//     ,either(
//       eq(q, 1),
//       eq(q, 2)
//     ))
// )

// console.log(mplus(false, function() {
//   return 'a';
// }));

function slice(a, n) {
  n = n || 0;
  return [].slice.call(a, n);
}



exports.empty = empty;
exports.lvar = lvar;
exports.islvar = islvar;
exports.append = append;
exports.findInPairs = findInPairs;
exports.rhs = rhs;
exports.walk = walk;
exports.occursCheck = occursCheck;
exports.extS = extS;
exports.unify = unify;
exports.walk_ = walk_;
exports.reifyS = reifyS;
// exports.eq = eq;
// exports.delay
