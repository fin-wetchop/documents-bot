import { Markup, Scenes } from 'telegraf';
import path from 'path';
import axios from 'axios';
import { merge } from 'lodash';
import { MessageEntity } from 'telegraf/typings/core/types/typegram';
import Command from '../types/Command';
import Context from '../types/Context';
import FileDAO from '../../../../shared/dao/file';
import string from '../../../../shared/utils/string';
import escape from '../utils/escape';

async function finishDocumentCreation(context: Context) {
    const { orm, minio, mqClient } = context;
    const { document } = context.session.documentCreation;

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

    const savedDocument = await mqClient.send('documents.create', {
        ownerUserId: document.ownerUserId,
        fileId: file.id,

        name: document.fileName,
        tags: document.tags,
    });

    await context.replyWithMarkdownV2(
        `Document "*${escape(savedDocument.name)}*" was successfully saved`,
    );
}

const documentCreationScene = new Scenes.BaseScene<Context>(
    'document-creation',
);

documentCreationScene.enter(async (context) => {
    context.session.documentCreation = {};

    await context.reply(
        "You've started creating a new document! Please, send me the document file.",
        Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
    );
});

documentCreationScene.on(['document', 'text'], async (context) => {
    const { message } = context;

    const savedDocument = context.session.documentCreation.document;

    let fileExtension: string | undefined = savedDocument?.fileExtension;
    let fileName: string | undefined = savedDocument?.fileName;

    const tags: string[] | undefined = context.text
        ? context
              .entities('hashtag')
              .map((entity) => entity.fragment.substring(1))
        : undefined;

    if (context.text) {
        fileName = context.text;

        let entities: MessageEntity[] = [];

        if ('entities' in message) {
            entities = message.entities ?? [];
        } else if ('caption_entities' in message) {
            entities = message.caption_entities ?? [];
        }

        const partsToRemove =
            entities?.map((entity) => ({
                offset: entity.offset,
                length: entity.length,
            })) ?? [];

        fileName = string.removeParts(context.text, partsToRemove).trim();
    }

    if (fileName?.length === 0) {
        fileName = savedDocument?.fileName;
    }

    let fileId: string | undefined;
    let fileSize: number | undefined;
    let mimeType: string | undefined;

    if ('document' in message) {
        const { document } = message;

        fileId = document.file_id;
        fileSize = document.file_size;
        mimeType = document.mime_type;

        if (document.file_name) {
            fileExtension = path.extname(document.file_name);

            if (!fileName) {
                fileName = path.basename(document.file_name, fileExtension);
            }
        }
    }

    const document = merge({}, savedDocument ?? {}, {
        ownerUserId: context.from.id,
        fileId,
        fileName,
        fileExtension,
        fileSize,
        mimeType,
        tags: tags ?? [],
    });

    context.session.documentCreation.document = document;

    if (document.fileId) {
        await context.replyWithMarkdownV2(
            // eslint-disable-next-line no-useless-escape
            `Document to save:\nName: *${escape(fileName!)}*\n${document.tags?.length ? `Tags: ${document.tags.map((tag: string) => `\\#${escape(tag)}`).join(' ')}\n` : ''}`,
            Markup.inlineKeyboard([
                Markup.button.callback('Cancel', 'cancel'),
                Markup.button.callback('Save', 'save'),
            ]),
        );
    } else {
        await context.reply(
            'Please, send me the document file',
            Markup.inlineKeyboard([Markup.button.callback('Cancel', 'cancel')]),
        );
    }
});

documentCreationScene.action('cancel', async (context) => {
    await context.scene.leave();

    await context.answerCbQuery('The document creation was canceled');
});

documentCreationScene.action('save', async (context) => {
    await finishDocumentCreation(context);

    await context.scene.leave();

    await context.answerCbQuery('The document was successfully saved');
});

const command: Command = {
    name: 'create_document',
    description: 'Create a new document',

    scenes: [documentCreationScene],

    async handler(context) {
        await context.scene.enter('document-creation');
    },
};

export default command;
