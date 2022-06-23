import { MongoClient, MongoClientOptions } from 'mongodb';
import { MONGO_HOST_IP, MONGO_HOST_PORT } from '../config';
import { logger } from '../utils';

export const connect_mongodb = async (): Promise<MongoClient> => {
  const mongodb = `mongodb://${MONGO_HOST_IP}:${MONGO_HOST_PORT}`;
  logger.info(`connecting to ${mongodb} without specifying db`);

  const connection = await MongoClient.connect(mongodb, {
    useUnifiedTopology: true,
  } as MongoClientOptions);

  connection
    ? logger.info(`connected to ${mongodb}`) && console.log(connection)
    : logger.error(`failed connection to ${mongodb}`);

  connection ? logger.info(`closing ${mongodb}`) && (await connection.close()) : null;

  return connection;
};
