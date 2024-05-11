import { IAcknowledgement, IParams } from "./commands-types.ts";
import { getLogger } from "./get-logger.ts";

export class Commander<T> {
  private name: string;
  private worker: Worker;
  private static readonly WAIT_DURATION = 5000;
  private logger;

  constructor(name: string, relativePath: string) {
    this.name = name;
    this.worker = new Worker(relativePath, {
      type: "module",
      name: `client-mock-${this.name}`,
    });
    this.logger = getLogger("🦄", this.name, {
      head: "color: cadetblue",
      highlight: "color: blue",
      error: "color: red",
    });
  }

  postThenReceive(
    command: T,
    params?: IParams,
  ): Promise<IAcknowledgement> {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ command, params });
      const timeoutHandle = setTimeout(() => {
        this.logger.info("time out");
        return reject("timed out!");
      }, Commander.WAIT_DURATION);
      this.worker.onmessage = (evt: { data: IAcknowledgement }) => {
        this.logger.data("message received in main", evt.data);
        clearTimeout(timeoutHandle);
        resolve(evt.data);
      };
    });
  }

  postAndForget(
    command: T,
    params?: IParams,
  ) {
    return this.worker.postMessage({ command, params });
  }

  stop() {
    this.worker.terminate();
  }
}
