import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { ReplaySubjectAsyncGenerator } from "./replay-subject-async-generator.ts";

describe("replay-subject-async-generator", () => {
  it("creates new async iterators that all get the already yielded value", async () => {
    const og = new ReplaySubjectAsyncGenerator();
    const g1 = og[Symbol.asyncIterator]();
    const promise1 = g1.next();
    og.yield(16);
    expect(await promise1).toStrictEqual({ done: false, value: 16 });
    const g2 = og[Symbol.asyncIterator]();
    const promise2 = g2.next();
    expect(await promise2).toStrictEqual({ done: false, value: 16 });
    const g3 = g2[Symbol.asyncIterator]();
    const promise3 = g3.next();
    expect(await promise3).toStrictEqual({ done: false, value: 16 });
  });
});
