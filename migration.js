import products from './datasets/products.json' assert {type: 'json'};
import { FOOD_COLLECTION_NAME, getChromaLocalClient } from "./common.js";

const chroma = getChromaLocalClient();

const migrate = async () => {
    console.log(`🙆 Start database migration for ${products.length} products`);

    // erase collection if exists
    await chroma.deleteCollection({ name: FOOD_COLLECTION_NAME });

    // create new collection
    const collection = await chroma.createCollection({ name: FOOD_COLLECTION_NAME });

    // execute dump
    await collection.add({
        ids: products.map(product => product.code),
        embeddings: products.map(product => product.likeliest_recipes),
        metadatas: products.map(product => {
            return {
                name: product.name,
                code: product.code,
                image_front_url: product.image_front_url,
                url: product.url
            }
        })
    });

    console.log(`✅  Database migration done! Database contains ${await collection.count()} products`);
}

await migrate();