import { Scenes, Context as TelegrafContext } from 'telegraf';
import MQClient from '../../../../shared/mq/Client';
import Logger from '../../../../shared/utils/logger';
import Minio from '../../../../shared/minio';
import ORM from '../../../../shared/orm';

interface Context extends TelegrafContext {
    session: Scenes.WizardSession & Record<string, any>;
    scene: Scenes.SceneContextScene<Context, Scenes.WizardSessionData>;
    wizard: Scenes.WizardContextWizard<Context>;

    logger: Logger;
    mqClient: MQClient;
    orm: ORM;
    minio: Minio;
}

export default Context;
