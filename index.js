import readline from "readline";
import colors from "colors";
import path from "path";
import inquirer from "inquirer";
import fsp from "fs/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const root = process.cwd();

const findFilesInDir = (dirName) => {
    return fsp
        .readdir(dirName)
        .then((choices) => {
            return inquirer.prompt([
                {
                    name: "fileName",
                    type: "list",
                    message: "Выбирите файл:",
                    choices,
                },
                {
                    name: "findString",
                    type: "input",
                    message: "Введите что-то для поиска:",
                    async when({ fileName }) {
                        const fullPath = path.join(dirName, fileName);
                        const stat = await fsp.stat(fullPath);

                        return stat.isFile();
                    },
                },
            ]);
        })
        .then(async ({ fileName, findString }) => {
            const fullPath = path.join(dirName, fileName);
            if (findString === undefined) return findFilesInDir(fullPath);

            return Promise.all([
                fsp.readFile(fullPath, "utf-8"),
                Promise.resolve(findString),
            ]);
        })
        .then((result) => {
            if (!result) return;

            const [text, findString] = result;
            const pattern = new RegExp(findString, "g");

            let count = 0;
            const out = text.split("\n")
                .filter((line) => {
                    return line.includes(findString);
                })
                .join("\n")
                .replace(pattern, () => {
                    count++;
                    return colors.red(findString);
                });

            console.log(out, "\n", colors.green(`Найдено ${count} совпадений`));
        });
};

rl.question(
    `Вы находитесь в папке: ${root} \n Пожалуйста, укажите путь до файла: `,
    (dirPath) => {
        const dirName = path.join(root, dirPath);

        findFilesInDir(dirName);
    }
);

rl.on("close", () => process.exit(0));
