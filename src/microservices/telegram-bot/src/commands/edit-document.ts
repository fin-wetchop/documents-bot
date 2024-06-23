import { Markup, Scenes } from 'telegraf';
import path from 'path';
import axios from 'axios';
import { merge } from 'lodash';
import { Message, MessageEntity } from 'telegraf/typings/core/types/typegram';
import Command from '../types/Command';
import Context from '../types/Context';
import FileDAO from '../../../../shared/dao/file';
import string from '../../../../shared/utils/string';
import escape from '../utils/escape';

function parseMessage(context: Context) {
    let tags: string[] | undefined;
    let { text } = context;
    let file: Message.DocumentMessage['document'] | undefined;

    const { message } = context;

    if (!message) {
        return {
            tags,
            text,
            file,
        };
    }

    let entities: MessageEntity[] | undefined;

    if ('entities' in message) {
        entities = message.entities;
    } else if ('caption_entities' in message) {
        entities = message.caption_entities;
    }

    tags = context
        .entities('hashtag')
        .map((entity) => entity.fragment.substring(1));

    if (tags.length === 0) {
        tags = undefined;
    }

    if (text) {
        const partsToRemove =
            entities?.map((entity) => ({
                offset: entity.offset,
                length: entity.length,
            })) ?? [];

        text = string.removeParts(text, partsToRemove).trim();

        if (text.length === 0) {
            text = undefined;
        }
    }

    if ('document' in message) {
        file = message.document;
    }

    return {
        tags,
        text,
        file,
    };
}

async function finishDocumentEditing(context: Context) {
    const { orm, minio, mqClient } = context;
    const { document } = context.session.documentEditing;

    let fileId: number | undefined;

    if (document.fileId) {
        const fileURL = await context.telegram.getFileLink(document.fileId);

        const response = await axios({
            url: fileURL.toString(),
            responseType: 'stream',
        });

        const fileDAO = new FileDAO({
            entityManager: orm.manager,
            minio,
        });

        const file = await fileDAO.upload({
            name: document.fileName,
            extension: document.fileExtension,
            data: response.data,
            size: document.fileSize,
            mimeType: document.mimeType,
        });

        await fileDAO.delete(document.original.fileId);

        fileId = file.id;
    }

    const savedDocument = await mqClient.send('documents.update', {
        id: document.id,

        fileId,

        name: document.name,
        tags: document.tags,
    });

    await context.replyWithMarkdownV2(
        `Document "*${escape(savedDocument.name)}*" was successfully saved`,
    );
}

const documentFindingScene = new Scenes.BaseScene<Context>(
    'document-editing:finding',
);

documentFindingScene.enter(async (context) => {
    context.session.documentEditing = {};

    await context.replyWithMarkdownV2(
        "Give me an *id* of the document you're looking for\\.",
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );
});

documentFindingScene.on('text', async (context) => {
    const { mqClient } = context;

    const documentId = parseInt(context.message.text, 10);

    const message = await context.replyWithMarkdownV2(
        `Searching for the document with id \`${documentId.toString().padStart(6, '0')}\`\\.\\.\\.`,
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
        );
    } else {
        const tags =
            `\nTags: ${document.tags?.map((tag) => `\\#${escape(tag.name)}`).join(' ')}` ??
            '';

        await context.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            `Found document:\nName: ${escape(document.name)} \\(\`${document.id.toString().padStart(6, '0')}\`\\)${tags}\n\nSend a new data for the document\\.`,
            {
                ...Markup.inlineKeyboard([
                    Markup.button.callback('Cancel', 'cancel'),
                ]),
                parse_mode: 'MarkdownV2',
            },
        );

        context.session.documentEditing.document = {
            original: document,

            id: document.id,
            tags: document.tags?.map((tag) => tag.name) ?? [],
            name: document.name,
        };

        await context.scene.enter('document-editing:updating');
    }
});

documentFindingScene.action('cancel', async (context) => {
    await context.scene.leave();

    await context.answerCbQuery('You have canceled the document editing.');
});

const documentUpdatingScene = new Scenes.BaseScene<Context>(
    'document-editing:updating',
);

documentUpdatingScene.on(['document', 'text'], async (context) => {
    const { tags, text, file } = parseMessage(context);

    if (!tags && !text && !file) {
        return;
    }

    const fileId = file?.file_id;
    let fileName = file?.file_name;
    const fileExtension = fileName ? path.extname(fileName) : undefined;
    const fileSize = file?.file_size;
    const mimeType = file?.mime_type;

    if (fileName && fileExtension) {
        fileName = path.basename(fileName, fileExtension);
    }

    const name = text ?? context.session.documentEditing.document.name;

    const editedDocument = merge({}, context.session.documentEditing.document, {
        fileId,
        fileName,
        fileExtension,
        fileSize,
        mimeType,
        tags,
        name: name ?? fileName,
    });

    context.session.documentEditing.document = editedDocument;

    await context.replyWithMarkdownV2(
        `Document to update:\nName: *${escape(editedDocument.name)}*\n${editedDocument.tags?.length ? `Tags: ${editedDocument.tags.map((tag: string) => `\\#${escape(tag)}`).join(' ')}\n` : ''}`,
        Markup.inlineKeyboard([Markup.button.callback('Save', 'save')]),
    );
});

documentUpdatingScene.action('save', async (context) => {
    await finishDocumentEditing(context);

    await context.scene.leave();

    await context.answerCbQuery('The document was successfully saved');
});

documentUpdatingScene.action('cancel', async (context) => {
    await context.scene.leave();

    await context.answerCbQuery('You have canceled the document editing.');
});

const command: Command = {
    name: 'edit_document',
    description: 'Edit a document',

    scenes: [documentFindingScene, documentUpdatingScene],

    async handler(context) {
        await context.scene.enter('document-editing:finding');
    },
};

export default command;
