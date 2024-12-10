import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { EmptyAsyncGenerator } from "./empty-async-generator.ts";

describe("empty-async-generator", () => {
  it("the generator to return like a GeneratorFunction", async () => {
    const returnValue = Symbol("returnValue");
    const spyA = spy();
    const spyB = spy();

    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
      }
    }

    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const generatorB: AsyncGenerator<number, symbol | void> =
      new EmptyAsyncGenerator<number, symbol | void>();

    const returnPromiseA1 = generatorA.return(returnValue);
    const returnPromiseC1 = generatorB.return(returnValue);

    expect(await returnPromiseA1).toStrictEqual({
      done: true,
      value: returnValue,
    });
    expect(await returnPromiseC1).toStrictEqual(await returnPromiseA1);

    const returnPromiseA2 = generatorA.return();
    const returnPromiseC2 = generatorB.return();

    expect(await returnPromiseA2).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await returnPromiseC2).toStrictEqual(await returnPromiseA2);

    const nextPromiseA3 = generatorA.next();
    const pusherPromise3 = generatorB.next(2);
    expect(await pusherPromise3).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await nextPromiseA3).toStrictEqual(await pusherPromise3);

    for await (const result of generatorA) {
      spyA(result);
    }

    assertSpyCalls(spyA, 0);

    for await (const result of generatorB) {
      spyB(result);
    }

    assertSpyCalls(spyB, 0);
  });

  it("the generator to throw like a GeneratorFunction", async () => {
    const error1 = new Error("error1");
    const spyA = spy();
    const spyB = spy();
    async function* generatorFn() {
      let i = 0;
      while (true) {
        yield i++;
      }
    }

    const generatorA: AsyncGenerator<number, symbol | void> = generatorFn();
    const generatorB: AsyncGenerator<number, symbol | void> =
      new EmptyAsyncGenerator<number, symbol | void>();

    await expect(generatorA.throw(error1)).rejects.toStrictEqual(error1);
    await expect(generatorB.throw(error1)).rejects.toStrictEqual(error1);

    const returnPromiseA2 = generatorA.return();
    const returnPromiseC2 = generatorB.return();

    expect(await returnPromiseA2).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await returnPromiseC2).toStrictEqual(await returnPromiseA2);

    const nextPromiseA3 = generatorA.next();
    const pusherPromise3 = generatorB.next(2);
    expect(await pusherPromise3).toStrictEqual({
      done: true,
      value: undefined,
    });
    expect(await nextPromiseA3).toStrictEqual(await pusherPromise3);

    for await (const result of generatorA) {
      spyA(result);
    }

    assertSpyCalls(spyA, 0);

    for await (const result of generatorB) {
      spyB(result);
    }

    assertSpyCalls(spyB, 0);
  });
});
