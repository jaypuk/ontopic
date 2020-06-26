const { getAccountId, createQueue, subscribeToQueue, deleteQueue, deleteSubscription, getMessages } = require('./aws');
const { logMessage } = require('./logger');

let QueueUrl;
let SubscriptionArn;

const removeResources = async () => {
    try {
        if (SubscriptionArn) {
            console.log(`Deleting ${SubscriptionArn}`);
            await deleteSubscription(SubscriptionArn);
        }

        if (QueueUrl) {
            console.log(`Deleting ${QueueUrl}`);
            await deleteQueue(QueueUrl);
        }
    } catch (err) {
        console.log(`An error occurred while cleaning up resources: ${err.message}`);
        console.log('You may need to manually remove the following resources:');
        [SubscriptionArn, QueueUrl]
            .filter((resource) => resource)
            .forEach((resource) => console.log(`- ${resource}`));
    }
};

const listen = async ({ topicArn }) => {
    const accountId = "000000000000";
    const region = "eu-west-2";
    const queue = await createQueue(topicArn, region, accountId);

    queue.url = queue.url.replace('localstack', 'localhost');
    QueueUrl = queue.url;

    const subscription = await subscribeToQueue(topicArn, queue.arn);

    SubscriptionArn = subscription.arn;

    console.log(`Queue: ${JSON.stringify(queue)}`);
    console.log(`SubscriptionArn: ${SubscriptionArn}`);
    console.log(`Waiting for messages on ${queue.url} ...`);

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const messages = await getMessages(queue.url);
            console.log(`${topicArn} received: ${JSON.stringify(messages)}`);
            messages.forEach((message) => logMessage(message));
        }
    } catch (err) {
        console.log(`An error occurred while polling new messages: ${err.message}`);
        console.log('Attempting to clean up resources...');
        await removeResources();
    }
};

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM'].forEach((signal) => process.on(signal, async () => {
    await removeResources();
    process.exit(0);
}));

module.exports = { listen };
