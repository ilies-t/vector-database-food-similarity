import axios from "axios";
import * as fs from 'fs';
import { getSearchAPI, prepareProduct } from "./common.js";

/**
 * Retrieve 10k products data from API and save into "products.json" file.
 */
const saveProductsData = async () => {
    const products = [];
    for (let i = 1; i <= 10; i++) {
        const apiUrl = getSearchAPI(i);

        console.log(`🔘 Call search API for page ${i}, please wait...`);
        await axios.get(apiUrl)
            .then(response => {
                console.log(`✅  Successful response when calling search API for page ${i}`);
                products.push(...response.data['products']);
            })
            .catch(error => {
                console.error(`❌  Bad things happened when calling search API for page ${i}`);
                console.error(error);
            });
    }

    const allLikeliestRecipeToSave = prepareLikeliestRecipe(products);
    saveAsJSON("datasets/likeliest_recipes.json", allLikeliestRecipeToSave);

    const allProductsToSave = prepareProducts(products, allLikeliestRecipeToSave);
    saveAsJSON("datasets/products.json", allProductsToSave);
}

/**
 * Save Object content into JSON file.
 * @param {string} filename Related file name.
 * @param {*} fileContent Related file content.
 */
const saveAsJSON = (filename, fileContent) => {
    fs.writeFile(filename, JSON.stringify(fileContent), 'utf8', () => {
        console.log(`📁 ${filename} has been successfully saved`);
    });
}

/**
 * Prepare and extract all likeliest recipe keys from products for indexed vectors (max dimension size will be 1,500).
 * @param {*[]} products Given list of products
 * @return {string[]}
 */
const prepareLikeliestRecipe = (products) => {
    const allLikeliestRecipe = [];
    products
        .filter(product => product?.ecoscore_extended_data?.impact?.likeliest_recipe)
        .forEach(product => {
            Object.keys(product?.ecoscore_extended_data?.impact?.likeliest_recipe)
                // get only english vectors and non already existing
                .filter(likeliestRecipe => likeliestRecipe.startsWith("en:") && !allLikeliestRecipe.includes(likeliestRecipe))
                .forEach(likeliestRecipe => { allLikeliestRecipe.push(likeliestRecipe) });
        });

    // limit vectors size to 1,500
    const slicedAllLikeliestRecipe = allLikeliestRecipe.slice(0, 1500);

    console.log(`🏆 ${slicedAllLikeliestRecipe.length} likeliest recipe has been extracted`);
    return slicedAllLikeliestRecipe;
}

/**
 * Prepare and transform products sent from Open Food Facts API.
 * @param {{code: string, product_name: string, ecoscore_extended_data: {impact: {likeliest_recipe: {}}}}[]|null} products
 *        Related products having Open Food Facts data.
 * @param {string[]} allLikeliestRecipe List of all indexed vectors.
 * @returns {{code: string, name: string, image_front_url: string, likeliest_recipes: number[], url: string}[]}
 */
const prepareProducts = (products, allLikeliestRecipe) => {
    const preparedProducts = [];
    products.forEach(product => {

        const preparedProduct = prepareProduct(
            product?.code,
            product?.product_name,
            product?.image_front_url,
            product?.ecoscore_extended_data?.impact?.likeliest_recipe,
            allLikeliestRecipe
        );

        const codeAlreadyExists = preparedProducts.map(p => p.code).includes(product?.code);
        if(preparedProduct && !codeAlreadyExists) {
            preparedProducts.push(preparedProduct);
        }
    });

    console.log(`🏆 ${preparedProducts.length} products has been extracted`);
    return preparedProducts;
}

await saveProductsData();