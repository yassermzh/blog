---
title: Reduce and Tail Recursion
date: '2017-05-20T12:10:13.715Z'
tags: ['rxjs', 'javascript']
---

To see how reduce function looks so similar to tail recursion implementation. Here we try to implement `sum` function given an array.

The old school way using for-loop (the imperative style):
```
const sum = arr => {
  let acc = 0;
  for (let i=0; i<arr.length; i++) {
    const x = arr[i];
    acc = acc + x;
  }
  return acc;
}
```
which involves assignments.

In the `[].reduce` way (the functional programming style):
```
const sum = arr => arr.reduce((acc, x) => acc + x, 0);
```

But how this relates to recursion:
```
const sum = arr => {
  if (arr.length == 0) return 0
  else {
    const [x, ...rest] = arr;
    return x + sum(rest);
  }
}
```
Not similar. But what if we go with tail recursion:

```
const sum = arr => {
  const helper = (acc, _arr) => {
    if (_arr.length == 0) return acc;
    else {
      const [x, ...rest] = _arr;
      return helper(acc + x, rest);
    }
  }
  return helper(0, arr);
}
```
Quite similar this time. Just need to extract the recursion part out as our own reduce function:

```
const reduce = (f, initialValue) => arr => {
  const helper = (acc, _arr) => {
    if (_arr.length == 0) return acc;
    else {
      const [x, ...rest] = _arr;
      return helper(f(acc, x), rest);
    }
  }
  return helper(initialValue, arr);
}
```

Now using above reduce, it almost the same as with `[].reduce`:

```
const sum = reduce((acc, x) => acc + x, 0)
```

