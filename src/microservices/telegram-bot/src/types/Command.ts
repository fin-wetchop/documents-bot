import { Scenes } from 'telegraf';
import Promisable from '../../../../shared/types/Promisable';
import Context from './Context';

interface Command {
    name: string;
    description: string;
    scenes?: Scenes.BaseScene<Context>[];
    handler: (context: Context) => Promisable<void>;
}

declare namespace Command {}

export default Command;
