import { ECommands, IAcknowledgement } from "./client-types.ts";
import { getLogger } from "./get-logger.ts";

export class Commander {
  private name: string;
  private worker: Worker;
  private static readonly WAIT_DURATION = 5000;
  private logger = getLogger("🦄", "commander", {
    head: "color: cadetblue",
    highlight: "color: blue",
    error: "color: red",
  });

  constructor(name: string) {
    this.name = name;
    this.worker = new Worker(import.meta.resolve("./client.ts"), {
      type: "module",
      name: `client-mock-${this.name}`,
    });
  }

  postThenReceive(
    command: ECommands,
    wait = Commander.WAIT_DURATION,
  ): Promise<IAcknowledgement> {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ command });
      const timeoutHandle = setTimeout(() => {
        this.logger.info("time out");
        return reject("timed out!");
      }, wait);
      this.worker.onmessage = (evt: { data: IAcknowledgement }) => {
        this.logger.data("message received in main", evt.data);
        clearTimeout(timeoutHandle);
        resolve(evt.data);
      };
    });
  }

  postAndForget(
    command: ECommands,
  ) {
    return this.worker.postMessage({ command });
  }
}

// Testing commander
// const commander = new Commander("commander");

// await commander.postThenReceive(ECommands.setup);
// await commander.postThenReceive(ECommands.logon);
// await commander.postThenReceive(ECommands.send);
// await commander.postThenReceive(ECommands.logout);
// commander.postAndForget(ECommands.close);
