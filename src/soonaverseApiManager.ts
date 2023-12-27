// converted to ts from https://github.com/HerrSkull/Soonaverse-NFT-Bot/blob/main/modules/nftRoleManager.js
import fetch from "node-fetch";

import { API_TOKEN } from "./config";

const API_ENDPOINT = "https://api.build5.com/api/";

export async function getNftsByCollection(collectionId: string) {
    return new Promise((resolve, reject) => {
        let results = new Array();
        fetch(
            `${API_ENDPOINT}/getMany?collection=nft&fieldName=collection&fieldValue=${collectionId}`,
            {
                method: "get",
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`,
                },
            },
        )
            .then(async (resp) => {
                const isJson = resp.headers.get("content-type")?.includes("application/json");
                const data = isJson ? await resp.json() : null;

                if (!resp.ok) {
                    const err = (data && data.message) || resp.status;
                    return reject(err);
                }

                results.push(...data);
                let page = await getNftsByCollectionPage(collectionId, results.slice(-1)[0].id);
                while (page.length != 0) {
                    results.push(...page);
                    page = await getNftsByCollectionPage(collectionId, page.slice(-1)[0].id);
                }
                return resolve(results);
            })
            .catch((error) => {
                console.log(
                    "Error while getting Nfts of Collection: " + collectionId + " Error: " + error,
                );
                return reject(error);
            });
    });
}

export async function getNftsByCollectionPage(collectionId: string, startAfter: string) {
    return fetch(
        `${API_ENDPOINT}getMany?collection=nft&fieldName=collection&fieldValue=${collectionId}&startAfter=${startAfter}`,
        {
            method: "get",
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            },
        },
    )
        .then(async (res) => {
            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok) {
                const err = (data && data.message) || res.status;
                return Promise.reject(err);
            }
            return data;
        })
        .catch((error) => {
            console.log(
                "Error while getting page of Nfts of Collection: " +
                    collectionId +
                    " Error: " +
                    error,
            );
            return Promise.reject(error);
        });
}

export async function getMemberById(memberId: string) {
    return fetch(`${API_ENDPOINT}getById?collection=member&uid=${memberId}`, {
        method: "get",
        headers: {
            Authorization: `Bearer ${API_TOKEN}`,
        },
    })
        .then(async (res) => {
            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;
            if (!res.ok) {
                const err = (data && data.message) || res.status;
                return Promise.reject(err);
            }
            return data;
        })
        .catch((error) => {
            console.log("Error while getting Soonaverse profile: " + memberId + " Error: " + error);
            return Promise.reject(error);
        });
}
