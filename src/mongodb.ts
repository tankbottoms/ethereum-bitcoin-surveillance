import { MongoClient, MongoClientOptions, SortDirection } from 'mongodb';
import { VERBOSE } from './config';
import { MONGODB } from './config/mongo';
import { logger } from './utils';

export class Mongo {
  private static instance: Mongo | undefined = undefined;
  private static mongodb_uri: string = MONGODB;
  private static connection: MongoClient | undefined = undefined;
  private static database_name: string | undefined = undefined;

  public static get_instance = async (): Promise<Mongo> => {
    if (!Mongo.instance) {
      Mongo.instance = new Mongo();
    }
    return Mongo.instance;
  };

  private static _instance = async (): Promise<Mongo | undefined> => {
    return !Mongo.instance ? await Mongo.get_instance() : undefined;
  };

  private static _is_undefined_database_name = (): boolean => {
    return Mongo.database_name === undefined ? true : false;
  };

  public static connect = async (connection_string?: string): Promise<MongoClient | undefined> => {
    try {
      await Mongo._instance();
      connection_string ? (Mongo.mongodb_uri = connection_string) : null;
      logger.info(`connecting to ${Mongo.mongodb_uri}, without specifying db`);
      Mongo.connection = await MongoClient.connect(Mongo.mongodb_uri, {
        useUnifiedTopology: true,
      } as MongoClientOptions);
      Mongo.connection
        ? logger.info(`connected to ${Mongo.mongodb_uri}`) && VERBOSE && console.info(Mongo.connection)
        : logger.error(`failed connecting to ${`${Mongo.mongodb_uri}`}`);
      return Mongo.connection;
    } catch (e) {
      if (e instanceof Error) logger.error(`failed connecting to ${connection_string}, ${JSON.stringify(e.message)}`);
      return undefined;
    }
  };

  public static _connect = async (): Promise<MongoClient | undefined> => {
    return await Mongo._connect();
  };

  public static disconnect = async () => {
    Mongo.connection && Mongo.database_name !== undefined
      ? logger.info(`closing ${Mongo.mongodb_uri}`) && (await Mongo.connection.close())
      : logger.warn(`disconnected ${Mongo.mongodb_uri}`);
  };

  public static create_database = async (database_name: string): Promise<boolean> => {
    try {
      await Mongo._instance();
      const ok = await Mongo.connection?.db(database_name);
      ok
        ? logger.info(`created database:${database_name}`) && (Mongo.database_name = database_name)
        : logger.error(`failed creating database ${database_name}`);
      VERBOSE && ok ? console.log(ok) : null;
      return ok ? true : false;
    } catch (e) {
      if (e instanceof Error) logger.error(`${e.message}`);
      return false;
    }
  };

  public static set_database = async (database_name: string): Promise<boolean> => {
    try {
      await Mongo._instance();
      const ok = await Mongo.connection?.db(database_name);
      ok
        ? logger.info(`set database to ${database_name}`) && (Mongo.database_name = database_name)
        : logger.error(`unable to set database ${database_name}`);
      ok ? console.log(ok) : null;
      return ok ? true : false;
    } catch (e) {
      if (e instanceof Error) logger.error(`${e.message}`);
      return false;
    }
  };

  public static delete_database = async (database_name: string): Promise<boolean> => {
    try {
      await Mongo._instance();
      const ok = await (await Mongo.connection?.db(database_name))?.dropDatabase();
      ok
        ? logger.info(`dropped database ${database_name}`) && (Mongo.database_name = undefined)
        : logger.error(`unable to drop/delete database ${database_name}`);
      ok ? await Mongo.connection?.close() : null;
      return ok ? ok : false;
    } catch (e) {
      if (e instanceof Error) logger.error(`${e.message}`);
      return false;
    }
  };

