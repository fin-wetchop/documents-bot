import Command from '../types/Command';

const command: Command = {
    name: 'cancel',
    description: 'Cancel the current operation',

    async handler(context) {
        await context.scene.leave();
    },
};

export default command;
