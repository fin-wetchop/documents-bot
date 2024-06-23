import { Markup, Scenes } from 'telegraf';
import Command from '../types/Command';
import Context from '../types/Context';
import escape from '../utils/escape';

const documentDeletingScene = new Scenes.BaseScene<Context>(
    'document-deleting',
);

documentDeletingScene.enter(async (context) => {
    context.session.documentDeleting = {};

    await context.replyWithMarkdownV2(
        "Give me an *id* of the document you're looking for\\.",
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );
});

documentDeletingScene.on('text', async (context) => {
    const { mqClient } = context;

    const documentId = parseInt(context.message.text, 10);

    const message = await context.replyWithMarkdownV2(
        `Searching for the document with id \`${documentId.toString().padStart(6, '0')}\`\\.\\.\\.`,
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );

    const document = await mqClient.send('documents.get', {
        id: documentId,
        relations: {
            tags: true,
        },
    });

    if (!document) {
        await context.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            'No documents found. Please, try another id.',
            Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
        );
    } else {
        const tags =
            `\nTags: ${document.tags?.map((tag) => `\\#${escape(tag.name)}`).join(' ')}` ??
            '';

        await context.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            `Found document:\nName: ${escape(document.name)} \\(\`${document.id.toString().padStart(6, '0')}\`\\)${tags}\n\nAre you sure you want to delete the document?`,
            {
                ...Markup.inlineKeyboard([
                    Markup.button.callback('Cancel', 'cancel'),
                    Markup.button.callback('Confirm', 'confirm'),
                ]),
                parse_mode: 'MarkdownV2',
            },
        );

        context.session.documentDeleting.document = {
            id: document.id,
        };
    }
});

documentDeletingScene.action('cancel', async (context) => {
    await context.scene.leave();

    await context.answerCbQuery('You have canceled the document editing.');
});

documentDeletingScene.action('confirm', async (context) => {
    const { mqClient } = context;
    const { document } = context.session.documentDeleting;

    await mqClient.send('documents.delete', {
        id: document.id,
    });

    await context.reply('The document was successfully deleted.');

    await context.scene.leave();

    await context.answerCbQuery('The document was successfully deleted.');
});

const command: Command = {
    name: 'delete_document',
    description: 'Delete a document',

    scenes: [documentDeletingScene],

    async handler(context) {
        await context.scene.enter('document-deleting');
    },
};

export default command;
