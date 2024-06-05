import { LANGUAGE_MAPPING } from "@repo/common/language";
import fs from "fs"
import { prismaClient } from "../src";

const MOUNT_PATH = process.env.MOUNT_PATH ?? "../../apps/problems";
function promisifedReadFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf8", (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

async function main(problemSlug: string, problemTitle: string) {
    const problemStatement = await promisifedReadFile(`${MOUNT_PATH}/${problemSlug}/Problem.md`);
    console.log(problemStatement);

    const problem = await prismaClient.problem.upsert({
        where: {
            slug: problemSlug
        },
        create: {
            title: problemSlug,
            slug: problemSlug,
            description: problemStatement
        },
        update: {
            description: problemStatement
        }
    });
    console.log(problem);

    await Promise.all(Object.keys(LANGUAGE_MAPPING).map(async (language) => {
        const code = await promisifedReadFile(`${MOUNT_PATH}/${problemSlug}/boilerplate/function.${language}`);
        await prismaClient.defaultCode.upsert({
            where: {
                problemId_languageId: {
                    problemId: problem.id,
                    languageId: LANGUAGE_MAPPING[language].internal
                }
            },
            create: {
                problemId: problem.id,
                languageId: LANGUAGE_MAPPING[language].internal,
                code
            },
            update: {
                code
            }
        });
    }));
}

main(process.env.PROBLEM_SLUG!, process.env.PROBLEM_TITLE!)