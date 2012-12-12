
var logic = require('../src/logic');

describe('logic vars', function() {

  var a = logic.lvar('a')
    , b = logic.lvar('a');

  it('should be a var', function() {
    expect(logic.islvar(a)).toBe(true);
    expect(logic.islvar(b)).toBe(true);
  });

  it('should check euality', function() {
    expect(a.is(b)).toBe(true);
    expect(a.is(logic.lvar('b'))).toBe(false);
  });

});

describe('append', function() {

  it('should create a copy of the array and not modify the original one', function() {
    var a = [0, 1, 2]
      , b = logic.append(a, 3);

    expect(b).toEqual([0, 1, 2, 3]);
    expect(a).not.toEqual(b);
  });

});

describe('findInPairs', function() {

  var pairs = [
      [logic.lvar('a'), 1]
    , [logic.lvar('b'), 2]
  ];

  it('should return false if not found', function() {
    expect(logic.findInPairs(logic.lvar('c'))).toBe(false);
  });

  it('should return the pair if found', function() {
    var found = logic.findInPairs(logic.lvar('a'), pairs);
    expect(found).toEqual(jasmine.any(Array));
    expect(found[0].is(logic.lvar('a'))).toBe(true);
    expect(found[1]).toEqual(1);
  });

});

describe('rhs', function() {
  it('should return the second piece of an array', function() {
    expect(logic.rhs([0, 1])).toEqual(1);
    expect(logic.rhs([0, 1, 2, 3])).toEqual(1);
  });
});

var a = logic.lvar('a')
  , b = logic.lvar('b')
  , c = logic.lvar('c')
  , d = logic.lvar('d')
  , e = logic.lvar('e')
  , f = logic.lvar('f')
  , g = logic.lvar('g')
  , h = logic.lvar('h');

var pairs = [
    [a, 1]
  , [b, 2]
  , [c, a]
  , [d, e]
  , [e, b]
  , [f, g]
  , [h, a]
];

describe('walk', function() {

  it('should return the value of the thing in the pairs if it is not a var', function() {
    expect(logic.walk(1, pairs)).toEqual(1);
    expect(logic.walk([1, 2], pairs)).toEqual([1, 2]);
  });

  it('should return the value of the key given', function() {
    expect(logic.walk(a, pairs)).toEqual(1);
    expect(logic.walk(b, pairs)).toEqual(2);
  });

  it('should walk the pairs recursively', function() {
    expect(logic.walk(c, pairs)).toEqual(1);
    expect(logic.walk(d, pairs)).toEqual(2);
  });

  it('should return itself if value not found', function() {
    expect(logic.walk(g, pairs)).toBe(g);
  });

});

describe('occursCheck', function() {

  it('checks if things exist in the current set', function() {
    expect(logic.occursCheck(g, f, pairs)).toBe(true);
    expect(logic.occursCheck(f, f, pairs)).toBe(false);
    expect(logic.occursCheck(a, h, pairs)).toBe(false);
    expect(logic.occursCheck(a, h, [[h, [1, 2, 3, a]]])).toBe(true);
  });

});

describe('extS', function() {

  it('extends the set', function() {
    expect(logic.extS(a, b, logic.empty)).toEqual([[a, b]]);
  });

  it('fails if the thing already appears', function() {
    expect(logic.extS(a, b, [[b, a]])).toBe(false);
  });

});

describe('unify', function() {

  it('extends the empty', function() {
    expect(logic.unify(a, 1, logic.empty)).toEqual([[a, 1]]);
  });

  it('returns an empty set if the values are the same', function() {
    expect(logic.unify(1, 1, logic.empty)).toEqual([]);
  });

  it('will unify key values for us', function() {
    expect(logic.unify([1, b, 3], [1, 2, 3], [])).toEqual([[b, 2]]);
  });

});

 var x = logic.lvar('x')
  , y = logic.lvar('y')
  , z = [x, y];

describe('walk_', function() {

  it('should recursively set values', function() {
    var s = logic.unify(y, 2, logic.unify(x, 1, logic.empty));
    expect(logic.walk_(z, s)).toEqual([1, 2]);
  });

});

describe('reifyS', function() {

  it('should give us "placeholder unknowns"', function() {
    var s = logic.unify(x, "ten", logic.empty);
    expect(logic.reifyS(z, s)).toEqual([
        [x, 'ten']
      , [y, logic.lvar("_.1")]
    ]);
  });

});
