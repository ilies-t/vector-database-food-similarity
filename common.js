import { ChromaClient } from "chromadb";

const OPEN_FOOD_FACTS_SEARCH_API_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const OPEN_FOOD_FACTS_FIND_PRODUCT_API_URL = "https://world.openfoodfacts.org/api/v2/product/";
const OPEN_FOOD_FACTS_FIND_PRODUCT_PUBLIC_URL = "https://world.openfoodfacts.org/product/";

export const FOOD_COLLECTION_NAME = "food-col";

/**
 * Get a Chroma local database client.
 * @returns {ChromaClient}
 */
export const getChromaLocalClient = () => {
    return new ChromaClient({ path: "http://localhost:8000" });
}

/**
 * Get search API URL as string with search params encapsulated.
 * @param {number} page Pagination (starts from 1).
 * @returns {string}
 */
export const getSearchAPI = (page) => {
    const url = new URL(OPEN_FOOD_FACTS_SEARCH_API_URL);
    url.searchParams.append('sort_by', 'unique_scans_n');
    url.searchParams.append('action', 'process');
    url.searchParams.append('json', '1');
    url.searchParams.append('page_size', '1000');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('fields', 'code,product_name,ecoscore_extended_data,image_front_url');
    return url.toString();
}

/**
 * Get product API URL as string with search params encapsulated.
 * @param code Related product code.
 * @returns {string}
 */
export const getProductAPI = (code) => {
    const url = new URL(`${OPEN_FOOD_FACTS_FIND_PRODUCT_API_URL}/${code}.json`);
    url.searchParams.append('fields', 'product_name,ecoscore_extended_data,image_front_url');
    return url.toString();
}

/**
 * Prepare and transform product sent from Open Food Facts API (only Product).
 * @param code Related product unique code.
 * @param productName Related product name.
 * @param productImageFrontUrl Related product main image URL.
 * @param productLikeliestRecipe Related product likeliest recipe (used as vectors).
 * @param {string[]} allLikeliestRecipe List of all indexed vectors.
 * @returns {{code: string, name: string, likeliest_recipes: number[]}|null}
 */
export const prepareProduct = (
    code,
    productName,
    productImageFrontUrl,
    productLikeliestRecipe,
    allLikeliestRecipe
) => {

    if(!code || !productName || !productLikeliestRecipe) {
        return null;
    }

    // create vector data from likeliest recipe
    const productLikeliestRecipes = [];
    allLikeliestRecipe.forEach(likeliestRecipe => {
        const vectorValue = productLikeliestRecipe[likeliestRecipe] ?? 0;
        productLikeliestRecipes.push(vectorValue);
    });

    // create data to be saved into database
    return {
        code,
        name: productName,
        image_front_url: productImageFrontUrl,
        likeliest_recipes: productLikeliestRecipes,
        url: getOpenFoodFactsPublicProductUrl(code)
    };
}

export const getOpenFoodFactsPublicProductUrl = (code) => {
    return OPEN_FOOD_FACTS_FIND_PRODUCT_PUBLIC_URL + code;
}