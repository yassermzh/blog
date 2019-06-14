const { interval, of, range, Subject } = Rx;
const { map, mapTo, tap, filter, startWith, distinctUntilChanged, delay, merge, scan } = RxOperators;

const identity = x => x
const random = () => Math.random() > 0.3
const delayWith = (id) => Math.random() * id * 1000

function multicast(source) {
  const subject = new Subject();
  source.subscribe(subject);
  return subject;
}

const g = (source, id) =>
  source
   .pipe(map(random))
   .pipe(delay(delayWith(id)))
   .pipe(distinctUntilChanged())
   .pipe(filter(identity), mapTo(id))

const source = interval(1000)
const buttons = [multicast(g(source, 1)), multicast(g(source, 2))]

const s1 = buttons[0].pipe(merge(buttons[1]))
const s2 = s1.pipe(scan((acc, id) => {
  return { ...acc, [id]: !acc[id] }
}, {}))
const s3 = s2.pipe(map(x=> Object.keys(x).filter(k=>x[k])))

const signals = [buttons[0], buttons[1], s3]

range(0, signals.length).pipe(map(i => signals[i]))
