import { FOOD_COLLECTION_NAME, getChromaLocalClient, getProductAPI, prepareProduct } from "./common.js";
import axios from "axios";
import likeliestRecipes from './datasets/likeliest_recipes.json' assert {type: 'json'};

const chroma = getChromaLocalClient();

const collection = await chroma.getCollection({
    name: FOOD_COLLECTION_NAME
});

/**
 * Check given argument product code and proceed to treatment (data retrieving and database query).
 */
const proceedToGetSimilarProducts = async () => {
    const plainProductCode = process.argv.find(arg => arg.toLowerCase().startsWith("product"));
    if(!plainProductCode) {
        console.error(`❌  The argument "product" is null or empty. Please provide a valid argument (example: 'node ./query.js product=3017620429484')`);
        return null;
    }
    const productCode = plainProductCode.split("=")[1].trim();
    if(!Number(productCode)) {
        console.error(`❌  ${productCode} is not a number. Please provide a valid argument (example: 'node ./query.js product=3017620429484')`);
        return null;
    }
    const result = await getSimilarProducts(productCode, likeliestRecipes);
    if(result?.error) {
        console.error(`❌  An error occurred while querying chroma, details: ${result.error}`);
        return null;
    }
    if(result?.metadatas) {
        console.log(result.metadatas[0]);
        return null;
    }
}

/**
 * Get products from Open Food Facts API and query database to retrieve similar products.
 * @param code Product unique code.
 * @param {string[]} allLikeliestRecipe List of all indexed vectors.
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
const getSimilarProducts = (code, allLikeliestRecipe) => {
    const apiUrl = getProductAPI(code);

    return axios.get(apiUrl)
        .then(async response => {
            const resData = response.data;
            const preparedProduct = prepareProduct(
                resData.code,
                resData.product?.product_name,
                resData.product?.image_front_url,
                resData.product?.ecoscore_extended_data?.impact?.likeliest_recipe,
                allLikeliestRecipe
            );
            if (preparedProduct) {
                return collection.query({
                    queryEmbeddings: preparedProduct.likeliest_recipes,
                    nResults: 3,
                    where: {
                        "code": {
                            $ne: code
                        }
                    }
                });
            } else {
                console.error("❌  Product has not been found from Open Food Facts API or doesn't contains valid datas");
            }
        })
        .catch(error => {
            console.error(error);
        });
}

await proceedToGetSimilarProducts();