  public static insert = async (collection_name: string | undefined = undefined, { _id, ...document }: any) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const insertion = await collection?.insertOne(document);
      insertion
        ? logger.debug(`database ${Mongo.database_name} insertion into ${collection_name} succeeded`)
        : logger.error(`database ${Mongo.database_name} insertion into ${collection_name} failed`) &&
          console.error(insertion);
      return insertion ? insertion : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} insertion into ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static update = async (collection_name: string | undefined = undefined, filter: any, query: any) => {
    if (collection_name === undefined || filter === undefined || query === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const update_results = await collection?.updateOne(filter, query, { upsert: true });
      update_results
        ? false &&
          logger.info(
            `database ${Mongo.database_name} updated documents in ${collection_name} => ${JSON.stringify(
              update_results,
            )} ` + `succeeded using filter:${JSON.stringify(filter)}`,
          )
        : logger.error(`database ${Mongo.database_name} updated documents in ${collection_name} failed`) &&
          console.error(update_results);
      return update_results ? update_results : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} updates in ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static update_documents = async (
    collection_name: string | undefined = undefined,
    filter: any,
    updates: any,
  ) => {
    if (collection_name === undefined || filter === undefined || updates === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const update_results = await collection?.updateOne(filter, { $set: updates }, { upsert: true });
      update_results
        ? false &&
          logger.info(
            `database ${Mongo.database_name} updated documents in ${collection_name} => ${JSON.stringify(
              update_results,
            )} ` + `succeeded using filter:${JSON.stringify(filter)}`,
          )
        : logger.error(`database ${Mongo.database_name} updated documents in ${collection_name} failed`) &&
          console.error(update_results);
      return update_results ? update_results : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} updates in ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static update_many_documents = async (
    collection_name: string | undefined = undefined,
    filter: any,
    updates: any,
  ) => {
    if (collection_name === undefined || filter === undefined || updates === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const update_results = await collection?.updateMany(filter, { $set: updates }, { upsert: true });
      update_results
        ? false &&
          logger.info(
            `database ${Mongo.database_name} updated documents in ${collection_name} ` +
              `succeeded using filter:${JSON.stringify(filter)}`,
          )
        : logger.error(`database ${Mongo.database_name} updated documents in ${collection_name} failed`) &&
          console.error(update_results);
      return update_results ? update_results : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} updates in ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static insert_many = async (collection_name: string | undefined = undefined, documents: any) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const insertions = await collection?.insertMany(documents);
      insertions
        ? logger.debug(`database ${Mongo.database_name} insertion into ${collection_name} succeeded`)
        : logger.error(`database ${Mongo.database_name} insertion into ${collection_name} failed`) &&
          console.error(insertions);
      return insertions ? insertions : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          `db:${Mongo.database_name} insertion into ` + `${collection_name} encountered the following error`,
        );
        console.error(e.message);
      }
      return e;
    }
  };

  public static find_one = async (collection_name: string | undefined = undefined, query = {}) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const document = await collection?.findOne(query);
      document
        ? logger.info(`${collection_name} ${JSON.stringify(query)} returned ${document._id} documents`)
        : logger.warn(
            `search in ${collection_name} using ${JSON.stringify(query)} hashed: ${JSON.stringify(document)} documents`,
          );
      return document ? document : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`find in ${collection_name} using ${query} encountered an error`);
        console.error(e.message);
        return e;
      }
      return undefined;
    }
  };

  public static isExists = async (collection_name: string, query = {}) => {
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return false;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const count = await collection?.countDocuments(query, { limit: 1 });
      count === 1
        ? logger.info(`${collection_name} with ${JSON.stringify(query)} already exist`)
        : logger.warn(`${collection_name} with ${JSON.stringify(query)} does not exist `);
      return count === 1 ? true : false;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`find in ${collection_name} using ${query} encountered an error`);
        console.error(e.message);
        return false;
      }
      return false;
    }
  };

  public static query_collection = async (
    collection_name: string | undefined,
    filter: any = {},
    projections: any = {},
    parameters: any = {},
    ordersort: any = {},
  ) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;

      parameters.sort = parameters.sort ? parameters.sort : {};
      parameters.skip = parameters.skip ? parameters.skip : 0;
      parameters.limit = parameters.limit ? parameters.limit : 0;

      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const documents = await collection?.find(filter).sort(ordersort).project(projections).toArray();
      documents?.length
        ? logger.info(
            `${collection_name} filter:${JSON.stringify(filter)}, ` +
              `order:${JSON.stringify(ordersort)} returned ${documents?.length} documents`,
          )
        : logger.error(
            `search in ${collection_name} filter:${JSON.stringify(filter)}, ` +
              `order:${JSON.stringify(ordersort)} failed any documents`,
          );
      return documents ? documents : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`query ${collection_name} w/ filter:${filter}, sort:${ordersort},  encountered an error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static find_all = async (collection_name: string | undefined = undefined) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const documents = await collection?.find({}).toArray();
      documents?.length
        ? logger.info(`${collection_name} returned ${documents?.length} documents`)
        : logger.info(`search within ${collection_name} returned ${documents?.length} documents`);
      return documents ? documents : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`find all in ${collection_name} encountered an error`);
        console.error(e.message);
      }
      return undefined;
    }
  };

  public static delete_documents = async (collection_name: string | undefined = undefined, filter: any) => {
    if (collection_name === undefined || filter === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const delete_result = await collection?.deleteMany(filter);
      delete_result
        ? logger.info(
            `${Mongo.database_name} deleted documents in ${collection_name} ` +
              `succeeded using filter:${JSON.stringify(filter)}`,
          )
        : logger.error(`${Mongo.database_name} deleted documents in ${collection_name} failed`) &&
          console.error(delete_result);
      return delete_result ? delete_result : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} deletions in ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static delete_document = async (collection_name: string | undefined = undefined, filter: any) => {
    if (collection_name === undefined || filter === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const delete_result = await collection?.deleteOne(filter);
      delete_result
        ? logger.info(
            `${Mongo.database_name} deleted document in ${collection_name} ` +
              `succeeded using filter:${JSON.stringify(filter)}`,
          )
        : logger.error(`${Mongo.database_name} deleted document in ${collection_name} failed`) &&
          console.error(delete_result);
      return delete_result ? delete_result : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`${Mongo.database_name} deletions in ` + `${collection_name} encountered the following error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static find_and_sort = async (
    collection_name: string | undefined = undefined,
    sort_query:
      | { [key: string]: SortDirection }
      | Map<string, SortDirection>
      | [string, SortDirection][]
      | [string, SortDirection],
  ) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const document = await collection?.find().sort(sort_query);
      document
        ? logger.info(`${collection_name} ${JSON.stringify(sort_query)} returned ${JSON.stringify(document)} documents`)
        : logger.warn(`sorting in ${collection_name} using ${JSON.stringify(sort_query)} failed`);
      return document ? document : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`find in ${collection_name} using ${sort_query} encountered an error`);
        console.error(e.message);
      }
      return e;
    }
  };

  public static delete_collection = async (collection_name: string | undefined = undefined) => {
    if (collection_name === undefined) {
      throw new Error(`illegal invocation, bad parameter`);
    }
    try {
      await Mongo._instance();
      if (Mongo._is_undefined_database_name()) return undefined;
      const collection = await (await Mongo.connection?.db(Mongo.database_name))?.collection(collection_name);
      const document = await collection?.drop();
      document
        ? logger.info(`${collection_name} delete  returned ${JSON.stringify(document)}`)
        : logger.warn(`delete ${collection_name}  failed`);
      return document ? document : undefined;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`delete ${collection_name} using encountered an error`);
        console.error(e.message);
      }
      return e;
    }
  };
}
