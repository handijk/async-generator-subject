import { EmptyAsyncGenerator } from "./empty-async-generator.ts";
import { SubjectAsyncGenerator } from "./subject-async-generator.ts";

export class ReplaySubjectAsyncGenerator<
  T,
  TReturn,
  TNext,
> extends SubjectAsyncGenerator<T, TReturn, TNext> {
  #currentValue?: T;
  #yielded = false;

  override yield(value: T): void {
    this.#currentValue = value;
    if (!this.#yielded) {
      this.#yielded = true;
    }
    return super.yield(value);
  }

  override [Symbol.asyncIterator](): AsyncGenerator<
    T,
    TReturn | undefined,
    TNext
  > {
    let nexted = false;
    return new EmptyAsyncGenerator<T, TReturn, TNext>({
      onNext: [
        (
          ...args: [TNext] | []
        ): Promise<IteratorResult<T, TReturn | undefined>> => {
          if (this.#yielded === true && !nexted) {
            return Promise.resolve({
              done: false,
              value: this.#currentValue as T,
            });
          }
          nexted = true;
          return this.next(...args);
        },
      ],
      onAsyncIterator: () => this[Symbol.asyncIterator](),
    });
  }
}
