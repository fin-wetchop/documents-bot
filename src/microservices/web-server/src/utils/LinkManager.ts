import { v4 as uuid } from 'uuid';
import { defaults } from 'lodash';
import Scheduler from '../../../../shared/packages/scheduler';

class LinkManager {
    private options: LinkManager.InternalOptions;

    private scheduler: Scheduler = new Scheduler();

    private cache: Record<string, number> = {};

    constructor(options: LinkManager.Options) {
        this.options = defaults({}, options, {
            lifespan: 5 * 60e3,
        });
    }

    public register(fileId: number) {
        const id = uuid();

        this.cache[id] = fileId;

        this.scheduler.schedule(this.options.lifespan, async () => {
            delete this.cache[id];
        });

        const url = new URL('http://test');

        url.hostname = this.options.host;
        url.port = this.options.port.toString();
        url.pathname = `/file/${id}`;

        return url.toString();
    }

    public get(id: string) {
        return this.cache[id];
    }
}

namespace LinkManager {
    export interface InternalOptions {
        host: string;
        port: number;
        lifespan: number;
    }

    export interface Options {
        host: string;
        port: number;
        lifespan?: number;
    }
}

export default LinkManager;
