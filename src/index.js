#!/usr/bin/env node
const glob = require("glob");
const chalk = require("chalk");
const log = console.log;
const fs = require("fs");
const path = require("path");
const pt = require("prepend-transform").default;
const toString = require("stream-to-string");

const writeFile = (file, contentStream) => {
  toString(contentStream).then(content => fs.writeFileSync(file, content));
};

const languagesPath = path.join(__dirname, "..", "languages");

require("yargs")
  .command(
    "fix <file/glob..>",
    "Fix matched files",
    yargs => {
      yargs
        .option("language", {
          alias: "l",
          default: "javascript"
        })
        .option("write", {
          alias: "w",
          default: false
        });
    },
    argv => {
      let globs = argv["file/glob"];

      const newContentStream = fs.createReadStream(
        path.join(languagesPath, `${argv.language}`)
      );
      const newContentDiff = toString(newContentStream.pipe(pt("++ ")));

      globs.forEach(pattern => {
        glob(pattern + "", {}, (er, files) => {
          files.forEach(file => {
            const oldContentStream = fs.createReadStream(file);
            const oldContentDiff = toString(oldContentStream.pipe(pt("-- ")));

            argv.write
              ? writeFile(file, newContentStream)
              : Promise.all([oldContentDiff, newContentDiff]).then(
                  ([deleted, added]) => {
                    log(`${chalk.bold(file)}:`);
                    log(`${chalk.red(deleted)}`);
                    log(`${chalk.green(added)}`);
                  }
                );
          });
        });
      });
    }
  )
  .command(
    "list",
    "List available languages",
    () => {},
    () => {
      log(chalk.bold("Available languages:"));
      fs.readdirSync(languagesPath).forEach(language => log(`- ${language}`));
    }
  ).argv;
