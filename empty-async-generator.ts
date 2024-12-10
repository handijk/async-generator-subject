export type OnNextFn<T, TReturn, TNext> = (
  ...args: [] | [TNext]
) => Promise<IteratorResult<T, TReturn | undefined>>;
export type OnAsyncIteratorFn<T, TReturn, TNext> = () => AsyncGenerator<
  T,
  TReturn | undefined,
  TNext
>;

export interface EmptyAsyncGeneratorProps<T, TReturn, TNext> {
  onNext?: OnNextFn<T, TReturn, TNext>[];
  onAsyncIterator?: OnAsyncIteratorFn<T, TReturn, TNext>;
}

export class EmptyAsyncGenerator<
  T = unknown,
  TReturn = unknown,
  TNext = unknown
> implements AsyncGenerator<T, TReturn | undefined, TNext>
{
  #closed = false;
  #onNext: OnNextFn<T, TReturn, TNext>[];
  #onAsyncIterator: OnAsyncIteratorFn<T, TReturn, TNext>;

  constructor({
    onNext = [],
    onAsyncIterator = () => this,
  }: EmptyAsyncGeneratorProps<T, TReturn, TNext> = {}) {
    this.#onNext = onNext;
    this.#onAsyncIterator = onAsyncIterator;
  }

  next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn | undefined>> {
    if (this.#closed) {
      return Promise.resolve({ value: undefined, done: true });
    }
    return Promise.race([...this.#onNext.map((fn) => fn(...args))]);
  }

  return(
    value: TReturn | undefined
  ): Promise<IteratorResult<T, TReturn | undefined>> {
    this.#closed = true;
    return Promise.resolve({ value, done: true });
  }

  throw(error: unknown): Promise<IteratorResult<T, TReturn | undefined>> {
    this.#closed = true;
    return Promise.reject(error);
  }

  async [Symbol.asyncDispose]() {}

  [Symbol.asyncIterator](): AsyncGenerator<T, TReturn | undefined, TNext> {
    return this.#onAsyncIterator();
  }
}
