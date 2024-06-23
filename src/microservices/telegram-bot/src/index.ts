import { Scenes, Telegraf, session } from 'telegraf';

import { BotCommand } from 'telegraf/typings/core/types/typegram';
import config from './config';
import Logger from '../../../shared/utils/logger';
import { MQClient } from '../../../shared/mq';
import ORM from '../../../shared/orm';
import Minio from '../../../shared/minio';
import commands from './commands';
import Context from './types/Context';

(async () => {
    const logger = new Logger('telegram-bot');

    const mqClient = new MQClient({
        host: config.mq.host,
        port: config.mq.grpcPort,
    });

    const orm = new ORM({
        type: config.database.dialect,
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
    });

    await orm.start();

    const minio = new Minio({
        host: config.minio.host,
        port: config.minio.port,

        username: config.minio.username,
        password: config.minio.password,
    });

    const bot = new Telegraf<Context>(config.botToken);

    bot.use((context, next) => {
        context.logger = logger;
        context.mqClient = mqClient;
        context.orm = orm;
        context.minio = minio;

        return next();
    });

    bot.use(session());

    const commandsInfo: BotCommand[] = commands.map((command) => ({
        command: command.name,
        description: command.description,
    }));

    bot.telegram.setMyCommands(commandsInfo);

    const scenes = commands
        .map((command) => command.scenes)
        .flat()
        .filter((scene) => scene !== undefined) as Scenes.BaseScene<Context>[];

    const stage = new Scenes.Stage<Context>(scenes);

    bot.use(stage.middleware());

    bot.start((context) =>
        context.reply(
            "Hello! I'm your Document Management Assistant. I can help you efficiently manage your documents with ease.",
        ),
    );

    bot.help((context) =>
        context.replyWithMarkdownV2(
            [
                "Here's what I can do for you:",
                '',
                '*Add Documents*: Upload new documents and store them securely\\. /create\\_document',
                '*Edit Documents*: Make changes to existing documents\\. /edit\\_document',
                '*Delete Documents*: Remove documents that are no longer needed\\. /delete\\_document',
                '*Find Documents*: Quickly search and retrieve documents based on your criteria\\. /find\\_documents',
            ].join('\n'),
        ),
    );

    commands.forEach((command) => {
        bot.command(command.name, command.handler);
    });

    bot.launch(() => {
        logger.info('Telegram Bot is ready!');
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    logger.info('Telegram Bot service started!');
})();
