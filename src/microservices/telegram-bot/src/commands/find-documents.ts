import { Markup, Scenes } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import Command from '../types/Command';
import Context from '../types/Context';
import string from '../../../../shared/utils/string';
import escape from '../utils/escape';
import MQClient from '../../../../shared/mq/Client';

async function renderResult(
    context: Context,
    message: Message.TextMessage,
    findOptions: MQClient.QueryData<'documents.find'>,
) {
    const { mqClient } = context;

    const findResult = await mqClient.send('documents.find', {
        ...findOptions,

        limit: 5,
    });

    context.session.documentFinding.findOptions = findOptions;
    context.session.documentFinding.currentPagination = findResult.pagination;
    context.session.documentFinding.message = message;

    if (findResult.items.length === 0) {
        await context.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            'No documents found. Please, try another name.',
        );
    } else {
        const fileLinks = await mqClient.send(
            'web-server.make-link-to-file',
            findResult.items.map((item) => item.fileId),
        );

        const isPaginated =
            (findResult.pagination.limit ?? 5) < findResult.pagination.total;

        const currentPage =
            findResult.pagination.offset / (findResult.pagination.limit ?? 5) +
            1;

        const pageCount = Math.ceil(
            findResult.pagination.total / (findResult.pagination.limit ?? 5),
        );

        const documentNames = findResult.items.map(
            (item, index) =>
                `${index + 1}\\. [${escape(item.name)}](${fileLinks[item.fileId]}) \\(\`${item.id.toString().padStart(6, '0')}\`\\)`,
        );

        await context.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            `Found documents:\n\n${documentNames.join('\n')}${isPaginated ? `\n\nPage ${currentPage} of ${pageCount}` : ''}`,
            {
                ...Markup.inlineKeyboard(
                    isPaginated
                        ? [
                              Markup.button.callback(
                                  'Previous',
                                  'previous-page',
                              ),
                              Markup.button.callback('Cancel', 'cancel'),
                              Markup.button.callback('Next', 'next-page'),
                          ]
                        : [Markup.button.callback('Cancel', 'cancel')],
                ),

                parse_mode: 'MarkdownV2',
            },
        );
    }
}

const documentFindingStartScene = new Scenes.BaseScene<Context>(
    'document-finding:start',
);

documentFindingStartScene.enter(async (context) => {
    context.session.documentFinding = {};

    await context.replyWithMarkdownV2(
        "Give me a *name* of the document you're looking for\\.",
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );
});

documentFindingStartScene.on('text', async (context) => {
    let tags: string[] | undefined = context
        .entities('hashtag')
        .map((entity) => entity.fragment.substring(1));

    if (tags.length === 0) {
        tags = undefined;
    }

    let query = context.message.text;

    if (context.message.entities) {
        const { entities } = context.message;

        const partsToRemove = entities.map((entity) => ({
            offset: entity.offset,
            length: entity.length,
        }));

        query = string.removeParts(query, partsToRemove).trim();
    }

    const message = await context.replyWithMarkdownV2(
        `Searching for documents with query "*${escape(query)}*"${tags ? ` and tags ${tags.map((tag) => `\\#${escape(tag)}`)}` : ''}\\.\\.\\.`,
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );

    const findOptions: MQClient.QueryData<'documents.find'> = {
        forUserId: context.from.id,

        query,
        tags,
    };

    await renderResult(context, message, findOptions);
});

documentFindingStartScene.action('cancel', async (context) => {
    await context.scene.leave();

    await context.answerCbQuery('You have canceled the document finding.');
});

documentFindingStartScene.action('previous-page', async (context) => {
    const { documentFinding } = context.session;

    const { currentPagination, findOptions, message } = documentFinding;

    const previousPageOffset =
        currentPagination.offset - (currentPagination.limit ?? 5);

    if (previousPageOffset < 0) {
        await context.answerCbQuery('No more pages');

        return;
    }

    await renderResult(context, message, {
        ...findOptions,

        offset: previousPageOffset,
    });

    await context.answerCbQuery();
});

documentFindingStartScene.action('next-page', async (context) => {
    const { documentFinding } = context.session;

    const { currentPagination, findOptions, message } = documentFinding;

    const nextPageOffset =
        currentPagination.offset + (currentPagination.limit ?? 5);

    if (nextPageOffset >= currentPagination.total) {
        await context.answerCbQuery('No more pages');

        return;
    }

    await renderResult(context, message, {
        ...findOptions,

        offset: nextPageOffset,
    });

    await context.answerCbQuery();
});

const command: Command = {
    name: 'find_documents',
    description: 'Find documents',

    scenes: [documentFindingStartScene],

    async handler(context) {
        await context.scene.enter('document-finding:start');
    },
};

export default command;
