import { sortedIndexBy } from 'lodash';

class Scheduler {
    private queue: Scheduler.Task[] = [];

    public schedule(timeOffset: number, handler: () => Promise<void>) {
        this.scheduleAt(Date.now() + timeOffset, handler);
    }

    public scheduleAt(time: number, handler: () => Promise<void>) {
        const task: Scheduler.Task = {
            time,
            handler,
        };

        this.queue.splice(sortedIndexBy(this.queue, task, 'time'), 0, task);

        this.run();
    }

    private run() {
        if (!this.queue.length) {
            return;
        }

        let task = this.queue[0];

        while (task.time <= Date.now()) {
            this.queue.shift();

            task.handler();

            if (!this.queue.length) {
                return;
            }

            [task] = this.queue;
        }

        setTimeout(() => this.run(), this.queue[0].time - Date.now());
    }
}

namespace Scheduler {
    export interface Task {
        time: number;
        handler: () => Promise<void>;
    }
}

export default Scheduler;
