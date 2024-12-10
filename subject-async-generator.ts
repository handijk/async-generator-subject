import { EmptyAsyncGenerator } from "./empty-async-generator.ts";

type ResolveFunction<T, TReturn> = (
  value: IteratorResult<T, TReturn> | PromiseLike<IteratorResult<T, TReturn>>,
) => void;

export class SubjectAsyncGenerator<
  T = unknown,
  TReturn = unknown,
  TNext = unknown,
> extends EmptyAsyncGenerator<T, TReturn, TNext> {
  #resolve: ResolveFunction<T, TReturn | undefined> | undefined;
  #reject: ((error: unknown) => void) | undefined;
  #promise: Promise<IteratorResult<T, TReturn | undefined>> | undefined;

  #setPromise() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }

  yield(value: T) {
    if (!this.#promise) {
      return;
    }
    this.#resolve && this.#resolve({ value, done: false });
    this.#promise = undefined;
  }

  override next(
    ...args: [] | [TNext]
  ): Promise<IteratorResult<T, TReturn | undefined>> {
    if (!this.#promise) {
      this.#setPromise();
    }
    return Promise.race([
      super.next(...args),
      this.#promise as Promise<IteratorResult<T, TReturn | undefined>>,
    ]);
  }

  override return(
    value: TReturn | undefined,
  ): Promise<IteratorResult<T, TReturn | undefined>> {
    this.#resolve && this.#resolve({ value, done: true });
    return super.return(value);
  }

  override throw(
    error: unknown,
  ): Promise<IteratorResult<T, TReturn | undefined>> {
    this.#reject && this.#reject(error);
    return super.throw(error);
  }

  override async [Symbol.asyncDispose]() {
    await this.return(undefined);
  }

  override [Symbol.asyncIterator](): AsyncGenerator<
    T,
    TReturn | undefined,
    TNext
  > {
    return new EmptyAsyncGenerator({
      onNext: [(...args: [] | [TNext]) => this.next(...args)],
      onAsyncIterator: () => this[Symbol.asyncIterator](),
    });
  }
}
