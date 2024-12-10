import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { SubjectAsyncGenerator } from "./subject-async-generator.ts";

describe("subject-async-generator", () => {
  it("the generator to lose a yielded value if no one is listening", async () => {
    const generator: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();
    generator.yield(13);
    const promise = generator.next();
    generator.yield(28);
    expect(await promise).toStrictEqual({ done: false, value: 28 });
  });

  it("the generator to be async disposable", async () => {
    const generator: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();
    await generator[Symbol.asyncDispose]();
    const promise = generator.next();
    generator.yield(13);
    expect(await promise).toStrictEqual({ done: true, value: undefined });
  });

  it("the generator to yield like a GeneratorFunction that returns", async () => {
    const spyA = spy();
    const spyB = spy();
    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
        if (i > 5) {
          return;
        }
      }
    }
    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const generatorB: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();

    const nextPromiseA1 = generatorA.next();
    const nextPromiseB1 = generatorB.next();
    generatorB.yield(0);
    expect(await nextPromiseA1).toStrictEqual({ done: false, value: 0 });
    expect(await nextPromiseB1).toStrictEqual(await nextPromiseA1);

    const nextPromiseA2 = generatorA.next();
    const nextPromiseB2 = generatorB.next();
    generatorB.yield(1);
    expect(await nextPromiseA2).toStrictEqual({ done: false, value: 1 });
    expect(await nextPromiseB2).toStrictEqual(await nextPromiseA2);

    const generatorC = (async function* () {
      for await (const i of generatorB) {
        spyB(i);
        yield i;
      }
    })();

    let promiseC;

    promiseC = generatorC.next();
    generatorB.yield(2);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(3);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(4);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(5);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.return();

    await expect(promiseC).resolves.toStrictEqual({
      done: true,
      value: undefined,
    });

    for await (const i of generatorA) {
      spyA(i);
    }

    assertSpyCalls(spyA, 4);
    assertSpyCalls(spyB, 4);
  });

  it("the generator to yield like a GeneratorFunction that throws", async () => {
    const error1 = new Error("error1");
    const spyA = spy();
    const spyB = spy();
    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
        if (i > 5) {
          throw error1;
        }
      }
    }

    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const generatorB: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();

    const nextPromiseA1 = generatorA.next();
    const nextPromiseB1 = generatorB.next();
    generatorB.yield(0);
    expect(await nextPromiseA1).toStrictEqual({ done: false, value: 0 });
    expect(await nextPromiseB1).toStrictEqual(await nextPromiseA1);

    const nextPromiseA2 = generatorA.next();
    const nextPromiseB2 = generatorB.next();
    generatorB.yield(1);
    expect(await nextPromiseA2).toStrictEqual({ done: false, value: 1 });
    expect(await nextPromiseB2).toStrictEqual(await nextPromiseA2);

    const generatorC = (async function* () {
      for await (const i of generatorB) {
        spyB(i);
        yield i;
      }
    })();

    let promiseC;

    promiseC = generatorC.next();
    generatorB.yield(2);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(3);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(4);
    await promiseC;
    promiseC = generatorC.next();
    generatorB.yield(5);
    await promiseC;
    await Promise.all([
      expect(generatorC.next()).rejects.toStrictEqual(error1),
      expect(generatorB.throw(error1)).rejects.toStrictEqual(error1),
    ]);

    const promiseA = (async () => {
      for await (const i of generatorA) {
        spyA(i);
      }
    })();

    await expect(promiseA).rejects.toStrictEqual(error1);

    assertSpyCalls(spyA, 4);
    assertSpyCalls(spyA, 4);
  });
  it("waits for values to be pushed and then returns", async () => {
    const returnValue = Symbol("returnValue");
    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
      }
    }

    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const pusher: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();
    const generatorB = pusher[Symbol.asyncIterator]();
    const generatorC = pusher[Symbol.asyncIterator]();
    const generatorD = generatorB[Symbol.asyncIterator]();

    const nextPromiseA1 = generatorA.next();
    const nextPromiseB1 = generatorB.next();
    const nextPromiseC1 = generatorC.next();
    const nextPromiseD1 = generatorD.next();
    const pusherPromise1 = pusher.next();

    pusher.yield(0);

    expect(await pusherPromise1).toStrictEqual({ done: false, value: 0 });
    expect(await nextPromiseA1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseB1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseC1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseD1).toStrictEqual(await pusherPromise1);

    const nextPromiseA2 = generatorA.next();
    const nextPromiseB2 = generatorB.next();
    const nextPromiseC2 = generatorC.next();
    const nextPromiseD2 = generatorD.next();
    const pusherPromise2 = pusher.next();

    pusher.yield(1);

    expect(await pusherPromise2).toStrictEqual({ done: false, value: 1 });
    expect(await nextPromiseA2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseB2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseC2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseD2).toStrictEqual(await pusherPromise2);

    const returnPromiseA1 = generatorA.return(returnValue);
    const returnPromiseB1 = generatorB.return(returnValue);
    const returnPromiseC1 = generatorC.return(returnValue);
    const returnPromiseD1 = generatorD.return(returnValue);
    const pusherPromise3 = pusher.return(returnValue);

    expect(await returnPromiseA1).toStrictEqual({
      done: true,
      value: returnValue,
    });
    expect(await returnPromiseB1).toStrictEqual(await returnPromiseA1);
    expect(await returnPromiseC1).toStrictEqual(await returnPromiseA1);
    expect(await returnPromiseD1).toStrictEqual(await returnPromiseA1);
    expect(await pusherPromise3).toStrictEqual(await returnPromiseA1);

    const returnPromiseA2 = generatorA.return();
    const returnPromiseB2 = generatorB.return();
    const returnPromiseC2 = generatorC.return();
    const returnPromiseD2 = generatorD.return();
    const pusherPromise4 = pusher.return();

    expect(await returnPromiseA2).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await returnPromiseB2).toStrictEqual(await returnPromiseA2);
    expect(await returnPromiseC2).toStrictEqual(await returnPromiseA2);
    expect(await returnPromiseD2).toStrictEqual(await returnPromiseA2);
    expect(await pusherPromise4).toStrictEqual(await returnPromiseA2);

    const nextPromiseA3 = generatorA.next();
    const nextPromiseB3 = generatorB.next();
    const nextPromiseC3 = generatorC.next();
    const nextPromiseD3 = generatorD.next();
    const pusherPromise5 = pusher.next();

    expect(await pusherPromise5).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await nextPromiseA3).toStrictEqual(await pusherPromise4);
    expect(await nextPromiseB3).toStrictEqual(await pusherPromise4);
    expect(await nextPromiseC3).toStrictEqual(await pusherPromise4);
    expect(await nextPromiseD3).toStrictEqual(await pusherPromise4);
  });

  it("waits for values to be pushed and then throws", async () => {
    const error1 = new Error("error1");
    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
      }
    }

    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const pusher: SubjectAsyncGenerator<number, symbol | void> =
      new SubjectAsyncGenerator<number, symbol | void>();
    const generatorB = pusher[Symbol.asyncIterator]();
    const generatorC = pusher[Symbol.asyncIterator]();
    const generatorD = generatorB[Symbol.asyncIterator]();

    const nextPromiseA1 = generatorA.next();
    const nextPromiseB1 = generatorB.next();
    const nextPromiseC1 = generatorC.next();
    const nextPromiseD1 = generatorD.next();
    const pusherPromise1 = pusher.next();
    pusher.yield(0);
    expect(await pusherPromise1).toStrictEqual({ done: false, value: 0 });
    expect(await nextPromiseA1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseB1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseC1).toStrictEqual(await pusherPromise1);
    expect(await nextPromiseD1).toStrictEqual(await pusherPromise1);

    const nextPromiseA2 = generatorA.next();
    const nextPromiseB2 = generatorB.next();
    const nextPromiseC2 = generatorC.next();
    const nextPromiseD2 = generatorD.next();
    const pusherPromise2 = pusher.next();
    pusher.yield(1);
    expect(await pusherPromise2).toStrictEqual({ done: false, value: 1 });
    expect(await nextPromiseA2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseB2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseC2).toStrictEqual(await pusherPromise2);
    expect(await nextPromiseD2).toStrictEqual(await pusherPromise2);

    const pusherPromise3 = pusher.next();
    await expect(generatorA.throw(error1)).rejects.toStrictEqual(error1);
    await expect(generatorB.throw(error1)).rejects.toStrictEqual(error1);
    await expect(generatorC.throw(error1)).rejects.toStrictEqual(error1);
    await expect(generatorD.throw(error1)).rejects.toStrictEqual(error1);
    await expect(pusher.throw(error1)).rejects.toStrictEqual(error1);
    await expect(pusherPromise3).rejects.toStrictEqual(error1);

    const returnPromiseA2 = generatorA.return();
    const returnPromiseB2 = generatorB.return();
    const returnPromiseC2 = generatorC.return();
    const returnPromiseD2 = generatorD.return();
    const returnPromiseE2 = pusher.return();

    expect(await returnPromiseA2).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await returnPromiseB2).toStrictEqual(await returnPromiseA2);
    expect(await returnPromiseC2).toStrictEqual(await returnPromiseA2);
    expect(await returnPromiseD2).toStrictEqual(await returnPromiseA2);
    expect(await returnPromiseE2).toStrictEqual(await returnPromiseA2);

    const nextPromiseA3 = generatorA.next();
    const nextPromiseB3 = generatorB.next();
    const nextPromiseC3 = generatorB.next();
    const nextPromiseD3 = generatorB.next();
    const pusherPromise4 = pusher.next();
    expect(await pusherPromise4).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await nextPromiseA3).toStrictEqual(await pusherPromise4);
    expect(await nextPromiseB3).toStrictEqual(await nextPromiseA3);
    expect(await nextPromiseC3).toStrictEqual(await nextPromiseA3);
    expect(await nextPromiseD3).toStrictEqual(await nextPromiseA3);
  });
});
